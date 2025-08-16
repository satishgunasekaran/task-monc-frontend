-- Trigger to provision profile + default org on new auth user

CREATE FUNCTION public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  new_org_id uuid;
  user_name text;
begin
  -- Create user profile
  insert into public.user_profiles (id, email)
  values (new.id, new.email);

  -- Derive default org name from email
  user_name := split_part(new.email, '@', 1);

  -- Create default organization
  insert into public.organizations (name, slug, description, created_by)
  values (
    user_name || '''s Organization',
    user_name || '-org-' || substr(new.id::text, 1, 8),
    'Default organization for ' || new.email,
    new.id
  )
  returning id into new_org_id;

  -- Add user as owner
  insert into public.organization_memberships (organization_id, user_id, role)
  values (new_org_id, new.id, 'owner');

  return new;
end;
$$;

CREATE TRIGGER on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


