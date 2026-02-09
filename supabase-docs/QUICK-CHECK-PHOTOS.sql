-- ============================================
-- BRZA PROVERA ZA PHOTO/VIDEO TABELE
-- Za trenutni problem sa club_photos
-- ============================================

-- 1. Da li club_photos tabela postoji?
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'club_photos'
) as club_photos_exists;


-- 2. Sve kolone u club_photos tabeli:
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'club_photos'
ORDER BY ordinal_position;


-- 3. Sample data iz club_photos (ako postoji):
SELECT * FROM club_photos LIMIT 2;


-- 4. Da li postoji created_at ili uploaded_at?
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'club_photos'
    AND (column_name LIKE '%created%' OR column_name LIKE '%upload%' OR column_name LIKE '%date%' OR column_name LIKE '%time%');


-- 5. Isto za model_photos:
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'model_photos'
ORDER BY ordinal_position;


-- 6. Proveri storage bucket za club photos:
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets
WHERE name LIKE '%club%' OR name LIKE '%photo%';


-- 7. Count - koliko ima uploadovanih slika:
SELECT 
    'club_photos' as table_name,
    COUNT(*) as total_photos
FROM club_photos
UNION ALL
SELECT 
    'model_photos' as table_name,
    COUNT(*) as total_photos
FROM model_photos;


-- ============================================
-- REZULTAT: Kopiraj i pošalji mi sve outpute
-- ============================================
