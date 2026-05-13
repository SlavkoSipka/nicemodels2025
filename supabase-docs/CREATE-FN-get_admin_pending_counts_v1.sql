-- Run in Supabase SQL editor. Sidebar badge counts via one round-trip for service-role clients.
CREATE OR REPLACE FUNCTION public.get_admin_pending_counts_v1()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'verifications', (SELECT COUNT(*)::int FROM public.verifications WHERE status = 'pending'),
    'reports', (SELECT COUNT(*)::int FROM public.reports WHERE status = 'pending'),
    'model_photos', (SELECT COUNT(*)::int FROM public.model_photos WHERE is_approved IS DISTINCT FROM true),
    'model_videos', (SELECT COUNT(*)::int FROM public.model_videos WHERE is_approved IS DISTINCT FROM true),
    'club_photos', (SELECT COUNT(*)::int FROM public.club_photos WHERE is_approved IS DISTINCT FROM true),
    'club_videos', (SELECT COUNT(*)::int FROM public.club_videos WHERE is_approved IS DISTINCT FROM true),
    'banners', (SELECT COUNT(*)::int FROM public.banners WHERE status = 'pending'),
    'comments', (SELECT COUNT(*)::int FROM public.model_comments WHERE status = 'approved'),
    'blocked', (SELECT COUNT(*)::int FROM public.profiles WHERE is_blocked IS true)
  );
$$;

REVOKE ALL ON FUNCTION public.get_admin_pending_counts_v1() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_pending_counts_v1() TO service_role;
