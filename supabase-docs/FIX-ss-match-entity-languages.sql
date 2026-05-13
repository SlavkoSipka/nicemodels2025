-- ============================================================================
-- FIX: ss_match_entity references non-existent column model_details.speaks_languages
-- ============================================================================
-- Symptom: New model registration fails with:
--   ERROR: column md.speaks_languages does not exist
-- Cause:   AFTER INSERT trigger on model_details calls ss_match_entity(),
--          which SELECTs md.speaks_languages. That column never existed;
--          languages are stored in the join table public.model_languages.
-- Fix:     Replace md.speaks_languages with an aggregate subquery against
--          model_languages. Behavior of language matching is preserved.
-- ============================================================================

CREATE OR REPLACE FUNCTION ss_match_entity(
  p_entity_type text,
  p_entity_id uuid,
  p_criteria jsonb
)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  v_city text;
  v_region text;
  v_ethnicity text;
  v_nationality text;
  v_gender text;
  v_hair_color text;
  v_age int;
  v_services text[];
  v_languages text[];
  v_listing_type text;
  v_club_area text;
  v_origin text;
  v_radius int;
  v_match_city text;
BEGIN
  IF p_criteria IS NULL OR p_criteria = '{}'::jsonb THEN
    RETURN true;
  END IF;

  IF p_entity_type = 'model' THEN
    SELECT md.city, NULL::text, md.ethnicity::text, md.nationality, md.gender::text,
           md.hair_color::text, md.age, md.services_for,
           (SELECT array_agg(ml.language) FROM model_languages ml WHERE ml.model_id = md.model_id),
           md.live_location_city
      INTO v_city, v_region, v_ethnicity, v_nationality, v_gender,
           v_hair_color, v_age, v_services, v_languages, v_match_city
    FROM model_details md WHERE md.model_id = p_entity_id;
  ELSIF p_entity_type = 'club' THEN
    SELECT cd.city, NULL::text, NULL::text, NULL::text, NULL::text,
           NULL::text, NULL::int, NULL::text[], NULL::text[], cd.area
      INTO v_city, v_region, v_ethnicity, v_nationality, v_gender,
           v_hair_color, v_age, v_services, v_languages, v_club_area
    FROM club_details cd WHERE cd.club_id = p_entity_id;
  ELSIF p_entity_type = 'listing' THEN
    SELECT jl.location, NULL::text, NULL::text, NULL::text, NULL::text,
           NULL::text, NULL::int, NULL::text[], NULL::text[], jl.listing_type
      INTO v_city, v_region, v_ethnicity, v_nationality, v_gender,
           v_hair_color, v_age, v_services, v_languages, v_listing_type
    FROM job_listings jl WHERE jl.id = p_entity_id;
  ELSE
    RETURN false;
  END IF;

  IF p_criteria ? 'city' AND coalesce(p_criteria->>'city','') <> '' THEN
    IF lower(coalesce(v_city,'')) <> lower(p_criteria->>'city') THEN
      RETURN false;
    END IF;
  END IF;

  IF p_criteria ? 'ethnicity' AND coalesce(p_criteria->>'ethnicity','') <> '' THEN
    IF lower(coalesce(v_ethnicity,'')) <> lower(p_criteria->>'ethnicity') THEN
      RETURN false;
    END IF;
  END IF;

  IF p_criteria ? 'nationality' AND coalesce(p_criteria->>'nationality','') <> '' THEN
    IF lower(coalesce(v_nationality,'')) <> lower(p_criteria->>'nationality') THEN
      RETURN false;
    END IF;
  END IF;

  IF p_criteria ? 'gender' AND coalesce(p_criteria->>'gender','') <> '' THEN
    IF lower(coalesce(v_gender,'')) <> lower(p_criteria->>'gender') THEN
      RETURN false;
    END IF;
  END IF;

  IF p_criteria ? 'hair_color' AND coalesce(p_criteria->>'hair_color','') <> '' THEN
    IF lower(coalesce(v_hair_color,'')) <> lower(p_criteria->>'hair_color') THEN
      RETURN false;
    END IF;
  END IF;

  IF p_criteria ? 'age_min' AND (p_criteria->>'age_min')::int IS NOT NULL THEN
    IF coalesce(v_age, 0) < (p_criteria->>'age_min')::int THEN RETURN false; END IF;
  END IF;
  IF p_criteria ? 'age_max' AND (p_criteria->>'age_max')::int IS NOT NULL THEN
    IF coalesce(v_age, 999) > (p_criteria->>'age_max')::int THEN RETURN false; END IF;
  END IF;

  IF p_criteria ? 'services' AND jsonb_array_length(p_criteria->'services') > 0 THEN
    IF p_entity_type <> 'model' THEN RETURN false; END IF;
    IF NOT EXISTS (
      SELECT 1
      FROM (SELECT jsonb_array_elements_text(p_criteria->'services') AS want) w
      WHERE EXISTS (
        SELECT 1 FROM model_services ms
        JOIN services s ON s.id = ms.service_id
        WHERE ms.model_id = p_entity_id AND lower(s.name) = lower(w.want)
      )
      HAVING count(*) = jsonb_array_length(p_criteria->'services')
    ) THEN
      RETURN false;
    END IF;
  END IF;

  -- Languages (stored in model_languages join table; aggregated into v_languages above)
  IF p_criteria ? 'languages' AND jsonb_array_length(p_criteria->'languages') > 0 THEN
    IF p_entity_type <> 'model' THEN RETURN false; END IF;
    IF NOT (
      SELECT bool_and(lower(want) = ANY(ARRAY(SELECT lower(x) FROM unnest(coalesce(v_languages, ARRAY[]::text[])) x)))
      FROM jsonb_array_elements_text(p_criteria->'languages') want
    ) THEN
      RETURN false;
    END IF;
  END IF;

  IF p_criteria ? 'listing_type' AND coalesce(p_criteria->>'listing_type','') <> '' THEN
    IF p_entity_type <> 'listing' THEN RETURN false; END IF;
    IF lower(coalesce(v_listing_type,'')) <> lower(p_criteria->>'listing_type') THEN RETURN false; END IF;
  END IF;

  IF p_criteria ? 'club_area' AND coalesce(p_criteria->>'club_area','') <> '' THEN
    IF p_entity_type <> 'club' THEN RETURN false; END IF;
    IF lower(coalesce(v_club_area,'')) <> lower(p_criteria->>'club_area') THEN RETURN false; END IF;
  END IF;

  v_origin := coalesce(p_criteria->>'origin_city', '');
  v_radius := NULLIF(p_criteria->>'radius_km','')::int;
  IF v_origin <> '' AND v_radius IS NOT NULL AND v_radius > 0 THEN
    IF NOT EXISTS (
      SELECT 1 FROM entities_near_origin(v_origin, v_radius, p_entity_type)
      WHERE entity_id = p_entity_id
    ) THEN
      RETURN false;
    END IF;
  END IF;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION ss_match_entity(text, uuid, jsonb) TO authenticated, service_role;

SELECT 'FIX applied: ss_match_entity now reads languages from model_languages.' AS status;
