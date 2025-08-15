-- Projects table for organizing tasks within organizations
-- Project status enum
create type public.project_status as enum (
  'planning',
  'active',
  'completed',
  'on_hold',
  'cancelled'
);

-- Project priority enum  
create type public.project_priority as enum ('low', 'medium', 'high', 'urgent');

create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4 (),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  description text,
  status public.project_status not null default 'planning',
  priority public.project_priority not null default 'medium',
  start_date date,
  due_date date,
  completed_at timestamp
  with
    time zone,
    color text, -- hex color for UI display
    created_at timestamp
  with
    time zone default now () not null,
    updated_at timestamp
  with
    time zone default now () not null,
    created_by uuid not null references auth.users (id) on delete set null,
    assigned_to uuid references auth.users (id) on delete set null -- project lead/manager
);

-- Indexes for better performance
create index if not exists idx_projects_organization_id on public.projects (organization_id);

create index if not exists idx_projects_status on public.projects (status);

create index if not exists idx_projects_priority on public.projects (priority);

create index if not exists idx_projects_created_by on public.projects (created_by);

create index if not exists idx_projects_assigned_to on public.projects (assigned_to);

create index if not exists idx_projects_due_date on public.projects (due_date);

-- Enable RLS
alter table public.projects enable row level security;

-- Keep timestamps fresh
create trigger handle_updated_at_projects before
update on public.projects for each row execute procedure public.handle_updated_at ();

-- Policies for projects
create policy "Organization members can view projects" on public.projects for
select
  to authenticated using (public.is_organization_member (organization_id));

create policy "Organization members can create projects" on public.projects for insert to authenticated
with
  check (
    public.is_organization_member (organization_id)
    and created_by = (
      select
        auth.uid ()
    )
  );

create policy "Project creators and organization admins can update projects" on public.projects for
update to authenticated using (
  public.is_organization_member (organization_id)
  and (
    created_by = (
      select
        auth.uid ()
    )
    or assigned_to = (
      select
        auth.uid ()
    )
    or public.is_organization_admin (organization_id)
  )
);

create policy "Project creators and organization admins can delete projects" on public.projects for delete to authenticated using (
  public.is_organization_member (organization_id)
  and (
    created_by = (
      select
        auth.uid ()
    )
    or public.is_organization_admin (organization_id)
  )
);

-- Grants
grant all on public.projects to authenticated;

-- Comments
comment on table public.projects is 'Projects within organizations for organizing tasks';

comment on column public.projects.status is 'Current status of the project';

comment on column public.projects.priority is 'Priority level of the project';

comment on column public.projects.assigned_to is 'User assigned as project lead/manager';

comment on column public.projects.color is 'Hex color code for UI display';
