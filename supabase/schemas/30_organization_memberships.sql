-- Organization memberships table, helper functions, and policies

create table if not exists public.organization_memberships (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.organization_role not null default 'member',
  joined_at timestamp with time zone default now() not null,
  invited_by uuid references auth.users(id) on delete set null,
  unique(organization_id, user_id)
);

create index if not exists idx_org_memberships_org_id on public.organization_memberships(organization_id);
create index if not exists idx_org_memberships_user_id on public.organization_memberships(user_id);
create index if not exists idx_org_memberships_role on public.organization_memberships(role);

alter table public.organization_memberships enable row level security;

-- Helper functions for org role checks
CREATE FUNCTION public.is_organization_member(org_id uuid, user_id uuid default auth.uid())
returns boolean
language sql
security definer set search_path = ''
stable
as $$
  select exists (
    select 1 from public.organization_memberships m
    where m.organization_id = org_id
      and m.user_id = is_organization_member.user_id
  );
$$;

CREATE FUNCTION public.is_organization_owner(org_id uuid, user_id uuid default auth.uid())
returns boolean
language sql
security definer set search_path = ''
stable
as $$
  select exists (
    select 1 from public.organization_memberships m
    where m.organization_id = org_id
      and m.user_id = is_organization_owner.user_id
      and m.role = 'owner'
  );
$$;

CREATE FUNCTION public.is_organization_admin(org_id uuid, user_id uuid default auth.uid())
returns boolean
language sql
security definer set search_path = ''
stable
as $$
  select exists (
    select 1 from public.organization_memberships m
    where m.organization_id = org_id
      and m.user_id = is_organization_admin.user_id
      and m.role in ('owner','admin')
  );
$$;

CREATE FUNCTION public.get_user_organization_role(org_id uuid, user_id uuid default auth.uid())
returns public.organization_role
language sql
security definer set search_path = ''
stable
as $$
  select role
  from public.organization_memberships m
  where m.organization_id = org_id and m.user_id = get_user_organization_role.user_id
  limit 1;
$$;

-- Used by profile visibility
CREATE FUNCTION public.can_view_profile(p_target uuid)
returns boolean
language sql
security definer set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.organization_memberships m_self
    join public.organization_memberships m_other
      on m_self.organization_id = m_other.organization_id
    where m_self.user_id = auth.uid()
      and m_other.user_id = p_target
  );
$$;

-- Policies for memberships
create policy "Organization members can view memberships"
  on public.organization_memberships for select
  to authenticated
  using ( public.is_organization_member(organization_id) );

create policy "Organization owners and admins can manage memberships"
  on public.organization_memberships for insert
  to authenticated
  with check (
    public.is_organization_admin(organization_id) OR 
    (user_id = (select auth.uid()) AND role = 'owner' AND EXISTS (
      select 1 from public.organizations o
      where o.id = organization_id AND o.created_by = (select auth.uid())
    )) OR
    (EXISTS (
      select 1 from public.organizations o
      where o.id = organization_id AND o.created_by = (select auth.uid())
    ))
  );

create policy "Organization owners and admins can update memberships"
  on public.organization_memberships for update
  to authenticated
  using ( public.is_organization_admin(organization_id) );

create policy "Organization owners and admins can delete memberships"
  on public.organization_memberships for delete
  to authenticated
  using ( public.is_organization_admin(organization_id) );

-- Grants and comments
grant all on public.organization_memberships to authenticated;
comment on table public.organization_memberships is 'Junction table for user-organization relationships with roles';
comment on column public.organization_memberships.role is 'User role within the organization: owner, admin, or member';


