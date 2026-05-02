-- ============================================================================
-- banners.target_cantons text[] — geographic targeting per banner
-- NULL or empty array = "all of CH" (no targeting); non-empty = explicit list
-- Run in Supabase SQL Editor after banners table exists.
-- ============================================================================

ALTER TABLE public.banners
  ADD COLUMN IF NOT EXISTS target_cantons text[] NULL;

COMMENT ON COLUMN public.banners.target_cantons IS
  'ISO codes of Swiss cantons this banner targets. NULL or empty = all of CH (no targeting).';

-- GIN index makes `target_cantons @> ARRAY['ZH']` and `&&` queries fast on large datasets.
CREATE INDEX IF NOT EXISTS idx_banners_target_cantons
  ON public.banners USING GIN (target_cantons)
  WHERE status = 'active';
