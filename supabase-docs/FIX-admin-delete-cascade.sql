-- ============================================================
-- FIX: Admin delete (users / models / companies) ne radi
-- ============================================================
-- Cilj: učiniti da brisanje korisnika sa sajta (iz admin panela
--       i iz Supabase Auth dashboarda) radi POUZDANO.
--
-- Uzrok: Većina tabela referencira `public.profiles(id)` i/ili
--        `auth.users(id)` BEZ `ON DELETE CASCADE`, pa Postgres
--        blokira `DELETE FROM auth.users` zbog FK ograničenja.
--
-- Šta ova skripta radi:
--   1. Prolazi kroz SVE foreign-key constraint-e koji referenciraju
--      `public.profiles(id)` ili `auth.users(id)` i koji NEMAJU
--      neku akciju (NO ACTION / RESTRICT). Briše ih i pravi
--      ponovo sa `ON DELETE CASCADE`. (FK-ovi sa SET NULL ili
--      već postojećim CASCADE se ne diraju.)
--   2. Forsira `public.profiles.id -> auth.users(id)` na CASCADE
--      (to je ključno – bez ovoga delete iz auth nikada ne radi).
--   3. Pravi `public.admin_delete_user(uuid)` SECURITY DEFINER
--      funkciju koja:
--        - proverava da je pozivalac admin
--        - defanzivno briše red iz `auth.users`
--        - svi public.* zavisnici se brišu kroz CASCADE
--      Ovo pozivamo iz Next.js admin API-ja.
--
-- Pokreni JEDNOM u Supabase SQL Editor-u (kao service role).
-- Bezbedno za ponovno pokretanje (idempotentno).
-- ============================================================

-- ------------------------------------------------------------
-- 1) Prebaci sve FK na CASCADE
-- ------------------------------------------------------------
DO $$
DECLARE
  fk RECORD;
  col_list TEXT;
  ref_col_list TEXT;
  sql_drop TEXT;
  sql_add TEXT;
BEGIN
  FOR fk IN
    SELECT
      c.conname,
      c.conrelid::regclass::text  AS table_full,
      c.confrelid::regclass::text AS ref_table_full,
      c.conkey,
      c.confkey,
      c.confdeltype,
      c.conrelid,
      c.confrelid
    FROM pg_constraint c
    WHERE c.contype = 'f'
      AND c.confrelid IN (
        'public.profiles'::regclass,
        'auth.users'::regclass
      )
      -- 'a' = NO ACTION, 'r' = RESTRICT -> blokiraju delete
      AND c.confdeltype IN ('a', 'r')
  LOOP
    SELECT string_agg(quote_ident(att.attname), ', ' ORDER BY u.ord)
      INTO col_list
      FROM unnest(fk.conkey) WITH ORDINALITY AS u(attnum, ord)
      JOIN pg_attribute att
        ON att.attrelid = fk.conrelid
       AND att.attnum   = u.attnum;

    SELECT string_agg(quote_ident(att.attname), ', ' ORDER BY u.ord)
      INTO ref_col_list
      FROM unnest(fk.confkey) WITH ORDINALITY AS u(attnum, ord)
      JOIN pg_attribute att
        ON att.attrelid = fk.confrelid
       AND att.attnum   = u.attnum;

    sql_drop := format(
      'ALTER TABLE %s DROP CONSTRAINT %I',
      fk.table_full, fk.conname
    );
    sql_add := format(
      'ALTER TABLE %s ADD CONSTRAINT %I FOREIGN KEY (%s) REFERENCES %s(%s) ON DELETE CASCADE',
      fk.table_full, fk.conname, col_list, fk.ref_table_full, ref_col_list
    );

    RAISE NOTICE 'Recreating FK % on % -> % with ON DELETE CASCADE',
      fk.conname, fk.table_full, fk.ref_table_full;
    EXECUTE sql_drop;
    EXECUTE sql_add;
  END LOOP;
