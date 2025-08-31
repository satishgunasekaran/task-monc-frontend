import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CalendarDays, User, MoreHorizontal, Trash2 } from "lucide-react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useProjectMutations } from "@/hooks/use-project-mutations";
import { useState } from "react";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: "planning" | "active" | "on_hold" | "completed" | "cancelled";
  start_date: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  task_count: number;
}

interface ProjectsListProps {
  projects: Project[];
}

const statusColors = {
  planning: "bg-gray-100 text-gray-800",
  active: "bg-green-100 text-green-800",
  on_hold: "bg-yellow-100 text-yellow-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800",
};

export function ProjectsList({ projects }: ProjectsListProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { deleteProject } = useProjectMutations();

  const handleDeleteProject = async () => {
    if (!selectedProject) return;

    try {
      await deleteProject(selectedProject.id);
      // Success toast is handled by the mutation hook
    } catch (error) {
      // Error is already handled by the mutation hook with toast
      console.error("Failed to delete project:", error);
    }
  };

  const openDeleteDialog = (project: Project, e: Event) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation();
    setSelectedProject(project);
    setShowDeleteDialog(true);
  };

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card
            key={project.id}
            className="h-full hover:shadow-md transition-shadow cursor-pointer select-none group relative"
          >
            <Link href={`/projects/${project.id}`} className="block h-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg line-clamp-2 flex-1 pr-2">
                    {project.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={statusColors[project.status]}
                    >
                      {project.status.replace("_", " ")}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                        onClick={(e) => e.preventDefault()}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive"
                          onSelect={(e) => openDeleteDialog(project, e)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                {project.description && (
                  <CardDescription className="line-clamp-3">
                    {project.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {project.created_by && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Created by {project.created_by}</span>
                    </div>
                  )}
                  {project.start_date && (
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      <span>
                        Started{" "}
                        {new Date(project.start_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {project.due_date && (
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      <span>
                        Due {new Date(project.due_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="text-xs">Tasks: {project.task_count}</div>
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>

      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Project"
        description={
          selectedProject
            ? `Are you sure you want to delete "${selectedProject.name}"? This action cannot be undone and will also delete all tasks associated with this project.`
            : ""
        }
        confirmText="Delete Project"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleDeleteProject}
      />
    </>
  );
}
