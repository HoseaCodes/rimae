-- ============================================================
-- VCTRL Knowledge System — Initial Schema
-- Run this in Supabase SQL editor
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- ENUMS
-- ────────────────────────────────────────────────────────────

CREATE TYPE source_type AS ENUM (
  'chatgpt_web',
  'claude_web',
  'manual',
  'notion',
  'slack',
  'email',
  'document',
  'screenshot',
  'external_url',
  'other'
);

CREATE TYPE event_severity AS ENUM (
  'critical',
  'high',
  'medium',
  'low',
  'info'
);

CREATE TYPE event_status AS ENUM (
  'open',
  'in_progress',
  'resolved',
  'archived',
  'wont_fix'
);

CREATE TYPE event_category AS ENUM (
  'product_decision',
  'bug',
  'auth_oauth',
  'launch_blocker',
  'beta_feedback',
  'competitor_insight',
  'pricing',
  'roadmap',
  'app_store',
  'marketing',
  'chat_log',
  'general'
);

CREATE TYPE event_type AS ENUM (
  'decision',
  'bug_note',
  'feedback',
  'insight',
  'blocker',
  'update',
  'reference',
  'log'
);

-- ────────────────────────────────────────────────────────────
-- PROJECTS
-- ────────────────────────────────────────────────────────────

CREATE TABLE projects (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text UNIQUE NOT NULL,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- SOURCES
-- ────────────────────────────────────────────────────────────

CREATE TABLE sources (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type         source_type NOT NULL DEFAULT 'manual',
  name         text NOT NULL,
  original_url text,
  imported_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- EVENTS
-- ────────────────────────────────────────────────────────────

CREATE TABLE events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source_id       uuid REFERENCES sources(id) ON DELETE SET NULL,
  title           text NOT NULL,
  summary         text,
  raw_text        text NOT NULL,
  event_type      event_type NOT NULL DEFAULT 'log',
  category        event_category NOT NULL DEFAULT 'general',
  severity        event_severity NOT NULL DEFAULT 'info',
  status          event_status NOT NULL DEFAULT 'open',
  event_timestamp timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  -- Full-text search vector (auto-updated by trigger)
  search_vector   tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(raw_text, '')), 'C')
  ) STORED
);

-- ────────────────────────────────────────────────────────────
-- TAGS
-- ────────────────────────────────────────────────────────────

CREATE TABLE tags (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text UNIQUE NOT NULL,
  slug       text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE event_tags (
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  tag_id   uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, tag_id)
);

-- ────────────────────────────────────────────────────────────
-- SAVED VIEWS
-- ────────────────────────────────────────────────────────────

CREATE TABLE saved_views (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name         text NOT NULL,
  description  text,
  filter_state jsonb NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- RAW CAPTURE: ChatGPT Conversation Snapshots
-- (already exists — shown here for reference only)
-- ────────────────────────────────────────────────────────────
-- CREATE TABLE chatgpt_conversation_snapshots (
--   id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
--   project_slug             text NOT NULL DEFAULT 'vctrl',
--   source                   text NOT NULL DEFAULT 'chatgpt_web',
--   external_conversation_id text NOT NULL,
--   conversation_url         text NOT NULL,
--   title                    text,
--   message_count            int,
--   content_hash             text NOT NULL,
--   raw_text                 text NOT NULL,
--   captured_at              timestamptz NOT NULL DEFAULT now(),
--   created_at               timestamptz NOT NULL DEFAULT now(),
--   UNIQUE (external_conversation_id, content_hash)
-- );

-- ────────────────────────────────────────────────────────────
-- INDEXES
-- ────────────────────────────────────────────────────────────

-- Full-text search
CREATE INDEX idx_events_search_vector ON events USING gin(search_vector);

-- Common filter columns
CREATE INDEX idx_events_project_id      ON events(project_id);
CREATE INDEX idx_events_category        ON events(category);
CREATE INDEX idx_events_severity        ON events(severity);
CREATE INDEX idx_events_status          ON events(status);
CREATE INDEX idx_events_event_type      ON events(event_type);
CREATE INDEX idx_events_event_timestamp ON events(event_timestamp DESC);
CREATE INDEX idx_events_source_id       ON events(source_id);

-- Sources
CREATE INDEX idx_sources_project_id ON sources(project_id);
CREATE INDEX idx_sources_type       ON sources(type);

-- Tags
CREATE INDEX idx_event_tags_event_id ON event_tags(event_id);
CREATE INDEX idx_event_tags_tag_id   ON event_tags(tag_id);

-- Saved views
CREATE INDEX idx_saved_views_project_id ON saved_views(project_id);

-- ────────────────────────────────────────────────────────────
-- UPDATED_AT TRIGGER (shared function)
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_sources_updated_at
  BEFORE UPDATE ON sources
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_saved_views_updated_at
  BEFORE UPDATE ON saved_views
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ────────────────────────────────────────────────────────────
-- SEARCH HELPER VIEW
-- Joins events with tag names and source name for easy querying
-- ────────────────────────────────────────────────────────────

CREATE VIEW events_with_meta AS
SELECT
  e.id,
  e.project_id,
  e.source_id,
  e.title,
  e.summary,
  e.raw_text,
  e.event_type,
  e.category,
  e.severity,
  e.status,
  e.event_timestamp,
  e.created_at,
  e.updated_at,
  e.search_vector,
  s.name    AS source_name,
  s.type    AS source_type,
  COALESCE(
    array_agg(t.name ORDER BY t.name) FILTER (WHERE t.name IS NOT NULL),
    '{}'::text[]
  ) AS tag_names
FROM events e
LEFT JOIN sources s ON s.id = e.source_id
LEFT JOIN event_tags et ON et.event_id = e.id
LEFT JOIN tags t ON t.id = et.tag_id
GROUP BY e.id, s.name, s.type;

-- ────────────────────────────────────────────────────────────
-- pgvector READINESS COMMENT
-- When ready: ALTER TABLE events ADD COLUMN embedding vector(1536);
-- CREATE INDEX ON events USING ivfflat (embedding vector_cosine_ops);
-- ────────────────────────────────────────────────────────────
