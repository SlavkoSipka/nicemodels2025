-- ============================================================================
-- Fix: infinite recursion detected in policy for relation "discussion_posts"
--
-- Cause: INSERT policy "Logged-in users insert posts on active topics" used
-- EXISTS (SELECT ... FROM discussion_posts ...) in WITH CHECK. That inner
-- SELECT re-applies RLS on discussion_posts and triggers recursion.
--
-- Fix: validate parent row in a SECURITY DEFINER function (runs as owner,
-- bypasses RLS for the inner read). Then reference only the function in policy.
--
-- Run in Supabase SQL Editor once.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.discussion_post_parent_is_valid(
  p_parent_id uuid,
  p_topic_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.discussion_posts pp
    WHERE pp.id = p_parent_id
      AND pp.topic_id = p_topic_id
      AND pp.is_deleted = false
  );
$$;

REVOKE ALL ON FUNCTION public.discussion_post_parent_is_valid(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.discussion_post_parent_is_valid(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.discussion_post_parent_is_valid(uuid, uuid) TO service_role;

DROP POLICY IF EXISTS "Logged-in users insert posts on active topics" ON public.discussion_posts;

CREATE POLICY "Logged-in users insert posts on active topics"
  ON public.discussion_posts FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND COALESCE(p.is_blocked, false) = false
    )
    AND EXISTS (
      SELECT 1 FROM public.discussion_topics t
      WHERE t.id = topic_id AND t.status = 'active'
    )
    AND (
      parent_id IS NULL
      OR public.discussion_post_parent_is_valid(parent_id, topic_id)
    )
  );
