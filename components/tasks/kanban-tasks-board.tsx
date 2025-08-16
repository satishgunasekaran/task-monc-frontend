"use client";

import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CalendarDays, Filter, FilterX } from "lucide-react";
import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
  type DragEndEvent,
} from "@/components/ui/shadcn-io/kanban";
import { updateTaskPositionAndStatus } from "@/app/(site)/projects/task-actions";
import { toast } from "sonner";
import { TaskWithProfiles } from "@/lib/types";

interface KanbanTasksBoardProps {
  initialTasks: TaskWithProfiles[];
  projectId?: string;
}

// Define the columns with colors matching your existing system
const statusColumns = [
  { id: "todo", name: "To Do", color: "#6B7280" },
  { id: "in_progress", name: "In Progress", color: "#F59E0B" },
  { id: "review", name: "Review", color: "#F59E0B" },
  { id: "completed", name: "Completed", color: "#10B981" },
];

const priorityColors = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

// Transform task to match Kanban component interface
type KanbanTask = TaskWithProfiles & {
  name: string;
  column: string;
};

const transformTaskForKanban = (task: TaskWithProfiles): KanbanTask => ({
  ...task,
  name: task.title,
  column: task.status,
});

const transformTasksForKanban = (tasks: TaskWithProfiles[]): KanbanTask[] => {
  return tasks.map(transformTaskForKanban);
};

