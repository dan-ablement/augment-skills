import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../config/database.config';
import { requireAuth } from '../middleware/auth.middleware';
import { notFound, badRequest } from '../middleware/error.middleware';
import { appConfig } from '../config/app.config';

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/v1/skills
 * Get all skills with pagination
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(
      parseInt(req.query.limit as string) || appConfig.pagination.defaultPageSize,
      appConfig.pagination.maxPageSize
    );
    const offset = (page - 1) * limit;
    const category = req.query.category as string;

    // Build query
    let queryText = 'SELECT * FROM skills';
    const params: any[] = [];

    if (category) {
      queryText += ' WHERE category = $1';
      params.push(category);
    }

    // Get total count
    const countQuery = category
      ? 'SELECT COUNT(*) FROM skills WHERE category = $1'
      : 'SELECT COUNT(*) FROM skills';
    const countResult = await query(countQuery, category ? [category] : []);
    const total = parseInt(countResult.rows[0].count);

    // Get skills
    queryText += ` ORDER BY category, name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    res.json({
      data: result.rows,
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
 * GET /api/v1/skills/categories
 * Get all skill categories
 */
router.get('/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      'SELECT DISTINCT category FROM skills WHERE category IS NOT NULL ORDER BY category'
    );
    res.json({ data: result.rows.map((row) => row.category) });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/skills/:id
 * Get skill by ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM skills WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return next(notFound('Skill not found'));
    }

    res.json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/skills
 * Create new skill
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, category, description } = req.body;

    if (!name) {
      return next(badRequest('Skill name is required'));
    }

    const result = await query(
      'INSERT INTO skills (name, category, description) VALUES ($1, $2, $3) RETURNING *',
      [name, category, description]
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (error: any) {
    if (error.code === '23505') {
      return next(badRequest('Skill with this name already exists'));
    }
    next(error);
  }
});

/**
 * PUT /api/v1/skills/:id
 * Update skill
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, category, description } = req.body;

    const result = await query(
      'UPDATE skills SET name = COALESCE($1, name), category = COALESCE($2, category), description = COALESCE($3, description) WHERE id = $4 RETURNING *',
      [name, category, description, id]
    );

    if (result.rows.length === 0) {
      return next(notFound('Skill not found'));
    }

    res.json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/skills/:id
 * Delete skill
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM skills WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return next(notFound('Skill not found'));
    }

    res.json({ message: 'Skill deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;

