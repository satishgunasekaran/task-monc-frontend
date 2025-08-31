import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, User, Edit, Trash2 } from "lucide-react";
import { CreateProjectForm } from "./create-project-form";
import { Project } from "./types";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useProjectMutations } from "@/hooks/use-project-mutations";
import { useRouter } from "next/navigation";
import { useState } from "react";


interface ProjectHeaderProps {
  project: Project;
}

const statusColors = {
  planning: "bg-gray-100 text-gray-800",
  active: "bg-green-100 text-green-800",
  on_hold: "bg-yellow-100 text-yellow-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800",
};

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { deleteProject } = useProjectMutations();
  const router = useRouter();

  const handleDeleteProject = async () => {
    try {
      const result = await deleteProject(project.id);
      if (result.success) {
        router.push("/projects");
      }
    } catch (error) {
      // Error is already handled by the mutation hook with toast
      console.error("Failed to delete project:", error);
    }
  };

  return (
    <div className="border-b bg-background p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <Badge variant="secondary" className={statusColors[project.status]}>
              {project.status.replace("_", " ")}
            </Badge>
            <div className="flex items-center gap-1">
              <CreateProjectForm
                project={project}
                trigger={
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit project</span>
                  </Button>
                }
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete project</span>
              </Button>
            </div>
          </div>
          {project.description && (
            <p className="text-muted-foreground max-w-2xl">
              {project.description}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          {project.created_by && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>
                Created by {project.created_by}
              </span>
            </div>
          )}
          {typeof project.task_count === 'number' && (
            <div className="text-xs">
              Tasks: {project.task_count}
            </div>
          )}
          {project.start_date && (
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              <span>
                Started {new Date(project.start_date).toLocaleDateString()}
              </span>
            </div>
          )}
          {project.due_date && (
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              <span>Due {new Date(project.due_date).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>

      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Project"
        description={`Are you sure you want to delete "${project.name}"? This action cannot be undone and will also delete all tasks associated with this project.`}
        confirmText="Delete Project"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleDeleteProject}
      />
    </div>
  );
}
