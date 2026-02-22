-- ============================================
-- UPDATE CHAT SYSTEM - Support All User Types
-- ============================================

-- Rename columns to be generic (not user/model specific)
ALTER TABLE conversations RENAME COLUMN user_id TO participant1_id;
ALTER TABLE conversations RENAME COLUMN model_id TO participant2_id;
ALTER TABLE conversations RENAME COLUMN user_unread_count TO participant1_unread_count;
ALTER TABLE conversations RENAME COLUMN model_unread_count TO participant2_unread_count;

-- Update UNIQUE constraint
ALTER TABLE conversations DROP CONSTRAINT conversations_user_id_model_id_key;
ALTER TABLE conversations ADD CONSTRAINT conversations_participants_unique 
  UNIQUE(participant1_id, participant2_id);

-- Update indexes
DROP INDEX IF EXISTS idx_conversations_user_id;
DROP INDEX IF EXISTS idx_conversations_model_id;
CREATE INDEX idx_conversations_participant1_id ON conversations(participant1_id);
CREATE INDEX idx_conversations_participant2_id ON conversations(participant2_id);

-- ============================================
-- UPDATE RLS POLICIES
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations with models" ON conversations;
DROP POLICY IF EXISTS "Models can create conversations with users" ON conversations;
DROP POLICY IF EXISTS "Participants can update conversation" ON conversations;

-- Create new generic policies
CREATE POLICY "Users can view conversations they participate in"
  ON conversations
  FOR SELECT
  USING (
    auth.uid() = participant1_id OR auth.uid() = participant2_id
  );

CREATE POLICY "Any logged-in user can create conversations"
  ON conversations
  FOR INSERT
  WITH CHECK (
    auth.uid() = participant1_id
    AND participant1_id != participant2_id
    AND EXISTS (SELECT 1 FROM profiles WHERE id = participant2_id)
  );

CREATE POLICY "Participants can update their conversation"
  ON conversations
  FOR UPDATE
  USING (
    auth.uid() = participant1_id OR auth.uid() = participant2_id
  );

-- ============================================
-- UPDATE FUNCTIONS
-- ============================================

-- Drop old functions first (with CASCADE to drop dependent triggers)
DROP FUNCTION IF EXISTS update_conversation_last_message() CASCADE;
DROP FUNCTION IF EXISTS reset_unread_count(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS get_or_create_conversation(UUID, UUID) CASCADE;

-- Function: Update conversation's last message (updated)
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message_text = NEW.message_text,
    last_message_at = NEW.created_at,
    last_message_sender_id = NEW.sender_id,
    updated_at = NOW(),
    -- Increment unread count for receiver
    participant1_unread_count = CASE 
      WHEN NEW.sender_id = participant2_id THEN participant1_unread_count + 1
      ELSE participant1_unread_count
    END,
    participant2_unread_count = CASE 
      WHEN NEW.sender_id = participant1_id THEN participant2_unread_count + 1
      ELSE participant2_unread_count
    END
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON messages;
CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Function: Reset unread count (updated)
CREATE OR REPLACE FUNCTION reset_unread_count(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE conversations
  SET 
    participant1_unread_count = CASE 
      WHEN participant1_id = p_user_id THEN 0
      ELSE participant1_unread_count
    END,
    participant2_unread_count = CASE 
      WHEN participant2_id = p_user_id THEN 0
      ELSE participant2_unread_count
    END,
    updated_at = NOW()
  WHERE id = p_conversation_id
    AND (participant1_id = p_user_id OR participant2_id = p_user_id);
    
  -- Mark all messages in conversation as read for this user
  UPDATE messages
  SET 
    is_read = TRUE,
    read_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get or create conversation (updated - generic for any 2 users)
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  p_user_id UUID,
  p_other_user_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Try to find existing conversation (either direction)
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE (participant1_id = p_user_id AND participant2_id = p_other_user_id)
     OR (participant1_id = p_other_user_id AND participant2_id = p_user_id);
  
  -- If not found, create new conversation
  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations (participant1_id, participant2_id)
    VALUES (p_user_id, p_other_user_id)
    RETURNING id INTO v_conversation_id;
  END IF;
  
  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VERIFICATION
-- ============================================

-- Check that everything is updated
SELECT 
  'Columns renamed' as status,
  column_name 
FROM information_schema.columns 
WHERE table_name = 'conversations' 
  AND column_name IN ('participant1_id', 'participant2_id', 'participant1_unread_count', 'participant2_unread_count');

-- Check policies
SELECT 
  'Policies updated' as status,
  policyname 
FROM pg_policies 
WHERE tablename = 'conversations';

-- Check functions
SELECT 
  'Functions updated' as status,
  routine_name 
FROM information_schema.routines 
WHERE routine_name IN ('update_conversation_last_message', 'reset_unread_count', 'get_or_create_conversation');
