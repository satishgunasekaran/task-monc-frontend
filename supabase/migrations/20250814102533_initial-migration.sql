create type "public"."organization_role" as enum ('owner', 'admin', 'member');


  create table "public"."organization_invitations" (
    "id" uuid not null default uuid_generate_v4(),
    "organization_id" uuid not null,
    "email" text not null,
    "role" organization_role not null default 'member'::organization_role,
    "token" uuid not null default uuid_generate_v4(),
    "invited_by" uuid,
    "created_at" timestamp with time zone not null default now(),
    "expires_at" timestamp with time zone not null default (now() + '7 days'::interval),
    "accepted_at" timestamp with time zone,
    "revoked_at" timestamp with time zone
      );


alter table "public"."organization_invitations" enable row level security;


  create table "public"."organization_memberships" (
    "id" uuid not null default uuid_generate_v4(),
    "organization_id" uuid not null,
    "user_id" uuid not null,
    "role" organization_role not null default 'member'::organization_role,
    "joined_at" timestamp with time zone not null default now(),
    "invited_by" uuid
      );


alter table "public"."organization_memberships" enable row level security;


  create table "public"."organizations" (
    "id" uuid not null default uuid_generate_v4(),
    "name" text not null,
    "slug" text not null,
    "description" text,
    "logo_url" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "created_by" uuid
      );


