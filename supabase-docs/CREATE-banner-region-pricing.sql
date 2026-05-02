-- ============================================================================
-- banner_region_pricing — price per (placement, duration_days, region_count)
-- region_count is the NUMBER of cantons targeted (1..27 incl. Liechtenstein)
-- Beta: all rows seeded with price_chf = 0; admin updates later.
-- Run in Supabase SQL Editor after banners table exists.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.banner_region_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placement text NOT NULL CHECK (placement IN ('feed_wide', 'feed_card', 'sidebar_left')),
  duration_days int NOT NULL CHECK (duration_days IN (5, 14, 30)),
  region_count int NOT NULL CHECK (region_count BETWEEN 1 AND 27),
  price_chf decimal(10, 2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (placement, duration_days, region_count)
);

CREATE INDEX IF NOT EXISTS idx_banner_region_pricing_lookup
  ON public.banner_region_pricing (placement, duration_days, region_count)
  WHERE is_active = true;

ALTER TABLE public.banner_region_pricing ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read banner pricing" ON public.banner_region_pricing;
CREATE POLICY "Anyone can read banner pricing"
  ON public.banner_region_pricing FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins manage banner pricing" ON public.banner_region_pricing;
CREATE POLICY "Admins manage banner pricing"
  ON public.banner_region_pricing FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Seed all 3 placements x 3 durations x 27 region counts = 243 rows with price 0.
-- Admin updates the prices later (beta is free anyway).
INSERT INTO public.banner_region_pricing (placement, duration_days, region_count, price_chf)
SELECT placement, duration_days, region_count, 0
FROM (
  SELECT unnest(ARRAY['feed_wide', 'feed_card', 'sidebar_left']::text[]) AS placement
) p
CROSS JOIN (
  SELECT unnest(ARRAY[5, 14, 30]) AS duration_days
) d
CROSS JOIN (
  SELECT generate_series(1, 27) AS region_count
) r
ON CONFLICT (placement, duration_days, region_count) DO NOTHING;
