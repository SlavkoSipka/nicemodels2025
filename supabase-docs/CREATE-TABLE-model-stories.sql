-- ============================================
-- MODEL STORIES SYSTEM - Instagram-style Stories
-- ============================================

-- STEP 1: Create model_stories table
CREATE TABLE IF NOT EXISTS model_stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Media info
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  media_url TEXT NOT NULL, -- Path in Supabase Storage
  thumbnail_url TEXT, -- For videos, optional thumbnail
  
  -- Story metadata
  caption TEXT,
  duration INTEGER DEFAULT 5, -- For images, how many seconds to show (videos use their actual duration)
  
  -- Timing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  
  -- Stats
  views_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Index for fast queries
  CONSTRAINT check_expires_at CHECK (expires_at > created_at)
);

-- STEP 2: Create story_views table (track who viewed what)
CREATE TABLE IF NOT EXISTS story_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES model_stories(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- NULL for anonymous views
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate views from same user
  UNIQUE(story_id, viewer_id)
);

-- STEP 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stories_model_id ON model_stories(model_id);
CREATE INDEX IF NOT EXISTS idx_stories_active ON model_stories(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON model_stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_viewer_id ON story_views(viewer_id);

-- STEP 4: Create function to get active stories grouped by model
-- Drop if exists first
DROP FUNCTION IF EXISTS get_active_model_stories();

CREATE OR REPLACE FUNCTION get_active_model_stories()
RETURNS TABLE (
  model_id UUID,
  model_username TEXT,
  model_showname TEXT,
  model_photo TEXT,
  total_stories BIGINT,
  unviewed_stories BIGINT,
  latest_story_at TIMESTAMP WITH TIME ZONE,
  stories JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH model_primary_photo AS (
    SELECT DISTINCT ON (model_id) 
      model_id,
      file_path
    FROM model_photos
    WHERE is_approved = TRUE
    ORDER BY model_id, uploaded_at DESC
  )
  SELECT 
    p.id as model_id,
    p.username as model_username,
    COALESCE(md.showname, p.username) as model_showname,
    mp.file_path as model_photo,
    COUNT(DISTINCT ms.id) as total_stories,
    COUNT(DISTINCT CASE WHEN sv.id IS NULL THEN ms.id END) as unviewed_stories,
    MAX(ms.created_at) as latest_story_at,
    JSONB_AGG(
      JSONB_BUILD_OBJECT(
        'id', ms.id,
        'media_type', ms.media_type,
        'media_url', ms.media_url,
        'thumbnail_url', ms.thumbnail_url,
        'caption', ms.caption,
        'duration', ms.duration,
        'created_at', ms.created_at,
        'expires_at', ms.expires_at,
        'views_count', ms.views_count,
        'viewed_by_me', (sv.id IS NOT NULL)
      ) ORDER BY ms.created_at ASC
    ) as stories
  FROM profiles p
  LEFT JOIN model_details md ON md.model_id = p.id
  LEFT JOIN model_primary_photo mp ON mp.model_id = p.id
  INNER JOIN model_stories ms ON ms.model_id = p.id 
    AND ms.is_active = TRUE 
    AND ms.expires_at > NOW()
  LEFT JOIN story_views sv ON sv.story_id = ms.id AND sv.viewer_id = auth.uid()
  WHERE p.role = 'model'
  GROUP BY p.id, p.username, md.showname, mp.file_path
  HAVING COUNT(ms.id) > 0
  ORDER BY MAX(ms.created_at) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 5: Create function to mark story as viewed
-- Drop if exists first
DROP FUNCTION IF EXISTS mark_story_viewed(UUID);

CREATE OR REPLACE FUNCTION mark_story_viewed(p_story_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Insert view record (ignore if already viewed)
  INSERT INTO story_views (story_id, viewer_id)
  VALUES (p_story_id, auth.uid())
  ON CONFLICT (story_id, viewer_id) DO NOTHING;
  
  -- Update views count
  UPDATE model_stories
  SET views_count = (
    SELECT COUNT(*) FROM story_views WHERE story_id = p_story_id
  )
  WHERE id = p_story_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 6: Create function to auto-expire old stories
-- Drop if exists first
DROP FUNCTION IF EXISTS expire_old_stories();

CREATE OR REPLACE FUNCTION expire_old_stories()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE model_stories
  SET is_active = FALSE
  WHERE is_active = TRUE
    AND expires_at <= NOW();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- STEP 7: Create function to delete expired stories (run via cron)
-- Drop if exists first
DROP FUNCTION IF EXISTS delete_expired_stories();

CREATE OR REPLACE FUNCTION delete_expired_stories()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
  story_record RECORD;
BEGIN
  -- Get all expired stories to delete their files
  FOR story_record IN 
    SELECT id, media_url, thumbnail_url 
    FROM model_stories 
    WHERE expires_at < (NOW() - INTERVAL '1 hour')
  LOOP
    -- Note: File deletion should be handled by your backend/cron job
    -- This just deletes the database records
    NULL;
  END LOOP;
  
  -- Delete expired stories
  DELETE FROM model_stories
  WHERE expires_at < (NOW() - INTERVAL '1 hour');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- STEP 8: RLS Policies

-- Enable RLS
ALTER TABLE model_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;

-- Everyone can view active stories
CREATE POLICY "Anyone can view active stories"
ON model_stories FOR SELECT
USING (is_active = TRUE AND expires_at > NOW());

-- Models can insert their own stories
CREATE POLICY "Models can create own stories"
ON model_stories FOR INSERT
WITH CHECK (
  auth.uid() = model_id AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'model')
);

-- Models can update/delete their own stories
CREATE POLICY "Models can update own stories"
ON model_stories FOR UPDATE
USING (auth.uid() = model_id);

CREATE POLICY "Models can delete own stories"
ON model_stories FOR DELETE
USING (auth.uid() = model_id);

-- Anyone can insert story views
CREATE POLICY "Anyone can record story views"
ON story_views FOR INSERT
WITH CHECK (TRUE);

-- Users can view their own story views
CREATE POLICY "Users can view own story views"
ON story_views FOR SELECT
USING (viewer_id = auth.uid());

-- Models can view who viewed their stories
CREATE POLICY "Models can view their story viewers"
ON story_views FOR SELECT
USING (
  story_id IN (
    SELECT id FROM model_stories WHERE model_id = auth.uid()
  )
);

-- STEP 9: Create trigger to update views_count
-- Drop if exists first
DROP TRIGGER IF EXISTS trigger_update_story_views_count ON story_views;
DROP FUNCTION IF EXISTS update_story_views_count();

CREATE OR REPLACE FUNCTION update_story_views_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE model_stories
  SET views_count = (
    SELECT COUNT(*) FROM story_views WHERE story_id = NEW.story_id
  )
  WHERE id = NEW.story_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_story_views_count
AFTER INSERT ON story_views
FOR EACH ROW
EXECUTE FUNCTION update_story_views_count();

-- STEP 10: Comments
COMMENT ON TABLE model_stories IS 'Instagram-style stories for models - auto-expire after 24 hours';
COMMENT ON TABLE story_views IS 'Track who viewed which stories';
COMMENT ON COLUMN model_stories.expires_at IS 'Story automatically becomes inactive after this time';
COMMENT ON COLUMN model_stories.duration IS 'How long to show this story (seconds) - for images only';

-- STEP 11: Verify everything was created
SELECT 'Stories tables created successfully!' as status;
