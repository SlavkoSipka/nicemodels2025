-- =====================================================
-- FIX: Allow all roles (anon, authenticated, all user types)
-- to view stories on the site.
-- Run this in Supabase SQL Editor.
-- =====================================================

-- 1. Grant EXECUTE on get_active_model_stories to all roles
GRANT EXECUTE ON FUNCTION get_active_model_stories() TO anon;
GRANT EXECUTE ON FUNCTION get_active_model_stories() TO authenticated;

-- 2. Fix mark_story_viewed to handle anonymous users (auth.uid() = NULL)
--    For anonymous viewers: increment views_count but skip story_views insert
--    For authenticated viewers: insert into story_views and increment count
DROP FUNCTION IF EXISTS mark_story_viewed(UUID);

CREATE OR REPLACE FUNCTION mark_story_viewed(p_story_id UUID)
RETURNS VOID AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    -- Authenticated user: track in story_views table
    INSERT INTO story_views (story_id, viewer_id)
    VALUES (p_story_id, auth.uid())
    ON CONFLICT (story_id, viewer_id) DO NOTHING;

    -- Update views count based on story_views rows
    UPDATE model_stories
    SET views_count = (
      SELECT COUNT(*) FROM story_views WHERE story_id = p_story_id
    )
    WHERE id = p_story_id;
  ELSE
    -- Anonymous user: just increment the count, don't insert into story_views
    UPDATE model_stories
    SET views_count = views_count + 1
    WHERE id = p_story_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant to both roles
GRANT EXECUTE ON FUNCTION mark_story_viewed(UUID) TO anon;
GRANT EXECUTE ON FUNCTION mark_story_viewed(UUID) TO authenticated;

-- 3. Verify RLS policies allow anon to SELECT active stories
--    (policy "Anyone can view active stories" should already allow this)
--    Recreate it to make sure:
DROP POLICY IF EXISTS "Anyone can view active stories" ON model_stories;

CREATE POLICY "Anyone can view active stories"
ON model_stories FOR SELECT
USING (is_active = TRUE AND expires_at > NOW());

-- 4. Verify story_views INSERT policy allows anon
DROP POLICY IF EXISTS "Anyone can record story views" ON story_views;

CREATE POLICY "Anyone can record story views"
ON story_views FOR INSERT
WITH CHECK (TRUE);

-- 5. Test
SELECT 'Stories access fixed for all roles!' as status;
SELECT COUNT(*) as active_stories FROM model_stories WHERE is_active = TRUE AND expires_at > NOW();
