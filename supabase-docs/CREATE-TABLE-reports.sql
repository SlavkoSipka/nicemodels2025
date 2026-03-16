-- ============================================
-- TABLE: reports
-- ============================================
-- Stores reports submitted by models against visitors in chat

CREATE TABLE IF NOT EXISTS public.reports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  reason          text,
  screenshot_path text,           -- path in report-screenshots bucket
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  admin_note      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  reviewed_at     timestamptz
);

-- Indexes for fast admin queries
CREATE INDEX IF NOT EXISTS idx_reports_status      ON public.reports (status);
CREATE INDEX IF NOT EXISTS idx_reports_reported_id ON public.reports (reported_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON public.reports (reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at  ON public.reports (created_at DESC);

-- RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Models can insert their own reports
CREATE POLICY "models_can_insert_reports"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = auth.uid());

-- Models can view their own reports
CREATE POLICY "models_can_view_own_reports"
  ON public.reports FOR SELECT
  TO authenticated
  USING (reporter_id = auth.uid());

-- Admins can view and update all reports (via service_role — no policy needed for service_role)

-- ============================================
-- STORAGE BUCKET: report-screenshots
-- ============================================
-- Run separately in Supabase Storage UI or via management API:
--
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('report-screenshots', 'report-screenshots', false);
--
-- Storage policy — authenticated users can upload to their own folder:
-- CREATE POLICY "reporters_upload"
--   ON storage.objects FOR INSERT TO authenticated
--   WITH CHECK (bucket_id = 'report-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);
--
-- Admins read via service_role (no public access needed)
