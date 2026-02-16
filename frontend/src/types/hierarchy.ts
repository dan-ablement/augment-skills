/**
 * Frontend types matching the backend hierarchy API response.
 * See: backend/src/services/hierarchy.service.ts
 */

export type ScoringMode = 'average' | 'team_readiness' | 'coverage';
export type NotAssessedHandling = 'exclude' | 'count_as_zero';

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

/** Query parameters for the hierarchy API */
export interface HierarchyQueryParams {
  scoring_mode?: ScoringMode;
  skills?: number[];
  roles?: string[];
  manager_id?: number;
  not_assessed?: NotAssessedHandling;
}

/** Summary API response shape */
export interface SummaryData {
  overall: {
    totalEmployees: number;
    totalSkills: number;
    totalAssessments: number;
    score: number | null;
  };
  filtered: {
    totalEmployees: number;
    totalSkills: number;
    totalAssessments: number;
    score: number | null;
  };
  hasFilters: boolean;
  scoreDistribution: Array<{ level: string; count: string }>;
  recentAssessments: Array<{
    employee_name: string;
    skill_name: string;
    score: number;
    assessment_date: string;
  }>;
}

