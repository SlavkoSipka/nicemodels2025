-- ============================================================================
-- Set banner pricing to the production table values.
-- ============================================================================
-- Pricing is fixed per (placement, duration). Buyers always pay the
-- 4-region price regardless of how many cantons they actually pick (1-4).
-- We seed all region_count rows with the same value so existing lookups
-- in src/lib/bannerPricing.ts keep working without code changes.
--
-- Pricing (CHF):
--   feed_wide    → 39 / 59 / 79  (5 / 14 / 30 days)
--   feed_card    → 29 / 49 / 69
--   sidebar_left → 19 / 29 / 39
-- ============================================================================

-- Wide banner -----------------------------------------------------------------
UPDATE public.banner_region_pricing SET price_chf = 39.00, updated_at = now()
  WHERE placement = 'feed_wide' AND duration_days = 5;
UPDATE public.banner_region_pricing SET price_chf = 59.00, updated_at = now()
  WHERE placement = 'feed_wide' AND duration_days = 14;
UPDATE public.banner_region_pricing SET price_chf = 79.00, updated_at = now()
  WHERE placement = 'feed_wide' AND duration_days = 30;

-- Card slot banner ------------------------------------------------------------
UPDATE public.banner_region_pricing SET price_chf = 29.00, updated_at = now()
  WHERE placement = 'feed_card' AND duration_days = 5;
UPDATE public.banner_region_pricing SET price_chf = 49.00, updated_at = now()
  WHERE placement = 'feed_card' AND duration_days = 14;
UPDATE public.banner_region_pricing SET price_chf = 69.00, updated_at = now()
  WHERE placement = 'feed_card' AND duration_days = 30;

-- Left column banner ----------------------------------------------------------
UPDATE public.banner_region_pricing SET price_chf = 19.00, updated_at = now()
  WHERE placement = 'sidebar_left' AND duration_days = 5;
UPDATE public.banner_region_pricing SET price_chf = 29.00, updated_at = now()
  WHERE placement = 'sidebar_left' AND duration_days = 14;
UPDATE public.banner_region_pricing SET price_chf = 39.00, updated_at = now()
  WHERE placement = 'sidebar_left' AND duration_days = 30;

-- Set price on the products table too so the package picker shows non-zero
-- amounts (used for display only — actual price comes from banner_region_pricing).
UPDATE public.products SET price_chf = 39.00
  WHERE product_type = 'banner_package' AND duration_days = 5;
UPDATE public.products SET price_chf = 59.00
  WHERE product_type = 'banner_package' AND duration_days = 14;
UPDATE public.products SET price_chf = 79.00
  WHERE product_type = 'banner_package' AND duration_days = 30;

-- Verify:
-- SELECT placement, duration_days, region_count, price_chf
-- FROM banner_region_pricing
-- ORDER BY placement, duration_days, region_count;
