-- ============================================================================
-- Sync job_package products to the production pricing table.
-- ============================================================================
--   5 days  → 39 CHF   (NEW — original seed used 7 days, so we insert it)
--   14 days → 49 CHF
--   30 days → 59 CHF
--
-- Identical pricing for both Job-Inserat and Immobilien-Inserat (rent),
-- so a single product_type covers both — listing_type lives on
-- job_listings, not on the product.
--
-- Older 7-day product (from the original seed in CREATE-job-listings-system)
-- is hidden so the UI shows the canonical 5/14/30 trio.
-- ============================================================================

-- 1) Update existing 14- and 30-day rows.
UPDATE products SET price_chf = 49.00, is_active = true
  WHERE product_type = 'job_package' AND duration_days = 14;

UPDATE products SET price_chf = 59.00, is_active = true
  WHERE product_type = 'job_package' AND duration_days = 30;

-- 2) Make sure a 5-day row exists; insert if missing, otherwise update.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM products WHERE product_type = 'job_package' AND duration_days = 5
  ) THEN
    UPDATE products
       SET price_chf = 39.00,
           name = '5 Days',
           description = 'Listing displayed for 5 days',
           is_active = true,
           display_order = 1
     WHERE product_type = 'job_package' AND duration_days = 5;
  ELSE
    INSERT INTO products (
      product_type, name, description, price_chf,
      duration_days, duration_hours, discount_percent,
      banner_type, is_active, display_order
    ) VALUES (
      'job_package', '5 Days', 'Listing displayed for 5 days', 39.00,
      5, 0, 0, NULL, true, 1
    );
  END IF;
END $$;

-- 3) Hide every other duration (legacy 7-day, anything else).
UPDATE products SET is_active = false
  WHERE product_type = 'job_package' AND duration_days NOT IN (5, 14, 30);

-- 4) Make sure display order is consistent (5 → 1, 14 → 2, 30 → 3).
UPDATE products SET display_order = 1
  WHERE product_type = 'job_package' AND duration_days = 5;
UPDATE products SET display_order = 2
  WHERE product_type = 'job_package' AND duration_days = 14;
UPDATE products SET display_order = 3
  WHERE product_type = 'job_package' AND duration_days = 30;

-- Verify:
-- SELECT name, duration_days, price_chf, is_active, display_order
-- FROM products WHERE product_type = 'job_package' ORDER BY duration_days;
