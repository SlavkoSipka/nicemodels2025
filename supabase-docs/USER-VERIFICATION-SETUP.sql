-- USER VERIFICATION SETUP
-- This documents the verification flow for regular users (role = 'user').
-- No new DB changes are needed — the existing `verifications` table and
-- `verification-documents` bucket already work for ALL roles (model, user, company).
--
-- The `verifications` table uses user_id with UNIQUE constraint, so each
-- user can only have one verification request (upsert on conflict).
--
-- Storage: verification-documents bucket (PRIVATE) — files stored as:
--   {email}/id-card-{timestamp}.{ext}
--   {email}/selfie-{timestamp}.{ext}
--   {email}/video-{timestamp}.{ext}

-- ============================================================
-- EXISTING RLS on `verifications` (verify these exist):
-- ============================================================

-- Users can read their own verification:
-- CREATE POLICY "Users can view own verification"
--   ON verifications FOR SELECT
--   USING (auth.uid() = user_id);

-- Users can insert/update their own verification:
-- CREATE POLICY "Users can upsert own verification"
--   ON verifications FOR INSERT
--   WITH CHECK (auth.uid() = user_id);
-- CREATE POLICY "Users can update own verification"
--   ON verifications FOR UPDATE
--   USING (auth.uid() = user_id);

-- Admins can read all verifications:
-- CREATE POLICY "Admins can view all verifications"
--   ON verifications FOR SELECT
--   USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Admins can update all verifications:
-- CREATE POLICY "Admins can update all verifications"
--   ON verifications FOR UPDATE
--   USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- EXISTING Storage RLS on `verification-documents` bucket:
-- ============================================================

-- Authenticated users can upload to their own folder:
-- CREATE POLICY "Authenticated users can upload verification docs"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'verification-documents' AND auth.role() = 'authenticated');

-- Authenticated users can read own docs (or admin can create signed URLs):
-- Admin reads use service_role key, so no RLS needed for admin reads.

-- ============================================================
-- NOTIFICATIONS (inserted from admin panel on approve/reject):
-- ============================================================
-- No trigger needed. The admin verification page now inserts notifications
-- directly into the `notifications` table when approving or rejecting:
--
-- Type: 'verification_approved' or 'verification_rejected'
-- user_id: the applicant's profile ID
-- action_url: /dashboard/{role}/verification
-- related_entity_type: 'verification'
-- related_entity_id: verification row ID

-- ============================================================
-- NO NEW SQL MIGRATIONS REQUIRED
-- ============================================================
-- The verifications table, bucket, and RLS policies are role-agnostic.
-- User verification requests appear alongside model/club requests in
-- the admin verification panel, distinguished by profiles.role badge.
