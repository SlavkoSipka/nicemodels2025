-- Create favorites table for users to save their favorite models/clubs
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  model_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  
  -- Ensure a user can only favorite a model once
  UNIQUE(user_id, model_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_model_id ON favorites(model_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON favorites(created_at DESC);

-- Enable Row Level Security
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for favorites

-- Users can view their own favorites
CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

-- Users can add favorites
CREATE POLICY "Users can add favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can remove favorites
CREATE POLICY "Users can remove favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Models can view who favorited them (optional, for statistics)
CREATE POLICY "Models can view their favorites count"
  ON favorites FOR SELECT
  USING (auth.uid() = model_id);

-- Add comments for documentation
COMMENT ON TABLE favorites IS 'User favorites - models/clubs that users have saved';
COMMENT ON COLUMN favorites.user_id IS 'User who favorited';
COMMENT ON COLUMN favorites.model_id IS 'Model/club that was favorited';
