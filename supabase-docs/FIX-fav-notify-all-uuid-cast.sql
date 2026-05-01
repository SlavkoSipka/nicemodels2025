-- ============================================================================
-- FIX: fav_notify_all – related_entity_id is uuid, not text
-- ============================================================================
-- Bug: prethodna verzija funkcije je radila INSERT sa p_model_id::text
-- u kolonu notifications.related_entity_id koja je tipa uuid.
-- Posledica: trigger trg_fav_new_story_insert je rušio insert u model_stories
-- sa greškom: column "related_entity_id" is of type uuid but expression is of type text.
--
-- Pokrenuti jednom na bazi (Supabase SQL editor).
-- ============================================================================

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
        AND n.related_entity_id = p_model_id
        AND n.created_at > (now() - INTERVAL '6 hours')
    ) THEN
      CONTINUE;
    END IF;

    INSERT INTO notifications (user_id, type, title, message, related_entity_type, related_entity_id, action_url)
    VALUES (r.user_id, p_type, p_title, p_message, 'model', p_model_id, p_action_url);
    inserted := inserted + 1;
  END LOOP;
  RETURN inserted;
END;
$$;

GRANT EXECUTE ON FUNCTION fav_notify_all(uuid, text, text, text, text) TO authenticated, service_role;

SELECT 'fav_notify_all fixed – related_entity_id sada koristi uuid bez cast-a.' AS status;
