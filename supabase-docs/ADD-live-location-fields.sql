-- Live Location Feature: Add columns + RPC function
-- Run this migration on your Supabase database

-- 1. Add live location columns to model_details
ALTER TABLE model_details
  ADD COLUMN IF NOT EXISTS share_live_location boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS live_location_city text,
  ADD COLUMN IF NOT EXISTS live_location_postal_code text,
  ADD COLUMN IF NOT EXISTS live_location_updated_at timestamptz;

-- 2. Index for filtering models by live location city on the homepage
CREATE INDEX IF NOT EXISTS idx_model_details_live_location
  ON model_details (live_location_city)
  WHERE share_live_location = true AND live_location_city IS NOT NULL;

-- 3. Function: convert WGS84 lat/lng → nearest Swiss city
--    Uses the official swisstopo approximate formulas (LV95).
CREATE OR REPLACE FUNCTION find_nearest_city_by_wgs84(
  p_lat double precision,
  p_lng double precision
)
RETURNS TABLE(city_name text, city_postal_code text, city_canton text)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  phi   double precision;
  lam   double precision;
  e_val double precision;
  n_val double precision;
BEGIN
  -- Convert WGS84 decimal degrees → auxiliary values (arc seconds / 10 000)
  phi := (p_lat * 3600.0 - 169028.66) / 10000.0;
  lam := (p_lng * 3600.0 - 26782.5)   / 10000.0;

  -- Approximate Swiss LV95 easting / northing
  e_val := 2600072.37
         + 211455.93 * lam
         -  10938.51 * lam * phi
         -      0.36 * lam * phi * phi
         -     44.54 * lam * lam * lam;

  n_val := 1200147.07
         + 308807.95 * phi
         +   3745.25 * lam * lam
         +     76.63 * phi * phi
         -    194.56 * lam * lam * phi
         +    119.79 * phi * phi * phi;

  RETURN QUERY
    SELECT c.name, c.postal_code, c.canton
    FROM cities c
    WHERE c.is_active = true
      AND c.coordinates_e IS NOT NULL
      AND c.coordinates_n IS NOT NULL
    ORDER BY
      ((c.coordinates_e - e_val) * (c.coordinates_e - e_val)
     + (c.coordinates_n - n_val) * (c.coordinates_n - n_val))
    LIMIT 1;
END;
$$;
