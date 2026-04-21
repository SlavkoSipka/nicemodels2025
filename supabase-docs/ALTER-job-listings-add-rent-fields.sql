-- ============================================================================
-- RENT LISTING FIELDS - ALTER job_listings
-- ============================================================================
-- Date: 2026-04-16
-- Purpose: Add rent-specific columns to job_listings table
--
-- These columns are nullable — only relevant when listing_type = 'rent'.
-- Job listings ignore them.
-- ============================================================================

-- Pricing (per day / week / month)
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS rent_price_daily   NUMERIC(10,2);
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS rent_price_weekly  NUMERIC(10,2);
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS rent_price_monthly NUMERIC(10,2);

-- Room / space amenities (booleans, default false)
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS rent_work_permit      BOOLEAN DEFAULT false;
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS rent_room_size        TEXT;
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS rent_furnished        BOOLEAN DEFAULT false;
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS rent_kitchen          BOOLEAN DEFAULT false;
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS rent_bathroom         BOOLEAN DEFAULT false;
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS rent_air_conditioning BOOLEAN DEFAULT false;
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS rent_towels           BOOLEAN DEFAULT false;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'job_listings'
  AND column_name LIKE 'rent_%'
ORDER BY ordinal_position;
