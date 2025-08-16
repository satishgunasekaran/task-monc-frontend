create type "public"."project_priority" as enum ('low', 'medium', 'high', 'urgent');

create type "public"."project_status" as enum ('planning', 'active', 'completed', 'on_hold', 'cancelled');

create type "public"."task_priority" as enum ('low', 'medium', 'high', 'urgent');

create type "public"."task_status" as enum ('todo', 'in_progress', 'review', 'completed', 'cancelled');


  create table "public"."projects" (
    "id" uuid not null default uuid_generate_v4(),
    "organization_id" uuid not null,
    "name" text not null,
    "description" text,
    "status" project_status not null default 'planning'::project_status,
    "priority" project_priority not null default 'medium'::project_priority,
    "start_date" date,
    "due_date" date,
    "completed_at" timestamp with time zone,
    "color" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "created_by" uuid not null,
    "assigned_to" uuid
      );


alter table "public"."projects" enable row level security;


  create table "public"."tasks" (
    "id" uuid not null default uuid_generate_v4(),
    "organization_id" uuid not null,
    "project_id" uuid,
    "parent_task_id" uuid,
    "title" text not null,
    "description" text,
    "status" task_status not null default 'todo'::task_status,
    "priority" task_priority not null default 'medium'::task_priority,
    "start_date" date,
    "due_date" date,
    "completed_at" timestamp with time zone,
    "estimated_hours" integer,
    "actual_hours" integer,
    "position" integer default 0,
    "tags" text[],
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "created_by" uuid not null,
    "assigned_to" uuid
      );


alter table "public"."tasks" enable row level security;

CREATE INDEX idx_projects_assigned_to ON public.projects USING btree (assigned_to);

CREATE INDEX idx_projects_created_by ON public.projects USING btree (created_by);

CREATE INDEX idx_projects_due_date ON public.projects USING btree (due_date);

CREATE INDEX idx_projects_organization_id ON public.projects USING btree (organization_id);

CREATE INDEX idx_projects_priority ON public.projects USING btree (priority);

CREATE INDEX idx_projects_status ON public.projects USING btree (status);

CREATE INDEX idx_tasks_assigned_to ON public.tasks USING btree (assigned_to);

CREATE INDEX idx_tasks_created_by ON public.tasks USING btree (created_by);

CREATE INDEX idx_tasks_due_date ON public.tasks USING btree (due_date);

CREATE INDEX idx_tasks_organization_id ON public.tasks USING btree (organization_id);

CREATE INDEX idx_tasks_parent_task_id ON public.tasks USING btree (parent_task_id);

CREATE INDEX idx_tasks_position ON public.tasks USING btree (project_id, "position");

CREATE INDEX idx_tasks_priority ON public.tasks USING btree (priority);

CREATE INDEX idx_tasks_project_id ON public.tasks USING btree (project_id);

CREATE INDEX idx_tasks_status ON public.tasks USING btree (status);

CREATE INDEX idx_tasks_tags ON public.tasks USING gin (tags);

CREATE UNIQUE INDEX projects_pkey ON public.projects USING btree (id);

CREATE UNIQUE INDEX tasks_pkey ON public.tasks USING btree (id);

alter table "public"."projects" add constraint "projects_pkey" PRIMARY KEY using index "projects_pkey";

alter table "public"."tasks" add constraint "tasks_pkey" PRIMARY KEY using index "tasks_pkey";

alter table "public"."projects" add constraint "projects_assigned_to_fkey" FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."projects" validate constraint "projects_assigned_to_fkey";

alter table "public"."projects" add constraint "projects_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."projects" validate constraint "projects_created_by_fkey";

alter table "public"."projects" add constraint "projects_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE not valid;

alter table "public"."projects" validate constraint "projects_organization_id_fkey";

alter table "public"."tasks" add constraint "tasks_actual_hours_positive" CHECK ((actual_hours >= 0)) not valid;

alter table "public"."tasks" validate constraint "tasks_actual_hours_positive";

alter table "public"."tasks" add constraint "tasks_assigned_to_fkey" FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."tasks" validate constraint "tasks_assigned_to_fkey";

alter table "public"."tasks" add constraint "tasks_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."tasks" validate constraint "tasks_created_by_fkey";

alter table "public"."tasks" add constraint "tasks_estimated_hours_positive" CHECK ((estimated_hours >= 0)) not valid;

alter table "public"."tasks" validate constraint "tasks_estimated_hours_positive";

alter table "public"."tasks" add constraint "tasks_no_self_parent" CHECK ((id <> parent_task_id)) not valid;

alter table "public"."tasks" validate constraint "tasks_no_self_parent";

alter table "public"."tasks" add constraint "tasks_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE not valid;

alter table "public"."tasks" validate constraint "tasks_organization_id_fkey";

alter table "public"."tasks" add constraint "tasks_parent_task_id_fkey" FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE CASCADE not valid;

