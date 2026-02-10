-- Fix RLS policies for favorites to work properly
-- Users need to view profiles and model_details of models they favorited

-- Allow public to view all profiles (needed for model profiles)
DROP POLICY IF EXISTS "Public can view profiles" ON profiles;
CREATE POLICY "Public can view profiles" 
  ON profiles FOR SELECT
  USING (true);

-- Allow public to view model_details (already should exist but making sure)
DROP POLICY IF EXISTS "allow_view_all" ON model_details;
DROP POLICY IF EXISTS "Public can view model details" ON model_details;
CREATE POLICY "Public can view model details"
  ON model_details FOR SELECT
  USING (true);

-- model_photos already has "Public can view approved photos" policy, so it's fine
