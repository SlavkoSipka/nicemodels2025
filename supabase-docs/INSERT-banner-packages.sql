-- ============================================
-- INSERT ad_package + banner_package products
-- ============================================
-- Run this in Supabase SQL Editor.
-- Removes old ad/banner order_items and products, then inserts new packages.
-- NOTE: This clears ad and banner purchase history (orders remain but lose these items).

DELETE FROM order_items WHERE product_id IN (
  SELECT id FROM products WHERE product_type IN ('ad_package', 'banner_package')
);
DELETE FROM products WHERE product_type IN ('ad_package', 'banner_package');

INSERT INTO products (product_type, name, description, price_chf, duration_days, duration_hours, discount_percent, banner_type, is_active, display_order)
VALUES
  -- Ad packages
  ('ad_package', '5 Days',  'Ad displayed for 5 days',   0, 5,  120, 0, NULL, true, 1),
  ('ad_package', '14 Days', 'Ad displayed for 14 days',  0, 14, 336, 0, NULL, true, 2),
  ('ad_package', '30 Days', 'Ad displayed for 30 days',  0, 30, 720, 0, NULL, true, 3),
  -- Banner packages
  ('banner_package', '5 Days',  'Banner displayed for 5 days',   0, 5,  120, 0, NULL, true, 1),
  ('banner_package', '14 Days', 'Banner displayed for 14 days',  0, 14, 336, 0, NULL, true, 2),
  ('banner_package', '30 Days', 'Banner displayed for 30 days',  0, 30, 720, 0, NULL, true, 3);
