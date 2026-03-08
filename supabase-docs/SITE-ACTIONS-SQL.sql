-- ============================================================================
-- SITE ACTIONS TRACKING SYSTEM
-- ============================================================================
-- Logs noteworthy activity for the Latest Actions page.
-- Actions only fire for models/clubs with active ad packages.
-- ============================================================================

-- ============================================================================
-- 0. CLEANUP: Remove actions logged by old registration-based triggers
-- ============================================================================

DELETE FROM site_actions WHERE action_type IN ('new_model', 'new_club');

-- ============================================================================
-- 1. CREATE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS site_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type text NOT NULL,
  actor_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  target_id uuid,
  target_type text,
  title text NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT valid_action_type CHECK (
    action_type IN (
      'new_model', 'new_club', 'new_photo', 'new_video',
      'new_comment', 'new_banner', 'model_verified'
    )
  )
);

-- ============================================================================
-- 2. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_site_actions_type ON site_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_site_actions_created ON site_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_actions_actor ON site_actions(actor_id);

-- ============================================================================
-- 3. RLS - public read, system write
-- ============================================================================

ALTER TABLE site_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read site actions" ON site_actions;
CREATE POLICY "Anyone can read site actions"
  ON site_actions FOR SELECT
  USING (true);

-- ============================================================================
-- 4. HELPER: Check if a user has an active ad package
-- ============================================================================

