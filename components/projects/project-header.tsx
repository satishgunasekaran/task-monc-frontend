import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, User, Edit } from "lucide-react";
import { CreateProjectForm } from "./create-project-form";
import { Project } from "./types";


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
  return (
    <div className="border-b bg-background p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <Badge variant="secondary" className={statusColors[project.status]}>
              {project.status.replace("_", " ")}
            </Badge>
            <CreateProjectForm
              project={project}
              trigger={
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Edit project</span>
                </Button>
              }
            />
          </div>
          {project.description && (
            <p className="text-muted-foreground max-w-2xl">
              {project.description}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          {project.user_profiles && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>
                Created by {project.user_profiles.first_name}{" "}
                {project.user_profiles.last_name}
              </span>
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
    </div>
  );
}
