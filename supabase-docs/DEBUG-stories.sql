-- PROVERA 1: Da li postoje stories u bazi?
SELECT 
  ms.id,
  ms.model_id,
  ms.media_type,
  ms.media_url,
  ms.caption,
  ms.is_active,
  ms.expires_at,
  ms.created_at,
  p.username
FROM model_stories ms
JOIN profiles p ON p.id = ms.model_id
ORDER BY ms.created_at DESC
LIMIT 10;

-- PROVERA 2: Da li je story aktivan?
SELECT 
  id,
  model_id,
  is_active,
  expires_at > NOW() as not_expired,
  NOW() - expires_at as time_until_expiry
FROM model_stories
ORDER BY created_at DESC
LIMIT 5;

-- PROVERA 3: Da li funkcija vraća stories?
SELECT * FROM get_active_model_stories();

-- PROVERA 4: Proveri RLS policies za model_stories
SELECT 
  schemaname, 
  tablename, 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'model_stories';
