import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../config/database.config';
import { requireAuth } from '../middleware/auth.middleware';
import { hierarchyService, ScoringMode, NotAssessedHandling } from '../services/hierarchy.service';
import { computeScore, getDefaultNotAssessed } from '../services/scoring.utils';

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/v1/dashboard/heatmap
 * Get heatmap data for dashboard
 * Returns employees as rows, skills as columns, scores as cell values
 */
router.get('/heatmap', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = req.query.category as string;
    const department = req.query.department as string;

    // Get all active employees
    let employeeQuery = `SELECT id, CONCAT(first_name, ' ', last_name) AS name, email, department, title FROM employees WHERE is_active = TRUE`;
    const employeeParams: any[] = [];

    if (department) {
      employeeQuery += ' AND department = $1';
      employeeParams.push(department);
    }
    employeeQuery += ' ORDER BY first_name, last_name';
    
    const employeesResult = await query(employeeQuery, employeeParams);

    // Get all active skills
    let skillQuery = 'SELECT id, name, category FROM skills WHERE is_active = TRUE';
    const skillParams: any[] = [];

    if (category) {
      skillQuery += ' AND category = $1';
      skillParams.push(category);
    }
    skillQuery += ' ORDER BY category, name';
    
    const skillsResult = await query(skillQuery, skillParams);

    // Get all employee_skills (only active employees)
    const scoresResult = await query(`
      SELECT
        es.employee_id,
        es.skill_id,
        es.score,
        es.assessment_date
      FROM employee_skills es
      JOIN employees e ON es.employee_id = e.id
      JOIN skills s ON es.skill_id = s.id
      WHERE e.is_active = TRUE
      ${department ? 'AND e.department = $1' : ''}
      ${category ? 'AND s.category = $' + (department ? '2' : '1') : ''}
    `, [department, category].filter(Boolean));

    // Build score matrix
    const scoreMap = new Map<string, { score: number; date: string }>();
    scoresResult.rows.forEach((row) => {
      const key = `${row.employee_id}-${row.skill_id}`;
      scoreMap.set(key, { score: parseFloat(row.score), date: row.assessment_date });
    });

    // Build heatmap data
    const heatmapData = employeesResult.rows.map((employee) => ({
      employee: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        department: employee.department,
        title: employee.title,
      },
      skills: skillsResult.rows.map((skill) => {
        const key = `${employee.id}-${skill.id}`;
        const scoreData = scoreMap.get(key);
        return {
          skillId: skill.id,
          skillName: skill.name,
          category: skill.category,
          score: scoreData?.score ?? null,
          assessmentDate: scoreData?.date ?? null,
        };
      }),
    }));

    res.json({
      data: {
        employees: employeesResult.rows,
        skills: skillsResult.rows,
        heatmap: heatmapData,
      },
    });
  } catch (error) {
    next(error);
  }
});

// computeScore is now imported from scoring.utils

/**
 * GET /api/v1/dashboard/summary
 * Get summary statistics for dashboard.
 *
 * Query params:
 *   scoring_mode — "average" (default), "team_readiness", "coverage"
 *   skills       — comma-separated skill IDs
 *   roles        — comma-separated departments
 *   manager_id   — filter to manager's subtree
 *   not_assessed — "exclude" (default) or "count_as_zero"
 */
