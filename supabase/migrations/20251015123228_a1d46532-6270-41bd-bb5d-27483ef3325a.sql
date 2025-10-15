-- Assign admin role to the admin user
-- This will work after you sign up with admin@inspaya.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'admin@inspaya.com'
ON CONFLICT (user_id, role) DO NOTHING;