"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ColumnDef } from "@/components/ui/shadcn-io/table";
import { TableColumnHeader } from "@/components/ui/shadcn-io/table";
import { TaskWithProfiles } from "@/lib/types";
import { Calendar, Clock, Eye, Edit } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { formatLocalDateTime, isInPast, isDueSoon } from "@/lib/datetime-utils";
import { TaskForm } from "./task-form";

type ExtendedTaskWithProfiles = TaskWithProfiles & {
  project_name?: string | null;
};

const statusColors = {
  todo: "bg-gray-100 text-gray-800 border-gray-300",
  in_progress: "bg-blue-100 text-blue-800 border-blue-300",
  review: "bg-yellow-100 text-yellow-800 border-yellow-300",
  completed: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
};

const priorityColors = {
  low: "bg-gray-100 text-gray-800 border-gray-300",
  medium: "bg-blue-100 text-blue-800 border-blue-300",
  high: "bg-orange-100 text-orange-800 border-orange-300",
  urgent: "bg-red-100 text-red-800 border-red-300",
};

const statusLabels = {
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function getTasksTableColumns(
  onTaskClick?: (task: ExtendedTaskWithProfiles) => void,
): ColumnDef<ExtendedTaskWithProfiles>[] {
  return [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <TableColumnHeader column={column} title="Task" />
      ),
      cell: ({ row }) => {
        const task = row.original;
        return (
          <div
            className={cn(
              "flex flex-col gap-1 max-w-[300px]",
              onTaskClick &&
                "cursor-pointer hover:bg-accent/50 p-2 -m-2 rounded",
            )}
            onClick={() => onTaskClick?.(task)}
          >
            <span className="font-medium text-sm truncate">{task.title}</span>
            {task.description && (
              <span className="text-xs text-muted-foreground truncate">
                {task.description}
              </span>
            )}
            {task.project_name && (
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-muted-foreground">
                  {task.project_name}
                </span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <TableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge
            variant="outline"
            className={cn("font-medium", statusColors[status])}
          >
            {statusLabels[status]}
          </Badge>
        );
      },
    },
    {
      accessorKey: "priority",
      header: ({ column }) => (
        <TableColumnHeader column={column} title="Priority" />
      ),
      cell: ({ row }) => {
        const priority = row.original.priority;
        return (
          <Badge
            variant="outline"
            className={cn("font-medium capitalize", priorityColors[priority])}
          >
            {priority}
          </Badge>
        );
      },
    },
    {
      accessorKey: "assigned_to_profile",
      header: ({ column }) => (
        <TableColumnHeader column={column} title="Assignee" />
      ),
      cell: ({ row }) => {
        const profile = row.original.assigned_to_profile;
        if (!profile) {
          return (
            <span className="text-muted-foreground text-sm">Unassigned</span>
          );
        }

        const initials = `${profile.first_name?.[0] || ""}${
          profile.last_name?.[0] || ""
        }`.slice(0, 2);
        const fullName = `${profile.first_name || ""} ${
          profile.last_name || ""
        }`.trim();

        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-sm">{fullName}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "start_datetime",
      header: ({ column }) => (
        <TableColumnHeader column={column} title="Start Date" />
      ),
      cell: ({ row }) => {
        const startDateTime = row.original.start_datetime;
        if (!startDateTime) {
          return <span className="text-muted-foreground text-sm">-</span>;
        }

        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            <span className="text-sm">
              {formatLocalDateTime(startDateTime, {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "due_datetime",
      header: ({ column }) => (
        <TableColumnHeader column={column} title="Due Date" />
      ),
      cell: ({ row }) => {
        const dueDateTime = row.original.due_datetime;
        if (!dueDateTime) {
          return <span className="text-muted-foreground text-sm">-</span>;
        }

        const isOverdue =
          isInPast(dueDateTime) && row.original.status !== "completed";
        const dueSoon = isDueSoon(dueDateTime);

        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            <span
              className={cn(
                "text-sm",
                isOverdue && "text-red-600 font-medium",
                !isOverdue && dueSoon && "text-orange-600 font-medium",
              )}
            >
              {formatLocalDateTime(dueDateTime, {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "tags",
      header: "Tags",
      cell: ({ row }) => {
        const tags = row.original.tags || [];
        if (tags.length === 0) {
          return <span className="text-muted-foreground text-sm">-</span>;
        }

        return (
          <div className="flex flex-wrap gap-1 max-w-[200px]">
            {tags.slice(0, 3).map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-xs px-1 py-0"
              >
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="secondary" className="text-xs px-1 py-0">
                +{tags.length - 3}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "estimated_hours",
      header: ({ column }) => (
        <TableColumnHeader column={column} title="Hours" />
      ),
      cell: ({ row }) => {
        const estimated = row.original.estimated_hours;
        const actual = row.original.actual_hours;

        if (!estimated && !actual) {
          return <span className="text-muted-foreground text-sm">-</span>;
        }

        return (
          <div className="flex items-center gap-1 text-sm">
            <Clock className="h-3 w-3" />
            <span>
              {actual || 0}h / {estimated || 0}h
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <TableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => {
        const date = new Date(row.original.created_at);
        return (
          <span className="text-sm text-muted-foreground">
            {format(date, "MMM d, yyyy")}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const task = row.original;
        return (
          <div className="flex items-center gap-2">
            <TaskForm
              task={task}
              mode="view"
              trigger={
                <Button size="sm" variant="ghost">
                  <Eye className="h-4 w-4" />
                </Button>
              }
            />
            <TaskForm
              task={task}
              mode="edit"
              trigger={
                <Button size="sm" variant="ghost">
                  <Edit className="h-4 w-4" />
                </Button>
              }
            />
          </div>
        );
      },
    },
  ];
}
