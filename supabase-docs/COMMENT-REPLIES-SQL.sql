-- ============================================================================
-- COMMENT REPLY + NOTIFICATION SYSTEM
-- ============================================================================
-- 1. Add reply columns to model_comments so models can reply
-- 2. Auto-approve comments on insert (no admin moderation needed)
-- 3. Trigger to notify model when they receive a new approved comment
-- ============================================================================

-- ============================================================================
-- 1. ADD REPLY COLUMNS
-- ============================================================================

ALTER TABLE model_comments
  ADD COLUMN IF NOT EXISTS reply_text text,
  ADD COLUMN IF NOT EXISTS replied_at timestamp with time zone;

-- ============================================================================
-- 2. RLS: Update INSERT policy so comments are auto-approved
-- ============================================================================

DROP POLICY IF EXISTS "Users can create comments" ON model_comments;
CREATE POLICY "Users can create comments"
  ON model_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status = 'approved');

DROP POLICY IF EXISTS "Users can delete own pending or rejected comments" ON model_comments;
CREATE POLICY "Users can delete own pending or rejected comments"
  ON model_comments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 3. RLS: Allow models to read and reply to comments on their profile
-- ============================================================================

DROP POLICY IF EXISTS "Models can view comments on own profile" ON model_comments;
CREATE POLICY "Models can view comments on own profile"
  ON model_comments FOR SELECT
  USING (auth.uid() = model_id);

DROP POLICY IF EXISTS "Models can reply to comments on own profile" ON model_comments;
CREATE POLICY "Models can reply to comments on own profile"
  ON model_comments FOR UPDATE
  USING (auth.uid() = model_id AND status = 'approved');

-- ============================================================================
-- 3. TRIGGER: Notify model when a comment is approved
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_model_on_comment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD IS NULL OR OLD.status != 'approved') THEN
    INSERT INTO notifications (
      user_id, type, title, message,
      related_entity_type, related_entity_id, action_url
    )
    VALUES (
      NEW.model_id,
      'new_comment',
      'New review received',
      'You received a new ' ||
        CASE WHEN NEW.rating IS NOT NULL THEN NEW.rating || '-star ' ELSE '' END ||
        'review from ' ||
        COALESCE(
          (SELECT username FROM profiles WHERE id = NEW.user_id),
          'a user'
        ),
      'comment',
      NEW.id,
      '/dashboard/model/comments'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_notify_model ON model_comments;
CREATE TRIGGER on_comment_notify_model
  AFTER INSERT OR UPDATE ON model_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_model_on_comment();
