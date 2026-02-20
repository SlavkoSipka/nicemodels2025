-- Add read_at column to messages table to track when a message was read
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster read status queries
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON messages(read_at);

-- Comment
COMMENT ON COLUMN messages.read_at IS 'Timestamp when message was read by recipient (null = not read yet)';
