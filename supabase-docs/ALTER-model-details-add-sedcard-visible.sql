-- ============================================
-- ALTER: model_details — add sedcard_visible
-- ============================================
-- Per-model public/private switch for the sedcard.
-- Default TRUE so existing paid models keep showing.
-- Toggling this does NOT pause the ad subscription — the
-- duration timer in models_with_active_ads() keeps ticking.

ALTER TABLE model_details
  ADD COLUMN IF NOT EXISTS sedcard_visible BOOLEAN NOT NULL DEFAULT TRUE;

-- Make filtering this column cheap on the public listing query.
CREATE INDEX IF NOT EXISTS idx_model_details_sedcard_visible
  ON model_details (model_id)
  WHERE sedcard_visible = TRUE;


-- ============================================
-- FUNCTION: models_with_active_ads (updated)
-- ============================================
-- Adds an INNER JOIN on model_details so models that turned
-- their sedcard OFF are excluded from every public surface
-- that uses this RPC (homepage, /models-page, prev/next nav).

DROP FUNCTION IF EXISTS models_with_active_ads();

CREATE OR REPLACE FUNCTION models_with_active_ads()
RETURNS TABLE (
  id uuid,
  username text,
  email text,
  role text,
  created_at timestamptz,
  public_id integer
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    p.id,
    p.username,
    p.email,
    p.role::text,
    p.created_at,
    p.public_id
  FROM profiles p
  INNER JOIN orders o ON o.user_id = p.id
  INNER JOIN order_items oi ON oi.order_id = o.id
  INNER JOIN products pr ON pr.id = oi.product_id
  INNER JOIN model_details md ON md.model_id = p.id AND md.sedcard_visible = TRUE
  WHERE
    p.role = 'model'
    AND p.is_blocked = FALSE
    AND o.status = 'paid'
    AND pr.product_type = 'ad_package'
    AND (
      (oi.activation_date IS NULL OR oi.activation_date <= NOW())
    )
    AND (
      COALESCE(oi.activation_date, o.created_at)
        + (pr.duration_days * INTERVAL '1 day')
        + (pr.duration_hours * INTERVAL '1 hour') > NOW()
    )
  ORDER BY p.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION models_with_active_ads() TO anon;
GRANT EXECUTE ON FUNCTION models_with_active_ads() TO authenticated;
