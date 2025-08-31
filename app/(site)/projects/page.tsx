"use client";

import { useActiveOrg } from "@/components/providers/app-provider";
import { ProjectsList } from "@/components/projects/projects-list";
import { CreateProjectForm } from "@/components/projects/create-project-form";
import PageContainer from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import EmptyState from "@/components/ui/empty-state";
import { useProjects } from "@/hooks/use-projects";

export default function ProjectsPage() {
  const { activeOrgId } = useActiveOrg();
  const { data: projects = [], isLoading, error } = useProjects(activeOrgId);

  if (error) {
    return (
      <PageContainer>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Error Loading Projects</h1>
          <p className="text-muted-foreground">
            Failed to load projects. Please try again.
          </p>
        </div>
      </PageContainer>
    );
  }

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-muted-foreground">Loading projects...</p>
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
            Please select an organization to view projects.
          </p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Projects"
        description="Manage your organization's projects and track progress."
        action={<CreateProjectForm />}
      />
      
      <div className="space-y-6">
        {projects && projects.length > 0 ? (
          <ProjectsList projects={projects} />
        ) : (
          <EmptyState
            title="No Projects Yet"
            description={
              "Get started by creating your first project for this organization."
            }
          />
        )}
      </div>
    </PageContainer>
  );
}
