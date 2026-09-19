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
-- ⚠️  The placement lists below MUST keep every value already in the tables,
-- not just the ones this migration cares about. 'interstitial' comes from
-- INSERT-banner-package-interstitial.sql, which seeded 12 inactive pricing
-- rows for a placement that has not shipped in the UI yet; dropping it from
-- the CHECK makes ALTER TABLE fail with
--   "check constraint ... is violated by some row".
-- If this script still fails, run DIAGNOSE below to see which value is new.
--
-- Run in Supabase SQL Editor. Safe to re-run.
-- ============================================================================

-- DIAGNOSE (run on its own if the script errors) ------------------------------
-- SELECT 'banners' AS tbl, placement, count(*) FROM public.banners GROUP BY 1, 2
-- UNION ALL
-- SELECT 'pricing', placement, count(*) FROM public.banner_region_pricing GROUP BY 1, 2
-- ORDER BY 1, 2;

-- 1) Allow the new value on banners.placement ---------------------------------
ALTER TABLE public.banners
  DROP CONSTRAINT IF EXISTS banners_placement_check;

ALTER TABLE public.banners
  ADD CONSTRAINT banners_placement_check
  CHECK (placement IN ('feed_wide', 'feed_card', 'sidebar_left', 'sidebar_right', 'interstitial'));

COMMENT ON COLUMN public.banners.placement IS
  'Where the banner renders: wide row in feed, single grid cell, left rail, right rail, or interstitial (prepared, not shipped)';

-- 2) Allow the new value on banner_region_pricing.placement -------------------
ALTER TABLE public.banner_region_pricing
  DROP CONSTRAINT IF EXISTS banner_region_pricing_placement_check;

ALTER TABLE public.banner_region_pricing
  ADD CONSTRAINT banner_region_pricing_placement_check
  CHECK (placement IN ('feed_wide', 'feed_card', 'sidebar_left', 'sidebar_right', 'interstitial'));

-- 3) Mirror the left rail's pricing onto the right rail -----------------------
-- Derived from sidebar_left rather than a hardcoded duration/region list, for
-- two reasons: the right rail is priced identically to the left one by design,
-- and the live table does NOT have the 3x4 shape the repo's seed scripts
-- suggest (it carries ~81 rows per placement). Copying guarantees a matching
-- row for every (duration_days, region_count) the buy flow can ask for —
-- checkout looks the price up as an exact hit on
-- (placement, duration_days, region_count) and throws "Banner pricing not
-- configured" on a miss.
--
-- DO NOTHING, not DO UPDATE: re-running must not clobber prices an admin has
-- since changed for the right rail on its own.
INSERT INTO public.banner_region_pricing
  (placement, duration_days, region_count, price_chf, is_active)
SELECT 'sidebar_right', duration_days, region_count, price_chf, is_active
FROM public.banner_region_pricing
WHERE placement = 'sidebar_left'
ON CONFLICT (placement, duration_days, region_count) DO NOTHING;

-- Verify (this is the result the SQL Editor will show). The two rails should
-- report the same row count, and the 4-region prices are the ones buyers pay.
SELECT
  placement,
  count(*)                                        AS rows,
  count(*) FILTER (WHERE is_active)               AS active_rows,
  count(DISTINCT duration_days)                   AS durations,
  min(price_chf)                                  AS price_min,
  max(price_chf)                                  AS price_max
FROM public.banner_region_pricing
WHERE placement IN ('sidebar_left', 'sidebar_right')
GROUP BY placement
ORDER BY placement;
