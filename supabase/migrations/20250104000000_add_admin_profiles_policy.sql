-- Add policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles" ON "public"."profiles"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au
    JOIN public.roles r ON au.role_id = r.id
    WHERE au.user_id = auth.uid()
    AND au.is_active = TRUE
    AND r.is_active = TRUE
  )
);

-- Add policy for admins to update all profiles
CREATE POLICY "Admins can update all profiles" ON "public"."profiles"
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au
    JOIN public.roles r ON au.role_id = r.id
    WHERE au.user_id = auth.uid()
    AND au.is_active = TRUE
    AND r.is_active = TRUE
  )
);
