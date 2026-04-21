-- Add address fields to model_details
ALTER TABLE model_details
  ADD COLUMN IF NOT EXISTS zip_code   TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS street     TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS street_number TEXT DEFAULT NULL;
