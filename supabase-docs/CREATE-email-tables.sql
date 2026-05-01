-- ============================================================================
-- EMAIL SYSTEM — supporting tables
--   1. email_unsubscribes  — per-user, per-category opt-out
--   2. email_log           — audit trail of every send attempt
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_unsubscribes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- 'all' kills every non-mandatory email; specific categories opt-out only that group
  category text NOT NULL CHECK (category IN (
    'admin_actions','verification','purchase','engagement',
    'fav_digest','saved_search_alerts','reports','all'
  )),
  unsubscribed_at timestamptz NOT NULL DEFAULT now(),
  source text DEFAULT 'email_link', -- 'email_link' | 'dashboard' | 'admin'
  UNIQUE (user_id, category)
);

CREATE INDEX IF NOT EXISTS idx_email_unsubscribes_user ON email_unsubscribes(user_id);

ALTER TABLE email_unsubscribes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own unsubscribes" ON email_unsubscribes;
CREATE POLICY "Users can view own unsubscribes"
  ON email_unsubscribes FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own unsubscribes" ON email_unsubscribes;
CREATE POLICY "Users can insert own unsubscribes"
  ON email_unsubscribes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own unsubscribes" ON email_unsubscribes;
CREATE POLICY "Users can delete own unsubscribes"
  ON email_unsubscribes FOR DELETE
  USING (auth.uid() = user_id);

-- service-role / admin can manage everything (no policy needed; bypasses RLS)

-- ----------------------------------------------------------------------------
-- email_log: every send attempt (including no-key skips) for audit/debug.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  recipient_email text NOT NULL,
  kind text NOT NULL,
  status text NOT NULL CHECK (status IN ('sent','failed','skipped_no_provider','skipped_unsubscribed')),
  provider_id text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_log_user ON email_log(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_email_log_created ON email_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_log_kind_status ON email_log(kind, status);

ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read email log" ON email_log;
CREATE POLICY "Admins can read email log"
  ON email_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

SELECT 'email_unsubscribes + email_log created.' AS status;
