-- Augment Skills Database Schema
-- PostgreSQL 14+
-- Created: January 2026
-- Updated: January 2026 - Added manager hierarchy and soft delete

-- ============================================
-- TABLES
-- ============================================

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255),
  department VARCHAR(255),
  manager_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create skills table
CREATE TABLE IF NOT EXISTS skills (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  category VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create employee_skills table (junction table with score)
CREATE TABLE IF NOT EXISTS employee_skills (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  score DECIMAL(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  assessment_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(employee_id, skill_id)
);

-- ============================================
-- INDEXES
-- ============================================

-- Performance indexes
CREATE INDEX idx_employee_skills_employee ON employee_skills(employee_id);
CREATE INDEX idx_employee_skills_skill ON employee_skills(skill_id);
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_manager ON employees(manager_id);
CREATE INDEX idx_employees_active ON employees(is_active);
CREATE INDEX idx_employees_name ON employees(last_name, first_name);
CREATE INDEX idx_skills_name ON skills(name);
CREATE INDEX idx_skills_category ON skills(category);

-- ============================================
-- TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON skills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_skills_updated_at BEFORE UPDATE ON employee_skills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA (for development)
-- ============================================

-- Insert sample employees (with manager hierarchy)
-- First insert CEO (no manager)
INSERT INTO employees (first_name, last_name, email, title, department, manager_id) VALUES
  ('Scott', 'Dietzen', 'scott@augmentcode.com', 'CEO', 'Executive', NULL)
ON CONFLICT (email) DO NOTHING;

-- Then insert managers
INSERT INTO employees (first_name, last_name, email, title, department, manager_id) VALUES
  ('Igor', 'Ostrovsky', 'igor@augmentcode.com', 'CTO', 'Engineering',
    (SELECT id FROM employees WHERE email = 'scott@augmentcode.com'))
ON CONFLICT (email) DO NOTHING;

-- Then insert employees
INSERT INTO employees (first_name, last_name, email, title, department, manager_id) VALUES
  ('John', 'Doe', 'john@augmentcode.com', 'Software Engineer', 'Engineering',
    (SELECT id FROM employees WHERE email = 'igor@augmentcode.com')),
  ('Jane', 'Smith', 'jane@augmentcode.com', 'Solution Architect', 'Engineering',
    (SELECT id FROM employees WHERE email = 'igor@augmentcode.com')),
  ('Bob', 'Johnson', 'bob@augmentcode.com', 'Sales Engineer', 'Sales',
    (SELECT id FROM employees WHERE email = 'scott@augmentcode.com'))
ON CONFLICT (email) DO NOTHING;

-- Insert sample skills
INSERT INTO skills (name, category, description) VALUES
  ('Cloud Architecture', 'Technical', 'AWS/GCP/Azure cloud platform knowledge'),
  ('Sales Methodology', 'Sales', 'MEDDIC, SPIN, Challenger sales techniques'),
  ('Product Knowledge', 'Product', 'Deep understanding of company products'),
  ('Technical Presentation', 'Soft Skills', 'Ability to present technical concepts'),
  ('Kubernetes', 'Technical', 'Container orchestration expertise')
ON CONFLICT (name) DO NOTHING;

-- Insert sample employee_skills (scores) - using subqueries for employee IDs
INSERT INTO employee_skills (employee_id, skill_id, score, assessment_date, notes)
SELECT e.id, 1, 85.5, '2026-01-15', 'Completed AWS certification'
FROM employees e WHERE e.email = 'john@augmentcode.com'
ON CONFLICT (employee_id, skill_id) DO NOTHING;

INSERT INTO employee_skills (employee_id, skill_id, score, assessment_date, notes)
SELECT e.id, 2, 92.0, '2026-01-10', 'Excellent MEDDIC application'
FROM employees e WHERE e.email = 'john@augmentcode.com'
ON CONFLICT (employee_id, skill_id) DO NOTHING;

INSERT INTO employee_skills (employee_id, skill_id, score, assessment_date, notes)
SELECT e.id, 1, 95.0, '2026-01-20', 'GCP Professional Architect certified'
FROM employees e WHERE e.email = 'jane@augmentcode.com'
ON CONFLICT (employee_id, skill_id) DO NOTHING;

INSERT INTO employee_skills (employee_id, skill_id, score, assessment_date, notes)
SELECT e.id, 3, 88.0, '2026-01-18', 'Strong product demo skills'
FROM employees e WHERE e.email = 'jane@augmentcode.com'
ON CONFLICT (employee_id, skill_id) DO NOTHING;

INSERT INTO employee_skills (employee_id, skill_id, score, assessment_date, notes)
SELECT e.id, 1, 78.0, '2026-01-12', 'Working on Azure fundamentals'
FROM employees e WHERE e.email = 'bob@augmentcode.com'
ON CONFLICT (employee_id, skill_id) DO NOTHING;

INSERT INTO employee_skills (employee_id, skill_id, score, assessment_date, notes)
SELECT e.id, 5, 90.0, '2026-01-22', 'CKA certified'
FROM employees e WHERE e.email = 'bob@augmentcode.com'
ON CONFLICT (employee_id, skill_id) DO NOTHING;

-- ============================================
-- VIEWS (for common queries)
-- ============================================

-- View: Employee skill summary (with manager info)
CREATE OR REPLACE VIEW employee_skill_summary AS
SELECT
  e.id as employee_id,
  e.first_name,
  e.last_name,
  CONCAT(e.first_name, ' ', e.last_name) as full_name,
  e.email,
  e.title,
  e.department,
  e.manager_id,
  CONCAT(m.first_name, ' ', m.last_name) as manager_name,
  e.is_active,
  COUNT(es.id) as total_skills,
  ROUND(AVG(es.score), 2) as average_score,
  MAX(es.assessment_date) as last_assessment_date
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id
LEFT JOIN employee_skills es ON e.id = es.employee_id
WHERE e.is_active = TRUE
GROUP BY e.id, e.first_name, e.last_name, e.email, e.title, e.department,
         e.manager_id, m.first_name, m.last_name, e.is_active;

-- View: Skill coverage
CREATE OR REPLACE VIEW skill_coverage AS
SELECT
  s.id as skill_id,
  s.name as skill_name,
  s.category,
  COUNT(es.id) as employee_count,
  ROUND(AVG(es.score), 2) as average_score,
  MIN(es.score) as min_score,
  MAX(es.score) as max_score
FROM skills s
LEFT JOIN employee_skills es ON s.id = es.skill_id
LEFT JOIN employees e ON es.employee_id = e.id AND e.is_active = TRUE
GROUP BY s.id, s.name, s.category;
