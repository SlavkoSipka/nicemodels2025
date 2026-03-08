-- ============================================================================
-- MODEL STATUS MESSAGES SYSTEM
-- ============================================================================
-- Standalone status messages published from the model dashboard.
-- Requires an active ad package. Expires after 7 days.
-- ============================================================================

-- ============================================================================
-- 1. CREATE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS model_status_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),

  CONSTRAINT status_msg_length CHECK (char_length(message) BETWEEN 1 AND 200)
);

-- ============================================================================
-- 2. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_status_msg_model ON model_status_messages(model_id);
CREATE INDEX IF NOT EXISTS idx_status_msg_active ON model_status_messages(is_active, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_status_msg_created ON model_status_messages(created_at DESC);

-- ============================================================================
-- 4. ENFORCE ONE ACTIVE MESSAGE PER MODEL (TRIGGER)
-- ============================================================================
-- Before inserting a new status message, delete any existing active ones
-- for the same model so only one can exist at a time.

DROP TRIGGER IF EXISTS trg_single_status_message ON model_status_messages;

CREATE OR REPLACE FUNCTION enforce_single_status_message()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM model_status_messages
  WHERE model_id = NEW.model_id
    AND id != NEW.id
    AND is_active = true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_single_status_message
  BEFORE INSERT ON model_status_messages
  FOR EACH ROW EXECUTE FUNCTION enforce_single_status_message();

-- ============================================================================
-- 3. RLS
-- ============================================================================

ALTER TABLE model_status_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active status messages" ON model_status_messages;
DROP POLICY IF EXISTS "Models can insert own status messages" ON model_status_messages;
DROP POLICY IF EXISTS "Models can update own status messages" ON model_status_messages;
DROP POLICY IF EXISTS "Models can delete own status messages" ON model_status_messages;

CREATE POLICY "Anyone can read active status messages"
  ON model_status_messages FOR SELECT
  USING (is_active = true AND expires_at > now());

CREATE POLICY "Models can insert own status messages"
  ON model_status_messages FOR INSERT
  WITH CHECK (auth.uid() = model_id);

CREATE POLICY "Models can update own status messages"
  ON model_status_messages FOR UPDATE
  USING (auth.uid() = model_id);

CREATE POLICY "Models can delete own status messages"
  ON model_status_messages FOR DELETE
  USING (auth.uid() = model_id);
