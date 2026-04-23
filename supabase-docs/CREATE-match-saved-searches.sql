-- ============================================================================
-- USER ALERTS FEATURE – PART 2/3: match_saved_searches + entity insert triggers
-- ============================================================================
-- Depends on: supabase-docs/CREATE-saved-searches-and-radius.sql
-- ============================================================================

-- Helper: does an entity match a given criteria JSON? All criteria are optional.
-- Works for model/club/listing (resolve fields per entity_type).
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
           md.hair_color::text, md.age, md.services_for, md.speaks_languages, md.live_location_city
      INTO v_city, v_region, v_ethnicity, v_nationality, v_gender,
           v_hair_color, v_age, v_services, v_languages, v_match_city
    FROM model_details md WHERE md.model_id = p_entity_id;
    -- services join-owa se posebno dole
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

  -- City
  IF p_criteria ? 'city' AND coalesce(p_criteria->>'city','') <> '' THEN
    IF lower(coalesce(v_city,'')) <> lower(p_criteria->>'city') THEN
      RETURN false;
    END IF;
  END IF;

  -- Ethnicity
  IF p_criteria ? 'ethnicity' AND coalesce(p_criteria->>'ethnicity','') <> '' THEN
    IF lower(coalesce(v_ethnicity,'')) <> lower(p_criteria->>'ethnicity') THEN
      RETURN false;
    END IF;
  END IF;

  -- Nationality
  IF p_criteria ? 'nationality' AND coalesce(p_criteria->>'nationality','') <> '' THEN
    IF lower(coalesce(v_nationality,'')) <> lower(p_criteria->>'nationality') THEN
      RETURN false;
    END IF;
  END IF;

  -- Gender
  IF p_criteria ? 'gender' AND coalesce(p_criteria->>'gender','') <> '' THEN
    IF lower(coalesce(v_gender,'')) <> lower(p_criteria->>'gender') THEN
      RETURN false;
    END IF;
  END IF;

  -- Hair color
  IF p_criteria ? 'hair_color' AND coalesce(p_criteria->>'hair_color','') <> '' THEN
    IF lower(coalesce(v_hair_color,'')) <> lower(p_criteria->>'hair_color') THEN
      RETURN false;
    END IF;
  END IF;

  -- Age range
  IF p_criteria ? 'age_min' AND (p_criteria->>'age_min')::int IS NOT NULL THEN
    IF coalesce(v_age, 0) < (p_criteria->>'age_min')::int THEN RETURN false; END IF;
  END IF;
  IF p_criteria ? 'age_max' AND (p_criteria->>'age_max')::int IS NOT NULL THEN
    IF coalesce(v_age, 999) > (p_criteria->>'age_max')::int THEN RETURN false; END IF;
  END IF;

  -- Services: criteria.services must be subset of model_services linked names
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

  -- Languages (stored on model_details.speaks_languages text[])
  IF p_criteria ? 'languages' AND jsonb_array_length(p_criteria->'languages') > 0 THEN
    IF p_entity_type <> 'model' THEN RETURN false; END IF;
    IF NOT (
      SELECT bool_and(lower(want) = ANY(ARRAY(SELECT lower(x) FROM unnest(coalesce(v_languages, ARRAY[]::text[])) x)))
      FROM jsonb_array_elements_text(p_criteria->'languages') want
    ) THEN
      RETURN false;
    END IF;
  END IF;

  -- Listing type (jobs/rent)
  IF p_criteria ? 'listing_type' AND coalesce(p_criteria->>'listing_type','') <> '' THEN
    IF p_entity_type <> 'listing' THEN RETURN false; END IF;
    IF lower(coalesce(v_listing_type,'')) <> lower(p_criteria->>'listing_type') THEN RETURN false; END IF;
  END IF;

  -- Club area
  IF p_criteria ? 'club_area' AND coalesce(p_criteria->>'club_area','') <> '' THEN
    IF p_entity_type <> 'club' THEN RETURN false; END IF;
    IF lower(coalesce(v_club_area,'')) <> lower(p_criteria->>'club_area') THEN RETURN false; END IF;
  END IF;

  -- Radius: origin_city + radius_km. Entity must be within radius of origin.
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

-- Main: for a newly-created entity, iterate all active saved searches of that
-- entity_type, and insert notifications for matching searches. Rate-limit: skip
-- if the same user already got a match_found notification for this exact
-- search+entity in the last 24h.
CREATE OR REPLACE FUNCTION match_saved_searches(
  p_entity_type text,
  p_entity_id uuid
)
RETURNS int
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  r record;
  entity_name text;
  entity_city text;
  notif_url text;
  notif_count int := 0;
