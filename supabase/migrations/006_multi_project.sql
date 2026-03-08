-- ============================================================
-- VCTRL — Phase 10: Multi-Project Support
-- Run this in the Supabase SQL editor (or via supabase db push).
-- All changes are additive and non-breaking.
-- Existing RIMAE data is preserved.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- PROJECT MEMBERSHIPS
-- Role-based access per project.
-- user_id references auth.users when Supabase Auth is enabled;
-- for now it accepts any UUID (placeholder-friendly).
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS project_memberships (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL,
  role       text        NOT NULL DEFAULT 'viewer'
                           CHECK (role IN ('owner', 'editor', 'viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_memberships_project_id ON project_memberships(project_id);
CREATE INDEX IF NOT EXISTS idx_project_memberships_user_id    ON project_memberships(user_id);

CREATE TRIGGER trg_project_memberships_updated_at
  BEFORE UPDATE ON project_memberships
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ────────────────────────────────────────────────────────────
-- ADD project_id TO launch_checklists
-- ────────────────────────────────────────────────────────────

ALTER TABLE launch_checklists
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id) ON DELETE CASCADE;

-- Backfill: existing checklists belong to the original RIMAE project
UPDATE launch_checklists
  SET project_id = 'a1b2c3d4-0000-0000-0000-000000000001'
  WHERE project_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_launch_checklists_project_id ON launch_checklists(project_id);

-- ────────────────────────────────────────────────────────────
-- ADD project_id TO action_boards
-- ────────────────────────────────────────────────────────────

ALTER TABLE action_boards
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id) ON DELETE CASCADE;

-- Backfill: existing boards belong to the original RIMAE project
UPDATE action_boards
  SET project_id = 'a1b2c3d4-0000-0000-0000-000000000001'
  WHERE project_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_action_boards_project_id ON action_boards(project_id);

-- ────────────────────────────────────────────────────────────
-- ADD scope TO saved_views
-- 'project' = scoped to one project (default, backwards-compatible)
-- 'global'  = visible across all projects in the workspace
-- ────────────────────────────────────────────────────────────

ALTER TABLE saved_views
  ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'project'
    CHECK (scope IN ('project', 'global'));

-- ────────────────────────────────────────────────────────────
-- SEED: second demo project
-- Only inserted if it doesn't already exist.
-- ────────────────────────────────────────────────────────────

INSERT INTO projects (id, name, slug, description)
VALUES (
  'c3d4e5f6-0000-0000-0000-000000000002',
  'Demo Project',
  'demo',
  'A second project to demonstrate multi-project support'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO project_settings (project_id, settings)
VALUES (
  'c3d4e5f6-0000-0000-0000-000000000002',
  '{"ai_enabled": false, "ai_provider": "ollama_local", "ollama_model": "llama3", "ollama_cloud_model": "", "openai_model": "gpt-4o-mini", "claude_model": "claude-3-haiku-20240307", "temperature": 0.3, "openai_embedding_model": "text-embedding-3-small"}'
)
ON CONFLICT (project_id) DO NOTHING;
