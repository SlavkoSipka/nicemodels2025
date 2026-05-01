-- =============================================================================
-- Set displayed prices for ad_package products (clubs/models sedcard activation)
-- =============================================================================
-- These are the *list prices* that will be shown to the user.
-- During the BETA phase the application keeps charging 0 (see /activate-ad
-- checkout flow which forces price_chf = 0 on order_items).
-- =============================================================================
-- 5 days  → 19.00 CHF
-- 14 days → 29.00 CHF
-- 30 days → 39.00 CHF
-- =============================================================================

UPDATE products
SET price_chf = 19.00, updated_at = now()
WHERE product_type = 'ad_package' AND duration_days = 5;

UPDATE products
SET price_chf = 29.00, updated_at = now()
WHERE product_type = 'ad_package' AND duration_days = 14;

UPDATE products
SET price_chf = 39.00, updated_at = now()
WHERE product_type = 'ad_package' AND duration_days = 30;

-- Verify (optional):
-- SELECT product_type, name, duration_days, price_chf, is_active
-- FROM products
-- WHERE product_type = 'ad_package'
-- ORDER BY duration_days;
