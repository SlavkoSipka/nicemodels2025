-- ============================================================
-- CREATE `verifications` table
-- ============================================================
-- Identity-verification requests for ALL roles (model, user, company).
-- One row per user (UNIQUE on user_id, upsert on conflict).
-- Documents stored in private `verification-documents` bucket.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.verifications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,

  first_name          TEXT NOT NULL,
  surname             TEXT NOT NULL,
  date_of_birth       DATE NOT NULL,
  id_number           TEXT NOT NULL,

  id_card_photo_path  TEXT NOT NULL,
  selfie_photo_path   TEXT NOT NULL,
  video_path          TEXT,

  status              TEXT NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'approved', 'rejected')),

  submitted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at         TIMESTAMPTZ,
  reviewed_by         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  rejection_reason    TEXT,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS verifications_status_idx ON public.verifications (status);
CREATE INDEX IF NOT EXISTS verifications_user_id_idx ON public.verifications (user_id);
CREATE INDEX IF NOT EXISTS verifications_submitted_at_idx ON public.verifications (submitted_at DESC);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own verification" ON public.verifications;
CREATE POLICY "Users can view own verification"
  ON public.verifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own verification" ON public.verifications;
CREATE POLICY "Users can insert own verification"
  ON public.verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own verification" ON public.verifications;
CREATE POLICY "Users can update own verification"
  ON public.verifications FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all verifications" ON public.verifications;
CREATE POLICY "Admins can view all verifications"
  ON public.verifications FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins can update all verifications" ON public.verifications;
CREATE POLICY "Admins can update all verifications"
  ON public.verifications FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- Reload PostgREST schema cache (so new table is visible immediately)
-- ============================================================
NOTIFY pgrst, 'reload schema';
