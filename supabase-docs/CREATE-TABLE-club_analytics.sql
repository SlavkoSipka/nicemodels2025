-- =============================================
-- TABLE: club_analytics
-- =============================================
-- Tracks club profile views and contact clicks

CREATE TABLE IF NOT EXISTS club_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('profile_view', 'contact_click')),
  viewer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  viewer_role text CHECK (viewer_role IN ('authenticated', 'guest')),
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_club_analytics_club_id ON club_analytics(club_id);
CREATE INDEX IF NOT EXISTS idx_club_analytics_event_type ON club_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_club_analytics_created_at ON club_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_club_analytics_viewer_id ON club_analytics(viewer_id);

-- Enable Row Level Security
ALTER TABLE club_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for club_analytics

-- Anyone can insert analytics (for tracking)
CREATE POLICY "Anyone can insert analytics"
  ON club_analytics FOR INSERT
  WITH CHECK (true);

-- Club owners can view their own analytics
CREATE POLICY "Club owners can view own analytics"
  ON club_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() 
      AND profiles.id = club_analytics.club_id
    )
  );

-- Admins can view all analytics
CREATE POLICY "Admins can view all analytics"
  ON club_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Add comments for documentation
COMMENT ON TABLE club_analytics IS 'Analytics tracking for club profiles - views and contact clicks';
COMMENT ON COLUMN club_analytics.club_id IS 'Club profile being tracked';
COMMENT ON COLUMN club_analytics.event_type IS 'Type of event: profile_view or contact_click';
COMMENT ON COLUMN club_analytics.viewer_id IS 'User who triggered the event (null for guests)';
COMMENT ON COLUMN club_analytics.viewer_role IS 'Role of viewer: authenticated or guest';