CREATE OR REPLACE FUNCTION user_has_active_ad(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  found boolean := false;
BEGIN
  SELECT true INTO found
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  JOIN products p ON p.id = oi.product_id
  WHERE o.user_id = p_user_id
    AND o.status = 'paid'
    AND p.product_type = 'ad_package'
    AND COALESCE(oi.activation_date, o.created_at) <= now()
    AND (
      COALESCE(oi.activation_date, o.created_at)
      + make_interval(days => p.duration_days, hours => p.duration_hours)
    ) > now()
  LIMIT 1;

  RETURN COALESCE(found, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. TRIGGER: Model/Club activated ad → new_model / new_club
-- ============================================================================
-- Fires when an order is paid and contains an ad_package product.

CREATE OR REPLACE FUNCTION log_ad_activation()
RETURNS TRIGGER AS $$
DECLARE
  v_role text;
  v_username text;
  v_showname text;
  v_has_ad_product boolean := false;
BEGIN
  IF NEW.status = 'paid' AND (OLD IS NULL OR OLD.status != 'paid') THEN
    SELECT true INTO v_has_ad_product
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = NEW.id
      AND p.product_type = 'ad_package'
    LIMIT 1;

    IF NOT COALESCE(v_has_ad_product, false) THEN
      RETURN NEW;
    END IF;

    SELECT role, username INTO v_role, v_username
    FROM profiles WHERE id = NEW.user_id;

    IF v_role = 'model' THEN
      SELECT showname INTO v_showname
      FROM model_details WHERE model_id = NEW.user_id;

      INSERT INTO site_actions (action_type, actor_id, target_id, target_type, title, description, metadata)
      VALUES (
        'new_model', NEW.user_id, NEW.user_id, 'profile',
        'New model activated',
        COALESCE(v_showname, v_username, 'A model') || ' is now active on the platform',
        jsonb_build_object('username', v_username)
      );

    ELSIF v_role = 'company' THEN
      INSERT INTO site_actions (action_type, actor_id, target_id, target_type, title, description, metadata)
      VALUES (
        'new_club', NEW.user_id, NEW.user_id, 'club',
        'New club activated',
        COALESCE(v_username, 'A club') || ' is now active on the platform',
        jsonb_build_object('username', v_username)
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

-- Remove old registration-based triggers
DROP TRIGGER IF EXISTS on_model_onboarded ON profiles;
DROP TRIGGER IF EXISTS on_model_inserted ON profiles;
DROP TRIGGER IF EXISTS on_club_onboarded ON profiles;
DROP TRIGGER IF EXISTS on_club_inserted ON profiles;

-- ============================================================================
-- 6. TRIGGER: New photo approved (only if model has active ad)
-- ============================================================================

CREATE OR REPLACE FUNCTION log_new_photo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_approved = true AND (OLD IS NULL OR OLD.is_approved = false) THEN
    IF user_has_active_ad(NEW.model_id) THEN
      INSERT INTO site_actions (action_type, actor_id, target_id, target_type, title, description, metadata)
      VALUES (
        'new_photo',
        NEW.model_id,
        NEW.id,
        'photo',
        'New photo added',
        COALESCE(
          (SELECT COALESCE(showname, (SELECT username FROM profiles WHERE id = NEW.model_id))
           FROM model_details WHERE model_id = NEW.model_id),
          'A model'
        ) || ' uploaded a new photo',
        jsonb_build_object('model_id', NEW.model_id)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_photo_approved ON model_photos;
CREATE TRIGGER on_photo_approved
  AFTER INSERT OR UPDATE ON model_photos
  FOR EACH ROW
  EXECUTE FUNCTION log_new_photo();

-- ============================================================================
-- 7. TRIGGER: New video approved (only if model has active ad)
-- ============================================================================

CREATE OR REPLACE FUNCTION log_new_video()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_approved = true AND (OLD IS NULL OR OLD.is_approved = false) THEN
    IF user_has_active_ad(NEW.model_id) THEN
      INSERT INTO site_actions (action_type, actor_id, target_id, target_type, title, description, metadata)
      VALUES (
        'new_video',
        NEW.model_id,
        NEW.id,
        'video',
        'New video added',
        COALESCE(
          (SELECT COALESCE(showname, (SELECT username FROM profiles WHERE id = NEW.model_id))
           FROM model_details WHERE model_id = NEW.model_id),
          'A model'
        ) || ' uploaded a new video',
        jsonb_build_object('model_id', NEW.model_id)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_video_approved ON model_videos;
CREATE TRIGGER on_video_approved
  AFTER INSERT OR UPDATE ON model_videos
  FOR EACH ROW
  EXECUTE FUNCTION log_new_video();

-- ============================================================================
-- 8. TRIGGER: New comment approved (only if model has active ad)
-- ============================================================================

CREATE OR REPLACE FUNCTION log_new_comment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD IS NULL OR OLD.status != 'approved') THEN
    IF user_has_active_ad(NEW.model_id) THEN
      INSERT INTO site_actions (action_type, actor_id, target_id, target_type, title, description, metadata)
      VALUES (
        'new_comment',
        NEW.user_id,
        NEW.id,
        'comment',
        'New review posted',
        COALESCE(
          (SELECT username FROM profiles WHERE id = NEW.user_id),
          'Someone'
        ) || ' left a review for ' ||
        COALESCE(
          (SELECT COALESCE(showname, (SELECT username FROM profiles WHERE id = NEW.model_id))
           FROM model_details WHERE model_id = NEW.model_id),
          'a model'
        ),
        jsonb_build_object('model_id', NEW.model_id, 'user_id', NEW.user_id, 'rating', NEW.rating)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_approved ON model_comments;
CREATE TRIGGER on_comment_approved
  AFTER INSERT OR UPDATE ON model_comments
  FOR EACH ROW
  EXECUTE FUNCTION log_new_comment();

-- ============================================================================
-- 9. TRIGGER: New banner activated
-- ============================================================================

CREATE OR REPLACE FUNCTION log_new_banner()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' AND (OLD IS NULL OR OLD.status != 'active') THEN
    INSERT INTO site_actions (action_type, actor_id, target_id, target_type, title, description, metadata)
    VALUES (
      'new_banner',
      NEW.owner_id,
      NEW.id,
      'banner',
      'New banner live',
      COALESCE(NEW.title, 'A new banner') || ' is now live on the site',
      jsonb_build_object('owner_id', NEW.owner_id, 'banner_title', NEW.title)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_banner_activated ON banners;
CREATE TRIGGER on_banner_activated
  AFTER INSERT OR UPDATE ON banners
  FOR EACH ROW
  EXECUTE FUNCTION log_new_banner();

-- ============================================================================
-- 10. TRIGGER: Model verified (only if model has active ad)
-- ============================================================================

CREATE OR REPLACE FUNCTION log_model_verified()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_verified = true AND (OLD IS NULL OR OLD.is_verified = false) THEN
    IF user_has_active_ad(NEW.id) THEN
      INSERT INTO site_actions (action_type, actor_id, target_id, target_type, title, description, metadata)
      VALUES (
        'model_verified',
        NEW.id,
        NEW.id,
        'profile',
        'Model verified',
        COALESCE(NEW.username, 'A model') || ' has been verified',
        jsonb_build_object('username', NEW.username)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_model_verified ON profiles;
CREATE TRIGGER on_model_verified
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION log_model_verified();
