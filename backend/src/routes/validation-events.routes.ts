import { Router, Request, Response, NextFunction } from 'express';
import { query, getClient } from '../config/database.config';
import { requireApiKey } from '../middleware/apikey.middleware';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';
import { notFound, badRequest } from '../middleware/error.middleware';
import { appConfig } from '../config/app.config';
import { logger } from '../config/logger.config';

const router = Router();

// Valid event types
const VALID_EVENT_TYPES = ['role_play', 'multiple_choice_test', 'certification_exam', 'hands_on_lab'];

/**
 * POST /api/v1/validation-events
 * Submit validation event results
 */
router.post('/', requireApiKey, async (req: Request, res: Response, next: NextFunction) => {
  const client = await getClient();
  try {
    const {
      employee_email,
      event_type,
      event_source,
      timestamp,
      overall_score,
      passed,
      competency_scores,
      details_url,
      session_metadata,
    } = req.body;

    // Validate required fields
    if (!employee_email || !event_type || !event_source || !timestamp || overall_score === undefined || passed === undefined) {
      return next(badRequest('Missing required fields: employee_email, event_type, event_source, timestamp, overall_score, passed'));
    }

    // Validate event_type
    if (!VALID_EVENT_TYPES.includes(event_type)) {
      return next(badRequest(`Invalid event_type. Must be one of: ${VALID_EVENT_TYPES.join(', ')}`));
    }

    // Validate scores are 0-100
    if (overall_score < 0 || overall_score > 100) {
      return next(badRequest('overall_score must be between 0 and 100'));
    }

    if (competency_scores && Array.isArray(competency_scores)) {
      for (const cs of competency_scores) {
        if (cs.score < 0 || cs.score > 100) {
          return next(badRequest(`Competency score for "${cs.competency}" must be between 0 and 100`));
        }
      }
    }

    // Start transaction
    await client.query('BEGIN');

    // Look up employee by email
    const employeeResult = await client.query(
      'SELECT id FROM employees WHERE email = $1 AND is_active = true',
      [employee_email]
    );

    if (employeeResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return next(notFound(`Employee with email "${employee_email}" not found`));
    }

    const employee_id = employeeResult.rows[0].id;

    // Insert validation event
    const eventResult = await client.query(
      `INSERT INTO validation_events (employee_id, event_type, event_source, event_timestamp, overall_score, passed, details_url, session_metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, employee_id, event_type, event_source, overall_score, passed, created_at`,
      [employee_id, event_type, event_source, timestamp, overall_score, passed, details_url || null, session_metadata || null]
    );

    const validation_event = eventResult.rows[0];

    // Insert competency scores
    if (competency_scores && Array.isArray(competency_scores)) {
      for (const cs of competency_scores) {
        await client.query(
          `INSERT INTO observation_scores (validation_event_id, competency, score, context)
           VALUES ($1, $2, $3, $4)`,
          [validation_event.id, cs.competency, cs.score, cs.context || null]
        );
      }
    }

    // Commit transaction
    await client.query('COMMIT');

    // Fetch competency scores for response
    const scoresResult = await query(
      'SELECT competency, score, context FROM observation_scores WHERE validation_event_id = $1',
      [validation_event.id]
    );

    res.status(201).json({
      data: {
        id: validation_event.id,
        employee_id: validation_event.employee_id,
        event_type: validation_event.event_type,
        event_source: validation_event.event_source,
        overall_score: validation_event.overall_score,
        passed: validation_event.passed,
        competency_scores: scoresResult.rows,
        created_at: validation_event.created_at,
      },
    });
  } catch (error: any) {
    await client.query('ROLLBACK').catch(() => {});
    logger.error('Error creating validation event:', error);
    next(error);
  } finally {
    client.release();
  }
});

/**
 * GET /api/v1/validation-events
 * Get all validation events across all employees (admin only)
 * Supports pagination, filtering by event_type, event_source, and search by employee name/email
 */
router.get('/', requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(
      parseInt(req.query.limit as string) || appConfig.pagination.defaultPageSize,
      appConfig.pagination.maxPageSize
    );
    const offset = (page - 1) * limit;
    const event_type = req.query.event_type as string | undefined;
    const event_source = req.query.event_source as string | undefined;
    const search = req.query.search as string | undefined;

    // Build WHERE clause
    const conditions: string[] = [];
    const params: any[] = [];

    if (event_type) {
      params.push(event_type);
      conditions.push(`ve.event_type = $${params.length}`);
    }

    if (event_source) {
      params.push(event_source);
      conditions.push(`ve.event_source = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(CONCAT(e.first_name, ' ', e.last_name) ILIKE $${params.length} OR e.email ILIKE $${params.length})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM validation_events ve
       JOIN employees e ON ve.employee_id = e.id
       ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get events with pagination
    const eventsResult = await query(
      `SELECT ve.id, ve.employee_id, CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
              e.email AS employee_email, ve.event_type, ve.event_source, ve.event_timestamp,
              ve.overall_score, ve.passed, ve.details_url, ve.session_metadata, ve.created_at
       FROM validation_events ve
       JOIN employees e ON ve.employee_id = e.id
       ${whereClause}
       ORDER BY ve.event_timestamp DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    // Fetch observation scores for each event
    const events = await Promise.all(
      eventsResult.rows.map(async (event) => {
        const scoresResult = await query(
          'SELECT competency, score, context FROM observation_scores WHERE validation_event_id = $1',
          [event.id]
        );
        return {
          ...event,
          competency_scores: scoresResult.rows,
        };
      })
    );

    res.json({
      data: events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/validation-events/:employee_id
 * Get validation event history for an employee
 */
router.get('/:employee_id', requireApiKey, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { employee_id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(
      parseInt(req.query.limit as string) || appConfig.pagination.defaultPageSize,
      appConfig.pagination.maxPageSize
    );
    const offset = (page - 1) * limit;
    const event_type = req.query.event_type as string | undefined;

    // Verify employee exists
    const employeeResult = await query(
      'SELECT id FROM employees WHERE id = $1',
      [employee_id]
    );

    if (employeeResult.rows.length === 0) {
      return next(notFound('Employee not found'));
    }

    // Build WHERE clause
    let whereClause = 've.employee_id = $1';
    const params: any[] = [employee_id];

    if (event_type) {
      whereClause += ' AND ve.event_type = $2';
      params.push(event_type);
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM validation_events ve WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get events with pagination
    const eventsResult = await query(
      `SELECT ve.id, ve.employee_id, ve.event_type, ve.event_source, ve.overall_score, ve.passed, ve.created_at
       FROM validation_events ve
       WHERE ${whereClause}
       ORDER BY ve.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    // Fetch observation scores for each event
    const events = await Promise.all(
      eventsResult.rows.map(async (event) => {
        const scoresResult = await query(
          'SELECT competency, score, context FROM observation_scores WHERE validation_event_id = $1',
          [event.id]
        );
        return {
          ...event,
          competency_scores: scoresResult.rows,
        };
      })
    );

    res.json({
      data: events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

