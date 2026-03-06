-- ============================================================
-- UPDATE cities table to use Swiss postal code data (PLZ)
-- ============================================================
-- This migration restructures the cities table to hold all
-- Swiss localities with their postal codes, cantons, and
-- coordinates (LV95) for future proximity search.
-- ============================================================

-- 1. Drop old data
DELETE FROM cities;

-- 2. Remove unique constraint on name (same city can have multiple postal codes)
ALTER TABLE cities DROP CONSTRAINT IF EXISTS cities_name_key;

-- 3. Add new columns
ALTER TABLE cities
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS municipality text,
  ADD COLUMN IF NOT EXISTS bfs_nr integer,
  ADD COLUMN IF NOT EXISTS coordinates_e double precision,
  ADD COLUMN IF NOT EXISTS coordinates_n double precision,
  ADD COLUMN IF NOT EXISTS language text;

-- 4. Make display_order optional (no longer primary ordering)
ALTER TABLE cities ALTER COLUMN display_order SET DEFAULT 0;

-- 5. Enable pg_trgm extension (needed for trigram similarity search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 6. Create indexes for fast search
CREATE INDEX IF NOT EXISTS idx_cities_postal_code ON cities (postal_code);
CREATE INDEX IF NOT EXISTS idx_cities_name_lower ON cities (lower(name));
CREATE INDEX IF NOT EXISTS idx_cities_canton ON cities (canton);
CREATE INDEX IF NOT EXISTS idx_cities_name_trgm ON cities USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_cities_postal_prefix ON cities (left(postal_code, 2));

-- Unique: one row per (name, postal_code) combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_cities_name_postal_unique ON cities (name, postal_code);

-- 7. Create a function for nearby cities by postal code prefix
CREATE OR REPLACE FUNCTION get_nearby_cities(target_plz text, radius int DEFAULT 50)
RETURNS SETOF cities AS $$
  SELECT *
  FROM cities
  WHERE is_active = true
    AND postal_code IS NOT NULL
    AND abs(postal_code::int - target_plz::int) <= radius
  ORDER BY abs(postal_code::int - target_plz::int), name
  LIMIT 50;
$$ LANGUAGE sql STABLE;

-- 8. Create a search function for city autocomplete
CREATE OR REPLACE FUNCTION search_cities(query text, max_results int DEFAULT 20)
RETURNS SETOF cities AS $$
BEGIN
  IF query ~ '^\d' THEN
    -- Numeric query: search by postal code
    RETURN QUERY
      SELECT *
      FROM cities
      WHERE is_active = true
        AND postal_code LIKE (query || '%')
      ORDER BY postal_code, name
      LIMIT max_results;
  ELSE
    -- Text query: search by city name
    RETURN QUERY
      SELECT *
      FROM cities
      WHERE is_active = true
        AND name ILIKE (query || '%')
      ORDER BY
        CASE WHEN lower(name) = lower(query) THEN 0 ELSE 1 END,
        name, postal_code
      LIMIT max_results;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- 9. RLS policies (keep existing or add)
-- The cities table should be publicly readable
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cities are publicly readable" ON cities;
CREATE POLICY "Cities are publicly readable"
  ON cities FOR SELECT
  USING (true);
