"use client";

import { useState } from "react";
import { ViewToggle, ViewMode } from "@/components/ui/view-toggle";
import { KanbanTasksBoard } from "@/components/tasks/kanban-tasks-board";
import { TasksTable } from "@/components/tasks/tasks-table";
import { CreateTaskForm } from "@/components/tasks/task-form";
import { useActiveOrg } from "@/components/providers/app-provider";
import { useTasks, useTaskMutations } from "@/hooks/use-tasks";

interface ProjectTasksViewProps {
  projectId: string;
  projectName: string;
  defaultView?: ViewMode;
}

export function ProjectTasksView({
  projectId,
  projectName,
  defaultView = "kanban",
}: ProjectTasksViewProps) {
  const { activeOrgId } = useActiveOrg();
  const [viewMode, setViewMode] = useState<ViewMode>(defaultView);
  
  // Use TanStack Query hooks with project filtering
  const { data: tasks = [], isLoading, error } = useTasks(activeOrgId, projectId);
  const { bulkDeleteTasks, bulkStatusUpdate } = useTaskMutations();

  // Transform tasks to include project name
  const extendedTasks = tasks.map((task) => ({
    ...task,
    project_name: projectName,
  }));

  if (error) {
    return (
      <div className="text-center p-8">
        <h3 className="text-lg font-semibold mb-2">Error Loading Tasks</h3>
        <p className="text-muted-foreground">
          Failed to load tasks for this project. Please try again.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    );
  }

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
        <KanbanTasksBoard projectId={projectId} />
      ) : (
        <TasksTable 
          tasks={extendedTasks} 
          onBulkDelete={bulkDeleteTasks}
          onBulkStatusUpdate={bulkStatusUpdate}
        />
      )}
    </div>
  );
}
