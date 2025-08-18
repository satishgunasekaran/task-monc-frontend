import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getActiveOrgIdServer } from "@/utils/active-org/server";
import { ProjectsList } from "@/components/projects/projects-list";
import { CreateProjectForm } from "@/components/projects/create-project-form";
import PageContainer from "@/components/layout/page-container";
// Card component not needed here; using PageContainer and EmptyState
import EmptyState from "@/components/ui/empty-state";

export default async function ProjectsPage() {
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
            Please select an organization to view projects.
          </p>
        </div>
      </PageContainer>
    );
  }

  // Fetch projects for the active organization
  const { data: projectsData, error } = await supabase
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
      created_by
    `,
    )
    .eq("organization_id", activeOrgId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching projects:", error);
  }

  // Fetch user profiles for project creators
  let projects: Array<{
    id: string;
    name: string;
    description: string | null;
    status: "completed" | "planning" | "active" | "on_hold" | "cancelled";
    start_date: string | null;
    due_date: string | null;
    created_at: string;
    updated_at: string;
    created_by: string;
    user_profiles: {
      id: string;
      first_name: string | null;
      last_name: string | null;
    } | null;
    tasks: Array<{ count: number }>;
  }> = [];
  if (projectsData && projectsData.length > 0) {
    const creatorIds = [
      ...new Set(projectsData.map((p) => p.created_by).filter(Boolean)),
    ];

    if (creatorIds.length > 0) {
      const { data: userProfiles } = await supabase
        .from("user_profiles")
        .select("id, first_name, last_name")
        .in("id", creatorIds);

      // Map user profiles to projects
      projects = projectsData.map((project) => ({
        ...project,
        user_profiles:
          userProfiles?.find((profile) => profile.id === project.created_by) ||
          null,
        tasks: [{ count: 0 }], // Placeholder - you might want to get actual task counts
      }));
    } else {
      projects = projectsData.map((project) => ({
        ...project,
        user_profiles: null,
        tasks: [{ count: 0 }],
      }));
    }
  } else {
    projects = [];
  }

  return (
    <PageContainer>
      <div className="w-full max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Projects</h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Manage your organization&apos;s projects and track progress.
            </p>
          </div>
          <CreateProjectForm />
        </div>

        <div className="space-y-6">
          {projects && projects.length > 0 ? (
            <ProjectsList projects={projects} />
          ) : (
            <>
              <EmptyState
                title="No Projects Yet"
                description={
                  "Get started by creating your first project for this organization."
                }
              />
            </>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