// Helper function to check if a date is today
const isDateToday = (dateString: string | null): boolean => {
  if (!dateString) return false;
  const today = new Date();
  const date = new Date(dateString);
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

export function KanbanTasksBoard({
  initialTasks,
  projectId,
}: KanbanTasksBoardProps) {
  const [allTasks, setAllTasks] = useState<KanbanTask[]>(() =>
    transformTasksForKanban(initialTasks),
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDueTodayOnly, setShowDueTodayOnly] = useState(false);
  // Update tasks when initialTasks changes
  useEffect(() => {
    setAllTasks(transformTasksForKanban(initialTasks));
  }, [initialTasks]);

  // Filter tasks based on due today filter
  const tasks = useMemo(() => {
    if (!showDueTodayOnly) {
      return allTasks;
    }
    return allTasks.filter((task) => isDateToday(task.due_date));
  }, [allTasks, showDueTodayOnly]);

  // Count tasks due today
  const dueTodayCount = useMemo(() => {
    return allTasks.filter((task) => isDateToday(task.due_date)).length;
  }, [allTasks]);

  const handleDragEnd = async (event: DragEndEvent) => {
    console.log("=== DRAG END CALLED ===", event);
    console.log("Active ID:", event.active.id);
    console.log("Over ID:", event.over?.id);

    const { active, over } = event;

    if (!over) {
      console.log("No over target, exiting");
      return;
    }

    if (active.id === over.id) {
      console.log("Dropped on same item, exiting");
      return;
    }

    // Find the active task
    const activeTask = tasks.find((task) => task.id === active.id);
    if (!activeTask) {
      console.log("Active task not found:", active.id);
      return;
    }

    if (isUpdating) {
      console.log("Already updating, exiting");
      return;
    }

    console.log("Active task found:", activeTask.title);
    console.log("Over target:", over.id);

    // Store original state for potential revert
    const originalTasks = [...tasks];

    // Determine target status and position
    let targetStatus = activeTask.status;
    let targetPosition = activeTask.position || 0;

    // Check if dropped on a column
    const targetColumn = statusColumns.find((col) => col.id === over.id);
    if (targetColumn) {
      console.log("Dropped on column:", targetColumn.name);
      targetStatus = targetColumn.id as TaskWithProfiles["status"];
      const tasksInColumn = tasks.filter(
        (t) => t.status === targetStatus && t.id !== activeTask.id,
      );
      targetPosition = tasksInColumn.length; // Place at end of column
      console.log("New position in column:", targetPosition);
    } else {
      // Dropped on another task
      const overTask = tasks.find((task) => task.id === over.id);
      if (overTask) {
        console.log("Dropped on task:", overTask.title);
        targetStatus = overTask.status;
        const tasksInStatus = tasks.filter(
          (t) => t.status === targetStatus && t.id !== activeTask.id,
        );
        const overIndex = tasksInStatus.findIndex((t) => t.id === over.id);
        targetPosition = overIndex >= 0 ? overIndex : tasksInStatus.length;
        console.log("New position relative to task:", targetPosition);
      } else {
        console.log("Could not find over task");
        return;
      }
    }

    // Check if task actually moved
    const taskMoved =
      activeTask.status !== targetStatus ||
      (activeTask.position || 0) !== targetPosition;

    console.log("Task movement analysis:", {
      taskId: activeTask.id,
      originalStatus: activeTask.status,
      targetStatus,
      originalPosition: activeTask.position || 0,
      targetPosition,
      taskMoved,
    });

    if (!taskMoved) {
      console.log("Task did not actually move, exiting");
      return;
    }

    console.log("Task moved, updating database...");
    setIsUpdating(true);

    try {
      console.log("Calling server action with:", {
        taskId: activeTask.id,
        targetStatus,
        targetPosition,
        projectId,
      });

      const result = await updateTaskPositionAndStatus(
        activeTask.id,
        targetStatus,
        targetPosition,
        projectId,
      );

      console.log("Server action result:", result);

      if (!result.success) {
        console.error("Failed to update task:", result.error);
        toast.error(result.error || "Failed to update task");
        // Revert local changes
        setAllTasks(originalTasks);
      } else {
        console.log("Task updated successfully");
        toast.success(
          `Task "${activeTask.title}" moved to ${statusColumns.find((c) => c.id === targetStatus)?.name}`,
        );
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
      // Revert local changes
      setAllTasks(originalTasks);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Filter Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={showDueTodayOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowDueTodayOnly(!showDueTodayOnly)}
            className="gap-2"
          >
            {showDueTodayOnly ? (
              <FilterX className="h-4 w-4" />
            ) : (
              <Filter className="h-4 w-4" />
            )}
            {showDueTodayOnly ? "Show All Tasks" : "Due Today"}
            {!showDueTodayOnly && dueTodayCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {dueTodayCount}
              </Badge>
            )}
          </Button>
        </div>

        {showDueTodayOnly && (
          <div className="text-sm text-muted-foreground">
            Showing {tasks.length} task{tasks.length !== 1 ? "s" : ""} due today
          </div>
        )}
      </div>

      {/* Kanban Board */}
      <div className="flex-1">
        <KanbanProvider
          columns={statusColumns}
          data={tasks}
          onDragEnd={handleDragEnd}
        >
          {(column) => (
            <KanbanBoard id={column.id} key={column.id}>
              <KanbanHeader>
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: column.color }}
                  />
                  <span>{column.name}</span>
                  <span className="text-muted-foreground">
                    ({tasks.filter((task) => task.column === column.id).length})
                  </span>
                </div>
              </KanbanHeader>
              <KanbanCards id={column.id}>
                {(task: KanbanTask) => (
                  <KanbanCard
                    key={task.id}
                    id={task.id}
                    name={task.name}
                    column={task.column}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-1 flex-1">
                        <p className="m-0 font-medium text-sm line-clamp-2">
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="m-0 text-muted-foreground text-xs line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant="secondary"
                        className={`text-xs font-medium ${priorityColors[task.priority]} shrink-0`}
                      >
                        {task.priority}
                      </Badge>
                    </div>

                    {task.tags && task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {task.tags.slice(0, 3).map((tag, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs px-1"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {task.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs px-1">
                            +{task.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      {task.assigned_to_profile && (
                        <div className="flex items-center gap-1">
                          <Avatar className="h-4 w-4">
                            <AvatarImage src="" />
                            <AvatarFallback className="text-xs">
                              {task.assigned_to_profile.first_name?.[0]}
                              {task.assigned_to_profile.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">
                            {task.assigned_to_profile.first_name}{" "}
                            {task.assigned_to_profile.last_name}
                          </span>
                        </div>
                      )}
                      {task.due_date && (
                        <div className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </KanbanCard>
                )}
              </KanbanCards>
            </KanbanBoard>
          )}
        </KanbanProvider>
      </div>
    </div>
  );
}