alter table "public"."organizations" enable row level security;


  create table "public"."user_profiles" (
    "id" uuid not null,
    "email" text,
    "first_name" text,
    "last_name" text,
    "full_name" text generated always as (
CASE
    WHEN ((first_name IS NOT NULL) AND (last_name IS NOT NULL)) THEN ((first_name || ' '::text) || last_name)
    WHEN (first_name IS NOT NULL) THEN first_name
    WHEN (last_name IS NOT NULL) THEN last_name
    ELSE NULL::text
END) stored,
    "avatar_url" text,
    "phone" text,
    "bio" text,
    "website" text,
    "location" text,
    "timezone" text default 'UTC'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."user_profiles" enable row level security;

CREATE INDEX idx_org_invitations_email ON public.organization_invitations USING btree (email);

CREATE INDEX idx_org_invitations_org_id ON public.organization_invitations USING btree (organization_id);

CREATE INDEX idx_org_memberships_org_id ON public.organization_memberships USING btree (organization_id);

CREATE INDEX idx_org_memberships_role ON public.organization_memberships USING btree (role);

CREATE INDEX idx_org_memberships_user_id ON public.organization_memberships USING btree (user_id);

CREATE INDEX idx_organizations_slug ON public.organizations USING btree (slug);

CREATE INDEX idx_user_profiles_email ON public.user_profiles USING btree (email);

CREATE INDEX idx_user_profiles_full_name ON public.user_profiles USING btree (full_name);

CREATE UNIQUE INDEX organization_invitations_pkey ON public.organization_invitations USING btree (id);

CREATE UNIQUE INDEX organization_invitations_token_key ON public.organization_invitations USING btree (token);

CREATE UNIQUE INDEX organization_memberships_organization_id_user_id_key ON public.organization_memberships USING btree (organization_id, user_id);

CREATE UNIQUE INDEX organization_memberships_pkey ON public.organization_memberships USING btree (id);

CREATE UNIQUE INDEX organizations_pkey ON public.organizations USING btree (id);

CREATE UNIQUE INDEX organizations_slug_key ON public.organizations USING btree (slug);

CREATE UNIQUE INDEX user_profiles_pkey ON public.user_profiles USING btree (id);

alter table "public"."organization_invitations" add constraint "organization_invitations_pkey" PRIMARY KEY using index "organization_invitations_pkey";

alter table "public"."organization_memberships" add constraint "organization_memberships_pkey" PRIMARY KEY using index "organization_memberships_pkey";

alter table "public"."organizations" add constraint "organizations_pkey" PRIMARY KEY using index "organizations_pkey";

alter table "public"."user_profiles" add constraint "user_profiles_pkey" PRIMARY KEY using index "user_profiles_pkey";

alter table "public"."organization_invitations" add constraint "organization_invitations_invited_by_fkey" FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."organization_invitations" validate constraint "organization_invitations_invited_by_fkey";

alter table "public"."organization_invitations" add constraint "organization_invitations_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE not valid;

alter table "public"."organization_invitations" validate constraint "organization_invitations_organization_id_fkey";

alter table "public"."organization_invitations" add constraint "organization_invitations_token_key" UNIQUE using index "organization_invitations_token_key";

alter table "public"."organization_memberships" add constraint "organization_memberships_invited_by_fkey" FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."organization_memberships" validate constraint "organization_memberships_invited_by_fkey";

alter table "public"."organization_memberships" add constraint "organization_memberships_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE not valid;

alter table "public"."organization_memberships" validate constraint "organization_memberships_organization_id_fkey";

alter table "public"."organization_memberships" add constraint "organization_memberships_organization_id_user_id_key" UNIQUE using index "organization_memberships_organization_id_user_id_key";

alter table "public"."organization_memberships" add constraint "organization_memberships_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."organization_memberships" validate constraint "organization_memberships_user_id_fkey";

alter table "public"."organizations" add constraint "organizations_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."organizations" validate constraint "organizations_created_by_fkey";

alter table "public"."organizations" add constraint "organizations_slug_key" UNIQUE using index "organizations_slug_key";

alter table "public"."user_profiles" add constraint "user_profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_profiles" validate constraint "user_profiles_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.accept_org_invitation(p_token uuid)
 RETURNS organization_memberships
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.auth_email()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select email from auth.users where id = auth.uid();
$function$
;

CREATE OR REPLACE FUNCTION public.can_view_invited_org(p_org uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1
    from public.organization_invitations inv
    where inv.organization_id = p_org
      and lower(inv.email) = lower(public.auth_email())
      and inv.revoked_at is null
      and inv.accepted_at is null
      and now() < inv.expires_at
  );
$function$
;

CREATE OR REPLACE FUNCTION public.can_view_inviter_profile(p_inviter uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1
    from public.organization_invitations inv
    where lower(inv.email) = lower(public.auth_email())
      and inv.invited_by = p_inviter
      and inv.revoked_at is null
      and inv.accepted_at is null
      and now() < inv.expires_at
  );
$function$
;

CREATE OR REPLACE FUNCTION public.can_view_profile(p_target uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1
    from public.organization_memberships m_self
    join public.organization_memberships m_other
      on m_self.organization_id = m_other.organization_id
    where m_self.user_id = auth.uid()
      and m_other.user_id = p_target
  );
$function$
;

CREATE OR REPLACE FUNCTION public.create_org_invitation(p_organization_id uuid, p_email text, p_role organization_role DEFAULT 'member'::organization_role)
 RETURNS organization_invitations
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_organization_role(org_id uuid, user_id uuid DEFAULT auth.uid())
 RETURNS organization_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select role
  from public.organization_memberships m
  where m.organization_id = org_id and m.user_id = get_user_organization_role.user_id
  limit 1;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.is_organization_admin(org_id uuid, user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1 from public.organization_memberships m
    where m.organization_id = org_id
      and m.user_id = is_organization_admin.user_id
      and m.role in ('owner','admin')
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_organization_member(org_id uuid, user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1 from public.organization_memberships m
    where m.organization_id = org_id
      and m.user_id = is_organization_member.user_id
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_organization_owner(org_id uuid, user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1 from public.organization_memberships m
    where m.organization_id = org_id
      and m.user_id = is_organization_owner.user_id
      and m.role = 'owner'
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_owner(resource_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select resource_user_id = (select auth.uid());
$function$
;

grant delete on table "public"."organization_invitations" to "anon";

grant insert on table "public"."organization_invitations" to "anon";

grant references on table "public"."organization_invitations" to "anon";

grant select on table "public"."organization_invitations" to "anon";

grant trigger on table "public"."organization_invitations" to "anon";

grant truncate on table "public"."organization_invitations" to "anon";

grant update on table "public"."organization_invitations" to "anon";

grant delete on table "public"."organization_invitations" to "authenticated";

grant insert on table "public"."organization_invitations" to "authenticated";

grant references on table "public"."organization_invitations" to "authenticated";

grant select on table "public"."organization_invitations" to "authenticated";

grant trigger on table "public"."organization_invitations" to "authenticated";

grant truncate on table "public"."organization_invitations" to "authenticated";

grant update on table "public"."organization_invitations" to "authenticated";

grant delete on table "public"."organization_invitations" to "service_role";

grant insert on table "public"."organization_invitations" to "service_role";

grant references on table "public"."organization_invitations" to "service_role";

grant select on table "public"."organization_invitations" to "service_role";

grant trigger on table "public"."organization_invitations" to "service_role";

grant truncate on table "public"."organization_invitations" to "service_role";

grant update on table "public"."organization_invitations" to "service_role";

grant delete on table "public"."organization_memberships" to "anon";

grant insert on table "public"."organization_memberships" to "anon";

grant references on table "public"."organization_memberships" to "anon";

grant select on table "public"."organization_memberships" to "anon";

grant trigger on table "public"."organization_memberships" to "anon";

grant truncate on table "public"."organization_memberships" to "anon";

grant update on table "public"."organization_memberships" to "anon";

grant delete on table "public"."organization_memberships" to "authenticated";

grant insert on table "public"."organization_memberships" to "authenticated";

grant references on table "public"."organization_memberships" to "authenticated";

grant select on table "public"."organization_memberships" to "authenticated";

grant trigger on table "public"."organization_memberships" to "authenticated";

grant truncate on table "public"."organization_memberships" to "authenticated";

grant update on table "public"."organization_memberships" to "authenticated";

grant delete on table "public"."organization_memberships" to "service_role";

grant insert on table "public"."organization_memberships" to "service_role";

grant references on table "public"."organization_memberships" to "service_role";

grant select on table "public"."organization_memberships" to "service_role";

grant trigger on table "public"."organization_memberships" to "service_role";

grant truncate on table "public"."organization_memberships" to "service_role";

grant update on table "public"."organization_memberships" to "service_role";

grant delete on table "public"."organizations" to "anon";

grant insert on table "public"."organizations" to "anon";

grant references on table "public"."organizations" to "anon";

grant select on table "public"."organizations" to "anon";

grant trigger on table "public"."organizations" to "anon";

grant truncate on table "public"."organizations" to "anon";

grant update on table "public"."organizations" to "anon";

grant delete on table "public"."organizations" to "authenticated";

grant insert on table "public"."organizations" to "authenticated";

grant references on table "public"."organizations" to "authenticated";

grant select on table "public"."organizations" to "authenticated";

grant trigger on table "public"."organizations" to "authenticated";

grant truncate on table "public"."organizations" to "authenticated";

grant update on table "public"."organizations" to "authenticated";

grant delete on table "public"."organizations" to "service_role";

grant insert on table "public"."organizations" to "service_role";

grant references on table "public"."organizations" to "service_role";

grant select on table "public"."organizations" to "service_role";

grant trigger on table "public"."organizations" to "service_role";

grant truncate on table "public"."organizations" to "service_role";

grant update on table "public"."organizations" to "service_role";

grant delete on table "public"."user_profiles" to "anon";

grant insert on table "public"."user_profiles" to "anon";

grant references on table "public"."user_profiles" to "anon";

grant select on table "public"."user_profiles" to "anon";

grant trigger on table "public"."user_profiles" to "anon";

grant truncate on table "public"."user_profiles" to "anon";

grant update on table "public"."user_profiles" to "anon";

grant delete on table "public"."user_profiles" to "authenticated";

grant insert on table "public"."user_profiles" to "authenticated";

grant references on table "public"."user_profiles" to "authenticated";

grant select on table "public"."user_profiles" to "authenticated";

grant trigger on table "public"."user_profiles" to "authenticated";

grant truncate on table "public"."user_profiles" to "authenticated";

grant update on table "public"."user_profiles" to "authenticated";

grant delete on table "public"."user_profiles" to "service_role";

grant insert on table "public"."user_profiles" to "service_role";

grant references on table "public"."user_profiles" to "service_role";

grant select on table "public"."user_profiles" to "service_role";

grant trigger on table "public"."user_profiles" to "service_role";

grant truncate on table "public"."user_profiles" to "service_role";

grant update on table "public"."user_profiles" to "service_role";


  create policy "Admins and invitees can view invitations"
  on "public"."organization_invitations"
  as permissive
  for select
  to authenticated
using ((is_organization_admin(organization_id) OR (lower(email) = lower(auth_email()))));



  create policy "Admins can create invitations"
  on "public"."organization_invitations"
  as permissive
  for insert
  to authenticated
with check (is_organization_admin(organization_id));



  create policy "Admins can update invitations"
  on "public"."organization_invitations"
  as permissive
  for update
  to authenticated
using (is_organization_admin(organization_id));



  create policy "Organization members can view memberships"
  on "public"."organization_memberships"
  as permissive
  for select
  to authenticated
using (is_organization_member(organization_id));



  create policy "Organization owners and admins can delete memberships"
  on "public"."organization_memberships"
  as permissive
  for delete
  to authenticated
using (is_organization_admin(organization_id));



  create policy "Organization owners and admins can manage memberships"
  on "public"."organization_memberships"
  as permissive
  for insert
  to authenticated
with check ((is_organization_admin(organization_id) OR ((user_id = ( SELECT auth.uid() AS uid)) AND (role = 'owner'::organization_role) AND (EXISTS ( SELECT 1
   FROM organizations o
  WHERE ((o.id = organization_memberships.organization_id) AND (o.created_by = ( SELECT auth.uid() AS uid)))))) OR (EXISTS ( SELECT 1
   FROM organizations o
  WHERE ((o.id = organization_memberships.organization_id) AND (o.created_by = ( SELECT auth.uid() AS uid)))))));



  create policy "Organization owners and admins can update memberships"
  on "public"."organization_memberships"
  as permissive
  for update
  to authenticated
using (is_organization_admin(organization_id));



  create policy "Authenticated users can create organizations"
  on "public"."organizations"
  as permissive
  for insert
  to authenticated
with check ((created_by = ( SELECT auth.uid() AS uid)));



  create policy "Organization owners and admins can update"
  on "public"."organizations"
  as permissive
  for update
  to authenticated
using (is_organization_admin(id))
with check (is_organization_admin(id));



  create policy "Organization owners can delete"
  on "public"."organizations"
  as permissive
  for delete
  to authenticated
using (is_organization_owner(id));



  create policy "Organizations: members/creators/invitees can view"
  on "public"."organizations"
  as permissive
  for select
  to authenticated
using ((is_organization_member(id) OR (created_by = ( SELECT auth.uid() AS uid)) OR can_view_invited_org(id)));



  create policy "Profiles: members/own/invitee can view"
  on "public"."user_profiles"
  as permissive
  for select
  to authenticated
using ((is_owner(id) OR can_view_profile(id) OR can_view_inviter_profile(id)));



  create policy "Users can insert own profile"
  on "public"."user_profiles"
  as permissive
  for insert
  to authenticated
with check (is_owner(id));



  create policy "Users can update own profile"
  on "public"."user_profiles"
  as permissive
  for update
  to authenticated
using (is_owner(id))
with check (is_owner(id));


CREATE TRIGGER handle_updated_at_organizations BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_updated_at_user_profiles BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();


