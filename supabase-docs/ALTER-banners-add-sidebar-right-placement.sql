-- ============================================================================
-- Adds the second (right-hand) ad rail: banners.placement = 'sidebar_right'.
--
-- The feed is flanked by two paid vertical rails on desktop:
--   sidebar_left   — left of the feed
--   sidebar_right  — right of the feed, above the chat/status widgets
-- Both use the same 2:3 portrait spec, and both collapse into the mobile
-- bottom promo strip, so this migration only widens the allowed values and
-- seeds prices. No data is rewritten.
--
-- Run in Supabase SQL Editor. Safe to re-run.
-- ============================================================================

-- 1) Allow the new value on banners.placement ---------------------------------
ALTER TABLE public.banners
  DROP CONSTRAINT IF EXISTS banners_placement_check;

ALTER TABLE public.banners
  ADD CONSTRAINT banners_placement_check
  CHECK (placement IN ('feed_wide', 'feed_card', 'sidebar_left', 'sidebar_right'));

COMMENT ON COLUMN public.banners.placement IS
  'Where the banner renders: wide row in feed, single grid cell, left rail, or right rail';

-- 2) Allow the new value on banner_region_pricing.placement -------------------
ALTER TABLE public.banner_region_pricing
  DROP CONSTRAINT IF EXISTS banner_region_pricing_placement_check;

ALTER TABLE public.banner_region_pricing
  ADD CONSTRAINT banner_region_pricing_placement_check
  CHECK (placement IN ('feed_wide', 'feed_card', 'sidebar_left', 'sidebar_right'));

-- 3) Seed the 3 durations x 4 region counts for the right rail ----------------
-- Seeded at 0 first so the rows always exist, then priced to match the left
-- rail (19 / 29 / 39 CHF for 5 / 14 / 30 days). Buyers always pay the
-- 4-region price, so every region_count row carries the same value — see
-- UPDATE-banner-region-pricing.sql for the reasoning.
INSERT INTO public.banner_region_pricing (placement, duration_days, region_count, price_chf)
SELECT 'sidebar_right', duration_days, region_count, 0
FROM (
  SELECT unnest(ARRAY[5, 14, 30]) AS duration_days
) d
CROSS JOIN (
  SELECT generate_series(1, 4) AS region_count
) r
ON CONFLICT (placement, duration_days, region_count) DO NOTHING;

UPDATE public.banner_region_pricing SET price_chf = 19.00, updated_at = now()
  WHERE placement = 'sidebar_right' AND duration_days = 5;
UPDATE public.banner_region_pricing SET price_chf = 29.00, updated_at = now()
  WHERE placement = 'sidebar_right' AND duration_days = 14;
UPDATE public.banner_region_pricing SET price_chf = 39.00, updated_at = now()
  WHERE placement = 'sidebar_right' AND duration_days = 30;

-- Verify:
-- SELECT placement, duration_days, region_count, price_chf
-- FROM banner_region_pricing
-- WHERE placement = 'sidebar_right'
-- ORDER BY duration_days, region_count;
