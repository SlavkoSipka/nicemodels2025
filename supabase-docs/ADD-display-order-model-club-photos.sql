-- Manual reorder for profile photos (models + clubs).
-- Run in Supabase SQL Editor after deploy.

ALTER TABLE public.model_photos
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;

ALTER TABLE public.club_photos
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;

-- Preserve previous cover behavior: newest upload first (was ORDER BY uploaded_at DESC).
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY model_id ORDER BY uploaded_at DESC) - 1 AS ord
  FROM public.model_photos
)
UPDATE public.model_photos mp
SET display_order = ranked.ord
FROM ranked WHERE mp.id = ranked.id;

WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY club_id ORDER BY uploaded_at DESC) - 1 AS ord
  FROM public.club_photos
)
UPDATE public.club_photos cp
SET display_order = ranked.ord
FROM ranked WHERE cp.id = ranked.id;

CREATE INDEX IF NOT EXISTS idx_model_photos_model_display_order
  ON public.model_photos (model_id, display_order);

CREATE INDEX IF NOT EXISTS idx_club_photos_club_display_order
  ON public.club_photos (club_id, display_order);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'model_photos' AND policyname = 'Models can update own model_photos'
  ) THEN
    CREATE POLICY "Models can update own model_photos"
      ON public.model_photos FOR UPDATE TO authenticated
      USING (auth.uid() = model_id)
      WITH CHECK (auth.uid() = model_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'club_photos' AND policyname = 'Clubs can update own club_photos'
  ) THEN
    CREATE POLICY "Clubs can update own club_photos"
      ON public.club_photos FOR UPDATE TO authenticated
      USING (auth.uid() = club_id)
      WITH CHECK (auth.uid() = club_id);
  END IF;
END $$;
