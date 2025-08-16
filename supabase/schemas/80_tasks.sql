-- Tasks table and related enums

-- Task status enum
create type public.task_status as enum ('todo', 'in_progress', 'review', 'completed', 'cancelled');

-- Task priority enum
create type public.task_priority as enum ('low', 'medium', 'high', 'urgent');

create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade, -- nullable for standalone tasks
  parent_task_id uuid references public.tasks(id) on delete cascade, -- for subtasks
  title text not null,
  description text,
  status public.task_status not null default 'todo',
  priority public.task_priority not null default 'medium',
  start_date date,
  due_date date,
  completed_at timestamp with time zone,
  estimated_hours integer, -- estimated time in hours
  actual_hours integer, -- actual time spent in hours
  position integer default 0, -- for ordering tasks within a project/parent
  tags text[], -- array of tags for categorization
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  created_by uuid not null references auth.users(id) on delete set null,
  assigned_to uuid references auth.users(id) on delete set null,
  
  -- Constraints
  constraint tasks_no_self_parent check (id != parent_task_id),
  constraint tasks_estimated_hours_positive check (estimated_hours >= 0),
  constraint tasks_actual_hours_positive check (actual_hours >= 0)
);

-- Indexes for better performance
create index if not exists idx_tasks_organization_id on public.tasks(organization_id);
create index if not exists idx_tasks_project_id on public.tasks(project_id);
create index if not exists idx_tasks_parent_task_id on public.tasks(parent_task_id);
create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_tasks_priority on public.tasks(priority);
create index if not exists idx_tasks_created_by on public.tasks(created_by);
create index if not exists idx_tasks_assigned_to on public.tasks(assigned_to);
create index if not exists idx_tasks_due_date on public.tasks(due_date);
create index if not exists idx_tasks_position on public.tasks(project_id, position);
create index if not exists idx_tasks_tags on public.tasks using gin(tags);

-- Enable RLS
alter table public.tasks enable row level security;

-- Keep timestamps fresh
create trigger handle_updated_at_tasks 
  before update on public.tasks 
  for each row execute procedure public.handle_updated_at();

-- Function to auto-update completed_at timestamp
create or replace function public.handle_task_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Set completed_at when status changes to completed
  if NEW.status = 'completed' and OLD.status != 'completed' then
    NEW.completed_at = now();
  -- Clear completed_at when status changes from completed
  elsif NEW.status != 'completed' and OLD.status = 'completed' then
    NEW.completed_at = null;
  end if;
  
  return NEW;
end;
$$;

-- Trigger to auto-update completed_at
create trigger handle_task_status_change_trigger
  before update on public.tasks
  for each row execute procedure public.handle_task_status_change();

-- Helper function to check if user can access task
create or replace function public.can_access_task(task_id uuid, user_id uuid default auth.uid())
returns boolean
language sql
security definer set search_path = ''
stable
as $$
  select exists (
    select 1 from public.tasks t
    where t.id = task_id
      and public.is_organization_member(t.organization_id, user_id)
  );
$$;

-- Policies for tasks
create policy "Organization members can view tasks"
  on public.tasks for select
  to authenticated
  using ( public.is_organization_member(organization_id) );

create policy "Organization members can create tasks"
  on public.tasks for insert
  to authenticated
  with check ( 
    public.is_organization_member(organization_id) 
    and created_by = (select auth.uid())
    -- If it's a subtask, check parent task access
    and (parent_task_id is null or public.can_access_task(parent_task_id))
    -- If it's in a project, check project access
    and (project_id is null or exists (
      select 1 from public.projects p 
      where p.id = project_id 
      and public.is_organization_member(p.organization_id)
    ))
  );

create policy "Task assignees, creators, and organization admins can update tasks"
  on public.tasks for update
  to authenticated
  using ( 
    public.is_organization_member(organization_id) and (
      created_by = (select auth.uid()) or
      assigned_to = (select auth.uid()) or
      public.is_organization_admin(organization_id)
    )
  );

create policy "Task creators and organization admins can delete tasks"
  on public.tasks for delete
  to authenticated
  using ( 
    public.is_organization_member(organization_id) and (
      created_by = (select auth.uid()) or
      public.is_organization_admin(organization_id)
    )
  );

-- Grants
grant all on public.tasks to authenticated;

-- Comments
comment on table public.tasks is 'Tasks within organizations, can be standalone or part of projects, supports subtasks';
comment on column public.tasks.parent_task_id is 'Reference to parent task for creating subtasks';
comment on column public.tasks.position is 'Position for ordering tasks within a project or parent task';
comment on column public.tasks.tags is 'Array of tags for categorization and filtering';
comment on column public.tasks.estimated_hours is 'Estimated time to complete task in hours';
comment on column public.tasks.actual_hours is 'Actual time spent on task in hours';
