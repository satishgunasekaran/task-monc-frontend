"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, User, GripVertical, Edit } from "lucide-react";
import { Task } from "./types";
import { cn } from "@/lib/utils";
import { CreateTaskForm } from "./create-task-form";

interface DraggableTaskCardProps {
  task: Task;
  isDragging?: boolean;
  onTaskClick?: (task: Task) => void;
}

const priorityColors = {
  low: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  medium: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  urgent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export function DraggableTaskCard({
  task,
  isDragging = false,
  onTaskClick,
}: DraggableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isCurrentlyDragging = isDragging || isSortableDragging;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("touch-none", isCurrentlyDragging && "opacity-50")}
    >
      <Card
        className={cn(
          "hover:shadow-lg transition-all duration-200 group select-none bg-gradient-to-br from-card to-muted/10 border-l-4",
          isCurrentlyDragging && "shadow-2xl ring-2 ring-primary",
          !isCurrentlyDragging && "hover:scale-[1.02] cursor-pointer",
          // Add colored left border based on priority
          task.priority === "urgent" && "border-l-red-500",
          task.priority === "high" && "border-l-orange-500",
          task.priority === "medium" && "border-l-blue-500",
          task.priority === "low" && "border-l-gray-400",
        )}
        onClick={() => onTaskClick?.(task)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1">
              <div
                {...attributes}
                {...listeners}
                className="mt-1 p-1 -m-1 rounded transition-colors cursor-grab active:cursor-grabbing"
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </div>
              <CardTitle className="text-base font-semibold line-clamp-2 flex-1">
                {task.title}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <CreateTaskForm
                task={task}
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-muted/80 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit task</span>
                  </Button>
                }
              />
              <Badge
                variant="secondary"
                className={`text-xs font-semibold shrink-0 ${priorityColors[task.priority]}`}
              >
                {task.priority}
              </Badge>
            </div>
          </div>
          {task.description && (
            <CardDescription className="text-sm mt-2 line-clamp-3">
              {task.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col gap-3">
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {task.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-xs font-medium"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              {task.assigned_to_profile && (
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  <span className="text-xs">
                    {task.assigned_to_profile.first_name}{" "}
                    {task.assigned_to_profile.last_name}
                  </span>
                </div>
              )}
              {task.due_date && (
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span className="text-xs">
                    {new Date(task.due_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
