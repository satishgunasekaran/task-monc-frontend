-- RLS policies for organizations (split due to cross-file dependencies)
-- Ensure RLS is enabled (no-op if already enabled)
alter table public.organizations enable row level security;

create policy "Organizations: members/creators/invitees can view" on public.organizations for
select
  to authenticated using (
    public.is_organization_member (id)
    or created_by = (
      select
        auth.uid ()
    )
    or public.can_view_invited_org (id)
  );

create policy "Organization owners and admins can update" on public.organizations for
update to authenticated using (public.is_organization_admin (id))
with
  check (public.is_organization_admin (id));

create policy "Authenticated users can create organizations" on public.organizations for insert to authenticated
with
  check (
    created_by = (
      select
        auth.uid ()
    )
  );

create policy "Organization owners can delete" on public.organizations for delete to authenticated using (public.is_organization_owner (id));
