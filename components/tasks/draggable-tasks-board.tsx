"use client";

import { useState, useMemo, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  UniqueIdentifier,
  CollisionDetection,
  pointerWithin,
  rectIntersection,
  getFirstCollision,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { updateTaskPositionAndStatus } from "@/app/(site)/projects/task-actions";
import { toast } from "sonner";
import { TaskColumn } from "./task-column";
import { DraggableTaskCard } from "./draggable-task-card";
import { Task } from "./types";

interface DraggableTasksBoardProps {
  initialTasks: Task[];
  projectId?: string;
}

const statusColumns = [
  { id: "todo", title: "To Do", bgColor: "bg-gray-50 dark:bg-gray-900/50" },
  {
    id: "in_progress",
    title: "In Progress",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
  },
  {
    id: "review",
    title: "Review",
    bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
  },
  {
    id: "completed",
    title: "Completed",
    bgColor: "bg-green-50 dark:bg-green-900/20",
  },
];

export function DraggableTasksBoard({
  initialTasks,
  projectId,
}: DraggableTasksBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Update tasks when initialTasks changes
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, Task[]> = {
      todo: [],
      in_progress: [],
      review: [],
      completed: [],
    };

    tasks.forEach((task) => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    });

    // Sort tasks by position within each status
    Object.keys(grouped).forEach((status) => {
      grouped[status].sort((a, b) => (a.position || 0) - (b.position || 0));
    });

    return grouped;
  }, [tasks]);

  const activeTask = useMemo(
    () => tasks.find((task) => task.id === activeId),
    [activeId, tasks],
  );

  // Custom collision detection to improve drag over columns
  const collisionDetectionAlgorithm: CollisionDetection = (args) => {
    // First, try to find intersecting droppable containers (columns)
    const pointerIntersections = pointerWithin(args);
    const intersections =
      pointerIntersections.length > 0
        ? pointerIntersections
        : rectIntersection(args);

    let overId = getFirstCollision(intersections, "id");

    if (overId != null) {
      // Check if we're over a column
      const isOverColumn = statusColumns.some((col) => col.id === overId);
      if (isOverColumn) {
        // Find the closest task in this column
        const tasksInColumn = tasksByStatus[overId as string] || [];
        if (tasksInColumn.length > 0) {
          // Return the last task in the column for appending
          overId = tasksInColumn[tasksInColumn.length - 1].id;
        }
      }
      return [{ id: overId }];
    }

    // If no droppable found, try to find the closest corners
    return closestCorners(args);
  };

  const [dragStartTask, setDragStartTask] = useState<Task | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setDragStartTask(task || null);
    setActiveId(event.active.id);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    const overTask = tasks.find((t) => t.id === over.id);

    if (!activeTask) return;

    // Check if we're over a column
    const overColumn = statusColumns.find((col) => col.id === over.id);

    if (overColumn) {
      // Moving to an empty column
      if (activeTask.status !== overColumn.id) {
        setTasks((tasks) =>
          tasks.map((task) =>
            task.id === activeTask.id
              ? { ...task, status: overColumn.id as Task["status"] }
              : task,
          ),
        );
      }
    } else if (overTask && activeTask.status !== overTask.status) {
      // Moving to a different column with tasks
      setTasks((tasks) =>
        tasks.map((task) =>
          task.id === activeTask.id
            ? { ...task, status: overTask.status }
            : task,
        ),
      );
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeTask = tasks.find((t) => t.id === active.id);
    const overTask = tasks.find((t) => t.id === over.id);

    if (!activeTask) {
      setActiveId(null);
      return;
    }

    // Determine the target status
    let targetStatus: Task["status"];
    let targetPosition = 0;

    // Check if we're dropping on a column
    const overColumn = statusColumns.find((col) => col.id === over.id);

    if (overColumn) {
      targetStatus = overColumn.id as Task["status"];
      const tasksInColumn = tasksByStatus[targetStatus];
      targetPosition = tasksInColumn.length;
    } else if (overTask) {
      targetStatus = overTask.status;

      // Calculate new position
      const tasksInTargetStatus = tasks.filter(
        (t) => t.status === targetStatus,
      );
      const overIndex = tasksInTargetStatus.findIndex((t) => t.id === over.id);

      if (activeTask.status === targetStatus) {
        // Moving within the same column
        const activeIndex = tasksInTargetStatus.findIndex(
          (t) => t.id === active.id,
        );
        if (activeIndex !== overIndex) {
          const reorderedTasks = arrayMove(
            tasksInTargetStatus,
            activeIndex,
            overIndex,
          );

          // Update positions
          const updatedTasks = tasks.map((task) => {
            const reorderedTask = reorderedTasks.find((t) => t.id === task.id);
            if (reorderedTask) {
              const newPosition = reorderedTasks.indexOf(reorderedTask);
              return { ...task, position: newPosition };
            }
            return task;
          });

          setTasks(updatedTasks);
          targetPosition = overIndex;
        }
      } else {
        // Moving to a different column
        targetPosition = overIndex + 1;
      }
    } else {
      setActiveId(null);
      return;
    }

    // Check if task actually moved using original task data
    const originalTask = dragStartTask;
    const taskMoved =
      originalTask &&
      (originalTask.status !== targetStatus ||
        originalTask.position !== targetPosition);

    console.log("Task movement check:", {
      taskId: activeTask.id,
      originalStatus: originalTask?.status,
      originalPosition: originalTask?.position,
      targetStatus,
      targetPosition,
      taskMoved,
      isUpdating,
    });

    if (taskMoved && !isUpdating) {
      setIsUpdating(true);

      // Store original tasks for potential revert
      const originalTasks = [...tasks];

      // Update task in database (don't wait for local state update)
      const updatePromise = updateTaskPositionAndStatus(
        activeTask.id,
        targetStatus,
        targetPosition,
        projectId,
      );

      updatePromise
        .then((result) => {
          console.log("Update result:", result);

          if (!result.success) {
            console.error("Failed to update task:", result.error);
            toast.error(result.error || "Failed to update task");
            // Revert on error
            setTasks(originalTasks);
          } else {
            toast.success(
              `Task moved to ${statusColumns.find((c) => c.id === targetStatus)?.title}`,
            );
            console.log("Task updated successfully");
          }
        })
        .catch((error) => {
          console.error("Error updating task:", error);
          toast.error("Failed to update task");
          // Revert on error
          setTasks(originalTasks);
        })
        .finally(() => {
          setIsUpdating(false);
        });
    } else if (!taskMoved) {
      console.log("No update needed for task");
    } else {
      console.log("Update already in progress, skipping");
    }

    setActiveId(null);
    setDragStartTask(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetectionAlgorithm}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-4 h-full min-h-0">
        {statusColumns.map((column) => (
          <TaskColumn
            key={column.id}
            id={column.id}
            title={column.title}
            bgColor={column.bgColor}
            tasks={tasksByStatus[column.id] || []}
            isUpdating={isUpdating}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <div className="rotate-3 scale-105">
            <DraggableTaskCard task={activeTask} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
