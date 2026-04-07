-- ============================================================================
-- Reactivate expired ads + Diagnostic queries
-- Run in Supabase SQL Editor.
-- ============================================================================

-- ─── 1. DIAGNOSTIC: Check if any order_items reference deleted products ───
-- If this returns rows, those order_items are orphaned (product was deleted).
SELECT
  oi.id AS order_item_id,
  oi.product_id,
  oi.activation_date,
  o.user_id,
  o.status AS order_status,
  o.created_at AS order_created_at,
  p.username,
  p.role
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
JOIN profiles p ON p.id = o.user_id
WHERE oi.product_id NOT IN (SELECT id FROM products)
ORDER BY o.created_at DESC;

-- ─── 2. DIAGNOSTIC: Show all ad purchases with computed expiry ───
-- Shows every ad_package purchase, whether active or expired.
SELECT
  p.username,
  p.role,
  pr.name AS package_name,
  pr.duration_days,
  pr.duration_hours,
  oi.activation_date,
  o.created_at AS order_created_at,
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
JOIN orders o ON o.id = oi.order_id
JOIN products pr ON pr.id = oi.product_id
JOIN profiles p ON p.id = o.user_id
WHERE o.status = 'paid'
  AND pr.product_type = 'ad_package'
ORDER BY effective_expiry DESC;

-- ─── 3. REACTIVATE: Reset activation_date to NOW() for all expired ads ───
-- This gives each expired ad its full original duration starting from now.
-- Only affects paid orders with ad_package products that have already expired.
-- ** REVIEW the diagnostic output above before running this! **

UPDATE order_items
SET activation_date = NOW()
WHERE id IN (
  SELECT oi.id
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  JOIN products pr ON pr.id = oi.product_id
  WHERE o.status = 'paid'
    AND pr.product_type = 'ad_package'
    AND (oi.activation_date IS NULL OR oi.activation_date <= NOW())
    AND COALESCE(oi.activation_date, o.created_at)
        + (pr.duration_days * INTERVAL '1 day')
        + (pr.duration_hours * INTERVAL '1 hour') <= NOW()
);

-- ─── 4. VERIFY: Run diagnostic #2 again — all should show ACTIVE now ───
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
JOIN orders o ON o.id = oi.order_id
JOIN products pr ON pr.id = oi.product_id
JOIN profiles p ON p.id = o.user_id
WHERE o.status = 'paid'
  AND pr.product_type = 'ad_package'
ORDER BY effective_expiry DESC;