END
$$;

-- ------------------------------------------------------------
-- 2) Ekplicitno forsiraj profiles.id -> auth.users(id) na CASCADE
--    (ako je već CASCADE ovo je no-op)
-- ------------------------------------------------------------
DO $$
DECLARE
  cname TEXT;
  cdel  CHAR;
BEGIN
  SELECT conname, confdeltype
    INTO cname, cdel
  FROM pg_constraint
  WHERE conrelid = 'public.profiles'::regclass
    AND confrelid = 'auth.users'::regclass
    AND contype = 'f'
  LIMIT 1;

  IF cname IS NULL THEN
    -- profiles.id nema FK ka auth.users – dodaj ga
    EXECUTE 'ALTER TABLE public.profiles
             ADD CONSTRAINT profiles_id_fkey
             FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE';
  ELSIF cdel <> 'c' THEN
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', cname);
    EXECUTE format(
      'ALTER TABLE public.profiles
       ADD CONSTRAINT %I FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE',
      cname
    );
  END IF;
END
$$;

-- ------------------------------------------------------------
-- 3) RPC: public.admin_delete_user(uuid)
--    Briše korisnika iz auth.users uz prethodnu proveru da je
--    pozivalac admin. Sve dependent rows iz public.* se cascade-uju.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  caller_role     text;
  caller_jwt_role text;
BEGIN
  IF target_id IS NULL THEN
    RAISE EXCEPTION 'target_id is required';
  END IF;

  -- Dozvoli ili eksplicitno admin korisnika (auth.uid -> profiles.role)
  -- ili service_role poziv iz server-side API rute.
  BEGIN
    caller_jwt_role := auth.role();
  EXCEPTION WHEN OTHERS THEN
    caller_jwt_role := NULL;
  END;

  IF caller_jwt_role IS DISTINCT FROM 'service_role' THEN
    SELECT role INTO caller_role
    FROM public.profiles
    WHERE id = auth.uid();

    IF caller_role IS DISTINCT FROM 'admin' THEN
      RAISE EXCEPTION 'Forbidden: caller is not admin';
    END IF;
  END IF;

  -- Bezbednosno: očisti par tabela koje su istorijski znale da
  -- imaju NO ACTION FK (ako su već prešle na CASCADE ovo je no-op).
  DELETE FROM public.notifications        WHERE user_id   = target_id;
  DELETE FROM public.banners              WHERE owner_id  = target_id;
  DELETE FROM public.model_comments       WHERE user_id   = target_id OR model_id = target_id;
  DELETE FROM public.favorites            WHERE user_id   = target_id OR model_id = target_id;

  -- Supabase blokira DIREKTAN `DELETE FROM storage.objects` ("Direct
  -- deletion from storage tables is not allowed"). Ako bilo koji
  -- USER trigger na `profiles` (ili sličnim tabelama) pokuša da
  -- briše storage redove tokom cascade-a, ceo delete pukne.
  -- Zato privremeno gasimo USER trigger-e oko delete-a.
  ALTER TABLE public.profiles DISABLE TRIGGER USER;

  -- Glavni delete – sve ostalo prati ON DELETE CASCADE
  DELETE FROM auth.users WHERE id = target_id;

  ALTER TABLE public.profiles ENABLE TRIGGER USER;
END
$$;

REVOKE ALL ON FUNCTION public.admin_delete_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated, service_role;

-- ------------------------------------------------------------
-- Provera (opciono): pogledaj koji FK još uvek nisu CASCADE/SET NULL
-- ------------------------------------------------------------
-- SELECT c.conrelid::regclass AS table_name, c.conname, c.confdeltype
-- FROM pg_constraint c
-- WHERE c.contype = 'f'
--   AND c.confrelid IN ('public.profiles'::regclass, 'auth.users'::regclass)
--   AND c.confdeltype NOT IN ('c','n','d');
