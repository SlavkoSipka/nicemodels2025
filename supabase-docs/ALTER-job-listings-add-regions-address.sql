-- ============================================================================
-- ALTER job_listings: regions[] + address_street/address_number
-- + 3 new job_package products (5 / 14 / 30 days @ 19 / 29 / 39 CHF)
-- ============================================================================

-- 1. Add new columns ----------------------------------------------------------

ALTER TABLE job_listings
  ADD COLUMN IF NOT EXISTS regions text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS address_street text,
  ADD COLUMN IF NOT EXISTS address_number text;

-- GIN index so we can quickly query "any region overlaps with X"
CREATE INDEX IF NOT EXISTS idx_job_listings_regions ON job_listings USING GIN (regions);

-- 2. New listing packages -----------------------------------------------------
-- Replaces / extends the previous beta 'job_package' rows. We use display_order
-- so existing free-beta rows stay below these.

INSERT INTO products (name, description, price_chf, duration_days, duration_hours, product_type, is_active, display_order)
VALUES
  ('5 days',  'Listing visible for 5 days',  19, 5,  0, 'job_package', true, 10),
  ('14 days', 'Listing visible for 14 days', 29, 14, 0, 'job_package', true, 20),
  ('30 days', 'Listing visible for 30 days', 39, 30, 0, 'job_package', true, 30)
ON CONFLICT DO NOTHING;

-- 3. Convenience view for backwards compatibility -----------------------------
-- (none needed — `club_id` already references profiles(id) so any role works)

SELECT 'job_listings: regions + address columns added; 3 packages seeded.' AS status;
