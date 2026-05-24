-- ============================================================================
-- FIX: site_actions misses new_model / new_club for FREE orders
-- ============================================================================
-- Problem
-- -------
-- The original trigger `log_ad_activation` fires on INSERT/UPDATE of `orders`
-- and inspects `order_items` to detect an ad_package. The free-order code path
-- in src/app/api/checkout/session/route.ts (`completeFreeAdOrder`) INSERTs
-- `orders` with status='paid' BEFORE inserting any `order_items`. The trigger
-- fires immediately on the orders INSERT, finds no items, and returns silently
-- → no `new_model` / `new_club` row is ever logged for free ad activations
-- (free 30-day sedcards, free club ads, GRANT-30DAY-AD-TO-ALL-MODELS, etc.).
--
-- The Stripe path is unaffected because there the order starts as 'pending',
-- items get inserted afterwards, and only the webhook flips status='paid' —
-- by which time the trigger sees the items.
--
-- Fix
-- ---
-- Add a second trigger on `order_items` (AFTER INSERT). When an item is added
-- to an already-paid order with an ad_package product, log the event. The
-- existing `orders` trigger is preserved (recreated idempotently) so the
-- Stripe path keeps working unchanged.
--
-- Double-logging protection
-- -------------------------
-- Both triggers can theoretically fire close to one another (e.g. unusual race
-- conditions, manual SQL inserts). Each trigger skips logging if a matching
-- `new_model` / `new_club` row already exists for the same actor in the last
-- 60 seconds.
--
-- Run once in the Supabase SQL Editor. Fully idempotent — safe to re-run.
-- ============================================================================

-- ============================================================================
-- 1. Replace `log_ad_activation` (orders trigger) with a guarded version
-- ============================================================================

CREATE OR REPLACE FUNCTION log_ad_activation()
RETURNS TRIGGER AS $$
DECLARE
  v_role text;
  v_username text;
  v_showname text;
  v_has_ad_product boolean := false;
  v_already_logged boolean := false;
