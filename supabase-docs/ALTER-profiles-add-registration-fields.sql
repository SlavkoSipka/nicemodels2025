-- ============================================================
-- Add phone, date_of_birth, first_name, last_name to profiles
-- + FIX handle_new_user trigger with ALL required columns
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1) Add new columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;

COMMENT ON COLUMN profiles.date_of_birth IS 'Date of birth — required at registration for age verification (18+)';
COMMENT ON COLUMN profiles.first_name IS 'Real first name — optional, only visible to the user themselves';
COMMENT ON COLUMN profiles.last_name IS 'Real last name — optional, only visible to the user themselves';

-- 2) Update the handle_new_user trigger to populate ALL required columns
--    CRITICAL: includes public_id, profile_status, is_verified, is_blocked,
--    is_draft, newsletter_enabled, onboarding_completed + proper enum cast
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO profiles (
    id, email, username, role, phone, date_of_birth,
    profile_status, is_verified, is_blocked, is_draft,
    onboarding_completed, newsletter_enabled,
    public_id,
    created_at, updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')::app_role,
    NEW.raw_user_meta_data->>'phone',
    CASE
      WHEN NEW.raw_user_meta_data->>'date_of_birth' IS NOT NULL
      THEN (NEW.raw_user_meta_data->>'date_of_birth')::date
      ELSE NULL
    END,
    'pending'::profile_status,
    false,
    false,
    false,
    false,
    false,
    nextval('profiles_public_id_seq'),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;

-- 3) Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
