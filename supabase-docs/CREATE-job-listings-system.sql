-- ============================================================================
-- JOB/RENT LISTINGS SYSTEM - COMPLETE SQL SCRIPT
-- ============================================================================
-- Date: 2026-03-08
-- Purpose: Full SQL setup for club job/rent listing system
--
-- This script includes:
-- 1. Tables (job_listings, job_listing_photos, job_listing_services)
-- 2. Indexes
-- 3. RLS policies
-- 4. Product seeds (job_package)
--
-- Usage:
-- Run this script in Supabase SQL Editor
-- Also create storage bucket 'job-listing-photos' (public, 10MB limit)
-- ============================================================================

-- ============================================================================
-- 1. CREATE TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS job_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_type text NOT NULL DEFAULT 'job',
  title text,
  location text NOT NULL,
  description text NOT NULL,
  country_code text DEFAULT '+41',
  phone_number text,
  has_whatsapp boolean DEFAULT false,
  has_viber boolean DEFAULT false,
  has_telegram boolean DEFAULT false,
  email text,
  website text,
  status text NOT NULL DEFAULT 'active',
  starts_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  CONSTRAINT valid_listing_type CHECK (listing_type IN ('job', 'rent')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'expired', 'deleted'))
);

CREATE TABLE IF NOT EXISTS job_listing_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES job_listings(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text NOT NULL,
  display_order integer DEFAULT 0,
  uploaded_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS job_listing_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES job_listings(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  UNIQUE(listing_id, service_id)
);

-- ============================================================================
-- 2. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_job_listings_club_id ON job_listings(club_id);
CREATE INDEX IF NOT EXISTS idx_job_listings_status ON job_listings(status);
CREATE INDEX IF NOT EXISTS idx_job_listings_type ON job_listings(listing_type);
CREATE INDEX IF NOT EXISTS idx_job_listings_active ON job_listings(status, expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_job_listing_photos_listing ON job_listing_photos(listing_id);
CREATE INDEX IF NOT EXISTS idx_job_listing_services_listing ON job_listing_services(listing_id);

-- ============================================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE job_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_listing_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_listing_services ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. RLS POLICIES - job_listings
-- ============================================================================

CREATE POLICY "Anyone can view active listings"
  ON job_listings FOR SELECT
  USING (status = 'active');

CREATE POLICY "Clubs can view own listings"
  ON job_listings FOR SELECT
  USING (auth.uid() = club_id);

CREATE POLICY "Clubs can create listings"
  ON job_listings FOR INSERT
  WITH CHECK (auth.uid() = club_id);

CREATE POLICY "Clubs can update own listings"
  ON job_listings FOR UPDATE
  USING (auth.uid() = club_id);

CREATE POLICY "Clubs can delete own listings"
  ON job_listings FOR DELETE
  USING (auth.uid() = club_id);

-- ============================================================================
-- 5. RLS POLICIES - job_listing_photos
-- ============================================================================

CREATE POLICY "Anyone can view listing photos"
  ON job_listing_photos FOR SELECT
  USING (true);

CREATE POLICY "Clubs can manage listing photos"
  ON job_listing_photos FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM job_listings WHERE id = listing_id AND club_id = auth.uid())
  );

CREATE POLICY "Clubs can delete listing photos"
  ON job_listing_photos FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM job_listings WHERE id = listing_id AND club_id = auth.uid())
  );

-- ============================================================================
-- 6. RLS POLICIES - job_listing_services
-- ============================================================================

CREATE POLICY "Anyone can view listing services"
  ON job_listing_services FOR SELECT
  USING (true);

CREATE POLICY "Clubs can manage listing services"
  ON job_listing_services FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM job_listings WHERE id = listing_id AND club_id = auth.uid())
  );

CREATE POLICY "Clubs can delete listing services"
  ON job_listing_services FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM job_listings WHERE id = listing_id AND club_id = auth.uid())
  );

-- ============================================================================
-- 7. PRODUCT SEEDS - job_package
-- ============================================================================

-- First extend the product_type check constraint to allow 'job_package'
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_product_type_check;
ALTER TABLE products ADD CONSTRAINT products_product_type_check
  CHECK (product_type IN ('ad_package', 'banner_package', 'job_package'));

INSERT INTO products (product_type, name, description, price_chf, duration_days, duration_hours, discount_percent, banner_type, is_active, display_order)
SELECT * FROM (VALUES
  ('job_package'::text, '7 Days',  'Listing displayed for 7 days',   0::numeric, 7,  168, 0::numeric, NULL::text, true, 1),
  ('job_package'::text, '14 Days', 'Listing displayed for 14 days',  0::numeric, 14, 336, 0::numeric, NULL::text, true, 2),
  ('job_package'::text, '30 Days', 'Listing displayed for 30 days',  0::numeric, 30, 720, 0::numeric, NULL::text, true, 3)
) AS v(product_type, name, description, price_chf, duration_days, duration_hours, discount_percent, banner_type, is_active, display_order)
WHERE NOT EXISTS (
  SELECT 1 FROM products WHERE product_type = 'job_package' AND name = v.name
);

-- ============================================================================
-- 8. STORAGE BUCKET (run manually in Supabase dashboard)
-- ============================================================================
-- Create bucket: job-listing-photos
-- Public: Yes
-- File size limit: 10MB
-- Allowed MIME types: image/jpeg, image/png, image/webp

-- ============================================================================
-- 9. MIGRATION: Add title column (run if table already exists)
-- ============================================================================

ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS title text;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('job_listings', 'job_listing_photos', 'job_listing_services');

SELECT indexname
FROM pg_indexes
WHERE tablename IN ('job_listings', 'job_listing_photos', 'job_listing_services');

SELECT tablename, policyname
FROM pg_policies
WHERE tablename IN ('job_listings', 'job_listing_photos', 'job_listing_services');
