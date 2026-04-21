-- Add show_phone_on_card to model_contact_details
-- When true, the model's phone number is displayed directly on the listing card
ALTER TABLE model_contact_details
  ADD COLUMN IF NOT EXISTS show_phone_on_card BOOLEAN NOT NULL DEFAULT FALSE;
