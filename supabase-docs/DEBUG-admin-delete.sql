-- ============================================================
-- DEBUG: dijagnostika brisanja korisnika (lightweight verzija)
-- ============================================================
-- Pravi RPC funkciju koju zove Next.js ruta da bi prikupila
-- listu trigger-a i FK-ova koji mogu da blokiraju DELETE.
--
-- Pokreni JEDNOM u Supabase SQL Editor-u.
-- ============================================================

CREATE OR REPLACE FUNCTION public._debug_delete_diagnostics(target_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_catalog
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'target_id', target_id,
    'target_role', (SELECT role FROM public.profiles WHERE id = target_id),
    'triggers_on_profiles', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'name',    t.tgname,
        'enabled', t.tgenabled,
        'def',     pg_get_triggerdef(t.oid)
      )), '[]'::jsonb)
      FROM pg_trigger t
      WHERE t.tgrelid = 'public.profiles'::regclass
        AND NOT t.tgisinternal
    ),
    'triggers_on_auth_users', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'name',    t.tgname,
        'enabled', t.tgenabled,
        'def',     pg_get_triggerdef(t.oid)
      )), '[]'::jsonb)
      FROM pg_trigger t
      WHERE t.tgrelid = 'auth.users'::regclass
        AND NOT t.tgisinternal
    ),
    'blocking_fks_to_profiles_or_auth_users', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'table',   c.conrelid::regclass::text,
        'name',    c.conname,
        'ref',     c.confrelid::regclass::text,
        'on_del',  c.confdeltype
      )), '[]'::jsonb)
      FROM pg_constraint c
      WHERE c.contype = 'f'
        AND c.confrelid IN ('public.profiles'::regclass, 'auth.users'::regclass)
        AND c.confdeltype NOT IN ('c','n','d')
    )
  ) INTO result;

  RETURN result;
END
$$;

REVOKE ALL ON FUNCTION public._debug_delete_diagnostics(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public._debug_delete_diagnostics(uuid) TO authenticated, service_role;