alter table "public"."tasks" validate constraint "tasks_parent_task_id_fkey";

alter table "public"."tasks" add constraint "tasks_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE not valid;

alter table "public"."tasks" validate constraint "tasks_project_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.can_access_task(task_id uuid, user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1 from public.tasks t
    where t.id = task_id
      and public.is_organization_member(t.organization_id, user_id)
  );
$function$
;

CREATE OR REPLACE FUNCTION public.handle_task_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$
;

grant delete on table "public"."projects" to "anon";

grant insert on table "public"."projects" to "anon";

grant references on table "public"."projects" to "anon";

grant select on table "public"."projects" to "anon";

grant trigger on table "public"."projects" to "anon";

grant truncate on table "public"."projects" to "anon";

grant update on table "public"."projects" to "anon";

grant delete on table "public"."projects" to "authenticated";

grant insert on table "public"."projects" to "authenticated";

grant references on table "public"."projects" to "authenticated";

grant select on table "public"."projects" to "authenticated";

grant trigger on table "public"."projects" to "authenticated";

grant truncate on table "public"."projects" to "authenticated";

grant update on table "public"."projects" to "authenticated";

grant delete on table "public"."projects" to "service_role";

grant insert on table "public"."projects" to "service_role";

grant references on table "public"."projects" to "service_role";

grant select on table "public"."projects" to "service_role";

grant trigger on table "public"."projects" to "service_role";

grant truncate on table "public"."projects" to "service_role";

grant update on table "public"."projects" to "service_role";

grant delete on table "public"."tasks" to "anon";

grant insert on table "public"."tasks" to "anon";

grant references on table "public"."tasks" to "anon";

grant select on table "public"."tasks" to "anon";

grant trigger on table "public"."tasks" to "anon";

grant truncate on table "public"."tasks" to "anon";

grant update on table "public"."tasks" to "anon";

grant delete on table "public"."tasks" to "authenticated";

grant insert on table "public"."tasks" to "authenticated";

grant references on table "public"."tasks" to "authenticated";

grant select on table "public"."tasks" to "authenticated";

grant trigger on table "public"."tasks" to "authenticated";

grant truncate on table "public"."tasks" to "authenticated";

grant update on table "public"."tasks" to "authenticated";

grant delete on table "public"."tasks" to "service_role";

grant insert on table "public"."tasks" to "service_role";

grant references on table "public"."tasks" to "service_role";

grant select on table "public"."tasks" to "service_role";

grant trigger on table "public"."tasks" to "service_role";

grant truncate on table "public"."tasks" to "service_role";

grant update on table "public"."tasks" to "service_role";


  create policy "Organization members can create projects"
  on "public"."projects"
  as permissive
  for insert
  to authenticated
with check ((is_organization_member(organization_id) AND (created_by = ( SELECT auth.uid() AS uid))));



  create policy "Organization members can view projects"
  on "public"."projects"
  as permissive
  for select
  to authenticated
using (is_organization_member(organization_id));



  create policy "Project creators and organization admins can delete projects"
  on "public"."projects"
  as permissive
  for delete
  to authenticated
using ((is_organization_member(organization_id) AND ((created_by = ( SELECT auth.uid() AS uid)) OR is_organization_admin(organization_id))));



  create policy "Project creators and organization admins can update projects"
  on "public"."projects"
  as permissive
  for update
  to authenticated
using ((is_organization_member(organization_id) AND ((created_by = ( SELECT auth.uid() AS uid)) OR (assigned_to = ( SELECT auth.uid() AS uid)) OR is_organization_admin(organization_id))));



  create policy "Organization members can create tasks"
  on "public"."tasks"
  as permissive
  for insert
  to authenticated
with check ((is_organization_member(organization_id) AND (created_by = ( SELECT auth.uid() AS uid)) AND ((parent_task_id IS NULL) OR can_access_task(parent_task_id)) AND ((project_id IS NULL) OR (EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = tasks.project_id) AND is_organization_member(p.organization_id)))))));



  create policy "Organization members can view tasks"
  on "public"."tasks"
  as permissive
  for select
  to authenticated
using (is_organization_member(organization_id));



  create policy "Task assignees, creators, and organization admins can update ta"
  on "public"."tasks"
  as permissive
  for update
  to authenticated
using ((is_organization_member(organization_id) AND ((created_by = ( SELECT auth.uid() AS uid)) OR (assigned_to = ( SELECT auth.uid() AS uid)) OR is_organization_admin(organization_id))));



  create policy "Task creators and organization admins can delete tasks"
  on "public"."tasks"
  as permissive
  for delete
  to authenticated
using ((is_organization_member(organization_id) AND ((created_by = ( SELECT auth.uid() AS uid)) OR is_organization_admin(organization_id))));


CREATE TRIGGER handle_updated_at_projects BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_task_status_change_trigger BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION handle_task_status_change();

CREATE TRIGGER handle_updated_at_tasks BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


