-- ============================================
-- FUNCTION: clubs_with_active_ads
-- ============================================
-- Vraća sve klubove koji imaju aktivne oglase (paid orders sa ad_package)
-- SECURITY DEFINER - zaobilazi RLS za anonymous users

DROP FUNCTION IF EXISTS clubs_with_active_ads();

CREATE OR REPLACE FUNCTION clubs_with_active_ads()
RETURNS TABLE (
  id uuid,
  username text,
  email text,
  role app_role,
  profile_status profile_status,
  onboarding_completed boolean,
  is_verified boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  public_id integer,
  club_name text,
  display_name text,
  area text,
  is_club boolean,
  photo_file_path text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.username,
        p.email,
        p.role,
        p.profile_status,
        p.onboarding_completed,
        p.is_verified,
        p.created_at,
        p.updated_at,
        p.public_id,
        cd.club_name,
        cd.display_name,
        cd.area,
        cd.is_club,
        (SELECT cp.file_path FROM public.club_photos cp WHERE cp.club_id = p.id AND cp.is_approved = TRUE ORDER BY cp.uploaded_at DESC LIMIT 1) AS photo_file_path
    FROM
        public.profiles p
    JOIN
        public.club_details cd ON p.id = cd.club_id
    WHERE
        p.role = 'company'
        AND p.onboarding_completed = TRUE
        AND p.is_blocked = FALSE
        -- Uklonjeno is_verified i profile_status za beta
        AND EXISTS (
            SELECT 1
            FROM public.order_items oi
            JOIN public.products pr ON oi.product_id = pr.id
            JOIN public.orders o ON oi.order_id = o.id
            WHERE o.user_id = p.id
              AND o.status = 'paid'
              AND pr.product_type = 'ad_package'
              AND (oi.activation_date IS NULL OR oi.activation_date <= now())
              AND (COALESCE(oi.activation_date, o.created_at) + (pr.duration_days * INTERVAL '1 day') + (pr.duration_hours * INTERVAL '1 hour')) >= now()
        )
    ORDER BY
        p.created_at DESC; -- Order by creation date, newest first
END;
$$;

-- Dodijeli pristup anonymous i authenticated korisnicima
GRANT EXECUTE ON FUNCTION clubs_with_active_ads() TO anon;
GRANT EXECUTE ON FUNCTION clubs_with_active_ads() TO authenticated;
