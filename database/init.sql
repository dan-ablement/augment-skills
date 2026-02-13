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
  confidence_level VARCHAR(20) DEFAULT 'unknown',
  observations_count INTEGER DEFAULT 0,
  source VARCHAR(50) DEFAULT 'manual',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(employee_id, skill_id)
);

-- Create validation_events table (Phase 1)
CREATE TABLE IF NOT EXISTS validation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  event_type VARCHAR NOT NULL,
  event_source VARCHAR NOT NULL,
  event_timestamp TIMESTAMPTZ NOT NULL,
  overall_score DECIMAL(5,2) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  passed BOOLEAN NOT NULL DEFAULT false,
  details_url TEXT,
  session_metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create observation_scores table (Phase 1)
CREATE TABLE IF NOT EXISTS observation_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  validation_event_id UUID NOT NULL REFERENCES validation_events(id) ON DELETE CASCADE,
  competency VARCHAR NOT NULL,
  score DECIMAL(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  context JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create api_keys table (Phase 1)
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  scopes TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ DEFAULT NULL,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
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

-- Indexes for validation_events (Phase 1)
CREATE INDEX idx_validation_events_employee ON validation_events(employee_id);
CREATE INDEX idx_validation_events_type ON validation_events(event_type);
CREATE INDEX idx_validation_events_source ON validation_events(event_source);
CREATE INDEX idx_validation_events_timestamp ON validation_events(event_timestamp DESC);

-- Indexes for observation_scores (Phase 1)
CREATE INDEX idx_observation_scores_event ON observation_scores(validation_event_id);
CREATE INDEX idx_observation_scores_competency ON observation_scores(competency);

-- Indexes for api_keys (Phase 1)
CREATE INDEX idx_api_keys_active ON api_keys(is_active) WHERE is_active = true;

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

CREATE TRIGGER update_validation_events_updated_at BEFORE UPDATE ON validation_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys
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

-- Insert dev API key (bcrypt hash of "dev-test-api-key-12345")
INSERT INTO api_keys (key_hash, name, scopes, is_active, expires_at)
VALUES (
  '$2b$10$VYNtEqe0i8F3Dv1rSpAM6.XFeVeIgmyfMYbIX2ATksoRqFrUuDGxK',
  'dev-test-key',
  ARRAY['validation:write', 'skills:read'],
  true,
  NULL
)
ON CONFLICT (key_hash) DO NOTHING;

-- Insert sample validation events for john@augmentcode.com
INSERT INTO validation_events (employee_id, event_type, event_source, event_timestamp, overall_score, passed, details_url, session_metadata)
SELECT
  e.id,
  'role_play',
  'voice-roleplay',
  '2026-02-10T14:30:00Z'::TIMESTAMPTZ,
  82,
  true,
  'gs://roleplay-results/session-abc123.json',
  '{"duration_seconds": 420, "scenario_id": "enterprise-discovery-tech-buyer", "attempt_number": 3, "certification_eligible": false}'::JSONB
FROM employees e
WHERE e.email = 'john@augmentcode.com'
ON CONFLICT DO NOTHING;

-- Insert observation scores for john's validation event
INSERT INTO observation_scores (validation_event_id, competency, score, context)
SELECT
  ve.id,
  'discovery',
  85,
  '{"industry": "healthcare", "deal_size": "enterprise"}'::JSONB
FROM validation_events ve
WHERE ve.event_source = 'voice-roleplay' AND ve.overall_score = 82
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO observation_scores (validation_event_id, competency, score, context)
SELECT
  ve.id,
  'objection_handling',
  78,
  '{"industry": "healthcare", "deal_size": "enterprise"}'::JSONB
FROM validation_events ve
WHERE ve.event_source = 'voice-roleplay' AND ve.overall_score = 82
LIMIT 1
ON CONFLICT DO NOTHING;

-- Insert sample validation event for jane@augmentcode.com
INSERT INTO validation_events (employee_id, event_type, event_source, event_timestamp, overall_score, passed, details_url, session_metadata)
SELECT
  e.id,
  'multiple_choice_test',
  'quiz-platform',
  '2026-02-11T09:15:00Z'::TIMESTAMPTZ,
  92,
  true,
  'https://quiz-platform/results/xyz789',
  '{"duration_seconds": 1200, "questions_total": 25, "questions_correct": 23}'::JSONB
FROM employees e
WHERE e.email = 'jane@augmentcode.com'
ON CONFLICT DO NOTHING;

-- Insert observation scores for jane's validation event
INSERT INTO observation_scores (validation_event_id, competency, score, context)
SELECT
  ve.id,
  'product_knowledge',
  94,
  '{"product_line": "platform"}'::JSONB
FROM validation_events ve
WHERE ve.event_source = 'quiz-platform' AND ve.overall_score = 92
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO observation_scores (validation_event_id, competency, score, context)
SELECT
  ve.id,
  'technical_architecture',
  90,
  '{"product_line": "platform"}'::JSONB
FROM validation_events ve
WHERE ve.event_source = 'quiz-platform' AND ve.overall_score = 92
LIMIT 1
ON CONFLICT DO NOTHING;

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
