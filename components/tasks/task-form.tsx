"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, X, Edit } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { TextField } from "@/components/ui/form-fields/TextField";
import { TextareaField } from "@/components/ui/form-fields/TextareaField";
import { SelectField } from "@/components/ui/form-fields/SelectField";
import { DatePickerField } from "@/components/ui/form-fields/DatePickerField";
import { TagsField } from "@/components/ui/form-fields/TagsField";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetDescription,
} from "@/components/ui/sheet";
import { createTask, updateTask } from "@/app/(site)/projects/task-actions";
import { toast } from "sonner";
import { Task } from "./types";
// Removed unused sidebar imports

const formSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  status: z.enum(["todo", "in_progress", "review", "completed", "cancelled"]),
  due_date: z.date().optional(),
  tags: z.string().optional(),
});

interface TaskFormProps {
  projectId?: string;
  task?: Task;
  trigger?: React.ReactNode;
  mode?: 'create' | 'edit' | 'view';
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
  mode = task ? 'edit' : 'create',
  open: controlledOpen,
  onOpenChange,
  onTaskCreated,
  onTaskUpdated,
  onTaskDeleted,
}: TaskFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  
  const [isEditing, setIsEditing] = useState(mode !== 'view');
  const [isLoading, setIsLoading] = useState(false);
  const isView = mode === 'view';
  const isEdit = mode === 'edit' || (mode !== 'create' && !!task);
  const readOnly = isView && !isEditing;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      priority: task?.priority || "medium",
      status: task?.status || "todo",
      due_date: task?.due_date ? new Date(task.due_date) : undefined,
      tags: task?.tags?.join(", ") || "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (readOnly) return;
    
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("description", values.description || "");
      formData.append("priority", values.priority);
      formData.append("status", values.status);
      if (values.due_date) {
        formData.append("due_date", values.due_date.toISOString());
      }
      formData.append("tags", values.tags || "");
      if (projectId) {
        formData.append("project_id", projectId);
      }

      const result =
        isEdit && task
          ? await updateTask(task.id, formData)
          : await createTask(formData);
      if (result.success) {
        const updatedTask = result.task;
        toast.success(isEdit ? "Task updated successfully" : "Task created");
        
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
      } else {
        console.error(
          `Failed to ${isEdit ? "update" : "create"} task:`,
          result.error,
        );
        const msg =
          result.error || `Failed to ${isEdit ? "update" : "create"} task`;
        toast.error(msg);
      }
    } catch (error) {
      console.error(`Error ${isEdit ? "updating" : "creating"} task:`, error);
      toast.error(`Unexpected error ${isEdit ? "updating" : "creating"} task`);
    } finally {
      setIsLoading(false);
    }
  }

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const getTitle = () => {
    if (mode === 'view') return task?.title || 'Task Details';
    return isEdit ? 'Edit Task' : 'Create New Task';
  };

  const getButtonText = () => {
    if (isView && !isEditing) return 'Edit';
    if (isLoading) return isEdit ? 'Updating...' : 'Creating...';
    return isEdit ? 'Update Task' : 'Create Task';
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

              <DatePickerField
                form={form}
                name="due_date"
                label="Due Date"
                placeholder="Pick a date"
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
