-- ============================================
-- CHAT/MESSAGING SYSTEM - Database Tables
-- ============================================

-- Table: conversations
-- Stores conversation metadata between two users
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Participants (user and model)
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Last message info (for quick display in list)
  last_message_text TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  last_message_sender_id UUID REFERENCES profiles(id),
  
  -- Unread counts per participant
  user_unread_count INTEGER DEFAULT 0,
  model_unread_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one conversation per user-model pair
  UNIQUE(user_id, model_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_model_id ON conversations(model_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);

-- ============================================
-- Table: messages
-- Stores individual messages in conversations
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  
  -- Sender info
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Message content
  message_text TEXT NOT NULL,
  
  -- Read status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read) WHERE is_read = FALSE;

-- ============================================
-- Table: online_status
-- Tracks who is online and available for chat
-- ============================================
CREATE TABLE IF NOT EXISTS online_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Availability
  is_online BOOLEAN DEFAULT FALSE,
  is_available_for_chat BOOLEAN DEFAULT FALSE,
  
  -- Last activity
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One status per user
  UNIQUE(user_id)
);

-- Index for finding online users
CREATE INDEX IF NOT EXISTS idx_online_status_is_online ON online_status(is_online) WHERE is_online = TRUE;
CREATE INDEX IF NOT EXISTS idx_online_status_available ON online_status(is_available_for_chat) WHERE is_available_for_chat = TRUE;

-- ============================================
-- RLS POLICIES - conversations
-- ============================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Users can view conversations they are part of
CREATE POLICY "Users can view own conversations"
  ON conversations
  FOR SELECT
  USING (
    auth.uid() = user_id OR auth.uid() = model_id
  );

-- Users can create conversations with models
CREATE POLICY "Users can create conversations with models"
  ON conversations
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = model_id 
      AND role = 'model'
    )
  );

-- Models can create conversations with users
CREATE POLICY "Models can create conversations with users"
  ON conversations
  FOR INSERT
  WITH CHECK (
    auth.uid() = model_id
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = user_id 
      AND role IN ('user', 'model', 'company')
    )
  );

-- Participants can update conversation (for unread counts)
CREATE POLICY "Participants can update conversation"
  ON conversations
  FOR UPDATE
  USING (
    auth.uid() = user_id OR auth.uid() = model_id
  );

-- Admins can view all conversations
CREATE POLICY "Admins can view all conversations"
  ON conversations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- ============================================
-- RLS POLICIES - messages
-- ============================================

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages in their conversations
CREATE POLICY "Users can view messages in own conversations"
  ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE id = messages.conversation_id 
      AND (user_id = auth.uid() OR model_id = auth.uid())
    )
  );

-- Users can send messages in their conversations
CREATE POLICY "Users can send messages in own conversations"
  ON messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversations 
      WHERE id = messages.conversation_id 
      AND (user_id = auth.uid() OR model_id = auth.uid())
    )
  );

-- Users can mark messages as read in their conversations
CREATE POLICY "Users can mark messages as read"
  ON messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE id = messages.conversation_id 
      AND (user_id = auth.uid() OR model_id = auth.uid())
    )
  );

-- Admins can view all messages
CREATE POLICY "Admins can view all messages"
  ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- ============================================
-- RLS POLICIES - online_status
-- ============================================

ALTER TABLE online_status ENABLE ROW LEVEL SECURITY;

-- All logged-in users can view online status
CREATE POLICY "Logged-in users can view online status"
  ON online_status
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Users can manage their own online status
CREATE POLICY "Users can manage own online status"
  ON online_status
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Update conversation's last message
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
    user_unread_count = CASE 
      WHEN NEW.sender_id = model_id THEN user_unread_count + 1
      ELSE user_unread_count
    END,
    model_unread_count = CASE 
      WHEN NEW.sender_id = user_id THEN model_unread_count + 1
      ELSE model_unread_count
    END
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Update conversation on new message
DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON messages;
CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Function: Reset unread count when user opens conversation
CREATE OR REPLACE FUNCTION reset_unread_count(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE conversations
  SET 
    user_unread_count = CASE 
      WHEN user_id = p_user_id THEN 0
      ELSE user_unread_count
    END,
    model_unread_count = CASE 
      WHEN model_id = p_user_id THEN 0
      ELSE model_unread_count
    END,
    updated_at = NOW()
  WHERE id = p_conversation_id
    AND (user_id = p_user_id OR model_id = p_user_id);
    
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

-- Function: Get or create conversation
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  p_user_id UUID,
  p_model_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Try to find existing conversation
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE (user_id = p_user_id AND model_id = p_model_id)
     OR (user_id = p_model_id AND model_id = p_user_id);
  
  -- If not found, create new conversation
  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations (user_id, model_id)
    VALUES (p_user_id, p_model_id)
    RETURNING id INTO v_conversation_id;
  END IF;
  
  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE conversations IS 'Stores conversations between users and models';
COMMENT ON TABLE messages IS 'Stores individual messages in conversations';
COMMENT ON TABLE online_status IS 'Tracks user online status and chat availability';

COMMENT ON FUNCTION update_conversation_last_message() IS 'Automatically updates conversation metadata when new message is sent';
COMMENT ON FUNCTION reset_unread_count(UUID, UUID) IS 'Resets unread message count when user opens conversation';
COMMENT ON FUNCTION get_or_create_conversation(UUID, UUID) IS 'Gets existing conversation or creates new one between two users';
