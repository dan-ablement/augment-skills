import { query } from '../config/database.config';
import { computeScore, getDefaultNotAssessed, ScoringMode, NotAssessedHandling } from './scoring.utils';

// Re-export types so existing imports from hierarchy.service still work
export type { ScoringMode, NotAssessedHandling } from './scoring.utils';

export interface HierarchyQueryParams {
  scoring_mode?: ScoringMode;
  skills?: number[];
  roles?: string[];
  manager_id?: number;
  not_assessed?: NotAssessedHandling;
}

export interface SkillScore {
  skillId: number;
  skillName: string;
  score: number | null;
  assessedCount: number;
  totalCount: number;
}

export interface HierarchyNode {
  id: number;
  name: string;
  title: string | null;
  department: string | null;
  isManager: boolean;
  directReportCount: number;
  totalDescendantCount: number;
  skillScores: SkillScore[];
  children: HierarchyNode[];
}

interface EmployeeRow {
  id: number;
  first_name: string;
  last_name: string;
  title: string | null;
  department: string | null;
  manager_id: number | null;
}

interface SkillRow {
  id: number;
  name: string;
}

interface ScoreRow {
  employee_id: number;
  skill_id: number;
  score: string; // pg returns numeric as string
}

// ── Service ────────────────────────────────────────────────────────────

export class HierarchyService {

  /**
   * Build the full org hierarchy tree with aggregated skill scores.
   */
  async getHierarchy(params: HierarchyQueryParams): Promise<HierarchyNode[]> {
    const notAssessed = params.not_assessed ?? await getDefaultNotAssessed();
    const scoringMode = params.scoring_mode ?? 'average';

    // 1. Fetch raw data in parallel
    const [employees, skills, scores] = await Promise.all([
      this.fetchEmployees(),
      this.fetchSkills(params.skills),
      this.fetchScores(params.skills),
    ]);

    // 2. Build lookup maps
    const childrenMap = new Map<number | null, EmployeeRow[]>();
    const employeeMap = new Map<number, EmployeeRow>();
    for (const emp of employees) {
      employeeMap.set(emp.id, emp);
      const siblings = childrenMap.get(emp.manager_id) ?? [];
      siblings.push(emp);
      childrenMap.set(emp.manager_id, siblings);
    }

    // Score map: employeeId -> skillId -> score
    const scoreMap = new Map<number, Map<number, number>>();
    for (const s of scores) {
      if (!scoreMap.has(s.employee_id)) scoreMap.set(s.employee_id, new Map());
      scoreMap.get(s.employee_id)!.set(s.skill_id, parseFloat(s.score));
    }

    // 3. Build tree recursively
    const buildNode = (emp: EmployeeRow): HierarchyNode => {
      const directReports = childrenMap.get(emp.id) ?? [];
      const children = directReports.map(buildNode);
      const isManager = children.length > 0;

      // Collect all descendant IDs (including self)
      const descendantIds = this.collectDescendantIds(emp.id, childrenMap);
      const allIds = [emp.id, ...descendantIds];

      // Apply role/department filter to descendants for scoring
      const scoringIds = params.roles?.length
        ? allIds.filter(id => {
            const e = employeeMap.get(id);
            return e && params.roles!.includes(e.department ?? '');
          })
        : allIds;

      const skillScores = this.calculateSkillScores(
        skills, scoringIds, scoreMap, scoringMode, notAssessed,
      );

      return {
        id: emp.id,
        name: `${emp.first_name} ${emp.last_name}`,
        title: emp.title,
        department: emp.department,
        isManager,
        directReportCount: directReports.length,
        totalDescendantCount: descendantIds.length,
        skillScores,
        children,
      };
    };

    // 4. Determine roots
    let roots: EmployeeRow[];
    if (params.manager_id != null) {
      const root = employeeMap.get(params.manager_id);
      roots = root ? [root] : [];
    } else {
      roots = childrenMap.get(null) ?? [];
    }

    return roots.map(buildNode);
  }

  // ── Private helpers ────────────────────────────────────────────────

  private collectDescendantIds(
    parentId: number,
    childrenMap: Map<number | null, EmployeeRow[]>,
  ): number[] {
    const directReports = childrenMap.get(parentId) ?? [];
    const ids: number[] = [];
    for (const child of directReports) {
      ids.push(child.id);
      ids.push(...this.collectDescendantIds(child.id, childrenMap));
    }
    return ids;
  }

  private calculateSkillScores(
    skills: SkillRow[],
    memberIds: number[],
    scoreMap: Map<number, Map<number, number>>,
    mode: ScoringMode,
    notAssessed: NotAssessedHandling,
  ): SkillScore[] {
    return skills.map(skill => {
      // Gather raw scores for this skill across all members
      const rawScores: (number | null)[] = memberIds.map(id =>
        scoreMap.get(id)?.get(skill.id) ?? null,
      );

      const assessed = rawScores.filter((s): s is number => s !== null);
      const totalCount = memberIds.length;
      const assessedCount = assessed.length;

      // Build the effective list for calculation
      let effective: number[];
      if (notAssessed === 'count_as_zero') {
        effective = rawScores.map(s => s ?? 0);
      } else {
        // exclude: use only assessed values
        effective = assessed;
      }

      const score = computeScore(effective, mode);

      return { skillId: skill.id, skillName: skill.name, score, assessedCount, totalCount };
    });
  }

  // ── DB queries ─────────────────────────────────────────────────────

  private async fetchEmployees(): Promise<EmployeeRow[]> {
    const result = await query(
      `SELECT id, first_name, last_name, title, department, manager_id
       FROM employees WHERE is_active = TRUE
       ORDER BY first_name, last_name`,
    );
    return result.rows;
  }

  private async fetchSkills(skillIds?: number[]): Promise<SkillRow[]> {
    if (skillIds?.length) {
      const placeholders = skillIds.map((_, i) => `$${i + 1}`).join(', ');
      const result = await query(
        `SELECT id, name FROM skills WHERE id IN (${placeholders}) ORDER BY name`,
        skillIds,
      );
      return result.rows;
    }
    const result = await query('SELECT id, name FROM skills ORDER BY name');
    return result.rows;
  }

  private async fetchScores(skillIds?: number[]): Promise<ScoreRow[]> {
    if (skillIds?.length) {
      const placeholders = skillIds.map((_, i) => `$${i + 1}`).join(', ');
      const result = await query(
        `SELECT es.employee_id, es.skill_id, es.score
         FROM employee_skills es
         JOIN employees e ON es.employee_id = e.id
         WHERE e.is_active = TRUE AND es.skill_id IN (${placeholders})`,
        skillIds,
      );
      return result.rows;
    }
    const result = await query(
      `SELECT es.employee_id, es.skill_id, es.score
       FROM employee_skills es
       JOIN employees e ON es.employee_id = e.id
       WHERE e.is_active = TRUE`,
    );
    return result.rows;
  }

  // getDefaultNotAssessed is now imported from scoring.utils
}

export const hierarchyService = new HierarchyService();

