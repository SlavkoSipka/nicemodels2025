-- ============================================================================
-- USER ALERTS FEATURE – PART 3/3: Favorite-update notifications (triggers)
-- ============================================================================
-- Fires notifications to all users who have favorited a model when:
--   1. a new approved photo is added (fav_new_photo)
--   2. a new story is posted (fav_new_story)
--   3. the model changes city / live_location_city (fav_location_change)
--   4. the model's profile is_active flips false -> true (fav_back_online)
--
-- Rate limit: for each trigger type, skip if the same user already has an
-- un-read or <6h old notification of that type for that model.
-- ============================================================================

-- Generic helper: insert fav notifications to all favoriters of a given model,
-- enforcing a per-user 6h rate limit.
CREATE OR REPLACE FUNCTION fav_notify_all(
  p_model_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_action_url text
)
RETURNS int
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  r record;
  inserted int := 0;
BEGIN
  FOR r IN
    SELECT f.user_id
    FROM favorites f
    WHERE f.model_id = p_model_id
  LOOP
    IF EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.user_id = r.user_id
        AND n.type = p_type
        AND n.related_entity_type = 'model'
        AND n.related_entity_id::text = p_model_id::text
        AND n.created_at > (now() - INTERVAL '6 hours')
    ) THEN
      CONTINUE;
    END IF;

    INSERT INTO notifications (user_id, type, title, message, related_entity_type, related_entity_id, action_url)
    VALUES (r.user_id, p_type, p_title, p_message, 'model', p_model_id::text, p_action_url);
    inserted := inserted + 1;
  END LOOP;
  RETURN inserted;
END;
$$;

GRANT EXECUTE ON FUNCTION fav_notify_all(uuid, text, text, text, text) TO authenticated, service_role;

-- 1. New approved photo
CREATE OR REPLACE FUNCTION trg_fav_notify_new_photo()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  display_name text;
BEGIN
  IF NEW.is_approved IS DISTINCT FROM true THEN
    RETURN NEW;
  END IF;

  SELECT coalesce(md.showname, p.username, 'A favorite')
    INTO display_name
  FROM profiles p LEFT JOIN model_details md ON md.model_id = p.id
  WHERE p.id = NEW.model_id;

  PERFORM fav_notify_all(
    NEW.model_id,
    'fav_new_photo',
    display_name || ' posted a new photo',
    'Check out the newest photo from ' || display_name || '.',
    '/models/' || NEW.model_id::text
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fav_new_photo_insert ON model_photos;
CREATE TRIGGER trg_fav_new_photo_insert
  AFTER INSERT ON model_photos
  FOR EACH ROW EXECUTE FUNCTION trg_fav_notify_new_photo();

-- Also fire when an existing photo transitions to approved.
CREATE OR REPLACE FUNCTION trg_fav_notify_photo_approved()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  display_name text;
BEGIN
  IF OLD.is_approved = true OR NEW.is_approved IS DISTINCT FROM true THEN
    RETURN NEW;
  END IF;

  SELECT coalesce(md.showname, p.username, 'A favorite')
    INTO display_name
  FROM profiles p LEFT JOIN model_details md ON md.model_id = p.id
  WHERE p.id = NEW.model_id;

  PERFORM fav_notify_all(
    NEW.model_id,
    'fav_new_photo',
    display_name || ' posted a new photo',
    'Check out the newest photo from ' || display_name || '.',
    '/models/' || NEW.model_id::text
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fav_photo_approved ON model_photos;
CREATE TRIGGER trg_fav_photo_approved
  AFTER UPDATE OF is_approved ON model_photos
  FOR EACH ROW EXECUTE FUNCTION trg_fav_notify_photo_approved();

-- 2. New story
CREATE OR REPLACE FUNCTION trg_fav_notify_new_story()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  display_name text;
BEGIN
  SELECT coalesce(md.showname, p.username, 'A favorite')
    INTO display_name
  FROM profiles p LEFT JOIN model_details md ON md.model_id = p.id
  WHERE p.id = NEW.model_id;

  PERFORM fav_notify_all(
    NEW.model_id,
    'fav_new_story',
    display_name || ' posted a new story',
    'A new story is live for the next 24 hours.',
    '/models/' || NEW.model_id::text
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fav_new_story_insert ON model_stories;
CREATE TRIGGER trg_fav_new_story_insert
  AFTER INSERT ON model_stories
  FOR EACH ROW EXECUTE FUNCTION trg_fav_notify_new_story();

-- 3. Location change
CREATE OR REPLACE FUNCTION trg_fav_notify_location_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  display_name text;
  old_city text;
  new_city text;
BEGIN
  new_city := coalesce(NEW.live_location_city, NEW.city);
  old_city := coalesce(OLD.live_location_city, OLD.city);

  IF old_city IS NOT DISTINCT FROM new_city THEN
    RETURN NEW;
  END IF;

  IF new_city IS NULL OR new_city = '' THEN
    RETURN NEW;
  END IF;

  SELECT coalesce(md.showname, p.username, 'A favorite')
    INTO display_name
  FROM profiles p LEFT JOIN model_details md ON md.model_id = p.id
  WHERE p.id = NEW.model_id;

  PERFORM fav_notify_all(
    NEW.model_id,
    'fav_location_change',
    display_name || ' is now in ' || new_city,
    CASE
      WHEN old_city IS NULL OR old_city = '' THEN display_name || ' just set their location to ' || new_city || '.'
      ELSE display_name || ' moved from ' || old_city || ' to ' || new_city || '.'
    END,
    '/models/' || NEW.model_id::text
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fav_location_change ON model_details;
CREATE TRIGGER trg_fav_location_change
  AFTER UPDATE OF city, live_location_city ON model_details
  FOR EACH ROW EXECUTE FUNCTION trg_fav_notify_location_change();

-- 4. Back online (profiles.is_active false -> true)
CREATE OR REPLACE FUNCTION trg_fav_notify_back_online()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  display_name text;
BEGIN
  IF OLD.is_active = true OR NEW.is_active IS DISTINCT FROM true THEN
    RETURN NEW;
  END IF;

  -- Only for models (favorites target models)
  IF NEW.role::text <> 'model' THEN RETURN NEW; END IF;

  SELECT coalesce(md.showname, NEW.username, 'A favorite')
    INTO display_name
  FROM model_details md WHERE md.model_id = NEW.id;

  PERFORM fav_notify_all(
    NEW.id,
    'fav_back_online',
    display_name || ' is back online',
    display_name || ' has activated their profile again.',
    '/models/' || NEW.id::text
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fav_back_online ON profiles;
CREATE TRIGGER trg_fav_back_online
  AFTER UPDATE OF is_active ON profiles
  FOR EACH ROW EXECUTE FUNCTION trg_fav_notify_back_online();

SELECT 'Part 3/3: favorite-update triggers installed (photo, story, location, back_online).' AS status;
