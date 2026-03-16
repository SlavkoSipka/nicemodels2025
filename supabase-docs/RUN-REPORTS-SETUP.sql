-- ============================================
-- RUN THIS IN SUPABASE SQL EDITOR
-- Creates reports table + storage bucket for report screenshots
-- ============================================

-- 1. TABLE: reports
CREATE TABLE IF NOT EXISTS public.reports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  reason          text,
  screenshot_path text,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  admin_note      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  reviewed_at     timestamptz
);

CREATE INDEX IF NOT EXISTS idx_reports_status      ON public.reports (status);
CREATE INDEX IF NOT EXISTS idx_reports_reported_id ON public.reports (reported_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON public.reports (reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at  ON public.reports (created_at DESC);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "models_can_insert_reports" ON public.reports;
CREATE POLICY "models_can_insert_reports"
  ON public.reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

DROP POLICY IF EXISTS "models_can_view_own_reports" ON public.reports;
CREATE POLICY "models_can_view_own_reports"
  ON public.reports FOR SELECT TO authenticated
  USING (reporter_id = auth.uid());

-- 2. STORAGE BUCKET: report-screenshots (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('report-screenshots', 'report-screenshots', false)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage policy: service_role uploads via API (no policy needed - bypasses RLS)
-- Allow authenticated users to upload to their own folder (optional, API uses service_role)
DROP POLICY IF EXISTS "reporters_upload_screenshots" ON storage.objects;
CREATE POLICY "reporters_upload_screenshots"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'report-screenshots'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
