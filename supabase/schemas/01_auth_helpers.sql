-- Helper to get current auth user's email
CREATE FUNCTION public.auth_email()
returns text
language sql
security definer set search_path = ''
stable
as $$
  select email from auth.users where id = auth.uid();
$$;


