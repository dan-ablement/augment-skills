import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../config/database.config';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';
import { badRequest, notFound } from '../middleware/error.middleware';

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/v1/settings
 * Get all app settings (any authenticated user)
 */
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT key, value, updated_by, updated_at
       FROM app_settings
       ORDER BY key`
    );

    // Return as a key-value map for easy consumption
    const settings: Record<string, { value: unknown; updated_by: string | null; updated_at: string }> = {};
    for (const row of result.rows) {
      settings[row.key] = {
        value: row.value,
        updated_by: row.updated_by,
        updated_at: row.updated_at,
      };
    }

    res.json({ settings });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/settings/:key
 * Update a setting value (admin only)
 */
router.put('/:key', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const userEmail = req.session.user?.email || req.session.user?.username;

    if (value === undefined) {
      return next(badRequest('value is required'));
    }

    // Check setting exists
    const existing = await query(
      'SELECT key FROM app_settings WHERE key = $1',
      [key]
    );

    if (existing.rows.length === 0) {
      return next(notFound(`Setting '${key}' not found`));
    }

    const result = await query(
      `UPDATE app_settings
       SET value = $1, updated_by = $2, updated_at = NOW()
       WHERE key = $3
       RETURNING key, value, updated_by, updated_at`,
      [JSON.stringify(value), userEmail, key]
    );

    res.json({ setting: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

export default router;

