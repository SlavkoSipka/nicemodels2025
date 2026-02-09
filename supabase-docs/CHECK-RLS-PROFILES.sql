-- ============================================================================
-- CHECK RLS POLICIES FOR PROFILES AND MODEL_DETAILS
-- ============================================================================
-- Purpose: Check if RLS policies are blocking clubs from viewing models
-- ============================================================================

-- 1. Check if RLS is enabled on profiles
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ RLS Enabled'
    ELSE '❌ RLS Disabled'
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'model_details');

-- 2. Check all policies on profiles table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 3. Check all policies on model_details table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'model_details'
ORDER BY policyname;

-- ============================================================================
-- EXPECTED BEHAVIOR FOR INVITE SYSTEM:
-- ============================================================================
-- 
-- Clubs (companies) should be able to:
-- 1. SELECT from profiles WHERE role = 'model' (to search for models)
-- 2. SELECT from model_details (to get model details like showname, city, age)
--
-- If no such policy exists, we need to add:
--
-- CREATE POLICY "Companies can view model profiles"
--   ON profiles FOR SELECT
--   USING (role = 'model');
--
-- CREATE POLICY "Companies can view model details"
--   ON model_details FOR SELECT
--   USING (true);
--
-- ============================================================================
