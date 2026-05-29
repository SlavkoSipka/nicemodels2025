-- ============================================================================
-- Mobile performance overhaul — supporting indexes
-- ============================================================================
-- Safe to run repeatedly (all IF NOT EXISTS). These back the query patterns
-- used by the public model listing / detail / search paths that were optimized
-- in the mobile performance overhaul:
--   * getModelRatingsBatch()  -> model_comments (model_id, status) + rating
--   * cached model public bundle (model detail page) -> per-table model_id lookups
--   * comments / collaborations / photo likes used on the detail page
--
-- Run in the Supabase SQL editor. For very large tables you may prefer to run
-- the CREATE INDEX statements with CONCURRENTLY (cannot be inside a txn block).
--
-- NOTE: ratings come from model_comments.rating (there is no `reviews` table);
-- the model_comments index below covers the ratings batch query too.
-- ============================================================================

-- Photos: bundle query orders by (display_order ASC, uploaded_at DESC) for
-- approved photos of a model.
CREATE INDEX IF NOT EXISTS idx_model_photos_model_order_partial
  ON public.model_photos (model_id, display_order ASC, uploaded_at DESC)
  WHERE is_approved IS true;

-- Videos: approved videos per model, newest first.
CREATE INDEX IF NOT EXISTS idx_model_videos_model_uploaded_partial
  ON public.model_videos (model_id, uploaded_at DESC)
  WHERE is_approved IS true;

-- Comments: detail page loads approved/reviewed comments per model, newest first.
CREATE INDEX IF NOT EXISTS idx_model_comments_model_status_created
  ON public.model_comments (model_id, status, created_at DESC);

-- Collaboration partners (both directions), accepted only.
CREATE INDEX IF NOT EXISTS idx_model_collab_sender_status
  ON public.model_collaborations (sender_id, status);
CREATE INDEX IF NOT EXISTS idx_model_collab_receiver_status
  ON public.model_collaborations (receiver_id, status);

-- Photo likes: "did the current viewer like these photos" lookup.
CREATE INDEX IF NOT EXISTS idx_photo_likes_user_photo
  ON public.photo_likes (user_id, photo_id);

-- Per-model child tables fetched in parallel for the detail bundle. These are
-- foreign-key lookups; ensure they are individually indexed.
CREATE INDEX IF NOT EXISTS idx_model_rates_model
  ON public.model_rates (model_id);
CREATE INDEX IF NOT EXISTS idx_model_services_model
  ON public.model_services (model_id);
CREATE INDEX IF NOT EXISTS idx_model_languages_model
  ON public.model_languages (model_id);
CREATE INDEX IF NOT EXISTS idx_model_working_hours_model
  ON public.model_working_hours (model_id);
