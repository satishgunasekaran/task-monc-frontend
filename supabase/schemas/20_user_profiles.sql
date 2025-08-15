-- User profiles table, helper, triggers, and policies

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  first_name text,
  last_name text,
  full_name text generated always as (
    case 
      when first_name is not null and last_name is not null then first_name || ' ' || last_name
      when first_name is not null then first_name
      when last_name is not null then last_name
      else null
    end
  ) stored,
  avatar_url text,
  phone text,
  bio text,
  website text,
  location text,
  timezone text default 'UTC',
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create index if not exists idx_user_profiles_email on public.user_profiles(email);
create index if not exists idx_user_profiles_full_name on public.user_profiles(full_name);

alter table public.user_profiles enable row level security;

-- Generic helper for ownership checks
CREATE FUNCTION public.is_owner(resource_user_id uuid)
returns boolean
language sql
security definer set search_path = ''
stable
as $$
  select resource_user_id = (select auth.uid());
$$;

-- Keep timestamps fresh
create trigger handle_updated_at_user_profiles
  before update on public.user_profiles
  for each row execute procedure public.handle_updated_at();

-- Policies for profiles
create policy "Profiles: members/own/invitee can view"
  on public.user_profiles for select
  to authenticated
  using (
    public.is_owner(id)
    or public.can_view_profile(id)
    or public.can_view_inviter_profile(id)
  );

create policy "Users can update own profile"
  on public.user_profiles for update
  to authenticated
  using ( public.is_owner(id) )
  with check ( public.is_owner(id) );

create policy "Users can insert own profile"
  on public.user_profiles for insert
  to authenticated
  with check ( public.is_owner(id) );

-- Grants and comments
grant all on public.user_profiles to authenticated;
comment on table public.user_profiles is 'Extended user profile information linked to auth.users';
comment on column public.user_profiles.full_name is 'Generated column combining first and last name';


