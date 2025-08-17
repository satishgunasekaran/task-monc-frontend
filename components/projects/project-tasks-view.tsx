"use client";

import { useState } from "react";
import { TaskWithProfiles } from "@/lib/types";
import { ViewToggle, ViewMode } from "@/components/ui/view-toggle";
import { KanbanTasksBoard } from "@/components/tasks/kanban-tasks-board";
import { TasksTable } from "@/components/tasks/tasks-table";
import { CreateTaskForm } from "@/components/tasks/task-form";

interface ProjectTasksViewProps {
  tasks: TaskWithProfiles[];
  projectId: string;
  projectName: string;
  defaultView?: ViewMode;
}

export function ProjectTasksView({
  tasks,
  projectId,
  projectName,
  defaultView = "kanban",
}: ProjectTasksViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultView);

  // Transform tasks to include project name
  const extendedTasks = tasks.map((task) => ({
    ...task,
    project_name: projectName,
  }));

  return (
    <div className="flex flex-1 flex-col space-y-4 w-full">
      {/* Header with View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Tasks</h2>
          <p className="text-muted-foreground text-sm">
            Manage tasks and track progress for this project.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
          <CreateTaskForm projectId={projectId} />
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === "kanban" ? (
        <KanbanTasksBoard initialTasks={tasks} projectId={projectId} />
      ) : (
        <TasksTable tasks={extendedTasks} />
      )}
    </div>
  );
}
