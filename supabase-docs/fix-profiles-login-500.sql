-- =====================================================
-- FIX: 500 na profiles pri loginu
-- =====================================================
-- Ako dobijaš 500 na:
--   GET .../profiles?select=onboarding_completed,role&id=eq.<uuid>
-- RLS na profiles može da izazove grešku pri evaluaciji politika.
-- Isključi RLS na profiles da login i čitanje profila uvek rade.
--
-- Pokreni u Supabase SQL Editoru.
-- =====================================================

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Opciono: da ostane bez RLS politika (čisto stanje)
-- DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
-- DROP POLICY IF EXISTS "Anyone can view models with active ads" ON public.profiles;
-- DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
-- DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
