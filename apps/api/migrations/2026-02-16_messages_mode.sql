ALTER TABLE messages
ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'common';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'messages_mode_check'
  ) THEN
    ALTER TABLE messages
    ADD CONSTRAINT messages_mode_check CHECK (mode IN ('common','deep'));
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_messages_pair_mode_created
ON messages(pair_id, mode, server_created_at DESC);

UPDATE messages
SET mode = 'common'
WHERE mode IS NULL;
