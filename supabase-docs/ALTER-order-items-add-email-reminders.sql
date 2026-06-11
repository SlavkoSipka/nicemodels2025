-- ============================================================================
-- Sedcard (ad_package) lifecycle emails — idempotency tracking
--   Adds two timestamp columns to order_items so the cron at
--   /api/cron/email/sedcard-reminders never sends a duplicate reminder or
--   expired notice for the same sedcard.
-- ============================================================================

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS reminder_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS expired_email_sent_at  timestamptz;

-- Speeds up the cron's "still needs an email" scan.
CREATE INDEX IF NOT EXISTS idx_order_items_reminder_pending
  ON order_items (reminder_email_sent_at)
  WHERE reminder_email_sent_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_order_items_expired_pending
  ON order_items (expired_email_sent_at)
  WHERE expired_email_sent_at IS NULL;

SELECT 'order_items: reminder_email_sent_at + expired_email_sent_at added.' AS status;
