-- ============================================================================
-- Pulse V2: per-user pulse rows (pair_id + user_id)
-- Safe migration: create pulses_v2, backfill from pulses, swap.
-- ============================================================================

BEGIN;

-- 1) Create new table
CREATE TABLE IF NOT EXISTS pulses_v2 (
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood TEXT NOT NULL CHECK (LENGTH(mood) <= 64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (pair_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_pulses_v2_pair_id ON pulses_v2(pair_id);
CREATE INDEX IF NOT EXISTS idx_pulses_v2_updated_at ON pulses_v2(updated_at DESC);

DROP TRIGGER IF EXISTS update_pulses_v2_updated_at ON pulses_v2;
CREATE TRIGGER update_pulses_v2_updated_at
  BEFORE UPDATE ON pulses_v2
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE pulses_v2 ENABLE ROW LEVEL SECURITY;

-- RLS: read pulses for pairs you're in
DROP POLICY IF EXISTS "Users can read pulses_v2 from own pairs" ON pulses_v2;
CREATE POLICY "Users can read pulses_v2 from own pairs"
  ON pulses_v2 FOR SELECT
  USING (
    pair_id IN (
      SELECT pair_id FROM pair_members
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

-- RLS: insert only for your own user_id and your own pairs
DROP POLICY IF EXISTS "Users can write pulses_v2 for own pairs" ON pulses_v2;
CREATE POLICY "Users can write pulses_v2 for own pairs"
  ON pulses_v2 FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    pair_id IN (
      SELECT pair_id FROM pair_members
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

-- RLS: update only your own pulse row, in your own pairs
DROP POLICY IF EXISTS "Users can update pulses_v2 for own pairs" ON pulses_v2;
CREATE POLICY "Users can update pulses_v2 for own pairs"
  ON pulses_v2 FOR UPDATE
  USING (
    auth.uid() = user_id AND
    pair_id IN (
      SELECT pair_id FROM pair_members
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  )
  WITH CHECK (
    auth.uid() = user_id AND
    pair_id IN (
      SELECT pair_id FROM pair_members
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Service role full access to pulses_v2" ON pulses_v2;
CREATE POLICY "Service role full access to pulses_v2"
  ON pulses_v2 FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- 2) Backfill from existing pulses (best-effort)
-- Old pulses has: pair_id (PK), mood, updated_by, created_at, updated_at
INSERT INTO pulses_v2 (pair_id, user_id, mood, created_at, updated_at)
SELECT p.pair_id, p.updated_by, p.mood, p.created_at, p.updated_at
FROM pulses p
WHERE p.updated_by IS NOT NULL
ON CONFLICT (pair_id, user_id)
DO UPDATE SET
  mood = EXCLUDED.mood,
  updated_at = EXCLUDED.updated_at;

-- 3) Swap tables: rename old -> pulses_legacy, new -> pulses
-- Only do this if pulses exists.
DO $$
BEGIN
  IF to_regclass('public.pulses') IS NOT NULL THEN
    ALTER TABLE pulses RENAME TO pulses_legacy;
  END IF;

  ALTER TABLE pulses_v2 RENAME TO pulses;
END $$;

COMMIT;
