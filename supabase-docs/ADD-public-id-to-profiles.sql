-- Add unique public_id to profiles table
-- This gives every user a short, human-readable, permanent ID

-- 1. Create a sequence starting from 1000
CREATE SEQUENCE IF NOT EXISTS public.profiles_public_id_seq START WITH 1000;

-- 2. Add the column with a default from the sequence
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS public_id INTEGER UNIQUE DEFAULT nextval('public.profiles_public_id_seq');

-- 3. Backfill existing rows that have NULL public_id
UPDATE profiles
SET public_id = nextval('public.profiles_public_id_seq')
WHERE public_id IS NULL;

-- 4. Make it NOT NULL now that all rows have a value
ALTER TABLE profiles ALTER COLUMN public_id SET NOT NULL;

-- 5. Create an index for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_public_id ON profiles (public_id);

-- 6. Allow public read of the column via RLS (profiles table should already have SELECT policies)
-- No extra RLS changes needed since profiles table already allows reads.
