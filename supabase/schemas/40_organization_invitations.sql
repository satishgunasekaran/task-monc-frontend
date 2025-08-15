-- Organization invitations table, RPCs, helpers, and policies

create table if not exists public.organization_invitations (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role public.organization_role not null default 'member',
  token uuid not null unique default uuid_generate_v4(),
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default now() not null,
  expires_at timestamp with time zone default (now() + interval '7 days') not null,
  accepted_at timestamp with time zone,
  revoked_at timestamp with time zone
);

create index if not exists idx_org_invitations_org_id on public.organization_invitations(organization_id);
create index if not exists idx_org_invitations_email on public.organization_invitations(email);

alter table public.organization_invitations enable row level security;

-- Helpers for invite-based visibility
CREATE FUNCTION public.can_view_inviter_profile(p_inviter uuid)
returns boolean
language sql
security definer set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.organization_invitations inv
    where lower(inv.email) = lower(public.auth_email())
      and inv.invited_by = p_inviter
      and inv.revoked_at is null
      and inv.accepted_at is null
      and now() < inv.expires_at
  );
$$;

CREATE FUNCTION public.can_view_invited_org(p_org uuid)
returns boolean
language sql
security definer set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.organization_invitations inv
    where inv.organization_id = p_org
      and lower(inv.email) = lower(public.auth_email())
      and inv.revoked_at is null
      and inv.accepted_at is null
      and now() < inv.expires_at
  );
$$;

-- Secure RPCs
CREATE FUNCTION public.create_org_invitation(p_organization_id uuid, p_email text, p_role public.organization_role default 'member')
returns public.organization_invitations
language plpgsql
security definer set search_path = ''
as $$
declare
  v_inv public.organization_invitations;
begin
  if not public.is_organization_admin(p_organization_id) then
    raise exception 'not_authorized';
  end if;

  insert into public.organization_invitations (organization_id, email, role, invited_by)
  values (p_organization_id, lower(p_email), p_role, auth.uid())
  returning * into v_inv;
  return v_inv;
end;
$$;

CREATE FUNCTION public.accept_org_invitation(p_token uuid)
returns public.organization_memberships
language plpgsql
security definer set search_path = ''
as $$
declare
  v_inv public.organization_invitations;
  v_membership public.organization_memberships;
begin
  select * into v_inv
  from public.organization_invitations
  where token = p_token
    and revoked_at is null
    and accepted_at is null
    and now() < expires_at
  limit 1;

  if not found then
    raise exception 'invalid_or_expired_invitation';
  end if;

  if lower(v_inv.email) <> lower(public.auth_email()) then
    raise exception 'email_mismatch';
  end if;

  insert into public.organization_memberships (organization_id, user_id, role)
  values (v_inv.organization_id, auth.uid(), v_inv.role)
  on conflict (organization_id, user_id) do update set role = excluded.role
  returning * into v_membership;

  update public.organization_invitations
  set accepted_at = now()
  where id = v_inv.id;

  return v_membership;
end;
$$;

-- Policies for invitations
create policy "Admins and invitees can view invitations"
  on public.organization_invitations for select
  to authenticated
  using (
    public.is_organization_admin(organization_id)
    or lower(email) = lower(public.auth_email())
  );

create policy "Admins can create invitations"
  on public.organization_invitations for insert
  to authenticated
  with check ( public.is_organization_admin(organization_id) );

create policy "Admins can update invitations"
  on public.organization_invitations for update
  to authenticated
  using ( public.is_organization_admin(organization_id) );

-- Grants
grant all on public.organization_invitations to authenticated;


