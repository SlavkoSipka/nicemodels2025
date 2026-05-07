-- ============================================================================
-- orders: add Stripe Checkout / Payment Intent tracking fields
-- ============================================================================
-- Adds columns required to link a Supabase order to a Stripe Checkout
-- Session and the resulting PaymentIntent. Used by:
--   POST /api/checkout/session   (writes stripe_session_id)
--   POST /api/stripe/webhook     (writes stripe_payment_intent_id, paid_at, ...)
--
-- Run once in Supabase SQL Editor. Idempotent.
-- ============================================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS stripe_session_id text,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_receipt_url text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS failed_at timestamptz,
  ADD COLUMN IF NOT EXISTS metadata jsonb;

-- Lookup by Stripe session id during webhook handling.
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_stripe_session_id
  ON public.orders (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_intent
  ON public.orders (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

-- ============================================================================
-- order_items: link an item to the side-table row it activates on payment.
-- ============================================================================
-- Webhook needs to know which banner/job_listings row to flip from
-- pending_payment to active. Polymorphic via (banner_id | listing_id).
-- ============================================================================

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS banner_id uuid REFERENCES public.banners(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS listing_id uuid REFERENCES public.job_listings(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_order_items_banner_id
  ON public.order_items (banner_id)
  WHERE banner_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_order_items_listing_id
  ON public.order_items (listing_id)
  WHERE listing_id IS NOT NULL;

SELECT 'orders + order_items extended with Stripe + linkage columns.' AS status;
