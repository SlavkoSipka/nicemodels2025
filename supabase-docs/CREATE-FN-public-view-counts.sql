-- ============================================================================
-- PUBLIC VIEW-COUNT RPC FUNCTIONS
-- Public users need to see how many times a profile/listing has been viewed,
-- but the underlying analytics tables have restrictive RLS. Expose ONLY the
-- aggregated counts through SECURITY DEFINER functions.
-- ============================================================================

-- ---- Models ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_model_view_counts(model_ids uuid[])
RETURNS TABLE(model_id uuid, view_count bigint)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT model_id, COUNT(*)::bigint AS view_count
  FROM model_statistics
  WHERE action_type = 'profile_view'
    AND model_id = ANY(model_ids)
  GROUP BY model_id;
$$;

REVOKE ALL ON FUNCTION public.get_model_view_counts(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_model_view_counts(uuid[]) TO anon, authenticated;

-- ---- Clubs -----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_club_view_counts(club_ids uuid[])
RETURNS TABLE(club_id uuid, view_count bigint)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT club_id, COUNT(*)::bigint AS view_count
  FROM club_analytics
  WHERE event_type = 'profile_view'
    AND club_id = ANY(club_ids)
  GROUP BY club_id;
$$;

REVOKE ALL ON FUNCTION public.get_club_view_counts(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_club_view_counts(uuid[]) TO anon, authenticated;

-- ---- Job/Rent listings -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_listing_view_counts(listing_ids uuid[])
RETURNS TABLE(listing_id uuid, view_count bigint)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT listing_id, COUNT(*)::bigint AS view_count
  FROM listing_views
  WHERE listing_id = ANY(listing_ids)
  GROUP BY listing_id;
$$;

REVOKE ALL ON FUNCTION public.get_listing_view_counts(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_listing_view_counts(uuid[]) TO anon, authenticated;

COMMENT ON FUNCTION public.get_model_view_counts(uuid[])   IS 'Public: aggregate profile_view counts per model';
COMMENT ON FUNCTION public.get_club_view_counts(uuid[])    IS 'Public: aggregate profile_view counts per club';
COMMENT ON FUNCTION public.get_listing_view_counts(uuid[]) IS 'Public: aggregate view counts per job/rent listing';
