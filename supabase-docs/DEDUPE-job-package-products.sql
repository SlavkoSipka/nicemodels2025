-- ============================================================================
-- DEDUPE job_package products
-- ============================================================================
-- Two seed scripts inserted overlapping rows for duration_days 14 and 30:
--   * CREATE-job-listings-system.sql  -> "14 Days" / "30 Days"  (capital D,
--                                        "Listing displayed for X days")
--   * ALTER-job-listings-add-regions-address.sql -> "14 days" / "30 days"
--                                        (lowercase d, "Listing visible for X days")
--
-- UPDATE-job-package-prices.sql already normalized the 5-day row, but left the
-- 14- and 30-day duplicates intact, so the UI shows each duration twice.
--
-- We KEEP one canonical active row per duration (5, 14, 30) and DEACTIVATE the
-- rest (is_active = false). We don't delete because orders.product_id may still
-- reference the legacy rows.
--
-- Canonical row format:
--   name        = 'X Days'                      (capital D)
--   description = 'Listing displayed for X days'
--   display_order = 1 / 2 / 3 for 5 / 14 / 30
--
-- Preference order when picking which row to keep:
--   1) name already matches the canonical 'X Days'
--   2) earliest created_at
-- ============================================================================

-- 14 days -------------------------------------------------------------------
WITH keeper AS (
  SELECT id FROM products
  WHERE product_type = 'job_package' AND duration_days = 14
  ORDER BY (name = '14 Days') DESC, created_at ASC
  LIMIT 1
)
UPDATE products
   SET name          = '14 Days',
       description   = 'Listing displayed for 14 days',
       is_active     = true,
       display_order = 2
 WHERE id = (SELECT id FROM keeper);

UPDATE products
   SET is_active = false
 WHERE product_type = 'job_package'
   AND duration_days = 14
   AND id <> (
     SELECT id FROM products
     WHERE product_type = 'job_package' AND duration_days = 14
     ORDER BY (name = '14 Days') DESC, created_at ASC
     LIMIT 1
   );

-- 30 days -------------------------------------------------------------------
WITH keeper AS (
  SELECT id FROM products
  WHERE product_type = 'job_package' AND duration_days = 30
  ORDER BY (name = '30 Days') DESC, created_at ASC
  LIMIT 1
)
UPDATE products
   SET name          = '30 Days',
       description   = 'Listing displayed for 30 days',
       is_active     = true,
       display_order = 3
 WHERE id = (SELECT id FROM keeper);

UPDATE products
   SET is_active = false
 WHERE product_type = 'job_package'
   AND duration_days = 30
   AND id <> (
     SELECT id FROM products
     WHERE product_type = 'job_package' AND duration_days = 30
     ORDER BY (name = '30 Days') DESC, created_at ASC
     LIMIT 1
   );

-- 5 days --------------------------------------------------------------------
-- Already normalized by UPDATE-job-package-prices.sql, but make idempotent:
-- if multiple 5-day rows somehow exist, keep one canonical row and deactivate
-- the rest.
WITH keeper AS (
  SELECT id FROM products
  WHERE product_type = 'job_package' AND duration_days = 5
  ORDER BY (name = '5 Days') DESC, created_at ASC
  LIMIT 1
)
UPDATE products
   SET name          = '5 Days',
       description   = 'Listing displayed for 5 days',
       is_active     = true,
       display_order = 1
 WHERE id = (SELECT id FROM keeper);

UPDATE products
   SET is_active = false
 WHERE product_type = 'job_package'
   AND duration_days = 5
   AND id <> (
     SELECT id FROM products
     WHERE product_type = 'job_package' AND duration_days = 5
     ORDER BY (name = '5 Days') DESC, created_at ASC
     LIMIT 1
   );

-- Deactivate any non-canonical durations (legacy 7-day, etc.) ---------------
UPDATE products
   SET is_active = false
 WHERE product_type = 'job_package'
   AND duration_days NOT IN (5, 14, 30);

-- ============================================================================
-- Verification
-- ============================================================================
-- Active rows should be exactly three: 5 / 14 / 30, in display_order 1 / 2 / 3.
--
-- SELECT id, name, description, price_chf, duration_days, is_active, display_order
-- FROM products
-- WHERE product_type = 'job_package'
-- ORDER BY duration_days, is_active DESC;
