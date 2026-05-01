-- =============================================================================
-- Add unified `contact_methods` array to club_contact_details
-- =============================================================================
-- Allowed values: 'call', 'sms', 'whatsapp', 'viber', 'telegram', 'email'
-- A club selects which channels are publicly clickable. If empty, the public
-- profile falls back to a heuristic (legacy fields) for backward compatibility.
-- =============================================================================

ALTER TABLE club_contact_details
  ADD COLUMN IF NOT EXISTS contact_methods text[] NOT NULL DEFAULT '{}';

-- One-time backfill: derive existing rows from legacy flags so nothing breaks.
UPDATE club_contact_details
SET contact_methods = ARRAY(
  SELECT DISTINCT m FROM unnest(ARRAY[
    CASE WHEN contact_instruction IN ('sms_and_call', 'call_only')
              AND coalesce(phone_number, '') <> '' THEN 'call' END,
    CASE WHEN contact_instruction IN ('sms_and_call', 'sms_only')
              AND coalesce(phone_number, '') <> '' THEN 'sms' END,
    CASE WHEN has_whatsapp AND coalesce(phone_number, '') <> '' THEN 'whatsapp' END,
    CASE WHEN has_viber    AND coalesce(phone_number, '') <> '' THEN 'viber'    END,
    CASE WHEN has_telegram AND coalesce(phone_number, '') <> '' THEN 'telegram' END,
    CASE WHEN coalesce(email, '') <> '' THEN 'email' END
  ]) AS m
  WHERE m IS NOT NULL
)
WHERE coalesce(array_length(contact_methods, 1), 0) = 0;

CREATE INDEX IF NOT EXISTS idx_club_contact_methods
  ON club_contact_details USING GIN (contact_methods);

COMMENT ON COLUMN club_contact_details.contact_methods IS
  'Channels the club allows publicly: call, sms, whatsapp, viber, telegram, email';
