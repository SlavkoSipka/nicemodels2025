-- ============================================
-- LISTING ANALYTICS TABLES
-- Tracks views and contact clicks on job / rent listings
-- ============================================

-- ---------- listing_views ----------
CREATE TABLE IF NOT EXISTS listing_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES job_listings(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  viewer_role text,
  user_agent text,
  ip_address inet,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listing_views_listing_id ON listing_views(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_views_created_at ON listing_views(created_at);
CREATE INDEX IF NOT EXISTS idx_listing_views_listing_created ON listing_views(listing_id, created_at);

ALTER TABLE listing_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_insert_listing_views" ON listing_views;
CREATE POLICY "allow_insert_listing_views" ON listing_views
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "admin_view_listing_views" ON listing_views;
CREATE POLICY "admin_view_listing_views" ON listing_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "owner_view_listing_views" ON listing_views;
CREATE POLICY "owner_view_listing_views" ON listing_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM job_listings jl
      WHERE jl.id = listing_views.listing_id
      AND jl.club_id = auth.uid()
    )
  );


-- ---------- listing_clicks ----------
CREATE TABLE IF NOT EXISTS listing_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES job_listings(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  click_type text NOT NULL CHECK (click_type IN ('phone','sms','email','website','whatsapp','viber','telegram')),
  user_agent text,
  ip_address inet,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listing_clicks_listing_id ON listing_clicks(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_clicks_created_at ON listing_clicks(created_at);
CREATE INDEX IF NOT EXISTS idx_listing_clicks_type ON listing_clicks(click_type);

ALTER TABLE listing_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_insert_listing_clicks" ON listing_clicks;
CREATE POLICY "allow_insert_listing_clicks" ON listing_clicks
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "admin_view_listing_clicks" ON listing_clicks;
CREATE POLICY "admin_view_listing_clicks" ON listing_clicks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "owner_view_listing_clicks" ON listing_clicks;
CREATE POLICY "owner_view_listing_clicks" ON listing_clicks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM job_listings jl
      WHERE jl.id = listing_clicks.listing_id
      AND jl.club_id = auth.uid()
    )
  );

COMMENT ON TABLE listing_views IS 'Tracks page views of job / rent listings';
COMMENT ON TABLE listing_clicks IS 'Tracks contact-button clicks on job / rent listings';
