-- Create model_comments table for user reviews/comments about models
CREATE TABLE IF NOT EXISTS model_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  model_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  comment_text text NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes text,
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  
  -- User can only leave one comment per model
  UNIQUE(user_id, model_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_model_comments_user_id ON model_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_model_comments_model_id ON model_comments(model_id);
CREATE INDEX IF NOT EXISTS idx_model_comments_status ON model_comments(status);
CREATE INDEX IF NOT EXISTS idx_model_comments_created_at ON model_comments(created_at DESC);

-- Enable Row Level Security
ALTER TABLE model_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for model_comments

-- Users can view their own comments
CREATE POLICY "Users can view own comments"
  ON model_comments FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create comments
CREATE POLICY "Users can create comments"
  ON model_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Users can update their own pending comments
CREATE POLICY "Users can update own pending comments"
  ON model_comments FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Users can delete their own pending or rejected comments
CREATE POLICY "Users can delete own pending or rejected comments"
  ON model_comments FOR DELETE
  USING (auth.uid() = user_id AND (status = 'pending' OR status = 'rejected'));

-- Only logged-in users can view approved comments (all roles: user, model, company, admin)
CREATE POLICY "Logged in users can view approved comments"
  ON model_comments FOR SELECT
  USING (
    status = 'approved' 
    AND auth.uid() IS NOT NULL
  );

-- Admins can view all comments
CREATE POLICY "Admins can view all comments"
  ON model_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Admins can update comments (for approval/rejection)
CREATE POLICY "Admins can update comments"
  ON model_comments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Admins can delete comments
CREATE POLICY "Admins can delete comments"
  ON model_comments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Add comments for documentation
COMMENT ON TABLE model_comments IS 'User comments/reviews for models - requires admin approval';
COMMENT ON COLUMN model_comments.user_id IS 'User who left the comment';
COMMENT ON COLUMN model_comments.model_id IS 'Model being reviewed';
COMMENT ON COLUMN model_comments.comment_text IS 'The actual comment/review text';
COMMENT ON COLUMN model_comments.rating IS 'Optional 1-5 star rating';
COMMENT ON COLUMN model_comments.status IS 'pending, approved, or rejected';
COMMENT ON COLUMN model_comments.admin_notes IS 'Internal notes from admin reviewer';
COMMENT ON COLUMN model_comments.reviewed_by IS 'Admin who reviewed the comment';
