-- ============================================================================
-- QUICK CHECK - Invite System Setup Verification
-- ============================================================================
-- Purpose: Verify that all components of the invite system are properly set up
-- Usage: Run this in Supabase SQL Editor after applying INVITE-SYSTEM-SQL-COMPLETE.sql
-- ============================================================================

-- ============================================================================
-- 1. CHECK TABLES
-- ============================================================================

SELECT 
  '✅ Tables Check' as check_category,
  COUNT(*) as found,
  'Should be 2 (club_invites, notifications)' as expected
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('club_invites', 'notifications');

-- Detailed table check
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('club_invites', 'notifications') THEN '✅ Found'
    ELSE '❌ Missing'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('club_invites', 'notifications');

-- ============================================================================
-- 2. CHECK COLUMNS - club_invites
-- ============================================================================

SELECT 
  '✅ club_invites Columns' as check_category,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'club_invites'
ORDER BY ordinal_position;

-- ============================================================================
-- 3. CHECK COLUMNS - notifications
-- ============================================================================

SELECT 
  '✅ notifications Columns' as check_category,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'notifications'
ORDER BY ordinal_position;

-- ============================================================================
-- 4. CHECK INDEXES
-- ============================================================================

SELECT 
  '✅ Indexes Check' as check_category,
  COUNT(*) as found,
  'Should be 6 indexes total' as expected
FROM pg_indexes 
WHERE tablename IN ('club_invites', 'notifications')
AND schemaname = 'public';

-- Detailed index check
SELECT 
  tablename,
  indexname,
  '✅ Found' as status
FROM pg_indexes 
WHERE tablename IN ('club_invites', 'notifications')
AND schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================================================
-- 5. CHECK RLS (Row Level Security)
-- ============================================================================

SELECT 
  '✅ RLS Check' as check_category,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ Enabled'
    ELSE '❌ Disabled'
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('club_invites', 'notifications');

-- ============================================================================
-- 6. CHECK POLICIES
-- ============================================================================

SELECT 
  '✅ Policies Check' as check_category,
  COUNT(*) as found,
  'Should be 9 policies total (6 for club_invites, 3 for notifications)' as expected
FROM pg_policies 
WHERE tablename IN ('club_invites', 'notifications')
AND schemaname = 'public';

-- Detailed policies check
SELECT 
  tablename,
  policyname,
  cmd as command,
  '✅ Found' as status
FROM pg_policies 
WHERE tablename IN ('club_invites', 'notifications')
AND schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- 7. CHECK TRIGGER
-- ============================================================================

SELECT 
  '✅ Trigger Check' as check_category,
  trigger_name,
  event_manipulation,
  event_object_table,
  '✅ Found' as status
FROM information_schema.triggers
WHERE trigger_name = 'on_club_invite_created';

-- ============================================================================
-- 8. CHECK FUNCTION
-- ============================================================================

SELECT 
  '✅ Function Check' as check_category,
  routine_name,
  routine_type,
  '✅ Found' as status
FROM information_schema.routines
WHERE routine_name = 'notify_model_on_invite'
AND routine_schema = 'public';

-- ============================================================================
-- 9. CHECK CONSTRAINTS
-- ============================================================================

SELECT 
  '✅ Constraints Check' as check_category,
  constraint_name,
  constraint_type,
  '✅ Found' as status
FROM information_schema.table_constraints
WHERE table_name IN ('club_invites', 'notifications')
AND table_schema = 'public'
ORDER BY table_name, constraint_type;

-- ============================================================================
-- 10. CHECK FOREIGN KEYS
-- ============================================================================

SELECT 
  '✅ Foreign Keys Check' as check_category,
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  '✅ Found' as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('club_invites', 'notifications')
ORDER BY tc.table_name;

-- ============================================================================
-- 11. SAMPLE DATA COUNT (if any)
-- ============================================================================

SELECT 
  '📊 Data Count' as info,
  'club_invites' as table_name,
  COUNT(*) as record_count
FROM club_invites

UNION ALL

SELECT 
  '📊 Data Count' as info,
  'notifications' as table_name,
  COUNT(*) as record_count
FROM notifications;

-- ============================================================================
-- 12. SUMMARY CHECK
-- ============================================================================

SELECT 
  '📋 SUMMARY' as section,
  'All components checked above' as status,
  'Review results for any ❌ marks' as note;

-- ============================================================================
-- EXPECTED RESULTS:
-- ============================================================================
-- 
-- ✅ Tables: 2 (club_invites, notifications)
-- ✅ Indexes: 6 total
-- ✅ RLS: Both tables should have RLS enabled
-- ✅ Policies: 9 total (6 for club_invites, 3 for notifications)
-- ✅ Trigger: 1 (on_club_invite_created)
-- ✅ Function: 1 (notify_model_on_invite)
-- ✅ Constraints: Multiple (PRIMARY KEY, FOREIGN KEY, CHECK)
-- 
-- If all checks show ✅, the invite system is correctly set up!
-- ============================================================================
