-- ============================================================================
-- banners.placement — feed_wide | feed_card | sidebar_left
-- One active banner per owner per placement (partial unique index).
-- Run in Supabase SQL Editor after banners table exists.
-- ============================================================================

ALTER TABLE public.banners
  ADD COLUMN IF NOT EXISTS placement text NOT NULL DEFAULT 'feed_wide';

ALTER TABLE public.banners
  DROP CONSTRAINT IF EXISTS banners_placement_check;

ALTER TABLE public.banners
  ADD CONSTRAINT banners_placement_check
  CHECK (placement IN ('feed_wide', 'feed_card', 'sidebar_left'));

COMMENT ON COLUMN public.banners.placement IS 'Where the banner renders: wide row in feed, single grid cell, or left rail';

-- At most one active row per (owner_id, placement)
CREATE UNIQUE INDEX IF NOT EXISTS idx_banners_one_active_per_owner_placement
  ON public.banners (owner_id, placement)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_banners_placement_active
  ON public.banners (placement, status)
  WHERE status = 'active';
