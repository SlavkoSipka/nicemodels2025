-- ============================================================================
-- banners: allow status = 'pending_payment' so a Stripe Checkout flow can
-- pre-create the row before the customer pays. Webhook flips it to 'active'
-- on checkout.session.completed and to 'cancelled' on session.expired.
-- ============================================================================

-- Drop and recreate the status check constraint to add the new value.
ALTER TABLE public.banners
  DROP CONSTRAINT IF EXISTS banners_status_check;

ALTER TABLE public.banners
  ADD CONSTRAINT banners_status_check
  CHECK (status IN ('pending_payment', 'pending', 'active', 'expired', 'rejected', 'cancelled'));

-- Default new rows to pending_payment so anyone manually inserting via the
-- old client path will still see the gate. Existing 'active' rows untouched.
ALTER TABLE public.banners
  ALTER COLUMN status SET DEFAULT 'pending_payment';

-- Cleanup index helper used by the cron job that purges abandoned drafts.
CREATE INDEX IF NOT EXISTS idx_banners_pending_payment_created
  ON public.banners (created_at)
  WHERE status = 'pending_payment';

SELECT 'banners.status now accepts pending_payment / cancelled.' AS status;
