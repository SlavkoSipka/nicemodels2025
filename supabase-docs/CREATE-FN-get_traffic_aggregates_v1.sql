-- Aggregated traffic stats for admin (avoids shipping 20k raw page_views rows to Node).
CREATE OR REPLACE FUNCTION get_traffic_aggregates_v1(p_since timestamptz DEFAULT NULL)
RETURNS json
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
WITH filtered AS (
  SELECT *
  FROM page_views
  WHERE p_since IS NULL OR created_at >= p_since
),
daily AS (
  SELECT (created_at AT TIME ZONE 'UTC')::date AS d, COUNT(*)::bigint AS views
  FROM filtered
  GROUP BY 1
  ORDER BY 1
),
top_paths AS (
  SELECT COALESCE(NULLIF(TRIM(path), ''), '/') AS path, COUNT(*)::bigint AS views
  FROM filtered
  GROUP BY 1
  ORDER BY views DESC
  LIMIT 10
),
ref_raw AS (
  SELECT
    CASE
      WHEN referrer IS NULL OR TRIM(referrer) = '' THEN '(direct)'
      ELSE referrer
    END AS raw_ref
  FROM filtered
),
ref_norm AS (
  SELECT
    CASE
      WHEN raw_ref = '(direct)' THEN '(direct)'
      ELSE COALESCE(
        NULLIF(
          REGEXP_REPLACE(
            REGEXP_REPLACE(raw_ref, '^https?://(www\.)?', ''),
            '/.*$', ''
          ),
          ''
        ),
        raw_ref
      )
    END AS source
  FROM ref_raw
),
top_refs AS (
  SELECT source, COUNT(*)::bigint AS visits
  FROM ref_norm
  GROUP BY 1
  ORDER BY visits DESC
  LIMIT 10
),
role_agg AS (
  SELECT
    CASE
      WHEN viewer_id IS NULL THEN 'anonymous'
      ELSE COALESCE(NULLIF(TRIM(viewer_role::text), ''), 'user')
    END AS vr,
    COUNT(*)::bigint AS c
  FROM filtered
  GROUP BY 1
),
kpi AS (
  SELECT
    COUNT(*)::bigint AS total,
    COUNT(*) FILTER (WHERE viewer_id IS NOT NULL)::bigint AS logged_in,
    COUNT(DISTINCT COALESCE(session_id::text, viewer_id::text, id::text))::bigint AS uniq
  FROM filtered
)
SELECT json_build_object(
  'series', COALESCE((SELECT json_agg(json_build_object('date', d, 'views', views)) FROM daily), '[]'::json),
  'topPaths', COALESCE((SELECT json_agg(json_build_object('path', path, 'views', views)) FROM top_paths), '[]'::json),
  'topReferrers', COALESCE((SELECT json_agg(json_build_object('source', source, 'visits', visits)) FROM top_refs), '[]'::json),
  'roleCounts', COALESCE((SELECT json_object_agg(vr, c) FROM role_agg), '{}'::json),
  'kpis', (SELECT json_build_object(
    'total', total,
    'loggedIn', logged_in,
    'anonymous', GREATEST(total - logged_in, 0::bigint),
    'uniqueVisitors', uniq,
    'topPath', (SELECT path FROM top_paths LIMIT 1)
  ) FROM kpi)
);
$$;

GRANT EXECUTE ON FUNCTION get_traffic_aggregates_v1(timestamptz) TO service_role;
