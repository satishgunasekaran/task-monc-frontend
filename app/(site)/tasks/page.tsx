import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getActiveOrgIdServer } from "@/utils/active-org/server";
import { DraggableTasksBoard } from "@/components/tasks/draggable-tasks-board";
import { Task } from "@/components/tasks/types";
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
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">No Organization Selected</h1>
          <p className="text-muted-foreground">
            Please select an organization to view tasks.
          </p>
        </div>
      </div>
    );
  }

  // Fetch tasks for all projects in the active organization
  const { data: tasksData, error } = await supabase
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
      project_id,
      created_by,
      assigned_to,
      projects!inner (
        id,
        name,
        organization_id
      )
    `,
    )
    .eq("projects.organization_id", activeOrgId)
    .order("position", { ascending: true });

  if (error) {
    console.error("Error fetching tasks:", error);
  }

  // Fetch user profiles for task creators and assignees
  let tasks: Task[] = [];
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

    // Transform the data to match the expected format
    tasks = tasksData.map((task) => {
      // Extract only the fields we need
      const { created_by, assigned_to, ...taskData } = task;
      return {
        ...taskData,
        created_by_profile:
          userProfiles.find((profile) => profile.id === created_by) || null,
        assigned_to_profile:
          userProfiles.find((profile) => profile.id === assigned_to) || null,
      };
    });
  }

  // Fetch projects for the dropdown
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, name")
    .eq("organization_id", activeOrgId)
    .order("name", { ascending: true });

  if (projectsError) {
    console.error("Error fetching projects:", projectsError);
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-full h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">All Tasks</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            View and manage all tasks across your organization&apos;s projects.
          </p>
        </div>
        {projects && projects.length > 0 && (
          <div className="flex gap-2">
            <select className="px-3 py-2 border rounded-md text-sm">
              <option value="">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tasks && tasks.length > 0 ? (
          <DraggableTasksBoard initialTasks={tasks} />
        ) : (
          <Card>
            <CardHeader className="text-center">
              <CardTitle>No Tasks Yet</CardTitle>
              <CardDescription>
                Tasks will appear here once you create projects and add tasks to
                them.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Start by creating a project, then add tasks to organize your
                work.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
