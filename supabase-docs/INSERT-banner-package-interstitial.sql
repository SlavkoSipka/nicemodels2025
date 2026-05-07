-- ============================================================================
-- Prep DB rows for the upcoming Interstitial Banner placement.
-- Pricing per the rate card:
--   24h / 1 day  → 139 CHF
--   48h / 2 days → 229 CHF
--   72h / 3 days → 299 CHF
-- Targets all regions, max 2 in random rotation.
--
-- NOTE: kept inactive (is_active = false) until the placement is implemented
-- in the buy-banner UI and the rendering layer. This file is harmless to run
-- now — the rows exist but won't show up because of the is_active filter.
-- ============================================================================

-- Allow the new placement value on banners.placement check constraint.
ALTER TABLE public.banners
  DROP CONSTRAINT IF EXISTS banners_placement_check;

ALTER TABLE public.banners
  ADD CONSTRAINT banners_placement_check
  CHECK (placement IN ('feed_wide', 'feed_card', 'sidebar_left', 'interstitial'));

-- Same on banner_region_pricing.placement, plus relax duration_days for 1/2/3.
ALTER TABLE public.banner_region_pricing
  DROP CONSTRAINT IF EXISTS banner_region_pricing_placement_check;
ALTER TABLE public.banner_region_pricing
  ADD CONSTRAINT banner_region_pricing_placement_check
  CHECK (placement IN ('feed_wide', 'feed_card', 'sidebar_left', 'interstitial'));

ALTER TABLE public.banner_region_pricing
  DROP CONSTRAINT IF EXISTS banner_region_pricing_duration_days_check;
ALTER TABLE public.banner_region_pricing
  ADD CONSTRAINT banner_region_pricing_duration_days_check
  CHECK (duration_days IN (1, 2, 3, 5, 14, 30));

-- Pricing rows. Region count doesn't apply (interstitial = all regions),
-- but to keep the existing 4-row matrix shape we seed all 4 with the same
-- price so the lookup helper keeps working unchanged.
INSERT INTO public.banner_region_pricing (placement, duration_days, region_count, price_chf, is_active)
SELECT 'interstitial', d.days, r.cnt, d.price, false
FROM (VALUES (1, 139.00), (2, 229.00), (3, 299.00)) AS d(days, price)
CROSS JOIN (SELECT generate_series(1, 4) AS cnt) r
ON CONFLICT (placement, duration_days, region_count) DO UPDATE
  SET price_chf = EXCLUDED.price_chf;

-- Product rows for the package picker (also kept inactive for now).
INSERT INTO public.products (product_type, name, description, price_chf, duration_days, duration_hours, discount_percent, banner_type, is_active, display_order)
SELECT 'banner_package', n.name, n.descr, n.price, n.dd, n.dh, 0, NULL, false, n.disp
FROM (VALUES
  ('1 day',  'Interstitial banner for 24 hours', 139.00, 1, 24, 100),
  ('2 days', 'Interstitial banner for 48 hours', 229.00, 2, 48, 110),
  ('3 days', 'Interstitial banner for 72 hours', 299.00, 3, 72, 120)
) AS n(name, descr, price, dd, dh, disp)
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE product_type = 'banner_package' AND duration_days = n.dd
);

SELECT 'Interstitial pricing seeded (inactive until placement ships).' AS status;
