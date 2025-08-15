import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getActiveOrgIdServer } from "@/utils/active-org/server";
import { ProjectHeader } from "@/components/projects/project-header";
import { DraggableTasksBoard } from "@/components/tasks/draggable-tasks-board";
import { CreateTaskForm } from "@/components/tasks/create-task-form";

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
      start_date,
      due_date,
      created_at,
      updated_at,
      created_by,
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
  let project: {
    id: string;
    name: string;
    description: string | null;
    status: "completed" | "planning" | "active" | "on_hold" | "cancelled";
    start_date: string | null;
    due_date: string | null;
    created_at: string;
    updated_at: string;
    created_by: string;
    organization_id: string;
    user_profiles: { id: string; first_name: string | null; last_name: string | null } | null;
  } = { ...projectData, user_profiles: null };
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
  } else {
    project = {
      ...projectData,
      user_profiles: null,
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
      position,
      tags,
      created_at,
      updated_at,
      completed_at,
      created_by,
      assigned_to
    `,
    )
    .eq("project_id", id)
    .order("position", { ascending: true });

  if (tasksError) {
    console.error("Error fetching tasks:", tasksError);
  }

  // Fetch user profiles for task creators and assignees
  let tasks: Array<{
    id: string;
    title: string;
    description: string | null;
    status: "completed" | "todo" | "in_progress" | "review";
    priority: "low" | "medium" | "high" | "urgent";
    due_date: string | null;
    position: number;
    tags: string[];
    created_at: string;
    updated_at: string;
    completed_at: string | null;
    created_by: string;
    assigned_to: string | null;
    created_by_profile: { id: string; first_name: string | null; last_name: string | null } | null;
    assigned_to_profile: { id: string; first_name: string | null; last_name: string | null } | null;
  }> = [];
  if (tasksData && tasksData.length > 0) {
    const userIds = [
      ...new Set(
        [
          ...tasksData.map((t) => t.created_by),
          ...tasksData.map((t) => t.assigned_to),
        ].filter(Boolean),
      ),
    ];

    let userProfiles: Array<{ id: string; first_name: string | null; last_name: string | null }> = [];
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
    <div className="h-full flex flex-col">
      <ProjectHeader project={project} />
      <div className="flex-1 min-h-0 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h2 className="text-xl font-semibold">Tasks</h2>
            <p className="text-muted-foreground text-sm">
              Manage tasks and track progress for this project.
            </p>
          </div>
          <CreateTaskForm projectId={id} />
        </div>
        <DraggableTasksBoard initialTasks={tasks || []} projectId={id} />
      </div>
    </div>
  );
}
