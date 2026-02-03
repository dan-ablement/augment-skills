import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { query, getClient } from '../config/database.config';
import { requireAuth } from '../middleware/auth.middleware';
import { badRequest } from '../middleware/error.middleware';
import { logger } from '../config/logger.config';
import { appConfig } from '../config/app.config';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: appConfig.upload.maxFileSize,
  },
  fileFilter: (req, file, cb) => {
    if (appConfig.upload.allowedFileTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV files are allowed.'));
    }
  },
});

// All routes require authentication
router.use(requireAuth);

// ============================================
// EMPLOYEE IMPORT TYPES AND HELPERS
// ============================================

interface ParsedEmployeeRow {
  first_name: string;
  last_name: string;
  email: string;
  title?: string;
  department?: string;
  manager_email?: string;
  rowNumber: number;
}

interface ValidationResult {
  valid: boolean;
  rows: ParsedEmployeeRow[];
  errors: string[];
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Parse CSV buffer and return parsed rows
 */
async function parseEmployeeCsv(buffer: Buffer): Promise<ParsedEmployeeRow[]> {
  const results: ParsedEmployeeRow[] = [];
  let rowNumber = 0;

  const stream = Readable.from(buffer.toString());

  await new Promise<void>((resolve, reject) => {
    stream
      .pipe(csv())
      .on('data', (row) => {
        rowNumber++;
        results.push({
          first_name: row.first_name?.trim() || '',
          last_name: row.last_name?.trim() || '',
          email: row.email?.trim().toLowerCase() || '',
          title: row.title?.trim() || undefined,
          department: row.department?.trim() || undefined,
          manager_email: row.manager_email?.trim().toLowerCase() || undefined,
          rowNumber,
        });
      })
      .on('end', resolve)
      .on('error', reject);
  });

  return results;
}

/**
 * Validate employee CSV data
 */
async function validateEmployeeCsv(rows: ParsedEmployeeRow[]): Promise<ValidationResult> {
  const errors: string[] = [];
  const emailsInCsv = new Set<string>();
  let ceoCount = 0;

  // First pass: collect all emails and check for required fields
  for (const row of rows) {
    // Check required fields
    if (!row.first_name) {
      errors.push(`Row ${row.rowNumber}: Missing required field 'first_name'`);
    }
    if (!row.last_name) {
      errors.push(`Row ${row.rowNumber}: Missing required field 'last_name'`);
    }
    if (!row.email) {
      errors.push(`Row ${row.rowNumber}: Missing required field 'email'`);
    } else {
      // Validate email format
      if (!isValidEmail(row.email)) {
        errors.push(`Row ${row.rowNumber}: Invalid email format '${row.email}'`);
      }
      // Check for duplicate emails in CSV
      if (emailsInCsv.has(row.email)) {
        errors.push(`Row ${row.rowNumber}: Duplicate email '${row.email}' in CSV`);
      }
      emailsInCsv.add(row.email);
    }

    // Count rows without manager_email (should be exactly 1 - the CEO)
    if (!row.manager_email || row.manager_email === '') {
      ceoCount++;
    } else if (!isValidEmail(row.manager_email)) {
      errors.push(`Row ${row.rowNumber}: Invalid manager email format '${row.manager_email}'`);
    }
  }

  // Validate exactly one CEO
  if (ceoCount === 0) {
    errors.push('No CEO found: exactly one row must have an empty manager_email');
  } else if (ceoCount > 1) {
    errors.push(`Multiple CEOs found: ${ceoCount} rows have empty manager_email (expected exactly 1)`);
  }

  // Get existing employees from database
  const existingEmployeesResult = await query('SELECT email FROM employees WHERE is_active = TRUE');
  const existingEmails = new Set<string>(existingEmployeesResult.rows.map((r) => r.email.toLowerCase()));

  // Second pass: validate manager references
  for (const row of rows) {
    if (row.manager_email && row.manager_email !== '') {
      const managerEmailLower = row.manager_email.toLowerCase();
      // Manager must exist either in CSV or in database
      if (!emailsInCsv.has(managerEmailLower) && !existingEmails.has(managerEmailLower)) {
        errors.push(
          `Row ${row.rowNumber}: Manager email '${row.manager_email}' not found in CSV or existing employees`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    rows,
    errors,
  };
}

/**
 * Topologically sort employees by manager dependency
 * CEO (no manager) comes first, then their direct reports, etc.
 */
function topologicalSortEmployees(
  rows: ParsedEmployeeRow[],
  existingEmails: Set<string>
): ParsedEmployeeRow[] {
  const sorted: ParsedEmployeeRow[] = [];
  const emailToRow = new Map<string, ParsedEmployeeRow>();
  const processed = new Set<string>();

  // Build email to row map
  for (const row of rows) {
    emailToRow.set(row.email.toLowerCase(), row);
  }

  // Recursive function to add employee and all dependencies
  function addEmployee(email: string): void {
    if (processed.has(email)) return;

    const row = emailToRow.get(email);
    if (!row) return;

    // If has manager in CSV, process manager first
    if (row.manager_email && row.manager_email !== '') {
      const managerEmailLower = row.manager_email.toLowerCase();
      if (emailToRow.has(managerEmailLower) && !processed.has(managerEmailLower)) {
        addEmployee(managerEmailLower);
      }
    }

    // Add this employee
    sorted.push(row);
    processed.add(email);
  }

  // First add CEO (no manager)
  for (const row of rows) {
    if (!row.manager_email || row.manager_email === '') {
      addEmployee(row.email.toLowerCase());
    }
  }

  // Then add everyone else
  for (const row of rows) {
    addEmployee(row.email.toLowerCase());
  }

  return sorted;
}

// ============================================
// EMPLOYEE IMPORT ENDPOINTS
// ============================================

/**
 * GET /api/v1/import/employees/template
 * Download CSV template for employee import
 */
router.get('/employees/template', (req: Request, res: Response) => {
  const template = `first_name,last_name,email,title,department,manager_email
Scott,Dietzen,scott@augmentcode.com,CEO,Executive,
Igor,Ostrovsky,igor@augmentcode.com,CTO,Engineering,scott@augmentcode.com
John,Doe,john@augmentcode.com,Software Engineer,Engineering,igor@augmentcode.com`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="employees_template.csv"');
  res.send(template);
});

/**
 * POST /api/v1/import/employees/preview
 * Preview CSV before import - validates but doesn't actually import
 */
router.post(
  '/employees/preview',
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return next(badRequest('No file uploaded'));
      }

      const rows = await parseEmployeeCsv(req.file.buffer);

      if (rows.length === 0) {
        return next(badRequest('CSV file is empty'));
      }

      const validationResult = await validateEmployeeCsv(rows);

      res.json(validationResult);
    } catch (error) {
      logger.error('Employee CSV preview failed:', error);
      next(error);
    }
  }
);

/**
 * POST /api/v1/import/employees
 * Bulk import employees from CSV file
 */
router.post(
  '/employees',
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    const client = await getClient();

    try {
      if (!req.file) {
        return next(badRequest('No file uploaded'));
      }

      const rows = await parseEmployeeCsv(req.file.buffer);

      if (rows.length === 0) {
        return next(badRequest('CSV file is empty'));
      }

      // Validate CSV
      const validationResult = await validateEmployeeCsv(rows);

      if (!validationResult.valid) {
        return res.status(400).json({
          imported: 0,
          errors: validationResult.errors,
        });
      }

      // Get existing employees for manager resolution
      const existingEmployeesResult = await query(
        'SELECT id, email FROM employees WHERE is_active = TRUE'
      );
      const existingEmails = new Set<string>(
        existingEmployeesResult.rows.map((r) => r.email.toLowerCase())
      );
      const emailToId = new Map<string, number>();
      for (const emp of existingEmployeesResult.rows) {
        emailToId.set(emp.email.toLowerCase(), emp.id);
      }

      // Sort employees topologically
      const sortedRows = topologicalSortEmployees(rows, existingEmails);

      // Start transaction
      await client.query('BEGIN');

      const errors: string[] = [];
      let imported = 0;

      for (const row of sortedRows) {
        try {
          // Resolve manager_id
          let managerId: number | null = null;
          if (row.manager_email && row.manager_email !== '') {
            const managerEmailLower = row.manager_email.toLowerCase();
            managerId = emailToId.get(managerEmailLower) || null;

            if (!managerId) {
              errors.push(`Row ${row.rowNumber}: Could not resolve manager '${row.manager_email}'`);
              continue;
            }
          }

          // Insert employee
          const result = await client.query(
            `INSERT INTO employees (first_name, last_name, email, title, department, manager_id, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, TRUE)
             ON CONFLICT (email) DO UPDATE SET
               first_name = EXCLUDED.first_name,
               last_name = EXCLUDED.last_name,
               title = EXCLUDED.title,
               department = EXCLUDED.department,
               manager_id = EXCLUDED.manager_id,
               is_active = TRUE,
               updated_at = CURRENT_TIMESTAMP
             RETURNING id`,
            [row.first_name, row.last_name, row.email, row.title || null, row.department || null, managerId]
          );

          // Store the new employee's ID for manager resolution
          emailToId.set(row.email.toLowerCase(), result.rows[0].id);
          imported++;
        } catch (error: any) {
          errors.push(`Row ${row.rowNumber}: ${error.message}`);
        }
      }

      // Commit transaction
      await client.query('COMMIT');

      logger.info(`Employee CSV import completed: ${imported} imported, ${errors.length} errors`);

      res.json({
        imported,
        errors,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Employee CSV import failed:', error);
      next(error);
    } finally {
      client.release();
    }
  }
);

/**
 * POST /api/v1/import/csv
 * Import data from CSV file
 * Expected columns: employee_name, employee_email, skill_name, score, assessment_date
 */
router.post('/csv', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  const client = await getClient();
  
  try {
    if (!req.file) {
      return next(badRequest('No file uploaded'));
    }

    const results: any[] = [];
    const errors: string[] = [];
    let rowNumber = 0;

    // Parse CSV from buffer
    const stream = Readable.from(req.file.buffer.toString());
    
    await new Promise<void>((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (row) => {
          rowNumber++;
          results.push({ ...row, rowNumber });
        })
        .on('end', resolve)
        .on('error', reject);
    });

    if (results.length === 0) {
      return next(badRequest('CSV file is empty'));
    }

    // Start transaction
    await client.query('BEGIN');

    let imported = 0;
    let skipped = 0;

    for (const row of results) {
      try {
        const { employee_name, employee_email, skill_name, score, assessment_date } = row;

        // Validate required fields
        if (!employee_email || !skill_name || !score) {
          errors.push(`Row ${row.rowNumber}: Missing required fields`);
          skipped++;
          continue;
        }

        // Validate score
        const scoreNum = parseFloat(score);
        if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
          errors.push(`Row ${row.rowNumber}: Invalid score (must be 0-100)`);
          skipped++;
          continue;
        }

        // Upsert employee
        const employeeResult = await client.query(
          `INSERT INTO employees (name, email) VALUES ($1, $2)
           ON CONFLICT (email) DO UPDATE SET name = COALESCE(EXCLUDED.name, employees.name)
           RETURNING id`,
          [employee_name || employee_email.split('@')[0], employee_email]
        );
        const employeeId = employeeResult.rows[0].id;

        // Upsert skill
        const skillResult = await client.query(
          `INSERT INTO skills (name) VALUES ($1)
           ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
           RETURNING id`,
          [skill_name]
        );
        const skillId = skillResult.rows[0].id;

        // Upsert employee_skill
        await client.query(
          `INSERT INTO employee_skills (employee_id, skill_id, score, assessment_date)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (employee_id, skill_id) 
           DO UPDATE SET score = EXCLUDED.score, assessment_date = EXCLUDED.assessment_date`,
          [employeeId, skillId, scoreNum, assessment_date || new Date().toISOString().split('T')[0]]
        );

        imported++;
      } catch (error: any) {
        errors.push(`Row ${row.rowNumber}: ${error.message}`);
        skipped++;
      }
    }

    // Commit transaction
    await client.query('COMMIT');

    logger.info(`CSV import completed: ${imported} imported, ${skipped} skipped`);

    res.json({
      success: true,
      message: `Import completed: ${imported} records imported, ${skipped} skipped`,
      details: {
        total: results.length,
        imported,
        skipped,
        errors: errors.slice(0, 10), // Return first 10 errors
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('CSV import failed:', error);
    next(error);
  } finally {
    client.release();
  }
});

export default router;

