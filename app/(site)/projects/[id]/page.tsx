"use client";

import { useParams, notFound } from "next/navigation";
import { useActiveOrg } from "@/components/providers/app-provider";
import { ProjectHeader } from "@/components/projects/project-header";
import { ProjectTasksView } from "@/components/projects/project-tasks-view";
import PageContainer from "@/components/layout/page-container";
import { useQuery } from "@tanstack/react-query";
import { createClient as createSupabaseBrowserClient } from "@/utils/supabase/client";
import { ProjectWithCreator } from "@/lib/types";

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { activeOrgId } = useActiveOrg();
  const supabase = createSupabaseBrowserClient();

  // Fetch project details with TanStack Query
  const { data: project, isLoading: projectLoading, error: projectError } = useQuery({
    queryKey: ["project", id, activeOrgId],
    queryFn: async (): Promise<ProjectWithCreator> => {
      if (!activeOrgId) throw new Error("No active organization");

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
        throw new Error("Project not found");
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

      return project;
    },
    enabled: !!activeOrgId && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (projectError) {
    return notFound();
  }

  if (projectLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-muted-foreground">Loading project...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!activeOrgId) {
    return (
      <PageContainer>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">No Organization Selected</h1>
          <p className="text-muted-foreground">
            Please select an organization to view this project.
          </p>
        </div>
      </PageContainer>
    );
  }

  if (!project) {
    return notFound();
  }

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4 w-full">
        <ProjectHeader project={project} />
        <ProjectTasksView
          projectId={id}
          projectName={project.name}
          defaultView="kanban"
        />
      </div>
    </PageContainer>
  );
}
