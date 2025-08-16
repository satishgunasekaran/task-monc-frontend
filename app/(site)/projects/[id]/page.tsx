import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getActiveOrgIdServer } from "@/utils/active-org/server";
import { ProjectHeader } from "@/components/projects/project-header";
import { KanbanTasksBoard } from "@/components/tasks/kanban-tasks-board";
import { CreateTaskForm } from "@/components/tasks/create-task-form";
import PageContainer from "@/components/layout/page-container";
import { ProjectWithCreator, TaskWithProfiles } from "@/lib/types";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const activeOrgId = await getActiveOrgIdServer();

  if (!activeOrgId) {
    return redirect("/projects");
  }

  // Fetch project details
  const { data: projectData, error: projectError } = await supabase
    .from("projects")
    .select(
      `
      id,
      name,
      description,
      status,
      priority,
      start_date,
      due_date,
      created_at,
      updated_at,
      completed_at,
      created_by,
      assigned_to,
      color,
      organization_id
    `,
    )
    .eq("id", id)
    .eq("organization_id", activeOrgId)
    .single();

  if (projectError || !projectData) {
    return notFound();
  }

  // Fetch user profile for project creator
  let project: ProjectWithCreator = { ...projectData, user_profiles: null };
  if (projectData.created_by) {
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("id, first_name, last_name")
      .eq("id", projectData.created_by)
      .single();

    project = {
      ...projectData,
      user_profiles: userProfile || null,
    };
  }

  // Fetch tasks for this project
  const { data: tasksData, error: tasksError } = await supabase
    .from("tasks")
    .select(
      `
      id,
      title,
      description,
      status,
      priority,
      due_date,
      start_date,
      position,
      tags,
      created_at,
      updated_at,
      completed_at,
      created_by,
      assigned_to,
      project_id,
      organization_id,
      parent_task_id,
      actual_hours,
      estimated_hours
    `,
    )
    .eq("project_id", id)
    .order("position", { ascending: true });

  if (tasksError) {
    console.error("Error fetching tasks:", tasksError);
  }

  // Fetch user profiles for task creators and assignees
  let tasks: TaskWithProfiles[] = [];
  if (tasksData && tasksData.length > 0) {
    const userIds = [
      ...new Set(
        [
          ...tasksData.map((t) => t.created_by),
          ...tasksData.map((t) => t.assigned_to),
        ].filter((id): id is string => Boolean(id)),
      ),
    ];

    let userProfiles: Array<{
      id: string;
      first_name: string | null;
      last_name: string | null;
    }> = [];
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("id, first_name, last_name")
        .in("id", userIds);
      userProfiles = profiles || [];
    }

    // Map user profiles to tasks
    tasks = tasksData.map((task) => ({
      ...task,
      tags: task.tags || [],
      created_by_profile:
        userProfiles.find((profile) => profile.id === task.created_by) || null,
      assigned_to_profile:
        userProfiles.find((profile) => profile.id === task.assigned_to) || null,
    }));
  }

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4 w-full">
        <ProjectHeader project={project} />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Tasks</h2>
            <p className="text-muted-foreground text-sm">
              Manage tasks and track progress for this project.
            </p>
          </div>
          <CreateTaskForm projectId={id} />
        </div>
        <KanbanTasksBoard initialTasks={tasks || []} projectId={id} />
      </div>
    </PageContainer>
  );
}
