-- ============================================
-- QUICK TEST QUERIES FOR CHAT SYSTEM
-- ============================================

-- 1. Check if tables are created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('conversations', 'messages', 'online_status');

-- 2. Check RLS policies
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('conversations', 'messages', 'online_status')
ORDER BY tablename, policyname;

-- 3. Check functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'update_conversation_last_message',
    'reset_unread_count',
    'get_or_create_conversation'
  );
