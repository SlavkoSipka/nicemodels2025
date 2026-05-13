-- =============================================================================
-- Add `hide_contact_info` boolean to club_contact_details
-- =============================================================================
-- When true, contact info (phone, email, website, messengers) is hidden on the
-- public club profile. Defaults to false to preserve existing behavior.
-- =============================================================================

ALTER TABLE club_contact_details
  ADD COLUMN IF NOT EXISTS hide_contact_info boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN club_contact_details.hide_contact_info IS
  'When true, contact info is hidden on the public club profile.';
