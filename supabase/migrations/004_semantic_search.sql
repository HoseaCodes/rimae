-- ============================================================
-- VCTRL — Phase 10: Semantic Search RPC Functions
-- Run this in the Supabase SQL editor.
-- Requires 002_pgvector.sql to have been applied first.
-- ============================================================

-- ─── Semantic event search ────────────────────────────────────────────────────
-- Takes a pre-computed query embedding and returns matching event IDs
-- ordered by cosine similarity. Called by the Explorer in semantic mode.

CREATE OR REPLACE FUNCTION search_events_semantic(
  p_project_id  uuid,
  p_embedding   vector(1536),
  p_limit       int DEFAULT 20
)
RETURNS TABLE (id uuid, similarity float8)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    1 - (embedding <=> p_embedding) AS similarity
  FROM events
  WHERE project_id = p_project_id
    AND embedding IS NOT NULL
  ORDER BY embedding <=> p_embedding
  LIMIT p_limit;
$$;

-- ─── Related events ───────────────────────────────────────────────────────────
-- Given an event ID, returns the N most similar other events in the same project.
-- Returns empty if the source event has no embedding yet.

CREATE OR REPLACE FUNCTION find_related_events(
  p_event_id    uuid,
  p_project_id  uuid,
  p_limit       int DEFAULT 5
)
RETURNS TABLE (id uuid, similarity float8)
LANGUAGE sql STABLE
AS $$
  SELECT
    e2.id,
    1 - (e1.embedding <=> e2.embedding) AS similarity
  FROM events e1
  JOIN events e2
    ON  e2.project_id = p_project_id
    AND e2.id         != p_event_id
    AND e2.embedding  IS NOT NULL
  WHERE e1.id        = p_event_id
    AND e1.embedding IS NOT NULL
  ORDER BY e1.embedding <=> e2.embedding
  LIMIT p_limit;
$$;
