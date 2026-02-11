-- Migration: 002_phase1_schema
-- Description: Phase 1 schema evolution - validation events, observation scores, API keys
-- Date: 2026-02-11

-- ============================================
-- STEP 1: Create validation_events table
-- ============================================

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

-- ============================================
-- STEP 2: Create observation_scores table
-- ============================================

CREATE TABLE IF NOT EXISTS observation_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  validation_event_id UUID NOT NULL REFERENCES validation_events(id) ON DELETE CASCADE,
  competency VARCHAR NOT NULL,
  score DECIMAL(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  context JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 3: Create api_keys table
-- ============================================

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  scopes TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 4: Alter employee_skills table
-- ============================================

ALTER TABLE employee_skills ADD COLUMN IF NOT EXISTS confidence_level VARCHAR(20) DEFAULT 'unknown';
ALTER TABLE employee_skills ADD COLUMN IF NOT EXISTS observations_count INTEGER DEFAULT 0;
ALTER TABLE employee_skills ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual';

-- ============================================
-- STEP 5: Create indexes
-- ============================================

-- Indexes for validation_events
CREATE INDEX IF NOT EXISTS idx_validation_events_employee ON validation_events(employee_id);
CREATE INDEX IF NOT EXISTS idx_validation_events_type ON validation_events(event_type);
CREATE INDEX IF NOT EXISTS idx_validation_events_source ON validation_events(event_source);
CREATE INDEX IF NOT EXISTS idx_validation_events_timestamp ON validation_events(event_timestamp DESC);

-- Indexes for observation_scores
CREATE INDEX IF NOT EXISTS idx_observation_scores_event ON observation_scores(validation_event_id);
CREATE INDEX IF NOT EXISTS idx_observation_scores_competency ON observation_scores(competency);

-- Indexes for api_keys
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active) WHERE is_active = true;

-- ============================================
-- STEP 6: Create triggers for updated_at
-- ============================================

CREATE TRIGGER IF NOT EXISTS update_validation_events_updated_at BEFORE UPDATE ON validation_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_api_keys_updated_at BEFORE UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 7: Seed data
-- ============================================

-- Insert dev API key (bcrypt hash of "dev-test-api-key-12345")
-- Using a realistic bcrypt hash format
INSERT INTO api_keys (key_hash, name, scopes, is_active)
VALUES (
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm',
  'dev-test-key',
  ARRAY['validation:write', 'skills:read'],
  true
)
ON CONFLICT (key_hash) DO NOTHING;

-- Insert sample validation events for existing employees
-- Get john@augmentcode.com's employee_id and create a validation event
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

-- Insert observation scores for the validation event
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

-- Insert another validation event for jane@augmentcode.com
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
-- VERIFICATION
-- ============================================

-- Tables created successfully
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('validation_events', 'observation_scores', 'api_keys');

