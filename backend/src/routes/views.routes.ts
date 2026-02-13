import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../config/database.config';
import { requireAuth } from '../middleware/auth.middleware';
import { badRequest, notFound, forbidden } from '../middleware/error.middleware';

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/v1/views
 * List user's personal saved views + all shared views
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userEmail = req.session.user?.email || req.session.user?.username;

    const result = await query(
      `SELECT id, user_email, name, description, is_shared, view_state, created_at, updated_at
       FROM saved_views
       WHERE user_email = $1 OR is_shared = true
       ORDER BY created_at DESC`,
      [userEmail]
    );

    res.json({ views: result.rows });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/views
 * Create a new saved view
 * Body: { name, description?, is_shared, view_state }
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userEmail = req.session.user?.email || req.session.user?.username;
    const { name, description, is_shared, view_state } = req.body;

    if (!name) {
      return next(badRequest('Name is required'));
    }

    if (!view_state || typeof view_state !== 'object') {
      return next(badRequest('view_state is required and must be an object'));
    }

    const result = await query(
      `INSERT INTO saved_views (user_email, name, description, is_shared, view_state)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_email, name, description, is_shared, view_state, created_at, updated_at`,
      [userEmail, name, description || null, is_shared === true, view_state]
    );

    res.status(201).json({ view: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/views/:id
 * Update a saved view (owner only)
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userEmail = req.session.user?.email || req.session.user?.username;
    const { id } = req.params;
    const { name, description, is_shared, view_state } = req.body;

    // Check view exists and user owns it
    const existing = await query(
      'SELECT id, user_email FROM saved_views WHERE id = $1',
      [id]
    );

    if (existing.rows.length === 0) {
      return next(notFound('Saved view not found'));
    }

    if (existing.rows[0].user_email !== userEmail) {
      return next(forbidden('You can only edit your own saved views'));
    }

    const result = await query(
      `UPDATE saved_views
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           is_shared = COALESCE($3, is_shared),
           view_state = COALESCE($4, view_state),
           updated_at = NOW()
       WHERE id = $5
       RETURNING id, user_email, name, description, is_shared, view_state, created_at, updated_at`,
      [name || null, description !== undefined ? description : null, is_shared !== undefined ? is_shared : null, view_state || null, id]
    );

    res.json({ view: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/views/:id
 * Delete a saved view (owner only)
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userEmail = req.session.user?.email || req.session.user?.username;
    const { id } = req.params;

    // Check view exists and user owns it
    const existing = await query(
      'SELECT id, user_email FROM saved_views WHERE id = $1',
      [id]
    );

    if (existing.rows.length === 0) {
      return next(notFound('Saved view not found'));
    }

    if (existing.rows[0].user_email !== userEmail) {
      return next(forbidden('You can only delete your own saved views'));
    }

    await query('DELETE FROM saved_views WHERE id = $1', [id]);

    res.json({ message: 'Saved view deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;

