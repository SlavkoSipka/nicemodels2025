-- ============================================================================
-- Add cover_image to discussion_topics + discussion-images storage bucket
-- Run in Supabase SQL Editor.
-- ============================================================================

ALTER TABLE discussion_topics ADD COLUMN IF NOT EXISTS cover_image text;

-- Storage bucket for discussion topic images (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('discussion-images', 'discussion-images', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can read
CREATE POLICY "Public read discussion images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'discussion-images');

-- Admins can upload / update / delete
CREATE POLICY "Admins manage discussion images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'discussion-images'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins update discussion images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'discussion-images'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins delete discussion images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'discussion-images'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
