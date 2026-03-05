-- Run this in Supabase SQL editor if the banners table already exists.
-- Adds admin full-access policy and updates existing policies.

-- Drop and recreate policies to avoid duplicates
DROP POLICY IF EXISTS "Anyone can view active banners" ON public.banners;
DROP POLICY IF EXISTS "Owners can view own banners" ON public.banners;
DROP POLICY IF EXISTS "Owners can create banners" ON public.banners;
DROP POLICY IF EXISTS "Owners can update own banners" ON public.banners;
DROP POLICY IF EXISTS "Owners can delete own banners" ON public.banners;
DROP POLICY IF EXISTS "Admins full access" ON public.banners;

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Homepage: anyone can read active banners
CREATE POLICY "Anyone can view active banners"
  ON public.banners FOR SELECT
  USING (status = 'active');

-- Owners can view all their own banners
CREATE POLICY "Owners can view own banners"
  ON public.banners FOR SELECT
  USING (auth.uid() = owner_id);

-- Owners can create banners
CREATE POLICY "Owners can create banners"
  ON public.banners FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Owners can update their own banners
CREATE POLICY "Owners can update own banners"
  ON public.banners FOR UPDATE
  USING (auth.uid() = owner_id);

-- Owners can delete their own banners
CREATE POLICY "Owners can delete own banners"
  ON public.banners FOR DELETE
  USING (auth.uid() = owner_id);

-- Admins have full access
CREATE POLICY "Admins full access"
  ON public.banners FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Index for fast homepage queries (skip if already exists)
CREATE INDEX IF NOT EXISTS idx_banners_active
  ON public.banners (status, starts_at, expires_at)
  WHERE status = 'active';
