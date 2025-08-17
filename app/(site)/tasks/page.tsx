import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getActiveOrgIdServer } from "@/utils/active-org/server";
import { TasksTable } from "@/components/tasks/tasks-table";
import { CreateTaskForm } from "@/components/tasks/create-task-form";
import PageContainer from "@/components/layout/page-container";
import { TaskWithProfiles } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function TasksPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const activeOrgId = await getActiveOrgIdServer();

  if (!activeOrgId) {
    return (
      <PageContainer>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">No Organization Selected</h1>
          <p className="text-muted-foreground">
            Please select an organization to view tasks.
          </p>
        </div>
      </PageContainer>
    );
  }

  // Fetch all tasks for the active organization
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
      estimated_hours,
      projects!inner (
        id,
        name
      )
    `,
    )
    .eq("organization_id", activeOrgId)
    .order("created_at", { ascending: false });

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

    // Map user profiles to tasks and include project info
    tasks = tasksData.map((task) => ({
      ...task,
      tags: task.tags || [],
      project_name: task.projects?.name || null,
      created_by_profile:
        userProfiles.find((profile) => profile.id === task.created_by) || null,
      assigned_to_profile:
        userProfiles.find((profile) => profile.id === task.assigned_to) || null,
    }));
  }

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Tasks</h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Manage and track all tasks across your organization's projects.
            </p>
          </div>
          <CreateTaskForm />
        </div>

        {/* Scrollable Content Area */}
        {tasks && tasks.length > 0 ? (
          <TasksTable tasks={tasks} defaultPageSize={20} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Card>
              <CardHeader className="text-center">
                <CardTitle>No Tasks Yet</CardTitle>
                <CardDescription>
                  Get started by creating your first task for this organization.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <CreateTaskForm />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