BEGIN
  IF NEW.status = 'paid' AND (OLD IS NULL OR OLD.status != 'paid') THEN
    SELECT true INTO v_has_ad_product
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = NEW.id
      AND p.product_type = 'ad_package'
    LIMIT 1;

    IF NOT COALESCE(v_has_ad_product, false) THEN
      -- Order is paid but items have not been inserted yet (free-order path).
      -- The on_order_item_insert trigger will log when items arrive.
      RETURN NEW;
    END IF;

    SELECT role, username INTO v_role, v_username
    FROM profiles WHERE id = NEW.user_id;

    -- Skip if already logged in the last 60s (e.g. order_items trigger beat us)
    SELECT EXISTS (
      SELECT 1 FROM site_actions
      WHERE actor_id = NEW.user_id
        AND action_type IN ('new_model', 'new_club')
        AND created_at > now() - interval '60 seconds'
    ) INTO v_already_logged;

    IF v_already_logged THEN
      RETURN NEW;
    END IF;

    IF v_role = 'model' THEN
      SELECT showname INTO v_showname
      FROM model_details WHERE model_id = NEW.user_id;

      INSERT INTO site_actions (action_type, actor_id, target_id, target_type, title, description, metadata)
      VALUES (
        'new_model', NEW.user_id, NEW.user_id, 'profile',
        'New model activated',
        COALESCE(v_showname, v_username, 'A model') || ' is now active on the platform',
        jsonb_build_object('username', v_username, 'source', 'orders_trigger')
      );

    ELSIF v_role = 'company' THEN
      INSERT INTO site_actions (action_type, actor_id, target_id, target_type, title, description, metadata)
      VALUES (
        'new_club', NEW.user_id, NEW.user_id, 'club',
        'New club activated',
        COALESCE(v_username, 'A club') || ' is now active on the platform',
        jsonb_build_object('username', v_username, 'source', 'orders_trigger')
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_ad_activation ON orders;
CREATE TRIGGER on_ad_activation
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_ad_activation();

-- ============================================================================
-- 2. NEW: trigger on order_items that catches the free-order path
-- ============================================================================
-- Fires AFTER INSERT on order_items. If the parent order is already 'paid' and
-- this item is an ad_package, log the activation (unless one was logged in the
-- last 60s for the same user — prevents double-log if both triggers fire).

CREATE OR REPLACE FUNCTION log_ad_activation_from_item()
RETURNS TRIGGER AS $$
DECLARE
  v_order_status text;
  v_user_id uuid;
  v_role text;
  v_username text;
  v_showname text;
  v_product_type text;
  v_already_logged boolean := false;
BEGIN
  SELECT product_type INTO v_product_type
  FROM products WHERE id = NEW.product_id;

  IF v_product_type IS DISTINCT FROM 'ad_package' THEN
    RETURN NEW;
  END IF;

  SELECT status, user_id INTO v_order_status, v_user_id
  FROM orders WHERE id = NEW.order_id;

  IF v_order_status IS DISTINCT FROM 'paid' THEN
    -- Parent order not paid yet — the orders trigger will fire later when it is.
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM site_actions
    WHERE actor_id = v_user_id
      AND action_type IN ('new_model', 'new_club')
      AND created_at > now() - interval '60 seconds'
  ) INTO v_already_logged;

  IF v_already_logged THEN
    RETURN NEW;
  END IF;

  SELECT role, username INTO v_role, v_username
  FROM profiles WHERE id = v_user_id;

  IF v_role = 'model' THEN
    SELECT showname INTO v_showname
    FROM model_details WHERE model_id = v_user_id;

    INSERT INTO site_actions (action_type, actor_id, target_id, target_type, title, description, metadata)
    VALUES (
      'new_model', v_user_id, v_user_id, 'profile',
      'New model activated',
      COALESCE(v_showname, v_username, 'A model') || ' is now active on the platform',
      jsonb_build_object('username', v_username, 'source', 'order_items_trigger')
    );

  ELSIF v_role = 'company' THEN
    INSERT INTO site_actions (action_type, actor_id, target_id, target_type, title, description, metadata)
    VALUES (
      'new_club', v_user_id, v_user_id, 'club',
      'New club activated',
      COALESCE(v_username, 'A club') || ' is now active on the platform',
      jsonb_build_object('username', v_username, 'source', 'order_items_trigger')
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_item_insert ON order_items;
CREATE TRIGGER on_order_item_insert
  AFTER INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION log_ad_activation_from_item();

-- ============================================================================
-- 3. DIAGNOSTIC: run these one-by-one in the SQL Editor after the patch
-- ============================================================================

-- 3a. Confirm all expected triggers exist
-- Expected rows: on_ad_activation, on_order_item_insert, on_photo_approved,
--   on_video_approved, on_comment_approved, on_banner_activated, on_model_verified
SELECT tgname AS trigger_name, tgrelid::regclass AS table_name
FROM pg_trigger
WHERE tgname IN (
  'on_ad_activation', 'on_order_item_insert', 'on_photo_approved',
  'on_video_approved', 'on_comment_approved', 'on_banner_activated',
  'on_model_verified'
)
ORDER BY tgname;

-- 3b. Row counts per action_type
SELECT action_type, COUNT(*) AS n,
       MIN(created_at) AS oldest,
       MAX(created_at) AS newest
FROM site_actions
GROUP BY action_type
ORDER BY action_type;

-- 3c. 10 most recent events of each type (last 30 days)
SELECT action_type, title, description, created_at
FROM site_actions
WHERE created_at > now() - interval '30 days'
ORDER BY created_at DESC
LIMIT 30;

-- 3d. Paid ad_package orders that have NO corresponding new_model/new_club row.
-- These are historical victims of the old free-order bug. Inspect, and if you
-- want, run section 4 below to backfill them.
SELECT
  o.user_id,
  p.role,
  p.username,
  o.id AS order_id,
  o.created_at AS order_created_at
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
JOIN products pr ON pr.id = oi.product_id
JOIN profiles p ON p.id = o.user_id
LEFT JOIN site_actions sa
  ON sa.actor_id = o.user_id
 AND sa.action_type IN ('new_model', 'new_club')
WHERE o.status = 'paid'
  AND pr.product_type = 'ad_package'
  AND sa.id IS NULL
  AND p.role IN ('model', 'company')
ORDER BY o.created_at DESC;

-- ============================================================================
-- 4. OPTIONAL: backfill missing new_model / new_club rows for historical
--    free orders. Review section 3d first, then run if you want to populate
--    the feed with historical activations.
-- ============================================================================
-- INSERT INTO site_actions (action_type, actor_id, target_id, target_type, title, description, metadata, created_at)
-- SELECT
--   CASE WHEN p.role = 'model' THEN 'new_model' ELSE 'new_club' END,
--   o.user_id, o.user_id,
--   CASE WHEN p.role = 'model' THEN 'profile' ELSE 'club' END,
--   CASE WHEN p.role = 'model' THEN 'New model activated' ELSE 'New club activated' END,
--   COALESCE(md.showname, p.username, CASE WHEN p.role = 'model' THEN 'A model' ELSE 'A club' END)
--     || ' is now active on the platform',
--   jsonb_build_object('username', p.username, 'source', 'backfill'),
--   COALESCE(oi.activation_date, o.created_at)
-- FROM orders o
-- JOIN order_items oi ON oi.order_id = o.id
-- JOIN products pr ON pr.id = oi.product_id
-- JOIN profiles p ON p.id = o.user_id
-- LEFT JOIN model_details md ON md.model_id = o.user_id AND p.role = 'model'
-- LEFT JOIN site_actions sa
--   ON sa.actor_id = o.user_id
--  AND sa.action_type IN ('new_model', 'new_club')
-- WHERE o.status = 'paid'
--   AND pr.product_type = 'ad_package'
--   AND sa.id IS NULL
--   AND p.role IN ('model', 'company');
