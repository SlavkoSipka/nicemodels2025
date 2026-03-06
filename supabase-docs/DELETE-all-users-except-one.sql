-- ============================================================
-- Delete ALL auth users and their data EXCEPT m1@gmail.com
-- ============================================================
-- Run in Supabase SQL Editor. BACKUP FIRST!
--
-- If "column participant1_id does not exist" on conversations:
--   Replace participant1_id → user_id, participant2_id → model_id
-- ============================================================

DO $$
DECLARE
  keep_id uuid;
  ids_to_delete uuid[];
BEGIN
  SELECT id INTO keep_id FROM auth.users WHERE email = 'm1@gmail.com' LIMIT 1;
  IF keep_id IS NULL THEN
    RAISE EXCEPTION 'User m1@gmail.com not found. Aborting.';
  END IF;

  SELECT array_agg(id) INTO ids_to_delete
  FROM auth.users
  WHERE email != 'm1@gmail.com';

  IF ids_to_delete IS NULL OR array_length(ids_to_delete, 1) IS NULL THEN
    RAISE NOTICE 'No users to delete.';
    RETURN;
  END IF;

  -- public schema: delete from tables that reference user/model/club ids
  DELETE FROM model_comments         WHERE user_id = ANY(ids_to_delete) OR model_id = ANY(ids_to_delete);
  DELETE FROM favorites             WHERE user_id = ANY(ids_to_delete) OR model_id = ANY(ids_to_delete);
  DELETE FROM model_statistics      WHERE model_id = ANY(ids_to_delete) OR user_id = ANY(ids_to_delete);
  DELETE FROM story_views           WHERE viewer_id = ANY(ids_to_delete);
  DELETE FROM model_stories         WHERE model_id = ANY(ids_to_delete);
  DELETE FROM verifications         WHERE user_id = ANY(ids_to_delete);
  DELETE FROM notifications         WHERE user_id = ANY(ids_to_delete);
  DELETE FROM club_invites          WHERE club_id = ANY(ids_to_delete) OR invited_model_id = ANY(ids_to_delete);
  DELETE FROM banners               WHERE owner_id = ANY(ids_to_delete);
  DELETE FROM messages              WHERE sender_id = ANY(ids_to_delete);
  DELETE FROM online_status         WHERE user_id = ANY(ids_to_delete);
  -- conversations: participant1_id/participant2_id (if migrated) or user_id/model_id (legacy)
  DELETE FROM conversations         WHERE participant1_id = ANY(ids_to_delete) OR participant2_id = ANY(ids_to_delete);
  DELETE FROM order_items           WHERE order_id IN (SELECT id FROM orders WHERE user_id = ANY(ids_to_delete));
  DELETE FROM model_rates           WHERE model_id = ANY(ids_to_delete);
  DELETE FROM model_photos          WHERE model_id = ANY(ids_to_delete);
  DELETE FROM model_videos          WHERE model_id = ANY(ids_to_delete);
  DELETE FROM model_services        WHERE model_id = ANY(ids_to_delete);
  DELETE FROM model_languages       WHERE model_id = ANY(ids_to_delete);
  DELETE FROM model_working_hours   WHERE model_id = ANY(ids_to_delete);
  DELETE FROM model_contact_details WHERE model_id = ANY(ids_to_delete);
  DELETE FROM model_details         WHERE model_id = ANY(ids_to_delete);
  DELETE FROM club_amenities        WHERE club_id = ANY(ids_to_delete);
  DELETE FROM club_photos           WHERE club_id = ANY(ids_to_delete);
  DELETE FROM club_videos           WHERE club_id = ANY(ids_to_delete);
  DELETE FROM club_working_hours    WHERE club_id = ANY(ids_to_delete);
  DELETE FROM club_contact_details  WHERE club_id = ANY(ids_to_delete);
  DELETE FROM club_details          WHERE club_id = ANY(ids_to_delete);
  DELETE FROM club_analytics        WHERE club_id = ANY(ids_to_delete) OR viewer_id = ANY(ids_to_delete);
  DELETE FROM orders                WHERE user_id = ANY(ids_to_delete);

  -- Disable storage trigger (Supabase blocks direct storage.objects DELETE)
  ALTER TABLE profiles DISABLE TRIGGER USER;
  DELETE FROM profiles              WHERE id = ANY(ids_to_delete);
  ALTER TABLE profiles ENABLE TRIGGER USER;

  -- auth schema
  DELETE FROM auth.users WHERE id = ANY(ids_to_delete);

  RAISE NOTICE 'Deleted % users. Kept m1@gmail.com.', array_length(ids_to_delete, 1);
END $$;
