-- ============================================================================
-- Cleanup function: remove banners / job_listings / orders abandoned in
-- pending_payment for more than 24 hours.
--
-- Stripe Checkout sessions auto-expire after 24h, but we don't always get
-- a webhook (e.g. user closes the tab on the Stripe page). This function
-- is the safety net.
--
-- Schedule via pg_cron, e.g.:
--   SELECT cron.schedule('cleanup-pending-payments', '*/30 * * * *',
--     $$ SELECT public.cleanup_pending_payments() $$);
--
-- Or call it manually from a Vercel/Netlify cron route.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_pending_payments(
  age interval DEFAULT '24 hours'
)
RETURNS TABLE (
  banners_cancelled int,
  listings_cancelled int,
  orders_cancelled int
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  banners_count int;
  listings_count int;
  orders_count int;
BEGIN
  -- 1. Delete the banner image from storage in advance? Skipped — the
  --    storage row is small and admins can prune the bucket separately.
  --    We just flip the rows to 'cancelled' so they don't pollute lookups.
  UPDATE public.banners
    SET status = 'cancelled', updated_at = now()
    WHERE status = 'pending_payment'
      AND created_at < now() - age;
  GET DIAGNOSTICS banners_count = ROW_COUNT;

  UPDATE public.job_listings
    SET status = 'cancelled', updated_at = now()
    WHERE status = 'pending_payment'
      AND created_at < now() - age;
  GET DIAGNOSTICS listings_count = ROW_COUNT;

  UPDATE public.orders
    SET status = 'cancelled', failed_at = now()
    WHERE status = 'pending'
      AND created_at < now() - age;
  GET DIAGNOSTICS orders_count = ROW_COUNT;

  RETURN QUERY SELECT banners_count, listings_count, orders_count;
END;
$$;

COMMENT ON FUNCTION public.cleanup_pending_payments(interval) IS
  'Marks orders/banners/listings stuck in pending_payment as cancelled.
   Default age = 24h. Safe to run on a schedule.';

-- Quick verify:
-- SELECT * FROM public.cleanup_pending_payments();
