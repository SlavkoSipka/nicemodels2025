-- ============================================
-- BANNER ANALYTICS TABLES
-- Tracks impressions and clicks on home-page banner ads
-- ============================================

-- ---------- banner_impressions ----------
CREATE TABLE IF NOT EXISTS banner_impressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  banner_id uuid NOT NULL REFERENCES banners(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  page_path text,
  user_agent text,
  ip_address inet,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_banner_impressions_banner_id ON banner_impressions(banner_id);
CREATE INDEX IF NOT EXISTS idx_banner_impressions_created_at ON banner_impressions(created_at);
CREATE INDEX IF NOT EXISTS idx_banner_impressions_banner_created ON banner_impressions(banner_id, created_at);

ALTER TABLE banner_impressions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_insert_banner_impressions" ON banner_impressions;
CREATE POLICY "allow_insert_banner_impressions" ON banner_impressions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "admin_view_banner_impressions" ON banner_impressions;
CREATE POLICY "admin_view_banner_impressions" ON banner_impressions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "owner_view_banner_impressions" ON banner_impressions;
CREATE POLICY "owner_view_banner_impressions" ON banner_impressions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM banners b
      WHERE b.id = banner_impressions.banner_id
      AND b.owner_id = auth.uid()
    )
  );


-- ---------- banner_clicks ----------
CREATE TABLE IF NOT EXISTS banner_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  banner_id uuid NOT NULL REFERENCES banners(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  click_type text,
  page_path text,
  user_agent text,
  ip_address inet,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_banner_clicks_banner_id ON banner_clicks(banner_id);
CREATE INDEX IF NOT EXISTS idx_banner_clicks_created_at ON banner_clicks(created_at);

ALTER TABLE banner_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_insert_banner_clicks" ON banner_clicks;
CREATE POLICY "allow_insert_banner_clicks" ON banner_clicks
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "admin_view_banner_clicks" ON banner_clicks;
CREATE POLICY "admin_view_banner_clicks" ON banner_clicks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "owner_view_banner_clicks" ON banner_clicks;
CREATE POLICY "owner_view_banner_clicks" ON banner_clicks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM banners b
      WHERE b.id = banner_clicks.banner_id
      AND b.owner_id = auth.uid()
    )
  );

COMMENT ON TABLE banner_impressions IS 'Tracks banner ad impressions';
COMMENT ON TABLE banner_clicks IS 'Tracks banner ad clicks';
