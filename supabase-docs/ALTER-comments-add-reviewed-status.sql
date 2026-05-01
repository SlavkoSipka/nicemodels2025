-- Adds 'reviewed' status to model_comments.
-- Flow:
--   * 'approved'  -> auto on insert (comment is immediately online, awaiting admin review).
--   * 'reviewed'  -> admin pressed "2nd approve": comment stays online but leaves the admin queue.
--   * 'rejected'  -> admin pressed reject: comment is hidden so the user can correct/resubmit.

ALTER TABLE model_comments DROP CONSTRAINT IF EXISTS model_comments_status_check;
ALTER TABLE model_comments
  ADD CONSTRAINT model_comments_status_check
  CHECK (status IN ('pending', 'approved', 'reviewed', 'rejected'));

-- Make sure RLS lets logged-in users see reviewed comments too (they are public).
DROP POLICY IF EXISTS "Logged in users can view approved comments" ON model_comments;
CREATE POLICY "Logged in users can view approved comments"
  ON model_comments FOR SELECT
  USING (
    status IN ('approved', 'reviewed')
    AND auth.uid() IS NOT NULL
  );

COMMENT ON COLUMN model_comments.status IS
  'pending (legacy), approved (online, awaiting admin review), reviewed (admin 2nd-approved), rejected (offline, user can edit)';
