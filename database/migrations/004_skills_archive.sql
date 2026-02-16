-- Migration 004: Add is_active column to skills table for soft-delete support
-- This migration is idempotent (safe to run multiple times)

-- Add is_active column to skills table
ALTER TABLE skills ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Add index for is_active filtering
CREATE INDEX IF NOT EXISTS idx_skills_active ON skills(is_active);

-- Update skill_coverage view to only include active skills
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
WHERE s.is_active = TRUE
GROUP BY s.id, s.name, s.category;

