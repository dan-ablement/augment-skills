-- Migration: 003_phase2_schema
-- Description: Phase 2 schema - saved views, app settings, assessment snapshots
-- Date: 2026-02-13

-- ============================================
-- STEP 1: Create saved_views table
-- ============================================

CREATE TABLE IF NOT EXISTS saved_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_shared BOOLEAN NOT NULL DEFAULT FALSE,
  view_state JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 2: Create app_settings table
-- ============================================

CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  updated_by VARCHAR(255),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 3: Create assessment_snapshots table
-- ============================================

CREATE TABLE IF NOT EXISTS assessment_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  score DECIMAL(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  snapshot_date DATE NOT NULL,
  manager_id_at_time INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 4: Create indexes
-- ============================================

-- Indexes for saved_views
CREATE INDEX IF NOT EXISTS idx_saved_views_user_email ON saved_views(user_email);
CREATE INDEX IF NOT EXISTS idx_saved_views_is_shared ON saved_views(is_shared) WHERE is_shared = true;

-- Indexes for app_settings
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);

-- Indexes for assessment_snapshots
CREATE INDEX IF NOT EXISTS idx_assessment_snapshots_employee_skill_date ON assessment_snapshots(employee_id, skill_id, snapshot_date);

-- ============================================
-- STEP 5: Create triggers for updated_at
-- ============================================

DROP TRIGGER IF EXISTS update_saved_views_updated_at ON saved_views;
CREATE TRIGGER update_saved_views_updated_at BEFORE UPDATE ON saved_views
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_app_settings_updated_at ON app_settings;
CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 6: Seed data for app_settings
-- ============================================

-- Default color thresholds for score visualization
INSERT INTO app_settings (key, value, updated_by)
VALUES (
  'color_thresholds',
  '{"expert": 90, "proficient": 70, "developing": 50, "beginner": 25, "none": 0}'::JSONB,
  'system'
)
ON CONFLICT (key) DO NOTHING;

-- Default not-assessed handling mode
INSERT INTO app_settings (key, value, updated_by)
VALUES (
  'not_assessed_handling',
  '{"mode": "exclude"}'::JSONB,
  'system'
)
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- VERIFICATION
-- ============================================

-- Tables created successfully
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('saved_views', 'app_settings', 'assessment_snapshots');
-- SELECT * FROM app_settings;