router.get('/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // --- Parse query params ---
    const scoringMode = ((req.query.scoring_mode as string) || 'average') as ScoringMode;
    const skillsParam = req.query.skills as string | undefined;
    const rolesParam = req.query.roles as string | undefined;
    const managerIdParam = req.query.manager_id as string | undefined;
    const notAssessedParam = req.query.not_assessed as string | undefined;
    const notAssessed: NotAssessedHandling = notAssessedParam
      ? (notAssessedParam as NotAssessedHandling)
      : await getDefaultNotAssessed();

    const skillIds = skillsParam ? skillsParam.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n)) : [];
    const roles = rolesParam ? rolesParam.split(',').map((r) => r.trim()).filter(Boolean) : [];
    let managerId = managerIdParam ? parseInt(managerIdParam, 10) : null;

    // Permission-based filtering: non-admin users see only their subtree
    const isAdmin = req.session.user?.role === 'admin';
    if (!isAdmin) {
      const userEmployeeId = await getEmployeeIdForUser(req.session.user?.email);
      if (userEmployeeId !== null) {
        managerId = userEmployeeId;
      }
    }

    const hasFilters = skillIds.length > 0 || roles.length > 0 || managerId !== null;

    // --- Overall (company-wide) metrics ---
    const overallEmployeeCount = await query('SELECT COUNT(*) FROM employees WHERE is_active = TRUE');
    const overallSkillCount = await query('SELECT COUNT(*) FROM skills WHERE is_active = TRUE');
    const overallAssessmentCount = await query(
      'SELECT COUNT(*) FROM employee_skills es JOIN employees e ON es.employee_id = e.id WHERE e.is_active = TRUE'
    );
    const overallScoresResult = await query(
      'SELECT es.score FROM employee_skills es JOIN employees e ON es.employee_id = e.id WHERE e.is_active = TRUE'
    );
    const overallScores = overallScoresResult.rows.map((r) => parseFloat(r.score));
    const overallScore = computeScore(overallScores, scoringMode);

    const overall = {
      totalEmployees: parseInt(overallEmployeeCount.rows[0].count),
      totalSkills: parseInt(overallSkillCount.rows[0].count),
      totalAssessments: parseInt(overallAssessmentCount.rows[0].count),
      score: overallScore,
    };

    // --- Filtered metrics ---
    let filtered = { ...overall };

    if (hasFilters) {
      // Build employee filter conditions
      const employeeConditions: string[] = ['e.is_active = TRUE'];
      const employeeParams: any[] = [];
      let paramIdx = 1;

      // Filter by roles (departments)
      if (roles.length > 0) {
        employeeConditions.push(`e.department = ANY($${paramIdx})`);
        employeeParams.push(roles);
        paramIdx++;
      }

      // Filter by manager subtree using recursive CTE
      if (managerId !== null) {
        employeeConditions.push(`e.id IN (
          WITH RECURSIVE subtree AS (
            SELECT id FROM employees WHERE id = $${paramIdx}
            UNION ALL
            SELECT emp.id FROM employees emp JOIN subtree st ON emp.manager_id = st.id
          )
          SELECT id FROM subtree
        )`);
        employeeParams.push(managerId);
        paramIdx++;
      }

      const employeeWhere = employeeConditions.join(' AND ');

      // Count filtered employees
      const filteredEmployeeCount = await query(
        `SELECT COUNT(*) FROM employees e WHERE ${employeeWhere}`,
        employeeParams
      );

      // Count filtered skills (if skills filter, count only those; otherwise all)
      let filteredSkillCount: number;
      if (skillIds.length > 0) {
        const skResult = await query('SELECT COUNT(*) FROM skills WHERE id = ANY($1)', [skillIds]);
        filteredSkillCount = parseInt(skResult.rows[0].count);
      } else {
        filteredSkillCount = overall.totalSkills;
      }

      // Build assessment query with skill filter
      const assessmentConditions = [...employeeConditions];
      const assessmentParams = [...employeeParams];
      if (skillIds.length > 0) {
        assessmentConditions.push(`es.skill_id = ANY($${paramIdx})`);
        assessmentParams.push(skillIds);
        paramIdx++;
      }
      const assessmentWhere = assessmentConditions.join(' AND ');

      const filteredAssessmentCount = await query(
        `SELECT COUNT(*) FROM employee_skills es JOIN employees e ON es.employee_id = e.id WHERE ${assessmentWhere}`,
        assessmentParams
      );

      // Get filtered scores for scoring mode computation
      const filteredScoresResult = await query(
        `SELECT es.score FROM employee_skills es JOIN employees e ON es.employee_id = e.id WHERE ${assessmentWhere}`,
        assessmentParams
      );

      let scores = filteredScoresResult.rows.map((r) => parseFloat(r.score));

      // Handle not_assessed = count_as_zero
      if (notAssessed === 'count_as_zero') {
        // Count employees in filter that have NO assessment (for the filtered skill set)
        const assessedEmployeeResult = await query(
          `SELECT DISTINCT es.employee_id FROM employee_skills es JOIN employees e ON es.employee_id = e.id WHERE ${assessmentWhere}`,
          assessmentParams
        );
        const assessedCount = assessedEmployeeResult.rows.length;
        const totalFilteredEmployees = parseInt(filteredEmployeeCount.rows[0].count);
        const unassessedCount = totalFilteredEmployees - assessedCount;
        // Add zero scores for unassessed employees
        for (let i = 0; i < unassessedCount; i++) {
          scores.push(0);
        }
      }

      const filteredScore = computeScore(scores, scoringMode);

      filtered = {
        totalEmployees: parseInt(filteredEmployeeCount.rows[0].count),
        totalSkills: filteredSkillCount,
        totalAssessments: parseInt(filteredAssessmentCount.rows[0].count),
        score: filteredScore,
      };
    }

    // --- Score distribution (company-wide) ---
    const distribution = await query(`
      SELECT
        CASE
          WHEN es.score >= 90 THEN 'Expert (90-100)'
          WHEN es.score >= 70 THEN 'Proficient (70-89)'
          WHEN es.score >= 50 THEN 'Developing (50-69)'
          ELSE 'Beginner (0-49)'
        END as level,
        COUNT(*) as count
      FROM employee_skills es
      JOIN employees e ON es.employee_id = e.id
      WHERE e.is_active = TRUE
      GROUP BY level
      ORDER BY level
    `);

    // --- Recent assessments (company-wide) ---
    const recentAssessments = await query(`
      SELECT
        CONCAT(e.first_name, ' ', e.last_name) as employee_name,
        s.name as skill_name,
        es.score,
        es.assessment_date
      FROM employee_skills es
      JOIN employees e ON es.employee_id = e.id
      JOIN skills s ON es.skill_id = s.id
      WHERE e.is_active = TRUE
      ORDER BY es.assessment_date DESC
      LIMIT 5
    `);

    res.json({
      data: {
        overall,
        filtered,
        hasFilters,
        scoreDistribution: distribution.rows,
        recentAssessments: recentAssessments.rows,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Look up the employee record for a non-admin user by email.
 * Returns the employee ID (to scope to their subtree) or null if not found.
 */
async function getEmployeeIdForUser(email: string | undefined): Promise<number | null> {
  if (!email) return null;
  const result = await query(
    'SELECT id FROM employees WHERE email = $1 AND is_active = TRUE LIMIT 1',
    [email],
  );
  return result.rows.length > 0 ? result.rows[0].id : null;
}

/**
 * GET /api/v1/dashboard/hierarchy
 * Get org tree with aggregated skill scores per manager node.
 * Supports scoring modes, skill/role filtering, subtree selection.
 * Non-admin users are scoped to their own subtree.
 */
router.get('/hierarchy', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scoringMode = (req.query.scoring_mode as string) || 'average';
    const notAssessed = req.query.not_assessed as string | undefined;

    // Validate scoring_mode
    const validModes: ScoringMode[] = ['average', 'team_readiness', 'coverage'];
    if (!validModes.includes(scoringMode as ScoringMode)) {
      res.status(400).json({
        error: `Invalid scoring_mode. Must be one of: ${validModes.join(', ')}`,
      });
      return;
    }

    // Validate not_assessed
    if (notAssessed && notAssessed !== 'exclude' && notAssessed !== 'count_as_zero') {
      res.status(400).json({
        error: 'Invalid not_assessed. Must be "exclude" or "count_as_zero".',
      });
      return;
    }

    // Parse comma-separated skill IDs
    const skillsParam = req.query.skills as string | undefined;
    const skills = skillsParam
      ? skillsParam.split(',').map(Number).filter(n => !isNaN(n))
      : undefined;

    // Parse comma-separated department/role values
    const rolesParam = req.query.roles as string | undefined;
    const roles = rolesParam
      ? rolesParam.split(',').map(r => r.trim()).filter(Boolean)
      : undefined;

    // Parse optional manager_id
    const managerIdParam = req.query.manager_id as string | undefined;
    let managerId = managerIdParam ? parseInt(managerIdParam, 10) : undefined;
    if (managerIdParam && (isNaN(managerId!) || managerId! <= 0)) {
      res.status(400).json({ error: 'Invalid manager_id. Must be a positive integer.' });
      return;
    }

    // Permission-based filtering: non-admin users see only their subtree
    const isAdmin = req.session.user?.role === 'admin';
    if (!isAdmin) {
      const userEmployeeId = await getEmployeeIdForUser(req.session.user?.email);
      if (userEmployeeId !== null) {
        // Scope to user's subtree (override any requested manager_id)
        managerId = userEmployeeId;
      }
    }

    const tree = await hierarchyService.getHierarchy({
      scoring_mode: scoringMode as ScoringMode,
      skills: skills?.length ? skills : undefined,
      roles: roles?.length ? roles : undefined,
      manager_id: managerId,
      not_assessed: notAssessed as NotAssessedHandling | undefined,
    });

    res.json({ data: tree });
  } catch (error) {
    next(error);
  }
});

export default router;

