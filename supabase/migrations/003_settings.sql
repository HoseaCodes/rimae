-- ============================================================
-- VCTRL — Phase 8: Project Settings + AI Provider Config
-- Run this in the Supabase SQL editor.
-- All changes are additive and non-breaking.
-- ============================================================

CREATE TABLE IF NOT EXISTS project_settings (
  project_id   uuid PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  settings     jsonb NOT NULL DEFAULT '{}',
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Reuse existing updated_at trigger function from 001_initial_schema.sql
CREATE TRIGGER trg_project_settings_updated_at
  BEFORE UPDATE ON project_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Seed default settings for the RIMAE project.
-- ai_enabled defaults to false — AI features must be explicitly opted in.
INSERT INTO project_settings (project_id, settings)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  '{
    "ai_enabled": false,
    "ai_provider": "ollama_local",
    "ollama_model": "llama3",
    "ollama_cloud_model": "llama3.1",
    "openai_model": "gpt-4o-mini",
    "claude_model": "claude-3-5-sonnet-latest",
    "temperature": 0.2
  }'::jsonb
)
ON CONFLICT (project_id) DO NOTHING;
