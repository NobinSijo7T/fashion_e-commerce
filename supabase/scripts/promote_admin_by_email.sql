-- Run in Supabase SQL Editor AFTER:
-- 1) 20260412120000_admin_dashboard.sql has been applied
-- 2) The user exists in Authentication (same email as below)
--
-- Links profile row (from signup trigger) to admin role.

UPDATE public.profiles AS p
SET is_admin = true
FROM auth.users AS u
WHERE p.id = u.id
  AND lower(u.email) = lower('clothstore103@gmail.com');

-- Verify (optional):
-- SELECT id, email, is_admin FROM public.profiles WHERE email ILIKE 'clothstore103@gmail.com';
