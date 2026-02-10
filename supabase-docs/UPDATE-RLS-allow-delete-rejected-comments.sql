-- Allow users to delete their own rejected comments
-- This allows them to submit a new comment after rejection

DROP POLICY IF EXISTS "Users can delete own pending comments" ON model_comments;

CREATE POLICY "Users can delete own pending or rejected comments"
  ON model_comments FOR DELETE
  USING (auth.uid() = user_id AND (status = 'pending' OR status = 'rejected'));
