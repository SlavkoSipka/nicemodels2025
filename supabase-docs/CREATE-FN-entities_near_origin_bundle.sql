-- Single round-trip counts for dashboard "In your area" (models / clubs / listings).
CREATE OR REPLACE FUNCTION entities_near_origin_bundle(
  p_origin_city text,
  p_radius_km int
)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  origin_e double precision;
  origin_n double precision;
  radius_m double precision;
  model_count int;
  club_count int;
  listing_count int;
BEGIN
  IF p_origin_city IS NULL OR p_radius_km IS NULL OR p_radius_km <= 0 THEN
    RETURN jsonb_build_object('models', 0, 'clubs', 0, 'listings', 0);
  END IF;

  SELECT easting, northing INTO origin_e, origin_n
  FROM resolve_city_coords(p_origin_city);

  IF origin_e IS NULL OR origin_n IS NULL THEN
    RETURN jsonb_build_object('models', 0, 'clubs', 0, 'listings', 0);
  END IF;

  radius_m := p_radius_km * 1000.0;

  SELECT COUNT(*)::int INTO model_count FROM (
    SELECT DISTINCT md.model_id
    FROM model_details md
    JOIN cities c ON c.name ILIKE COALESCE(md.live_location_city, md.city)
      AND c.is_active = true
      AND c.coordinates_e IS NOT NULL
      AND c.coordinates_n IS NOT NULL
    WHERE sqrt(power(c.coordinates_e - origin_e, 2) + power(c.coordinates_n - origin_n, 2)) <= radius_m
  ) q;

  SELECT COUNT(*)::int INTO club_count FROM (
    SELECT DISTINCT cd.club_id
    FROM club_details cd
    JOIN cities c ON c.name ILIKE cd.city
      AND c.is_active = true
      AND c.coordinates_e IS NOT NULL
      AND c.coordinates_n IS NOT NULL
    WHERE sqrt(power(c.coordinates_e - origin_e, 2) + power(c.coordinates_n - origin_n, 2)) <= radius_m
  ) q;

  SELECT COUNT(*)::int INTO listing_count FROM (
    SELECT DISTINCT jl.id
    FROM job_listings jl
    JOIN cities c ON c.name ILIKE jl.location
      AND c.is_active = true
      AND c.coordinates_e IS NOT NULL
      AND c.coordinates_n IS NOT NULL
    WHERE jl.status = 'active'
      AND sqrt(power(c.coordinates_e - origin_e, 2) + power(c.coordinates_n - origin_n, 2)) <= radius_m
  ) q;

  RETURN jsonb_build_object(
    'models', COALESCE(model_count, 0),
    'clubs', COALESCE(club_count, 0),
    'listings', COALESCE(listing_count, 0)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION entities_near_origin_bundle(text, int) TO anon, authenticated;
