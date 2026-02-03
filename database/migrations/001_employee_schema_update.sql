-- Migration: 001_employee_schema_update
-- Description: Update employees table with first_name, last_name, manager_id, is_active
-- Date: 2026-01-27

-- ============================================
-- STEP 1: Add new columns
-- ============================================

-- Add first_name and last_name columns
ALTER TABLE employees ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);

-- Add manager_id (self-referencing foreign key)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS manager_id INTEGER REFERENCES employees(id) ON DELETE SET NULL;

-- Add is_active for soft delete
ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Rename role to title (if role exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'role') THEN
    ALTER TABLE employees RENAME COLUMN role TO title;
  END IF;
END $$;

-- ============================================
-- STEP 2: Migrate existing data
-- ============================================

-- Split existing 'name' into first_name and last_name
UPDATE employees 
SET 
  first_name = SPLIT_PART(name, ' ', 1),
  last_name = CASE 
    WHEN POSITION(' ' IN name) > 0 THEN SUBSTRING(name FROM POSITION(' ' IN name) + 1)
    ELSE ''
  END
WHERE first_name IS NULL AND name IS NOT NULL;

-- ============================================
-- STEP 3: Make columns NOT NULL after migration
-- ============================================

-- Set defaults for any NULL values
UPDATE employees SET first_name = 'Unknown' WHERE first_name IS NULL OR first_name = '';
UPDATE employees SET last_name = 'Unknown' WHERE last_name IS NULL OR last_name = '';
UPDATE employees SET is_active = TRUE WHERE is_active IS NULL;

-- Now make first_name and last_name NOT NULL
ALTER TABLE employees ALTER COLUMN first_name SET NOT NULL;
ALTER TABLE employees ALTER COLUMN last_name SET NOT NULL;
ALTER TABLE employees ALTER COLUMN is_active SET NOT NULL;

-- ============================================
-- STEP 4: Drop old 'name' column
-- ============================================

ALTER TABLE employees DROP COLUMN IF EXISTS name;

-- ============================================
-- STEP 5: Add indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_employees_manager ON employees(manager_id);
CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(is_active);
CREATE INDEX IF NOT EXISTS idx_employees_name ON employees(last_name, first_name);

-- ============================================
-- STEP 6: Update views
-- ============================================

-- Drop and recreate employee_skill_summary view
DROP VIEW IF EXISTS employee_skill_summary;
CREATE VIEW employee_skill_summary AS
SELECT 
  e.id as employee_id,
  e.first_name,
  e.last_name,
  CONCAT(e.first_name, ' ', e.last_name) as full_name,
  e.email,
  e.department,
  e.title,
  e.manager_id,
  m.first_name || ' ' || m.last_name as manager_name,
  e.is_active,
  COUNT(es.id) as total_skills,
  ROUND(AVG(es.score), 2) as average_score,
  MAX(es.assessment_date) as last_assessment_date
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id
LEFT JOIN employee_skills es ON e.id = es.employee_id
WHERE e.is_active = TRUE
GROUP BY e.id, e.first_name, e.last_name, e.email, e.department, e.title, 
         e.manager_id, m.first_name, m.last_name, e.is_active;

-- ============================================
-- VERIFICATION
-- ============================================

-- Show updated table structure
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'employees' 
-- ORDER BY ordinal_position;

