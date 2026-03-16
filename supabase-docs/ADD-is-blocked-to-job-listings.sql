-- Add is_blocked column to job_listings
-- Run this in Supabase SQL Editor

ALTER TABLE job_listings
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_job_listings_is_blocked ON job_listings (is_blocked);
