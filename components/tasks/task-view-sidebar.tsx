"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TaskWithProfiles } from "@/lib/types";
import { 
  Calendar, 
  Clock, 
  User, 
  Tag, 
  FileText, 
  Save,
  X,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type ExtendedTaskWithProfiles = TaskWithProfiles & {
  project_name?: string | null;
};

interface TaskViewSidebarProps {
  task: ExtendedTaskWithProfiles | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (task: ExtendedTaskWithProfiles) => void;
}

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

export function TaskViewSidebar({ task, isOpen, onClose, onSave }: TaskViewSidebarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<ExtendedTaskWithProfiles | null>(null);

  useEffect(() => {
    if (task) {
      setEditedTask({ ...task });
      setIsEditing(false);
    }
  }, [task]);

  if (!task) return null;

  const handleSave = () => {
    if (editedTask && onSave) {
      onSave(editedTask);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedTask(task ? { ...task } : null);
    setIsEditing(false);
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "completed";

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <SheetTitle className="text-lg font-semibold pr-2">
                {isEditing ? (
                  <Input
                    value={editedTask?.title || ""}
                    onChange={(e) => setEditedTask(prev => prev ? { ...prev, title: e.target.value } : null)}
                    className="text-lg font-semibold"
                  />
                ) : (
                  task.title
                )}
              </SheetTitle>
              <SheetDescription className="mt-2 flex items-center gap-2">
                {task.project_name && (
                  <>
                    <span className="text-sm text-muted-foreground">
                      {task.project_name}
                    </span>
                    <span className="text-muted-foreground">•</span>
                  </>
                )}
                <span className="text-sm text-muted-foreground">
                  Created {format(new Date(task.created_at), "MMM d, yyyy")}
                </span>
              </SheetDescription>
            </div>
            <div className="flex gap-2 ml-4">
              {isEditing ? (
                <>
                  <Button size="sm" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancel}>
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Status
              </Label>
              {isEditing ? (
                <Select
                  value={editedTask?.status}
                  onValueChange={(value) => setEditedTask(prev => prev ? { ...prev, status: value as any } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge
                  variant="outline"
                  className={cn("font-medium w-fit", statusColors[task.status])}
                >
                  {statusLabels[task.status]}
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Priority
              </Label>
              {isEditing ? (
                <Select
                  value={editedTask?.priority}
                  onValueChange={(value) => setEditedTask(prev => prev ? { ...prev, priority: value as any } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge
                  variant="outline"
                  className={cn("font-medium capitalize w-fit", priorityColors[task.priority])}
                >
                  {task.priority}
                </Badge>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Description
            </Label>
            {isEditing ? (
              <Textarea
                value={editedTask?.description || ""}
                onChange={(e) => setEditedTask(prev => prev ? { ...prev, description: e.target.value } : null)}
                placeholder="Add a description..."
                rows={4}
              />
            ) : (
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                {task.description || "No description provided"}
              </div>
            )}
          </div>

          {/* Assignee */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <User className="w-4 h-4" />
              Assignee
            </Label>
            <div className="flex items-center gap-2">
              {task.assigned_to_profile ? (
                <>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-sm">
                      {`${task.assigned_to_profile.first_name?.[0] || ""}${task.assigned_to_profile.last_name?.[0] || ""}`.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">
                    {`${task.assigned_to_profile.first_name || ""} ${task.assigned_to_profile.last_name || ""}`.trim()}
                  </span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">Unassigned</span>
              )}
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Due Date
            </Label>
            <div className="flex items-center gap-2">
              {task.due_date ? (
                <>
                  <span 
                    className={cn(
                      "text-sm",
                      isOverdue && "text-red-600 font-medium"
                    )}
                  >
                    {format(new Date(task.due_date), "EEEE, MMM d, yyyy")}
                  </span>
                  {isOverdue && (
                    <Badge variant="destructive" className="text-xs">
                      Overdue
                    </Badge>
                  )}
                </>
              ) : (
                <span className="text-sm text-muted-foreground">No due date set</span>
              )}
            </div>
          </div>

          {/* Time Tracking */}
          {(task.estimated_hours || task.actual_hours) && (
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Time Tracking
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Estimated</div>
                  <div className="text-sm font-medium">
                    {task.estimated_hours ? `${task.estimated_hours}h` : "-"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Actual</div>
                  <div className="text-sm font-medium">
                    {task.actual_hours ? `${task.actual_hours}h` : "-"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Tags
              </Label>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="space-y-3 pt-4 border-t">
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Created: {format(new Date(task.created_at), "MMM d, yyyy 'at' h:mm a")}</div>
              <div>Updated: {format(new Date(task.updated_at), "MMM d, yyyy 'at' h:mm a")}</div>
              {task.completed_at && (
                <div>Completed: {format(new Date(task.completed_at), "MMM d, yyyy 'at' h:mm a")}</div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
