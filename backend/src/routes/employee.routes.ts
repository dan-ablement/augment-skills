import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../config/database.config';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';
import { notFound, badRequest } from '../middleware/error.middleware';
import { appConfig } from '../config/app.config';

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/v1/employees/managers
 * Get all potential managers (active employees) for dropdown
 */
router.get('/managers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT id, CONCAT(first_name, ' ', last_name) AS full_name, title, department
       FROM employees
       WHERE is_active = true
       ORDER BY first_name ASC, last_name ASC`
    );

    res.json({ data: result.rows });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/employees
 * Get all employees with pagination and manager info
 * Query params:
 *   - include_inactive: if 'true', include inactive employees
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(
      parseInt(req.query.limit as string) || appConfig.pagination.defaultPageSize,
      appConfig.pagination.maxPageSize
    );
    const offset = (page - 1) * limit;
    const includeInactive = req.query.include_inactive === 'true';

    // Build WHERE clause for active filter
    const activeFilter = includeInactive ? '' : 'WHERE e.is_active = true';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM employees e ${activeFilter}`
    );
    const total = parseInt(countResult.rows[0].count);

    // Get employees with manager info
    const result = await query(
      `SELECT
         e.id,
         e.first_name,
         e.last_name,
         CONCAT(e.first_name, ' ', e.last_name) AS full_name,
         e.email,
         e.title,
         e.department,
         e.manager_id,
         CONCAT(m.first_name, ' ', m.last_name) AS manager_name,
         e.is_active,
         e.created_at,
         e.updated_at
       FROM employees e
       LEFT JOIN employees m ON e.manager_id = m.id
       ${activeFilter}
       ORDER BY e.first_name ASC, e.last_name ASC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

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
 * GET /api/v1/employees/:id
 * Get employee by ID with manager info
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT
         e.id,
         e.first_name,
         e.last_name,
         CONCAT(e.first_name, ' ', e.last_name) AS full_name,
         e.email,
         e.title,
         e.department,
         e.manager_id,
         CONCAT(m.first_name, ' ', m.last_name) AS manager_name,
         e.is_active,
         e.created_at,
         e.updated_at
       FROM employees e
       LEFT JOIN employees m ON e.manager_id = m.id
       WHERE e.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return next(notFound('Employee not found'));
    }

    res.json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/employees
 * Create new employee
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { first_name, last_name, email, title, department, manager_id } = req.body;

    if (!first_name || !last_name || !email) {
      return next(badRequest('First name, last name, and email are required'));
    }

    // Validate CEO constraint: only one employee can have manager_id = NULL
    if (manager_id === null || manager_id === undefined) {
      const ceoCheck = await query(
        'SELECT id FROM employees WHERE manager_id IS NULL AND is_active = true'
      );
      if (ceoCheck.rows.length > 0) {
        return next(badRequest('A CEO (employee with no manager) already exists. Only one employee can have no manager.'));
      }
    }

    const result = await query(
      `INSERT INTO employees (first_name, last_name, email, title, department, manager_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [first_name, last_name, email, title || null, department || null, manager_id || null]
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (error: any) {
    if (error.code === '23505') {
      return next(badRequest('Employee with this email already exists'));
    }
    if (error.code === '23503') {
      return next(badRequest('Invalid manager_id: manager does not exist'));
    }
    next(error);
  }
});

/**
 * PUT /api/v1/employees/:id
 * Update employee
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, title, department, manager_id } = req.body;

    // Check if employee exists
    const existingEmployee = await query('SELECT * FROM employees WHERE id = $1', [id]);
    if (existingEmployee.rows.length === 0) {
      return next(notFound('Employee not found'));
    }

    // Validate CEO constraint if updating manager_id to NULL
    const newManagerId = manager_id === undefined ? existingEmployee.rows[0].manager_id : manager_id;
    if (newManagerId === null) {
      const ceoCheck = await query(
        'SELECT id FROM employees WHERE manager_id IS NULL AND is_active = true AND id != $1',
        [id]
      );
      if (ceoCheck.rows.length > 0) {
        return next(badRequest('A CEO (employee with no manager) already exists. Only one employee can have no manager.'));
      }
    }

    // Prevent employee from being their own manager
    if (manager_id !== undefined && parseInt(manager_id) === parseInt(id as string)) {
      return next(badRequest('An employee cannot be their own manager'));
    }

    const result = await query(
      `UPDATE employees SET
         first_name = COALESCE($1, first_name),
         last_name = COALESCE($2, last_name),
         email = COALESCE($3, email),
         title = COALESCE($4, title),
         department = COALESCE($5, department),
         manager_id = $6,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [
        first_name || null,
        last_name || null,
        email || null,
        title,
        department,
        newManagerId,
        id
      ]
    );

    res.json({ data: result.rows[0] });
  } catch (error: any) {
    if (error.code === '23505') {
      return next(badRequest('Employee with this email already exists'));
    }
    if (error.code === '23503') {
      return next(badRequest('Invalid manager_id: manager does not exist'));
    }
    next(error);
  }
});

/**
 * DELETE /api/v1/employees/:id
 * Soft delete employee (set is_active = false)
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Check if employee exists and is active
    const existingEmployee = await query(
      'SELECT * FROM employees WHERE id = $1',
      [id]
    );

    if (existingEmployee.rows.length === 0) {
      return next(notFound('Employee not found'));
    }

    if (!existingEmployee.rows[0].is_active) {
      return next(badRequest('Employee is already inactive'));
    }

    // Soft delete by setting is_active to false
    const result = await query(
      `UPDATE employees SET is_active = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    res.json({ message: 'Employee deactivated successfully', data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/employees/:id/restore
 * Restore an archived employee (admin only)
 */
router.put('/:id/restore', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Check if employee exists
    const existingEmployee = await query('SELECT * FROM employees WHERE id = $1', [id]);

    if (existingEmployee.rows.length === 0) {
      return next(notFound('Employee not found'));
    }

    if (existingEmployee.rows[0].is_active) {
      return next(badRequest('Employee is already active'));
    }

    const result = await query(
      `UPDATE employees SET is_active = true, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    res.json({ message: 'Employee restored successfully', data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

export default router;

