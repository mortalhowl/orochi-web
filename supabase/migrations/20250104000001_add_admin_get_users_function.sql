-- Function for admins to get all users
CREATE OR REPLACE FUNCTION public.admin_get_all_profiles(
  search_text TEXT DEFAULT NULL,
  page_number INT DEFAULT 1,
  page_size INT DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  total_points INT,
  current_points INT,
  lifetime_points INT,
  rank_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  rank_name TEXT,
  rank_color TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users au
    JOIN public.roles r ON au.role_id = r.id
    WHERE au.user_id = auth.uid()
    AND au.is_active = TRUE
    AND r.is_active = TRUE
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Return profiles with rank info
  RETURN QUERY
  SELECT
    p.id,
    p.email,
    p.full_name,
    p.avatar_url,
    p.phone,
    p.total_points,
    p.current_points,
    p.lifetime_points,
    p.rank_id,
    p.created_at,
    p.updated_at,
    r.name as rank_name,
    r.color as rank_color
  FROM public.profiles p
  LEFT JOIN public.ranks r ON p.rank_id = r.id
  WHERE
    search_text IS NULL
    OR p.full_name ILIKE '%' || search_text || '%'
    OR p.email ILIKE '%' || search_text || '%'
    OR p.phone ILIKE '%' || search_text || '%'
  ORDER BY p.created_at DESC
  LIMIT page_size
  OFFSET (page_number - 1) * page_size;
END;
$$;

-- Function to get total count
CREATE OR REPLACE FUNCTION public.admin_get_profiles_count(
  search_text TEXT DEFAULT NULL
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_count INT;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users au
    JOIN public.roles r ON au.role_id = r.id
    WHERE au.user_id = auth.uid()
    AND au.is_active = TRUE
    AND r.is_active = TRUE
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  SELECT COUNT(*)
  INTO total_count
  FROM public.profiles p
  WHERE
    search_text IS NULL
    OR p.full_name ILIKE '%' || search_text || '%'
    OR p.email ILIKE '%' || search_text || '%'
    OR p.phone ILIKE '%' || search_text || '%';

  RETURN total_count;
END;
$$;
