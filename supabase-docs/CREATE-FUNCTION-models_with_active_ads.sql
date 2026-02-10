-- ============================================
-- FUNCTION: models_with_active_ads
-- ============================================
-- Vraća sve modele koji imaju aktivne oglase (paid orders sa ad_package)
-- SECURITY DEFINER - zaobilazi RLS za anonymous users

DROP FUNCTION IF EXISTS models_with_active_ads();

CREATE OR REPLACE FUNCTION models_with_active_ads()
RETURNS TABLE (
  id uuid,
  username text,
  email text,
  role text,
  created_at timestamptz
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
    p.created_at
  FROM profiles p
  INNER JOIN orders o ON o.user_id = p.id
  INNER JOIN order_items oi ON oi.order_id = o.id
  INNER JOIN products pr ON pr.id = oi.product_id
  WHERE 
    p.role = 'model'
    AND o.status = 'paid'
    AND pr.product_type = 'ad_package'
    AND (
      -- Immediately activated (no activation_date) or activation_date is in the past
      (oi.activation_date IS NULL OR oi.activation_date <= NOW())
    )
    AND (
      -- Check if ad is still active (activation_date + duration_hours > NOW)
      -- If activation_date is NULL, use order created_at
      COALESCE(oi.activation_date, o.created_at) + (pr.duration_hours || ' hours')::INTERVAL > NOW()
    )
  ORDER BY p.created_at DESC;
END;
$$;

-- Dodijeli pristup anonymous i authenticated korisnicima
GRANT EXECUTE ON FUNCTION models_with_active_ads() TO anon;
GRANT EXECUTE ON FUNCTION models_with_active_ads() TO authenticated;
