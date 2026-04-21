-- ============================================================================
-- Products: stop double-counting duration (duration_days + duration_hours)
--
-- Seed rows used BOTH for the same period (e.g. 5 days + 120h = intended 5d).
-- models_with_active_ads() used ONLY hours; clubs + UI used days + hours → mismatch.
-- After aligning models_with_active_ads with days+hours, packages became 2× too long
-- unless you zero out the redundant column.
--
-- CRITICAL ORDER (do not swap):
--   1) Run CREATE-FUNCTION-models_with_active_ads.sql (new definition with days+hours).
--   2) THEN run this UPDATE.
-- If you zero duration_hours while the OLD function still uses ONLY hours, every
-- model ad expires immediately (0 hours) and disappears from the site.
--
-- Side effect after step 1+2: expiry is computed as start + duration_days only
-- (was effectively start + days + hours before). Anyone who still had "extra"
-- life only from the doubled hours may drop off listing sooner — matches the
-- product name ("5 Days" = 5 days). job_package rows are NOT touched here.
--
-- Run once in Supabase SQL Editor.
-- Keeps duration_days as the primary display (5 / 14 / 30); clears duplicate hours.
-- ============================================================================

UPDATE public.products
SET duration_hours = 0
WHERE product_type IN ('ad_package', 'banner_package')
  AND duration_days > 0
  AND duration_hours > 0;
