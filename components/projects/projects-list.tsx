import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, User } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: "planning" | "active" | "on_hold" | "completed" | "cancelled";
  start_date: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  user_profiles: {
    first_name: string | null;
    last_name: string | null;
  } | null;
  tasks: { count: number }[];
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
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Link key={project.id} href={`/projects/${project.id}`}>
          <Card className="h-full hover:shadow-md transition-shadow cursor-pointer select-none">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg line-clamp-2">
                  {project.name}
                </CardTitle>
                <Badge
                  variant="secondary"
                  className={statusColors[project.status]}
                >
                  {project.status.replace("_", " ")}
                </Badge>
              </div>
              {project.description && (
                <CardDescription className="line-clamp-3">
                  {project.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                {project.user_profiles && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>
                      {project.user_profiles.first_name}{" "}
                      {project.user_profiles.last_name}
                    </span>
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
                <div className="text-xs">
                  Tasks: {project.tasks?.[0]?.count || 0}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
