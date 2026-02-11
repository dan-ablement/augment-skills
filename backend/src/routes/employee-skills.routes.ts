import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../config/database.config';
import { requireAuth } from '../middleware/auth.middleware';
import { notFound } from '../middleware/error.middleware';

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/v1/employees/:id/skills
 * Get employee's skill profile with confidence levels and observation counts
 * 
 * Query params:
 *   - competency (optional): filter by skill category
 *   - include_events (boolean, default false): include recent validation events
 */
router.get('/:id/skills', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const competency = req.query.competency as string;
    const includeEvents = req.query.include_events === 'true';

    // Verify employee exists and is active
    const employeeResult = await query(
      `SELECT id, first_name, last_name, email FROM employees WHERE id = $1 AND is_active = true`,
      [id]
    );

    if (employeeResult.rows.length === 0) {
      return next(notFound('Employee not found'));
    }

    const employee = employeeResult.rows[0];

    // Query employee skills with skill details
    let skillQuery = `
      SELECT 
        es.id,
        es.employee_id,
        es.skill_id,
        es.score,
        es.assessment_date,
        s.name as skill_name,
        s.category,
        COALESCE(es.confidence_level, 'medium') as confidence_level,
        COALESCE(es.observations_count, 0) as observations_count,
        COALESCE(es.source, 'manual') as source
      FROM employee_skills es
      JOIN skills s ON es.skill_id = s.id
      WHERE es.employee_id = $1
    `;

    const params: any[] = [id];

    // Optional competency filter
    if (competency) {
      skillQuery += ` AND s.category = $2`;
      params.push(competency);
    }

    skillQuery += ` ORDER BY s.category, s.name`;

    const skillsResult = await query(skillQuery, params);

    // Build response with skills
    const skills = skillsResult.rows.map((skill) => ({
      skill_id: skill.skill_id,
      skill_name: skill.skill_name,
      category: skill.category,
      score: parseFloat(skill.score),
      confidence_level: skill.confidence_level,
      observations_count: parseInt(skill.observations_count),
      assessment_date: skill.assessment_date,
      source: skill.source,
      recent_events: includeEvents ? [] : undefined, // Placeholder for future events
    }));

    // Remove recent_events if not requested
    if (!includeEvents) {
      skills.forEach((skill) => delete skill.recent_events);
    }

    res.json({
      employee_id: employee.id,
      employee_email: employee.email,
      employee_name: `${employee.first_name} ${employee.last_name}`,
      skills,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

