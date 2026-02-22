-- Add typing status tracking to conversations table
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS participant1_typing_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS participant2_typing_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster typing status checks
CREATE INDEX IF NOT EXISTS idx_conversations_typing 
ON conversations(participant1_typing_at, participant2_typing_at);

-- Comment
COMMENT ON COLUMN conversations.participant1_typing_at IS 'Last time participant1 started typing (null = not typing)';
COMMENT ON COLUMN conversations.participant2_typing_at IS 'Last time participant2 started typing (null = not typing)';
