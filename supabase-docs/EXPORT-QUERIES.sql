-- ============================================
-- SUPABASE DATABASE EXPORT QUERIES
-- Izvršiti u Supabase SQL Editor i sačuvati rezultate
-- ============================================

-- ============================================
-- 1. SVE TABELE I KOLONE (najvažnije!)
-- ============================================
-- Kopiraj rezultat u: supabase-docs/01-tables-columns.sql

SELECT 
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;


-- ============================================
-- 2. PRIMARY KEYS
-- ============================================
-- Kopiraj rezultat u: supabase-docs/02-primary-keys.sql

SELECT
    tc.table_name,
    kcu.column_name,
    tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;


-- ============================================
-- 3. FOREIGN KEYS (veze između tabela)
-- ============================================
-- Kopiraj rezultat u: supabase-docs/03-foreign-keys.sql

SELECT
    tc.table_name AS from_table,
    kcu.column_name AS from_column,
    ccu.table_name AS to_table,
    ccu.column_name AS to_column,
    tc.constraint_name,
    rc.update_rule,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;


-- ============================================
-- 4. INDEXES (za performance)
-- ============================================
-- Kopiraj rezultat u: supabase-docs/04-indexes.sql

SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;


-- ============================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- Kopiraj rezultat u: supabase-docs/05-rls-policies.sql

SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;


-- ============================================
-- 6. FULL TABLE DEFINITIONS (CREATE TABLE statements)
-- ============================================
-- Kopiraj rezultat u: supabase-docs/06-create-statements.sql

SELECT
    'CREATE TABLE ' || table_name || ' (' || 
    string_agg(
        column_name || ' ' || data_type ||
        CASE 
            WHEN character_maximum_length IS NOT NULL 
            THEN '(' || character_maximum_length || ')'
            ELSE ''
        END ||
        CASE 
            WHEN is_nullable = 'NO' THEN ' NOT NULL'
            ELSE ''
        END ||
        CASE 
            WHEN column_default IS NOT NULL 
            THEN ' DEFAULT ' || column_default
            ELSE ''
        END,
        ', '
        ORDER BY ordinal_position
    ) || ');' AS create_statement
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;


-- ============================================
-- 7. STORAGE BUCKETS
-- ============================================
-- Kopiraj rezultat u: supabase-docs/07-storage-buckets.sql

SELECT
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at
FROM storage.buckets
ORDER BY name;


-- ============================================
-- 8. FUNCTIONS & TRIGGERS
-- ============================================
-- Kopiraj rezultat u: supabase-docs/08-functions-triggers.sql

-- Functions:
SELECT
    n.nspname as schema,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY function_name;

-- Triggers:
SELECT
    event_object_table AS table_name,
    trigger_name,
    event_manipulation AS event,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;


-- ============================================
-- 9. ENUMS (ako ih ima)
-- ============================================
-- Kopiraj rezultat u: supabase-docs/09-enums.sql

SELECT
    t.typname AS enum_name,
    e.enumlabel AS enum_value,
    e.enumsortorder AS sort_order
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
ORDER BY t.typname, e.enumsortorder;


-- ============================================
-- 10. TABLE COUNTS (da vidimo koliko ima podataka)
-- ============================================
-- Kopiraj rezultat u: supabase-docs/10-table-counts.sql

SELECT
    schemaname,
    tablename,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = pg_tables.tablename AND table_schema = 'public') as column_count
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;


-- ============================================
-- BONUS: SAMPLE DATA ZA VAŽNE TABELE
-- ============================================
-- (samo za proveru, ne treba čuvati)

-- Proveri profiles strukturu:
SELECT * FROM profiles LIMIT 1;

-- Proveri club_photos strukturu:
SELECT * FROM club_photos LIMIT 1;

-- Proveri club_details strukturu:
SELECT * FROM club_details LIMIT 1;

-- Proveri model_photos strukturu:
SELECT * FROM model_photos LIMIT 1;

-- Proveri model_details strukturu:
SELECT * FROM model_details LIMIT 1;
