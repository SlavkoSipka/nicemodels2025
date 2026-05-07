-- ============================================================================
-- job_listings: allow status = 'pending_payment' for Stripe-gated creation.
-- Listing is created in pending_payment, redirected to Stripe, then flipped
-- to 'active' by the webhook on checkout.session.completed.
-- ============================================================================

ALTER TABLE public.job_listings
  DROP CONSTRAINT IF EXISTS valid_status;

ALTER TABLE public.job_listings
  ADD CONSTRAINT valid_status
  CHECK (status IN ('pending_payment', 'active', 'expired', 'deleted', 'cancelled'));

-- Default new rows to pending_payment so the gate is on by default.
ALTER TABLE public.job_listings
  ALTER COLUMN status SET DEFAULT 'pending_payment';

-- Make sure the public RLS policy doesn't expose pending listings.
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.job_listings;
CREATE POLICY "Anyone can view active listings"
  ON public.job_listings FOR SELECT
  USING (status = 'active');

CREATE INDEX IF NOT EXISTS idx_job_listings_pending_payment_created
  ON public.job_listings (created_at)
  WHERE status = 'pending_payment';

SELECT 'job_listings.status now accepts pending_payment / cancelled.' AS status;
