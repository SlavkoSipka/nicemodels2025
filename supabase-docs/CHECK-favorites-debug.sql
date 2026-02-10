-- Debug query to check favorites data

-- Check if favorites exist
SELECT * FROM favorites;

-- Check if model_details can be accessed
SELECT * FROM model_details WHERE model_id IN (
  SELECT model_id FROM favorites
);

-- Check if model_photos can be accessed
SELECT * FROM model_photos WHERE model_id IN (
  SELECT model_id FROM favorites
) AND is_approved = true;

-- Check RLS policies for model_details
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'model_details';

-- Check RLS policies for model_photos
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'model_photos';
