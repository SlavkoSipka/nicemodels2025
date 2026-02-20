-- ============================================
-- EXPORT SCRIPT FOR COMPLETE DATABASE SNAPSHOT
-- ============================================
-- Kopiraj ove upite jedan po jedan u Supabase SQL Editor
-- Rezultate kopiraj u data-snapshot/ folder
-- ============================================

-- 1. PROFILES (Users, Models, Clubs, Admin)
-- ============================================
SELECT 
  id,
  email,
  username,
  role,
  phone,
  city,
  description,
  profile_status,
  is_verified,
  onboarding_completed,
  blocked_at,
  blocked_reason,
  created_at,
  updated_at
FROM profiles
ORDER BY created_at DESC;

-- 2. MODEL DETAILS
-- ============================================
SELECT 
  id,
  model_id,
  showname,
  city,
  district,
  origin,
  age,
  hair_color,
  hair_length,
  eye_color,
  height_cm,
  weight_kg,
  breast_size,
  breast_type,
  body_type,
  intimate_haircut,
  tattoo,
  piercing,
  smoking,
  description,
  languages,
  club_id,
  created_at,
  updated_at
FROM model_details
ORDER BY created_at DESC;

-- 3. MODEL PHOTOS
-- ============================================
SELECT 
  id,
  model_id,
  photo_url,
  is_primary,
  is_approved,
  uploaded_at
FROM model_photos
ORDER BY model_id, is_primary DESC, uploaded_at DESC;

-- 4. MODEL RATES
-- ============================================
SELECT 
  id,
  model_id,
  service_type,
  duration,
  rate_in_euros
FROM model_rates
ORDER BY model_id, service_type, duration;

-- 5. MODEL SERVICES
-- ============================================
SELECT 
  id,
  model_id,
  service_name,
  service_category
FROM model_services
ORDER BY model_id, service_category, service_name;

-- 6. MODEL CONTACT DETAILS
-- ============================================
SELECT 
  id,
  model_id,
  show_phone_number,
  country_code,
  phone_number,
  has_viber,
  has_whatsapp,
  has_telegram,
  contact_instruction,
  no_withheld_numbers,
  other_instructions,
  created_at,
  updated_at
FROM model_contact_details
ORDER BY model_id;

-- 7. MODEL WORKING HOURS
-- ============================================
SELECT 
  id,
  model_id,
  working_hours_type,
  day_of_week,
  start_time,
  end_time,
  is_available
FROM model_working_hours
ORDER BY model_id, day_of_week;

-- 8. CLUB DETAILS
-- ============================================
SELECT 
  id,
  club_id,
  club_name,
  club_type,
  area,
  address,
  description,
  entrance_fee,
  has_wellness,
  has_food_drinks,
  has_outdoor_area,
  email,
  website,
  created_at,
  updated_at
FROM club_details
ORDER BY created_at DESC;

-- 9. CLUB PHOTOS
-- ============================================
SELECT 
  id,
  club_id,
  photo_url,
  is_primary,
  is_approved,
  uploaded_at
FROM club_photos
ORDER BY club_id, is_primary DESC, uploaded_at DESC;

-- 10. CLUB CONTACT DETAILS
-- ============================================
SELECT 
  id,
  club_id,
  country_code,
  phone_number,
  has_viber,
  has_whatsapp,
  has_telegram,
  created_at,
  updated_at
FROM club_contact_details
ORDER BY club_id;

-- 11. CLUB WORKING HOURS
-- ============================================
SELECT 
  id,
  club_id,
  working_hours_type,
  day_of_week,
  start_time,
  end_time,
  is_available
FROM club_working_hours
ORDER BY club_id, day_of_week;

-- 12. CLUB ANALYTICS
-- ============================================
SELECT 
  id,
  club_id,
  event_type,
  viewer_id,
  viewer_role,
  created_at
FROM club_analytics
ORDER BY created_at DESC
LIMIT 500;

-- 13. MODEL COMMENTS
-- ============================================
SELECT 
  mc.id,
  mc.user_id,
  mc.model_id,
  mc.comment_text,
  mc.rating,
  mc.status,
  mc.reviewed_at,
  mc.created_at,
  u.username as user_username,
  u.email as user_email,
  m.username as model_username,
  md.showname as model_showname
FROM model_comments mc
LEFT JOIN profiles u ON mc.user_id = u.id
LEFT JOIN profiles m ON mc.model_id = m.id
LEFT JOIN model_details md ON mc.model_id = md.model_id
ORDER BY mc.created_at DESC;

-- 14. FAVORITES
-- ============================================
SELECT 
  f.id,
  f.user_id,
  f.model_id,
  f.created_at,
  u.username as user_username,
  m.username as model_username,
  md.showname as model_showname
FROM favorites f
LEFT JOIN profiles u ON f.user_id = u.id
LEFT JOIN profiles m ON f.model_id = m.id
LEFT JOIN model_details md ON f.model_id = md.model_id
ORDER BY f.created_at DESC;

-- 15. MODEL INVITES
-- ============================================
SELECT 
  mi.id,
  mi.club_id,
  mi.model_id,
  mi.status,
  mi.invited_at,
  mi.responded_at,
  c.username as club_username,
  cd.club_name,
  m.username as model_username,
  md.showname as model_showname
FROM model_invites mi
LEFT JOIN profiles c ON mi.club_id = c.id
LEFT JOIN club_details cd ON mi.club_id = cd.club_id
LEFT JOIN profiles m ON mi.model_id = m.id
LEFT JOIN model_details md ON mi.model_id = md.model_id
ORDER BY mi.invited_at DESC;

