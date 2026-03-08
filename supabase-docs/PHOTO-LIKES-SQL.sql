-- ============================================================
-- Photo Likes — let users like model photos
-- ============================================================

-- 1. Table
CREATE TABLE IF NOT EXISTS photo_likes (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id   uuid NOT NULL REFERENCES model_photos(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES profiles(id)     ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(photo_id, user_id)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_photo_likes_photo_id ON photo_likes(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_likes_user_id  ON photo_likes(user_id);

-- 3. RLS
ALTER TABLE photo_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read photo likes" ON photo_likes;
CREATE POLICY "Anyone can read photo likes"
  ON photo_likes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Logged-in users can like photos" ON photo_likes;
CREATE POLICY "Logged-in users can like photos"
  ON photo_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike their own likes" ON photo_likes;
CREATE POLICY "Users can unlike their own likes"
  ON photo_likes FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Helper: get like counts for a set of photos (batch)
CREATE OR REPLACE FUNCTION get_photo_like_counts(photo_ids uuid[])
RETURNS TABLE(photo_id uuid, like_count bigint) AS $$
  SELECT pl.photo_id, COUNT(*)::bigint AS like_count
  FROM photo_likes pl
  WHERE pl.photo_id = ANY(photo_ids)
  GROUP BY pl.photo_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 5. Notify model when someone likes their photo (who liked it)
CREATE OR REPLACE FUNCTION notify_model_on_photo_like()
RETURNS TRIGGER AS $$
DECLARE
  v_model_id uuid;
  v_username text;
BEGIN
  -- Get model who owns the photo
  SELECT model_id INTO v_model_id
  FROM model_photos
  WHERE id = NEW.photo_id;

  -- Don't notify if model liked their own photo
  IF v_model_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Get username of who liked
  SELECT COALESCE(username, 'Someone') INTO v_username
  FROM profiles
  WHERE id = NEW.user_id;

  INSERT INTO notifications (
    user_id, type, title, message,
    related_entity_type, related_entity_id, action_url
  )
  VALUES (
    v_model_id,
    'photo_like',
    'New photo like',
    v_username || ' liked your photo',
    'photo',
    NEW.photo_id,
    '/models/' || v_model_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_photo_like_notify_model ON photo_likes;
CREATE TRIGGER on_photo_like_notify_model
  AFTER INSERT ON photo_likes
  FOR EACH ROW
  EXECUTE FUNCTION notify_model_on_photo_like();
