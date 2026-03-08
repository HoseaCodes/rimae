-- ============================================================
-- VCTRL — Phase 9: Workflow Layer
-- Run this in the Supabase SQL editor.
-- All changes are additive and non-breaking.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- FOLLOW-UPS
-- Actionable items tied to events
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS follow_ups (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id       uuid        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title          text        NOT NULL,
  description    text,
  assignee       text,
  priority       text        NOT NULL DEFAULT 'medium'
                               CHECK (priority IN ('low','medium','high','urgent')),
  status         text        NOT NULL DEFAULT 'backlog'
                               CHECK (status IN ('backlog','ready','in_progress','in_review','blocked','done')),
  due_date       timestamptz,
  needs_decision boolean     NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_follow_ups_event_id       ON follow_ups(event_id);
CREATE INDEX idx_follow_ups_status         ON follow_ups(status);
CREATE INDEX idx_follow_ups_priority       ON follow_ups(priority);
CREATE INDEX idx_follow_ups_needs_decision ON follow_ups(needs_decision) WHERE needs_decision = true;
CREATE INDEX idx_follow_ups_due_date       ON follow_ups(due_date)       WHERE due_date IS NOT NULL;

CREATE TRIGGER trg_follow_ups_updated_at
  BEFORE UPDATE ON follow_ups
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ────────────────────────────────────────────────────────────
-- EVENT PINS
-- Lightweight event bookmarking — UNIQUE enforces one pin per event
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS event_pins (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   uuid        NOT NULL UNIQUE REFERENCES events(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_event_pins_event_id ON event_pins(event_id);

-- ────────────────────────────────────────────────────────────
-- LAUNCH CHECKLISTS
-- Structured readiness checklists (separate from event-level blockers)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS launch_checklists (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_launch_checklists_updated_at
  BEFORE UPDATE ON launch_checklists
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS launch_checklist_items (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id uuid        NOT NULL REFERENCES launch_checklists(id) ON DELETE CASCADE,
  event_id     uuid        REFERENCES events(id) ON DELETE SET NULL,
  title        text        NOT NULL,
  description  text,
  owner        text,
  status       text        NOT NULL DEFAULT 'backlog'
                             CHECK (status IN ('backlog','in_progress','blocked','done')),
  due_date     timestamptz,
  sort_order   integer     NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_checklist_items_checklist_id ON launch_checklist_items(checklist_id);
CREATE INDEX idx_checklist_items_event_id     ON launch_checklist_items(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX idx_checklist_items_status       ON launch_checklist_items(status);

CREATE TRIGGER trg_launch_checklist_items_updated_at
  BEFORE UPDATE ON launch_checklist_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ────────────────────────────────────────────────────────────
-- ACTION BOARDS
-- Saved operational views with filter configuration
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS action_boards (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL,
  description  text,
  filter_state jsonb       NOT NULL DEFAULT '{}',
  layout_type  text        NOT NULL DEFAULT 'list'
                             CHECK (layout_type IN ('list','board','checklist')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_action_boards_updated_at
  BEFORE UPDATE ON action_boards
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ────────────────────────────────────────────────────────────
-- CONVENIENCE VIEW: follow-ups joined with event context
-- ────────────────────────────────────────────────────────────

CREATE VIEW follow_ups_with_event AS
SELECT
  fu.id,
  fu.event_id,
  fu.title,
  fu.description,
  fu.assignee,
  fu.priority,
  fu.status,
  fu.due_date,
  fu.needs_decision,
  fu.created_at,
  fu.updated_at,
  e.title        AS event_title,
  e.category     AS event_category,
  e.severity     AS event_severity,
  e.status       AS event_status
FROM follow_ups fu
JOIN events e ON e.id = fu.event_id;
