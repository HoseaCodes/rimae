-- ============================================================
-- VCTRL — Phase 6: pgvector Readiness Migration
-- Run this when you are ready to enable semantic search.
-- All changes are additive and non-breaking.
-- ============================================================

-- Step 1: Enable the pgvector extension
-- (requires Supabase Pro or above, or self-hosted with pgvector installed)
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Add nullable embedding column to events
-- Using 1536 dims for OpenAI text-embedding-3-small / text-embedding-ada-002
-- or 1024 dims for Anthropic voyage-3 — adjust if needed
ALTER TABLE events ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Step 3: IVFFlat index for approximate nearest-neighbour search
-- nlists=100 is a good starting point for <1M rows
-- Run ANALYZE events before using the index for the first time
CREATE INDEX IF NOT EXISTS idx_events_embedding
  ON events USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Step 4: Helper view — events that need embeddings generated
CREATE OR REPLACE VIEW events_missing_embeddings AS
SELECT
  id,
  project_id,
  title,
  summary,
  length(raw_text) AS raw_text_length,
  event_timestamp,
  created_at
FROM events
WHERE embedding IS NULL
ORDER BY created_at DESC;

-- Step 5: Add summary_auto column to track AI-generated vs user-written summaries
-- summary_auto = true means the summary was generated automatically
ALTER TABLE events ADD COLUMN IF NOT EXISTS summary_auto boolean NOT NULL DEFAULT false;

-- ─── Usage notes ────────────────────────────────────────────────────────────
-- To backfill embeddings, call the generate-embedding Edge Function for each
-- row in events_missing_embeddings.
--
-- Similarity search example:
--   SELECT id, title, 1 - (embedding <=> $1::vector) AS similarity
--   FROM events
--   WHERE project_id = $2
--   ORDER BY embedding <=> $1::vector
--   LIMIT 10;
-- ─────────────────────────────────────────────────────────────────────────────
