-- ============================================================================
-- GRANT a free 30-day ad_package to every model who ever had one
-- ============================================================================
-- Run sections in order in the Supabase SQL Editor.
-- Creates a new paid order + order_item for each distinct model that has
-- at least one historical ad_package purchase (paid).

-- ─── 1. DIAGNOSTIC: Which models will receive the grant? ───
-- Review this BEFORE running section 2.
SELECT DISTINCT
  p.id          AS model_id,
  p.username,
  p.role,
  p.is_blocked
FROM profiles p
JOIN orders o    ON o.user_id = p.id
JOIN order_items oi ON oi.order_id = o.id
JOIN products pr   ON pr.id = oi.product_id
WHERE p.role = 'model'
  AND p.is_blocked = FALSE
  AND o.status = 'paid'
  AND pr.product_type = 'ad_package'
ORDER BY p.username;

-- ─── 2. GRANT: Insert a new order + order_item per model ───
-- Uses the "30 Days" ad_package product.
-- Each model gets exactly one new order with activation_date = NOW().

DO $$
DECLARE
  v_product_id uuid;
  v_model     record;
  v_order_id  uuid;
BEGIN
  -- Find the 30-day ad_package product
  SELECT id INTO v_product_id
  FROM products
  WHERE product_type = 'ad_package'
    AND duration_days = 30
    AND is_active = TRUE
  LIMIT 1;

  IF v_product_id IS NULL THEN
    RAISE EXCEPTION 'No active 30-day ad_package product found. Run INSERT-banner-packages.sql first.';
  END IF;

  -- Loop over every model that ever had a paid ad_package
  FOR v_model IN
    SELECT DISTINCT p.id AS model_id
    FROM profiles p
    JOIN orders o    ON o.user_id = p.id
    JOIN order_items oi ON oi.order_id = o.id
    JOIN products pr   ON pr.id = oi.product_id
    WHERE p.role = 'model'
      AND p.is_blocked = FALSE
      AND o.status = 'paid'
      AND pr.product_type = 'ad_package'
  LOOP
    -- Create a paid order for this model
    INSERT INTO orders (user_id, status, total_amount, created_at)
    VALUES (v_model.model_id, 'paid', 0, NOW())
    RETURNING id INTO v_order_id;

    -- Create the order_item linked to the 30-day product, activated now
    INSERT INTO order_items (order_id, product_id, price_chf, activation_date)
    VALUES (v_order_id, v_product_id, 0, NOW());
  END LOOP;

  RAISE NOTICE 'Done — granted 30-day ad to all qualifying models.';
END $$;

-- ─── 3. VERIFY: All models should now show ACTIVE with ~30 days left ───
SELECT
  p.username,
  p.role,
  pr.name AS package_name,
  COALESCE(oi.activation_date, o.created_at) AS effective_start,
  COALESCE(oi.activation_date, o.created_at)
    + (pr.duration_days * INTERVAL '1 day')
    + (pr.duration_hours * INTERVAL '1 hour') AS effective_expiry,
  CASE
    WHEN COALESCE(oi.activation_date, o.created_at)
         + (pr.duration_days * INTERVAL '1 day')
         + (pr.duration_hours * INTERVAL '1 hour') > NOW()
    THEN 'ACTIVE'
    ELSE 'EXPIRED'
  END AS status
FROM order_items oi
JOIN orders o    ON o.id = oi.order_id
JOIN products pr ON pr.id = oi.product_id
JOIN profiles p  ON p.id = o.user_id
WHERE o.status = 'paid'
  AND pr.product_type = 'ad_package'
ORDER BY effective_expiry DESC;
