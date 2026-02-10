-- ============================================
-- MODEL STATISTICS TRACKING TABLE
-- Prati sve interakcije korisnika sa profilima modela
-- ============================================

-- Drop existing table if needed
DROP TABLE IF EXISTS model_statistics CASCADE;

-- Create statistics table
CREATE TABLE model_statistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL, -- NULL za anonimne korisnike
  action_type text NOT NULL CHECK (action_type IN ('profile_view', 'contact_view', 'favorite_add', 'share')),
  user_agent text,
  ip_address inet,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_model_stats_model_id ON model_statistics(model_id);
CREATE INDEX idx_model_stats_action_type ON model_statistics(action_type);
CREATE INDEX idx_model_stats_created_at ON model_statistics(created_at);
CREATE INDEX idx_model_stats_model_action ON model_statistics(model_id, action_type);

-- Enable RLS
ALTER TABLE model_statistics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Svi mogu da dodaju statistiku (track akcije)
CREATE POLICY "allow_insert_stats" ON model_statistics
  FOR INSERT WITH CHECK (true);

-- Modeli mogu da vide svoje statistike
CREATE POLICY "model_view_own_stats" ON model_statistics
  FOR SELECT USING (auth.uid() = model_id);

-- Admin može da vidi sve statistike
CREATE POLICY "admin_view_all_stats" ON model_statistics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Kreiranje agregiranih view-ova za brži pristup statistici
CREATE OR REPLACE VIEW model_statistics_summary AS
SELECT 
  model_id,
  COUNT(*) FILTER (WHERE action_type = 'profile_view') as total_profile_views,
  COUNT(*) FILTER (WHERE action_type = 'contact_view') as total_contact_views,
  COUNT(*) FILTER (WHERE action_type = 'favorite_add') as total_favorites,
  COUNT(*) FILTER (WHERE action_type = 'share') as total_shares,
  COUNT(DISTINCT user_id) FILTER (WHERE action_type = 'profile_view') as unique_profile_views,
  MAX(created_at) FILTER (WHERE action_type = 'profile_view') as last_profile_view,
  MAX(created_at) as last_activity
FROM model_statistics
GROUP BY model_id;

-- View za dnevnu statistiku (zadnjih 30 dana)
CREATE OR REPLACE VIEW model_statistics_daily AS
SELECT 
  model_id,
  DATE(created_at) as date,
  COUNT(*) FILTER (WHERE action_type = 'profile_view') as profile_views,
  COUNT(*) FILTER (WHERE action_type = 'contact_view') as contact_views,
  COUNT(*) FILTER (WHERE action_type = 'favorite_add') as favorites,
  COUNT(*) FILTER (WHERE action_type = 'share') as shares,
  COUNT(DISTINCT user_id) as unique_visitors
FROM model_statistics
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY model_id, DATE(created_at)
ORDER BY date DESC;

-- Funkcija za tracking akcija (opcionalno, može se koristiti preko direktnog INSERT-a)
CREATE OR REPLACE FUNCTION track_model_action(
  p_model_id uuid,
  p_action_type text,
  p_user_id uuid DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_ip_address inet DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_stat_id uuid;
BEGIN
  INSERT INTO model_statistics (
    model_id,
    user_id,
    action_type,
    user_agent,
    ip_address
  ) VALUES (
    p_model_id,
    p_user_id,
    p_action_type,
    p_user_agent,
    p_ip_address
  ) RETURNING id INTO v_stat_id;
  
  RETURN v_stat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Testiranje
-- INSERT INTO model_statistics (model_id, action_type) 
-- SELECT id, 'profile_view' FROM profiles WHERE role = 'model' LIMIT 1;

COMMENT ON TABLE model_statistics IS 'Tracks all user interactions with model profiles';
COMMENT ON COLUMN model_statistics.action_type IS 'Types: profile_view, contact_view, favorite_add, share';
