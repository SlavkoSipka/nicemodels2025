-- ============================================================================
-- USER ALERTS FEATURE – PART 1/3: saved_searches + profiles.is_active + radius RPC
-- ============================================================================
-- Run this in Supabase SQL Editor once.
-- Depends on: cities (with coordinates_e, coordinates_n), profiles, model_details,
--             club_details, job_listings. See supabase-docs/ADD-live-location-fields.sql.
-- ============================================================================

-- 1. profiles.is_active (for "back online" detection)
--    Default TRUE so existing profiles keep working. An active profile means the
--    model/club is currently available; false means paused/offline.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active) WHERE is_active = true;

-- 2. saved_searches table
CREATE TABLE IF NOT EXISTS saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('model', 'club', 'listing')),
  -- JSON criteria. Supported keys (all optional):
  --   city text, region text (canton), origin_city text, radius_km int,
  --   ethnicity text, nationality text, gender text, hair_color text,
  --   services text[], languages text[], age_min int, age_max int,
  --   listing_type text ('job' | 'rent'), club_area text
  criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  last_matched_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_active ON saved_searches(is_active, entity_type) WHERE is_active = true;

ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own saved searches" ON saved_searches;
CREATE POLICY "Users can view own saved searches"
  ON saved_searches FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own saved searches" ON saved_searches;
CREATE POLICY "Users can insert own saved searches"
  ON saved_searches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own saved searches" ON saved_searches;
CREATE POLICY "Users can update own saved searches"
  ON saved_searches FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own saved searches" ON saved_searches;
CREATE POLICY "Users can delete own saved searches"
  ON saved_searches FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Helper function: resolve city name → LV95 coordinates
--    Returns NULL row when city not found.
CREATE OR REPLACE FUNCTION resolve_city_coords(p_city text)
RETURNS TABLE(easting double precision, northing double precision)
LANGUAGE sql STABLE AS $$
  SELECT coordinates_e::double precision, coordinates_n::double precision
  FROM cities
  WHERE name ILIKE p_city
    AND is_active = true
    AND coordinates_e IS NOT NULL
    AND coordinates_n IS NOT NULL
  ORDER BY postal_code NULLS LAST
  LIMIT 1;
$$;

-- 4. Radius search RPC: returns IDs of entities (models/clubs/listings) within
--    p_radius_km of p_origin_city. Distance uses LV95 Euclidean (meters → km).
CREATE OR REPLACE FUNCTION entities_near_origin(
  p_origin_city text,
  p_radius_km int,
  p_entity text
)
RETURNS TABLE(entity_id uuid, distance_km numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  origin_e double precision;
  origin_n double precision;
  radius_m double precision;
BEGIN
  IF p_origin_city IS NULL OR p_radius_km IS NULL OR p_radius_km <= 0 THEN
    RETURN;
  END IF;

  SELECT easting, northing INTO origin_e, origin_n
  FROM resolve_city_coords(p_origin_city);

  IF origin_e IS NULL OR origin_n IS NULL THEN
    RETURN;
  END IF;

  radius_m := p_radius_km * 1000.0;

  IF p_entity = 'model' THEN
    RETURN QUERY
    SELECT DISTINCT md.model_id AS entity_id,
           ROUND((sqrt(power(c.coordinates_e - origin_e, 2) + power(c.coordinates_n - origin_n, 2)) / 1000.0)::numeric, 1) AS distance_km
    FROM model_details md
    JOIN cities c ON c.name ILIKE COALESCE(md.live_location_city, md.city)
      AND c.is_active = true
      AND c.coordinates_e IS NOT NULL
      AND c.coordinates_n IS NOT NULL
    WHERE sqrt(power(c.coordinates_e - origin_e, 2) + power(c.coordinates_n - origin_n, 2)) <= radius_m
    ORDER BY distance_km ASC;

  ELSIF p_entity = 'club' THEN
    RETURN QUERY
    SELECT DISTINCT cd.club_id AS entity_id,
           ROUND((sqrt(power(c.coordinates_e - origin_e, 2) + power(c.coordinates_n - origin_n, 2)) / 1000.0)::numeric, 1) AS distance_km
    FROM club_details cd
    JOIN cities c ON c.name ILIKE cd.city
      AND c.is_active = true
      AND c.coordinates_e IS NOT NULL
      AND c.coordinates_n IS NOT NULL
    WHERE sqrt(power(c.coordinates_e - origin_e, 2) + power(c.coordinates_n - origin_n, 2)) <= radius_m
    ORDER BY distance_km ASC;

  ELSIF p_entity = 'listing' THEN
    RETURN QUERY
    SELECT DISTINCT jl.id AS entity_id,
           ROUND((sqrt(power(c.coordinates_e - origin_e, 2) + power(c.coordinates_n - origin_n, 2)) / 1000.0)::numeric, 1) AS distance_km
    FROM job_listings jl
    JOIN cities c ON c.name ILIKE jl.location
      AND c.is_active = true
      AND c.coordinates_e IS NOT NULL
      AND c.coordinates_n IS NOT NULL
    WHERE jl.status = 'active'
      AND sqrt(power(c.coordinates_e - origin_e, 2) + power(c.coordinates_n - origin_n, 2)) <= radius_m
    ORDER BY distance_km ASC;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION entities_near_origin(text, int, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION resolve_city_coords(text) TO anon, authenticated;

-- 5. Touch trigger: keep updated_at fresh
CREATE OR REPLACE FUNCTION touch_saved_searches_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_saved_searches_updated_at ON saved_searches;
CREATE TRIGGER trg_saved_searches_updated_at
  BEFORE UPDATE ON saved_searches
  FOR EACH ROW EXECUTE FUNCTION touch_saved_searches_updated_at();

SELECT 'Part 1/3: saved_searches + is_active + radius RPC created.' AS status;
