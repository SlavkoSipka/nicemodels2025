-- ============================================
-- SUPABASE STORAGE SETUP FOR MODEL STORIES
-- ============================================

-- STEP 1: Create bucket manually in Supabase Dashboard
-- Go to: Storage → Create new bucket
-- Settings:
--   Name: model-stories
--   Public: YES ✅
--   File size limit: 52428800 (50MB)
--   Allowed MIME types: image/*, video/*

-- STEP 2: Run these RLS policies for the bucket

-- Allow anyone to view/read stories
INSERT INTO storage.buckets (id, name, public)
VALUES ('model-stories', 'model-stories', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- RLS Policies for storage.objects

-- Policy 1: Anyone can view stories (SELECT)
CREATE POLICY "Anyone can view model stories"
ON storage.objects FOR SELECT
USING ( bucket_id = 'model-stories' );

-- Policy 2: Models can upload their own stories (INSERT)
CREATE POLICY "Models can upload own stories"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'model-stories' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Models can update their own stories (UPDATE)
CREATE POLICY "Models can update own stories"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'model-stories' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Models can delete their own stories (DELETE)
CREATE POLICY "Models can delete own stories"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'model-stories' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- STEP 3: Verify policies were created
SELECT 
  schemaname, 
  tablename, 
  policyname 
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%model stories%';

-- STEP 4: Test upload (from application)
-- Models should be able to upload files to: model-stories/{user_id}/{timestamp}.{ext}
-- Example path: model-stories/a1b2c3d4-e5f6-7890-abcd-ef1234567890/1708520400000.jpg

SELECT 'Storage bucket setup complete!' as status;
