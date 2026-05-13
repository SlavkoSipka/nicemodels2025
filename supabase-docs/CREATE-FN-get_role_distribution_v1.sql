-- Role counts for admin overview (replaces full-table profile role scan).
CREATE OR REPLACE FUNCTION get_role_distribution_v1()
RETURNS TABLE(role text, count bigint)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.role::text, COUNT(*)::bigint
  FROM profiles p
  GROUP BY p.role;
$$;

GRANT EXECUTE ON FUNCTION get_role_distribution_v1() TO service_role;
