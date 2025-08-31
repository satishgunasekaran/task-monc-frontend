"use client";

import { useParams, notFound } from "next/navigation";
import { useActiveOrg } from "@/components/providers/app-provider";
import { ProjectHeader } from "@/components/projects/project-header";
import { ProjectTasksView } from "@/components/projects/project-tasks-view";
import PageContainer from "@/components/layout/page-container";
import { useProject } from "@/hooks/use-projects";

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { activeOrgId } = useActiveOrg();

  // Fetch project details with TanStack Query
  const { data: project, isLoading: projectLoading, error: projectError } = useProject(id, activeOrgId);

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
      <ProjectHeader project={project} />
      <ProjectTasksView
        projectId={id}
        projectName={project.name}
        defaultView="kanban"
      />
    </PageContainer>
  );
}
