CREATE INDEX IF NOT EXISTS idx_notifications_user_unread_created
  ON public.notifications (user_id, created_at DESC)
  WHERE is_read IS false;

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_page_views_created
  ON public.page_views (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_page_views_created_path
  ON public.page_views (created_at DESC, path);

CREATE INDEX IF NOT EXISTS idx_listing_views_listing_created
  ON public.listing_views (listing_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_listing_clicks_listing_created
  ON public.listing_clicks (listing_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_banner_imp_banner_created
  ON public.banner_impressions (banner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_banner_clk_banner_created
  ON public.banner_clicks (banner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_model_stats_action_model_created
  ON public.model_statistics (action_type, model_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_user_status_created
  ON public.orders (user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_verifications_status_submitted
  ON public.verifications (status, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_model_photos_model_uploaded_partial
  ON public.model_photos (model_id, uploaded_at DESC)
  WHERE is_approved IS true;
