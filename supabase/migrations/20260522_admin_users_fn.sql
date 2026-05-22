-- Admin RPC: returns all users with profile + activity summary
-- Security definer so it can read auth.users; guarded by app-layer admin check + PIN
CREATE OR REPLACE FUNCTION public.get_users_admin()
RETURNS TABLE(
  id              uuid,
  email           text,
  full_name       text,
  joined_at       timestamptz,
  last_sign_in_at timestamptz,
  days_count      bigint
)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
  SELECT
    p.id,
    u.email,
    p.full_name,
    p.created_at          AS joined_at,
    u.last_sign_in_at,
    COUNT(d.id)::bigint   AS days_count
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  LEFT JOIN public.days d ON d.user_id = p.id
  GROUP BY p.id, u.email, p.full_name, p.created_at, u.last_sign_in_at
  ORDER BY p.created_at DESC;
$$;

-- Grant to authenticated (admin app-layer already checks email + PIN)
GRANT EXECUTE ON FUNCTION public.get_users_admin() TO authenticated;