-- 16. PRODUCTS (Ad Packages)
-- ============================================
SELECT 
  id,
  name,
  description,
  price,
  duration_days,
  product_type,
  features,
  is_active,
  created_at,
  updated_at
FROM products
ORDER BY product_type, price;

-- 17. ORDERS
-- ============================================
SELECT 
  o.id,
  o.user_id,
  o.total_amount,
  o.status,
  o.payment_method,
  o.created_at,
  p.username,
  p.email,
  p.role
FROM orders o
LEFT JOIN profiles p ON o.user_id = p.id
ORDER BY o.created_at DESC;

-- 18. ORDER ITEMS
-- ============================================
SELECT 
  oi.id,
  oi.order_id,
  oi.product_id,
  oi.quantity,
  oi.price,
  oi.activation_date,
  oi.expiration_date,
  pr.name as product_name,
  pr.product_type,
  pr.duration_days
FROM order_items oi
LEFT JOIN products pr ON oi.product_id = pr.id
ORDER BY oi.activation_date DESC;

-- 19. BANNERS
-- ============================================
SELECT 
  b.id,
  b.user_id,
  b.banner_url,
  b.banner_order,
  b.advertising_text,
  b.contact_phone,
  b.contact_email,
  b.contact_website,
  b.uploaded_at,
  b.is_approved,
  b.is_active,
  p.username,
  p.role
FROM banners b
LEFT JOIN profiles p ON b.user_id = p.id
ORDER BY b.banner_order, b.uploaded_at DESC;

-- 20. NOTIFICATIONS
-- ============================================
SELECT 
  id,
  user_id,
  title,
  message,
  type,
  related_id,
  is_read,
  created_at
FROM notifications
ORDER BY created_at DESC
LIMIT 200;

-- ============================================
-- SUMMARY STATISTICS
-- ============================================

-- Total counts
SELECT 
  'Total Users' as metric,
  COUNT(*) as count
FROM profiles
UNION ALL
SELECT 
  'Total Models' as metric,
  COUNT(*) as count
FROM profiles WHERE role = 'model'
UNION ALL
SELECT 
  'Total Clubs' as metric,
  COUNT(*) as count
FROM profiles WHERE role = 'company'
UNION ALL
SELECT 
  'Total Regular Users' as metric,
  COUNT(*) as count
FROM profiles WHERE role = 'user'
UNION ALL
SELECT 
  'Total Admins' as metric,
  COUNT(*) as count
FROM profiles WHERE role = 'admin'
UNION ALL
SELECT 
  'Verified Models' as metric,
  COUNT(*) as count
FROM profiles WHERE role = 'model' AND is_verified = TRUE
UNION ALL
SELECT 
  'Active Models' as metric,
  COUNT(*) as count
FROM profiles WHERE role = 'model' AND profile_status = 'active'
UNION ALL
SELECT 
  'Total Model Photos' as metric,
  COUNT(*) as count
FROM model_photos
UNION ALL
SELECT 
  'Approved Model Photos' as metric,
  COUNT(*) as count
FROM model_photos WHERE is_approved = TRUE
UNION ALL
SELECT 
  'Total Comments' as metric,
  COUNT(*) as count
FROM model_comments
UNION ALL
SELECT 
  'Approved Comments' as metric,
  COUNT(*) as count
FROM model_comments WHERE status = 'approved'
UNION ALL
SELECT 
  'Pending Comments' as metric,
  COUNT(*) as count
FROM model_comments WHERE status = 'pending'
UNION ALL
SELECT 
  'Total Favorites' as metric,
  COUNT(*) as count
FROM favorites
UNION ALL
SELECT 
  'Total Orders' as metric,
  COUNT(*) as count
FROM orders
UNION ALL
SELECT 
  'Total Invites' as metric,
  COUNT(*) as count
FROM model_invites;

-- ============================================
-- ACTIVE ADS SNAPSHOT
-- ============================================

-- Models with active ads
SELECT 
  p.username,
  md.showname,
  md.city,
  COUNT(mp.id) as photo_count,
  p.is_verified,
  p.profile_status
FROM profiles p
LEFT JOIN model_details md ON p.id = md.model_id
LEFT JOIN model_photos mp ON p.id = mp.model_id AND mp.is_approved = TRUE
WHERE p.role = 'model'
  AND EXISTS (
    SELECT 1 FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN products pr ON oi.product_id = pr.id
    WHERE o.user_id = p.id
      AND pr.product_type = 'model_ad'
      AND COALESCE(oi.activation_date, o.created_at) <= NOW()
      AND (COALESCE(oi.activation_date, o.created_at) + (pr.duration_days || ' days')::INTERVAL) > NOW()
  )
GROUP BY p.id, p.username, md.showname, md.city, p.is_verified, p.profile_status
ORDER BY md.city, md.showname;

-- Clubs with active ads
SELECT 
  p.username,
  cd.club_name,
  cd.club_type,
  cd.area,
  COUNT(cp.id) as photo_count
FROM profiles p
LEFT JOIN club_details cd ON p.id = cd.club_id
LEFT JOIN club_photos cp ON p.id = cp.club_id AND cp.is_approved = TRUE
WHERE p.role = 'company'
  AND EXISTS (
    SELECT 1 FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN products pr ON oi.product_id = pr.id
    WHERE o.user_id = p.id
      AND pr.product_type = 'club_ad'
      AND COALESCE(oi.activation_date, o.created_at) <= NOW()
      AND (COALESCE(oi.activation_date, o.created_at) + (pr.duration_days || ' days')::INTERVAL) > NOW()
  )
GROUP BY p.id, p.username, cd.club_name, cd.club_type, cd.area
ORDER BY cd.area, cd.club_name;
