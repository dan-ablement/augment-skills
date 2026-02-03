import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../config/database.config';
import { requireAuth } from '../middleware/auth.middleware';

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

    // Get all skills
    let skillQuery = 'SELECT id, name, category FROM skills';
    const skillParams: any[] = [];
    
    if (category) {
      skillQuery += ' WHERE category = $1';
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

/**
 * GET /api/v1/dashboard/summary
 * Get summary statistics for dashboard
 */
router.get('/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get counts (only active employees)
    const employeeCount = await query('SELECT COUNT(*) FROM employees WHERE is_active = TRUE');
    const skillCount = await query('SELECT COUNT(*) FROM skills');
    const assessmentCount = await query('SELECT COUNT(*) FROM employee_skills es JOIN employees e ON es.employee_id = e.id WHERE e.is_active = TRUE');

    // Get average score (only active employees)
    const avgScore = await query('SELECT ROUND(AVG(es.score), 2) as avg FROM employee_skills es JOIN employees e ON es.employee_id = e.id WHERE e.is_active = TRUE');

    // Get score distribution (only active employees)
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

    // Get recent assessments (only active employees)
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
        totalEmployees: parseInt(employeeCount.rows[0].count),
        totalSkills: parseInt(skillCount.rows[0].count),
        totalAssessments: parseInt(assessmentCount.rows[0].count),
        averageScore: parseFloat(avgScore.rows[0].avg) || 0,
        scoreDistribution: distribution.rows,
        recentAssessments: recentAssessments.rows,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

