"use client";

import { useActiveOrg } from "@/components/providers/app-provider";
import { ProjectsList } from "@/components/projects/projects-list";
import { CreateProjectForm } from "@/components/projects/create-project-form";
import PageContainer from "@/components/layout/page-container";
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
      <div className="w-full">
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
            <EmptyState
              title="No Projects Yet"
              description={
                "Get started by creating your first project for this organization."
              }
            />
          )}
        </div>
      </div>
    </PageContainer>
  );
}
