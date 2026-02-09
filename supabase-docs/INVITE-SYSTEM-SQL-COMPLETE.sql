-- ============================================================================
-- CLUB-MODEL INVITE SYSTEM - COMPLETE SQL SCRIPT
-- ============================================================================
-- Date: 2026-02-09
-- Purpose: Full SQL setup for club-model invite system with notifications
-- 
-- This script includes:
-- 1. Tables creation (club_invites, notifications)
-- 2. Indexes for performance
-- 3. RLS policies
-- 4. Trigger function for automatic notifications
-- 5. Trigger setup
--
-- Usage:
-- Run this script in Supabase SQL Editor to set up the complete system
-- ============================================================================

-- ============================================================================
-- 1. CREATE TABLES
-- ============================================================================

-- Table: club_invites
-- Stores all invitations from clubs to models
CREATE TABLE IF NOT EXISTS club_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invited_model_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  message text,
  invited_at timestamp with time zone NOT NULL DEFAULT now(),
  responded_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_status CHECK (
    status IN ('pending', 'accepted', 'rejected', 'cancelled')
  )
);

-- Table: notifications
-- Generic notification system for all user notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  related_entity_type text,
  related_entity_id uuid,
  action_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  read_at timestamp with time zone
);

-- ============================================================================
-- 2. CREATE INDEXES
-- ============================================================================

-- Indexes for club_invites
CREATE INDEX IF NOT EXISTS idx_club_invites_club_id ON club_invites(club_id);
CREATE INDEX IF NOT EXISTS idx_club_invites_model_id ON club_invites(invited_model_id);
CREATE INDEX IF NOT EXISTS idx_club_invites_status ON club_invites(status);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) 
  WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- ============================================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE club_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. RLS POLICIES - club_invites
-- ============================================================================

-- Policy: Clubs can view their own invites
CREATE POLICY "Clubs can view own invites"
  ON club_invites FOR SELECT
  USING (auth.uid() = club_id);

-- Policy: Clubs can create invites
CREATE POLICY "Clubs can create invites"
  ON club_invites FOR INSERT
  WITH CHECK (auth.uid() = club_id);

-- Policy: Clubs can cancel their pending invites
CREATE POLICY "Clubs can cancel invites"
  ON club_invites FOR UPDATE
  USING (auth.uid() = club_id AND status = 'pending')
  WITH CHECK (status = 'cancelled');

-- Policy: Models can view invites sent to them
CREATE POLICY "Models can view their invites"
  ON club_invites FOR SELECT
  USING (auth.uid() = invited_model_id);

-- Policy: Models can respond to invites (accept/reject)
CREATE POLICY "Models can respond to invites"
  ON club_invites FOR UPDATE
  USING (auth.uid() = invited_model_id AND status = 'pending')
  WITH CHECK (status IN ('accepted', 'rejected'));

-- ============================================================================
-- 5. RLS POLICIES - notifications
-- ============================================================================

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 6. TRIGGER FUNCTION - Auto-create notification on invite
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_model_on_invite()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for the invited model
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    related_entity_type,
    related_entity_id,
    action_url
  )
  SELECT
    NEW.invited_model_id,
    'club_invite',
    'New Club Invitation',
    'You have received an invitation from ' || 
      COALESCE(
        (SELECT display_name FROM club_details WHERE club_id = NEW.club_id),
        (SELECT club_name FROM club_details WHERE club_id = NEW.club_id),
        'a club'
      ),
    'club_invite',
    NEW.id,
    '/dashboard/model/invites'
  WHERE NEW.invited_model_id IS NOT NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. CREATE TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS on_club_invite_created ON club_invites;

CREATE TRIGGER on_club_invite_created
  AFTER INSERT ON club_invites
  FOR EACH ROW
  EXECUTE FUNCTION notify_model_on_invite();

-- ============================================================================
-- 8. VERIFICATION QUERIES (Optional - for testing)
-- ============================================================================

-- Verify tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('club_invites', 'notifications');

-- Verify indexes exist
SELECT indexname 
FROM pg_indexes 
WHERE tablename IN ('club_invites', 'notifications');

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('club_invites', 'notifications');

-- Verify policies exist
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('club_invites', 'notifications');

-- Verify trigger exists
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_club_invite_created';

-- Verify function exists
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'notify_model_on_invite'
AND routine_schema = 'public';

-- ============================================================================
-- 9. SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Note: Replace UUIDs with actual club_id and model_id from your profiles table

-- Example: Create a test invite (replace UUIDs)
/*
INSERT INTO club_invites (club_id, invited_model_id, message)
VALUES (
  'your-club-uuid-here',
  'your-model-uuid-here',
  'We would love to have you join our club!'
);
*/

-- Example: Check if notification was created automatically
/*
SELECT * FROM notifications 
WHERE related_entity_type = 'club_invite' 
ORDER BY created_at DESC 
LIMIT 5;
*/

-- ============================================================================
-- 10. CLEANUP QUERIES (Optional - for rollback)
-- ============================================================================

-- WARNING: These queries will DELETE all data and drop tables!
-- Only use if you need to completely remove the invite system

/*
-- Drop trigger
DROP TRIGGER IF EXISTS on_club_invite_created ON club_invites;

-- Drop function
DROP FUNCTION IF EXISTS notify_model_on_invite();

-- Drop tables (will also drop policies and indexes)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS club_invites CASCADE;
*/

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================

-- Success! 🎉
-- All tables, indexes, policies, and triggers have been created.
-- The invite system is now ready to use!
