-- ============================================
-- PAGE VIEWS TABLE
-- Global site-wide page view tracking
-- ============================================

CREATE TABLE IF NOT EXISTS page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  viewer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  viewer_role text,
  session_id text,
  referrer text,
  user_agent text,
  ip_address inet,
  country text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(path);
CREATE INDEX IF NOT EXISTS idx_page_views_viewer ON page_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_page_views_session ON page_views(session_id);

ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Inserts happen exclusively through the /api/track/event endpoint which
-- uses the service role, so we deliberately do NOT add a public insert
-- policy. This prevents anonymous flooding of the table.

DROP POLICY IF EXISTS "admin_view_page_views" ON page_views;
CREATE POLICY "admin_view_page_views" ON page_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

COMMENT ON TABLE page_views IS 'Global site-wide page view log. Written only by the server through /api/track/event.';
