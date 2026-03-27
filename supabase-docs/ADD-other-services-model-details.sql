-- Free-text "Other services" for models (dashboard Services tab → bottom field).
-- Run in Supabase SQL Editor after reviewing.

ALTER TABLE model_details
  ADD COLUMN IF NOT EXISTS other_services text;

COMMENT ON COLUMN model_details.other_services IS
  'Optional custom services description entered by the model (plain text).';
