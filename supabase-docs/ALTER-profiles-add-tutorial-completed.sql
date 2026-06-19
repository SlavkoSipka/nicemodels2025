-- Adds a flag that tracks whether a model has seen the interactive onboarding
-- tutorial (driver.js tour). Only genuinely new sign-ups should see it, so we
-- backfill every already-onboarded profile as completed.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tutorial_completed boolean NOT NULL DEFAULT false;

-- Backfill: existing users who already finished onboarding shouldn't get the
-- tour. New registrations keep the default (false) and will see it once.
UPDATE profiles
  SET tutorial_completed = true
  WHERE onboarding_completed = true;
