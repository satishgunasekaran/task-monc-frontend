import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getActiveOrgIdServer } from "@/utils/active-org/server";
import { ProjectsList } from "@/components/projects/projects-list";
import { CreateProjectForm } from "@/components/projects/create-project-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

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
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">No Organization Selected</h1>
          <p className="text-muted-foreground">
            Please select an organization to view projects.
          </p>
        </div>
      </div>
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
  let projects: any[] = [];
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
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Projects</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Manage your organization's projects and track progress.
          </p>
        </div>
        <CreateProjectForm />
      </div>

      <div className="space-y-6">
        {projects && projects.length > 0 ? (
          <ProjectsList projects={projects} />
        ) : (
          <Card>
            <CardHeader className="text-center">
              <CardTitle>No Projects Yet</CardTitle>
              <CardDescription>
                Get started by creating your first project for this
                organization.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <CreateProjectForm />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