BEGIN
  -- Resolve display fields for notification text
  IF p_entity_type = 'model' THEN
    SELECT coalesce(md.showname, p.username), coalesce(md.live_location_city, md.city)
      INTO entity_name, entity_city
    FROM profiles p LEFT JOIN model_details md ON md.model_id = p.id
    WHERE p.id = p_entity_id;
    notif_url := '/models/' || p_entity_id::text;
  ELSIF p_entity_type = 'club' THEN
    SELECT coalesce(cd.display_name, cd.club_name, p.username), cd.city
      INTO entity_name, entity_city
    FROM profiles p LEFT JOIN club_details cd ON cd.club_id = p.id
    WHERE p.id = p_entity_id;
    notif_url := '/clubs/' || p_entity_id::text;
  ELSIF p_entity_type = 'listing' THEN
    SELECT coalesce(jl.title, initcap(jl.listing_type::text) || ' listing'), jl.location
      INTO entity_name, entity_city
    FROM job_listings jl WHERE jl.id = p_entity_id;
    notif_url := '/jobs-rents/' || p_entity_id::text;
  ELSE
    RETURN 0;
  END IF;

  FOR r IN
    SELECT ss.id, ss.user_id, ss.name, ss.criteria
    FROM saved_searches ss
    WHERE ss.is_active = true
      AND ss.entity_type = p_entity_type
  LOOP
    -- rate limit: one notif per (user, search, entity) per 24h
    IF EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.user_id = r.user_id
        AND n.type = 'match_found'
        AND n.related_entity_type = p_entity_type
        AND n.related_entity_id::text = p_entity_id::text
        AND n.created_at > (now() - INTERVAL '24 hours')
    ) THEN
      CONTINUE;
    END IF;

    IF ss_match_entity(p_entity_type, p_entity_id, r.criteria) THEN
      INSERT INTO notifications (user_id, type, title, message, related_entity_type, related_entity_id, action_url)
      VALUES (
        r.user_id,
        'match_found',
        'New ' || p_entity_type || ' matching "' || r.name || '"',
        coalesce(entity_name, 'An item') ||
          CASE WHEN entity_city IS NOT NULL AND entity_city <> '' THEN ' from ' || entity_city ELSE '' END
          || ' just appeared.',
        p_entity_type,
        p_entity_id::text,
        notif_url
      );
      UPDATE saved_searches SET last_matched_at = now() WHERE id = r.id;
      notif_count := notif_count + 1;
    END IF;
  END LOOP;

  RETURN notif_count;
END;
$$;

GRANT EXECUTE ON FUNCTION match_saved_searches(text, uuid) TO authenticated, service_role;

-- Triggers: fire match on new entity creation
CREATE OR REPLACE FUNCTION trg_match_on_model_details_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM match_saved_searches('model', NEW.model_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_saved_searches_match_model ON model_details;
CREATE TRIGGER trg_saved_searches_match_model
  AFTER INSERT ON model_details
  FOR EACH ROW EXECUTE FUNCTION trg_match_on_model_details_insert();

CREATE OR REPLACE FUNCTION trg_match_on_club_details_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM match_saved_searches('club', NEW.club_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_saved_searches_match_club ON club_details;
CREATE TRIGGER trg_saved_searches_match_club
  AFTER INSERT ON club_details
  FOR EACH ROW EXECUTE FUNCTION trg_match_on_club_details_insert();

CREATE OR REPLACE FUNCTION trg_match_on_listing_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'active' THEN
    PERFORM match_saved_searches('listing', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_saved_searches_match_listing ON job_listings;
CREATE TRIGGER trg_saved_searches_match_listing
  AFTER INSERT ON job_listings
  FOR EACH ROW EXECUTE FUNCTION trg_match_on_listing_insert();

-- Preview function (used by "Test search" button): returns counts without inserting notifs.
CREATE OR REPLACE FUNCTION preview_saved_search(
  p_entity_type text,
  p_criteria jsonb
)
RETURNS int
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  total int := 0;
BEGIN
  IF p_entity_type = 'model' THEN
    SELECT count(*) INTO total FROM model_details md
    WHERE ss_match_entity('model', md.model_id, p_criteria);
  ELSIF p_entity_type = 'club' THEN
    SELECT count(*) INTO total FROM club_details cd
    WHERE ss_match_entity('club', cd.club_id, p_criteria);
  ELSIF p_entity_type = 'listing' THEN
    SELECT count(*) INTO total FROM job_listings jl
    WHERE jl.status = 'active'
      AND ss_match_entity('listing', jl.id, p_criteria);
  END IF;
  RETURN coalesce(total, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION preview_saved_search(text, jsonb) TO authenticated;

SELECT 'Part 2/3: match_saved_searches + triggers + preview created.' AS status;
