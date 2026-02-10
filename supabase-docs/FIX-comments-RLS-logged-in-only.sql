-- Remove public access to comments
DROP POLICY IF EXISTS "Public can view approved comments" ON model_comments;

-- Allow only logged-in users to view approved comments (all roles: user, model, company, admin)
CREATE POLICY "Logged in users can view approved comments"
  ON model_comments FOR SELECT
  USING (
    status = 'approved' 
    AND auth.uid() IS NOT NULL
  );
