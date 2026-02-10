-- Add user-specific fields to profiles table
-- These fields are for regular users (role='user')

-- Add city/area field
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS city TEXT;

-- Add description/bio field
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add comment for documentation
COMMENT ON COLUMN profiles.city IS 'City/area for user profiles';
COMMENT ON COLUMN profiles.description IS 'User bio/description';
