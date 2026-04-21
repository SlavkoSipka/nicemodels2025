-- FIX: Update function with better error handling and make sure it runs with proper permissions

-- Drop existing function
DROP FUNCTION IF EXISTS get_active_model_stories();

-- Recreate with SECURITY DEFINER and better logic
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
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  -- Prva (profilna) slika modela = prva po uploaded_at
  WITH model_primary_photo AS (
    SELECT DISTINCT ON (mp.model_id) 
      mp.model_id as photo_model_id,
      mp.file_path as photo_path
    FROM model_photos mp
    WHERE mp.is_approved = TRUE
    ORDER BY mp.model_id, mp.uploaded_at ASC
  )
  SELECT 
    p.id,
    p.username,
    COALESCE(md.showname, p.username),
    mpp.photo_path,
    COUNT(DISTINCT ms.id)::BIGINT,
    COUNT(DISTINCT CASE WHEN sv.id IS NULL AND ms.id IS NOT NULL THEN ms.id END)::BIGINT,
    MAX(ms.created_at),
    JSONB_AGG(
      JSONB_BUILD_OBJECT(
        'id', ms.id,
        'media_type', ms.media_type,
        'media_url', ms.media_url,
        'thumbnail_url', ms.thumbnail_url,
        'caption', ms.caption,
        'duration', COALESCE(ms.duration, 5),
        'created_at', ms.created_at,
        'expires_at', ms.expires_at,
        'views_count', COALESCE(ms.views_count, 0),
        'viewed_by_me', COALESCE(sv.id IS NOT NULL, false)
      ) ORDER BY ms.created_at ASC
    )
  FROM profiles p
  LEFT JOIN model_details md ON md.model_id = p.id
  LEFT JOIN model_primary_photo mpp ON mpp.photo_model_id = p.id
  INNER JOIN model_stories ms ON ms.model_id = p.id
  LEFT JOIN story_views sv ON sv.story_id = ms.id AND sv.viewer_id = auth.uid()
  WHERE p.role = 'model'
    AND p.is_blocked = FALSE
    AND ms.is_active = TRUE 
    AND ms.expires_at > NOW()
  GROUP BY p.id, p.username, md.showname, mpp.photo_path
  HAVING COUNT(ms.id) > 0
  ORDER BY MAX(ms.created_at) DESC;
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION get_active_model_stories() TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_model_stories() TO anon;

-- Test the function
SELECT 'Function updated! Test it:' as message;
SELECT * FROM get_active_model_stories();
