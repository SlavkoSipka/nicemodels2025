-- STEP 1: Enable Realtime for required tables
-- This is the most important step - without this, nothing will work in real-time!
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS messages;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS online_status;

-- Verify Realtime is enabled
SELECT 'Realtime enabled for:', schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename IN ('messages', 'conversations', 'online_status');

-- STEP 2: Add the required columns
-- Add read_at column to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- Add typing status columns to conversations table
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS participant1_typing_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS participant2_typing_at TIMESTAMP WITH TIME ZONE;

-- STEP 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON messages(read_at);
CREATE INDEX IF NOT EXISTS idx_conversations_typing ON conversations(participant1_typing_at, participant2_typing_at);

-- STEP 4: Add comments
COMMENT ON COLUMN messages.read_at IS 'Timestamp when message was read by recipient (null = not read yet)';
COMMENT ON COLUMN conversations.participant1_typing_at IS 'Last time participant1 started typing (null = not typing)';
COMMENT ON COLUMN conversations.participant2_typing_at IS 'Last time participant2 started typing (null = not typing)';

-- STEP 5: Verify the columns were created
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'messages' AND column_name = 'read_at';

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'conversations' AND column_name IN ('participant1_typing_at', 'participant2_typing_at');

-- STEP 6: Check RLS policies allow updates
-- First drop if exists, then create
DO $$ 
BEGIN
  -- Conversations table should allow users to update their own typing status
  DROP POLICY IF EXISTS "Users can update their typing status" ON conversations;
  
  CREATE POLICY "Users can update their typing status"
  ON conversations
  FOR UPDATE
  USING (
    auth.uid() = participant1_id OR auth.uid() = participant2_id
  )
  WITH CHECK (
    auth.uid() = participant1_id OR auth.uid() = participant2_id
  );
  
  -- Messages table should allow marking messages as read
  DROP POLICY IF EXISTS "Users can mark messages as read" ON messages;
  
  CREATE POLICY "Users can mark messages as read"
  ON messages
  FOR UPDATE
  USING (
    -- Receiver can mark message as read
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE participant1_id = auth.uid() OR participant2_id = auth.uid()
    )
  )
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE participant1_id = auth.uid() OR participant2_id = auth.uid()
    )
  );
END $$;
