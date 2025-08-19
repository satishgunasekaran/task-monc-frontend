drop index if exists "public"."idx_tasks_due_date";

alter table "public"."tasks" drop column "due_date";

alter table "public"."tasks" drop column "start_date";

alter table "public"."tasks" add column "due_datetime" timestamp with time zone;

alter table "public"."tasks" add column "start_datetime" timestamp with time zone;

CREATE INDEX idx_tasks_due_datetime ON public.tasks USING btree (due_datetime);


