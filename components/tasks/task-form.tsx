"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, X, Edit } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { TextField } from "@/components/ui/form-fields/TextField";
import { TextareaField } from "@/components/ui/form-fields/TextareaField";
import { SelectField } from "@/components/ui/form-fields/SelectField";
import { DateTimePickerField } from "@/components/ui/form-fields/DateTimePickerField";
import { TagsField } from "@/components/ui/form-fields/TagsField";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { toUTC, fromUTC } from "@/lib/datetime-utils";
import { toast } from "sonner";
import { Task } from "./types";
import { useTaskMutations } from "@/hooks/use-tasks";
// Removed unused sidebar imports

const formSchema = z
  .object({
    title: z.string().min(1, "Task title is required"),
    description: z.string().optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]),
    status: z.enum(["todo", "in_progress", "review", "completed", "cancelled"]),
    start_datetime: z.date().optional(),
    due_datetime: z.date().optional(),
    tags: z.string().optional(),
  })
  .superRefine((vals, ctx) => {
    const { start_datetime, due_datetime } = vals as {
      start_datetime?: Date;
      due_datetime?: Date;
    };

    if (start_datetime && due_datetime) {
      if (due_datetime <= start_datetime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["due_datetime"],
          message: "Due date/time must be after start date/time",
        });
      }
    }
  });

interface TaskFormProps {
  projectId?: string;
  task?: Task;
  trigger?: React.ReactNode;
  mode?: "create" | "edit" | "view";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onTaskCreated?: (task: Task) => void;
  onTaskUpdated?: (task: Task) => void;
  onTaskDeleted?: (taskId: string) => void;
}

// Legacy component name for backwards compatibility
export function CreateTaskForm(props: TaskFormProps) {
  return <TaskForm {...props} />;
}

export function TaskForm({
  projectId,
  task,
  trigger,
  mode = task ? "edit" : "create",
  open: controlledOpen,
  onOpenChange,
  onTaskCreated,
  onTaskUpdated,
}: TaskFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [isEditing, setIsEditing] = useState(mode !== "view");
  const isView = mode === "view";
  const isEdit = mode === "edit" || (mode !== "create" && !!task);
  const readOnly = isView && !isEditing;
  
  // Use TanStack Query mutations
  const { createTask, updateTask, isCreating, isUpdating } = useTaskMutations();
  const isLoading = isCreating || isUpdating;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      priority: task?.priority || "medium",
      status: task?.status || "todo",
      start_datetime: task?.start_datetime
        ? fromUTC(task.start_datetime)
        : undefined,
      due_datetime: task?.due_datetime ? fromUTC(task.due_datetime) : undefined,
      tags: task?.tags?.join(", ") || "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (readOnly) return;

    // Defensive runtime check in case schema validation didn't run or was bypassed
    if (values.start_datetime && values.due_datetime) {
      if (values.due_datetime <= values.start_datetime) {
        toast.error("Due date/time must be after start date/time");
        return;
      }
    }

    try {
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("description", values.description || "");
      formData.append("priority", values.priority);
      formData.append("status", values.status);
      if (values.start_datetime) {
        formData.append("start_datetime", toUTC(values.start_datetime));
      }
      if (values.due_datetime) {
        formData.append("due_datetime", toUTC(values.due_datetime));
      }
      formData.append("tags", values.tags || "");
      if (projectId) {
        formData.append("project_id", projectId);
      }

      const result = isEdit && task
        ? await updateTask({ taskId: task.id, formData })
        : await createTask(formData);

      // Success is handled by the mutation's onSuccess callback
      const updatedTask = result.task;

      // Call appropriate callback to update parent state
      if (isEdit && onTaskUpdated && updatedTask) {
        onTaskUpdated(updatedTask);
      } else if (!isEdit && onTaskCreated && updatedTask) {
        onTaskCreated(updatedTask);
      }

      setOpen(false);
      if (!isEdit) {
        form.reset();
      }

      // If in view mode and was editing, switch back to view mode
      if (isView && isEditing) {
        setIsEditing(false);
      }
    } catch (error) {
      // Error handling is already done by the mutation's onError callback
      console.error(`Error ${isEdit ? "updating" : "creating"} task:`, error);
    }
  }

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const getTitle = () => {
    if (mode === "view") return task?.title || "Task Details";
    return isEdit ? "Edit Task" : "Create New Task";
  };

  const getButtonText = () => {
    if (isView && !isEditing) return "Edit";
    if (isLoading) return isEdit ? "Updating..." : "Creating...";
    return isEdit ? "Update Task" : "Create Task";
  };

  const defaultTrigger = (
    <Button>
      <Plus className="mr-2 h-4 w-4" />
      New Task
    </Button>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger || defaultTrigger}</SheetTrigger>
      <SheetContent className="flex flex-col h-full p-0 w-full sm:max-w-md">
        {/* Fixed Header */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <SheetHeader>
                <SheetTitle>{getTitle()}</SheetTitle>
              </SheetHeader>
            </div>
            {isView && (
              <div className="flex gap-2 ml-4">
                <Button size="sm" variant="outline" onClick={handleEditToggle}>
                  {isEditing ? (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <Form {...form}>
            <div className="space-y-6">
              <TextField
                form={form}
                name="title"
                label="Task Title"
                description="Choose a clear, descriptive title for your task."
                placeholder="Enter task title"
                readOnly={readOnly}
              />

              <TextareaField
                form={form}
                name="description"
                label="Description"
                description="Provide details about what needs to be done. (Optional)"
                placeholder="Describe the task..."
                readOnly={readOnly}
                className="min-h-[100px] resize-none"
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <SelectField
                  form={form}
                  name="priority"
                  label="Priority"
                  description="Set the urgency level for this task."
                  placeholder="Select priority"
                  options={[
                    { value: "low", label: "Low" },
                    { value: "medium", label: "Medium" },
                    { value: "high", label: "High" },
                    { value: "urgent", label: "Urgent" },
                  ]}
                  readOnly={readOnly}
                />

                <SelectField
                  form={form}
                  name="status"
                  label="Status"
                  description="Set the current state of the task."
                  placeholder="Select status"
                  options={[
                    { value: "todo", label: "To Do" },
                    { value: "in_progress", label: "In Progress" },
                    { value: "review", label: "Review" },
                    { value: "completed", label: "Completed" },
                    { value: "cancelled", label: "Cancelled" },
                  ]}
                  readOnly={readOnly}
                />
              </div>

              <DateTimePickerField
                form={form}
                name="start_datetime"
                label="Start Date & Time"
                placeholder="Pick start date and time"
                readOnly={readOnly}
              />

              <DateTimePickerField
                form={form}
                name="due_datetime"
                label="Due Date & Time"
                placeholder="Pick due date and time"
                readOnly={readOnly}
              />

              <TagsField
                form={form}
                name="tags"
                label="Tags"
                description="Separate tags with commas to organize tasks."
                placeholder="frontend, api, urgent"
                readOnly={readOnly}
              />
            </div>
          </Form>
        </div>

        {/* Fixed Footer */}
        {!readOnly && (
          <div className="px-6 py-4 border-t bg-background">
            <SheetFooter>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                onClick={form.handleSubmit(onSubmit)}
              >
                {getButtonText()}
              </Button>
            </SheetFooter>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
