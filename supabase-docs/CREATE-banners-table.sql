-- ============================================================
-- banners table — homepage banner ads for clubs and models
-- ============================================================

CREATE TABLE public.banners (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  owner_type text NOT NULL CHECK (owner_type IN ('model', 'club')),
  title text NOT NULL,
  slogan text,
  image_path text,
  logo_path text,
  location text,
  cta_label text DEFAULT 'View Profile',
  cta_url text,
  accent_color text DEFAULT '#EC4899',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'rejected')),
  starts_at timestamp with time zone,
  expires_at timestamp with time zone,
  display_order integer DEFAULT 0,
  placement text NOT NULL DEFAULT 'feed_wide' CHECK (placement IN ('feed_wide', 'feed_card', 'sidebar_left')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT banners_pkey PRIMARY KEY (id),
  CONSTRAINT banners_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id)
);

-- Index for fast homepage queries
CREATE INDEX idx_banners_active ON public.banners (status, starts_at, expires_at)
  WHERE status = 'active';

CREATE UNIQUE INDEX idx_banners_one_active_per_owner_placement
  ON public.banners (owner_id, placement)
  WHERE status = 'active';

-- RLS policies
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Anyone can read active banners (for the homepage)
CREATE POLICY "Anyone can view active banners"
  ON public.banners FOR SELECT
  USING (status = 'active');

-- Owners can view all their own banners
CREATE POLICY "Owners can view own banners"
  ON public.banners FOR SELECT
  USING (auth.uid() = owner_id);

-- Owners can insert their own banners
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

-- Admins can do everything
CREATE POLICY "Admins full access"
  ON public.banners FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Storage bucket for banner images
-- Run this via Supabase dashboard or API:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true);
