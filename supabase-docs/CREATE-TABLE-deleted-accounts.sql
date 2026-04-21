-- Archive table for deleted accounts.
--
-- Whenever an account is permanently deleted (by the user or by an admin), a
-- row is written here BEFORE auth.users is removed. The auth.users row is then
-- deleted via admin.auth.admin.deleteUser(), which:
--   - frees the email so the same address can register again later
--   - cascades the delete to public.profiles (FK ON DELETE CASCADE)
--
-- This table is intentionally append-only. We never write back into auth.users.

CREATE TABLE IF NOT EXISTS public.deleted_accounts (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  original_user_id UUID       NOT NULL,                -- former auth.users.id
  email           TEXT        NOT NULL,
  username        TEXT,
  role            TEXT,                                -- 'user' | 'model' | 'company' | 'admin'
  reason          TEXT,                                -- optional free-text reason
  deleted_by      TEXT        NOT NULL DEFAULT 'self', -- 'self' or admin user_id
  snapshot        JSONB,                               -- full profile + role-specific details
  deleted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS deleted_accounts_email_idx
  ON public.deleted_accounts (LOWER(email));

CREATE INDEX IF NOT EXISTS deleted_accounts_deleted_at_idx
  ON public.deleted_accounts (deleted_at DESC);

-- RLS: only admins can read this table from the client.
ALTER TABLE public.deleted_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view deleted accounts" ON public.deleted_accounts;
CREATE POLICY "Admins can view deleted accounts"
  ON public.deleted_accounts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Inserts only happen via service-role from the API route, so no insert policy
-- is needed for end users.
