-- ============================================================================
-- FIX RLS POLICIES FOR INVITE SYSTEM
-- ============================================================================
-- Purpose: Add RLS policies so clubs can view model profiles and send invites
-- Date: 2026-02-09
-- ============================================================================

-- ============================================================================
-- 1. PROFILES TABLE - Allow viewing model profiles
-- ============================================================================

-- Policy: Allow everyone to view model profiles (public profiles)
DROP POLICY IF EXISTS "Public can view model profiles" ON profiles;
CREATE POLICY "Public can view model profiles"
  ON profiles FOR SELECT
  USING (role = 'model');

-- Policy: Allow authenticated users to view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================================
-- 2. MODEL_DETAILS TABLE - Allow viewing model details
-- ============================================================================

-- Policy: Allow everyone to view model details (public info like showname, city, age)
DROP POLICY IF EXISTS "Public can view model details" ON model_details;
CREATE POLICY "Public can view model details"
  ON model_details FOR SELECT
  USING (true);

-- Policy: Allow models to update their own details
DROP POLICY IF EXISTS "Models can update own details" ON model_details;
CREATE POLICY "Models can update own details"
  ON model_details FOR UPDATE
  USING (auth.uid() = model_id);

-- Policy: Allow models to insert their own details
DROP POLICY IF EXISTS "Models can insert own details" ON model_details;
CREATE POLICY "Models can insert own details"
  ON model_details FOR INSERT
  WITH CHECK (auth.uid() = model_id);

-- ============================================================================
-- 3. CLUB_INVITES TABLE - Enable invite functionality
-- ============================================================================

-- Enable RLS on club_invites (if not already enabled)
ALTER TABLE club_invites ENABLE ROW LEVEL SECURITY;

-- Policy: Clubs can view their own invites
DROP POLICY IF EXISTS "Clubs can view own invites" ON club_invites;
CREATE POLICY "Clubs can view own invites"
  ON club_invites FOR SELECT
  USING (auth.uid() = club_id);

-- Policy: Clubs can create invites
DROP POLICY IF EXISTS "Clubs can create invites" ON club_invites;
CREATE POLICY "Clubs can create invites"
  ON club_invites FOR INSERT
  WITH CHECK (auth.uid() = club_id);

-- Policy: Clubs can cancel their pending invites
DROP POLICY IF EXISTS "Clubs can cancel invites" ON club_invites;
CREATE POLICY "Clubs can cancel invites"
  ON club_invites FOR UPDATE
  USING (auth.uid() = club_id AND status = 'pending')
  WITH CHECK (status = 'cancelled');

-- Policy: Models can view invites sent to them
DROP POLICY IF EXISTS "Models can view their invites" ON club_invites;
CREATE POLICY "Models can view their invites"
  ON club_invites FOR SELECT
  USING (auth.uid() = invited_model_id);

-- Policy: Models can respond to invites (accept/reject)
DROP POLICY IF EXISTS "Models can respond to invites" ON club_invites;
CREATE POLICY "Models can respond to invites"
  ON club_invites FOR UPDATE
  USING (auth.uid() = invited_model_id AND status = 'pending')
  WITH CHECK (status IN ('accepted', 'rejected'));

-- ============================================================================
-- 4. NOTIFICATIONS TABLE - Enable notification functionality
-- ============================================================================

-- Enable RLS on notifications (if not already enabled)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own notifications (mark as read)
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own notifications
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 5. VERIFICATION QUERIES
-- ============================================================================

-- Test if policies are working
-- Run these as a club/company user to verify:
/*
-- Test 1: View model profiles
SELECT 
  id,
  username,
  is_verified
FROM profiles
WHERE role = 'model'
LIMIT 5;

-- Test 2: View model details
SELECT 
  model_id,
  showname,
  city,
  age
FROM model_details
LIMIT 5;

-- Test 3: View your own invites (should work for clubs)
SELECT * FROM club_invites WHERE club_id = auth.uid();

-- Test 4: Create an invite (should work for clubs)
INSERT INTO club_invites (club_id, invited_model_id, message)
VALUES (auth.uid(), 'some-model-uuid', 'Test invite');

-- Test 5: View your notifications (should work for everyone)
SELECT * FROM notifications WHERE user_id = auth.uid();
*/

-- ============================================================================
-- SUMMARY OF CHANGES:
-- ============================================================================
-- 
-- ✅ Anyone can view model profiles (role = 'model')
-- ✅ Anyone can view model_details (public info)
-- ✅ Users can view/update their own profile
-- ✅ Models can insert/update their own details
-- 
-- ✅ Clubs can view their own invites
-- ✅ Clubs can create new invites
-- ✅ Clubs can cancel pending invites
-- ✅ Models can view invites sent to them
-- ✅ Models can accept/reject invites
-- 
-- ✅ Users can view/update/delete their own notifications
-- 
-- This enables the FULL invite system where clubs can:
-- - Search for models ✅
-- - View model details ✅
-- - Send invitations ✅
-- - View pending invites ✅
-- - Cancel invites ✅
-- 
-- And models can:
-- - Receive notifications ✅
-- - View invitations ✅
-- - Accept/reject invitations ✅
-- 
-- ============================================================================
