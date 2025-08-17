"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { 
  CalendarIcon, 
  Plus, 
  Save, 
  X, 
  Edit, 
  Calendar as CalendarLucide, 
  Clock, 
  User, 
  Tag as TagIcon, 
  FileText, 
  AlertCircle 
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
import { useTaskSidebar, TaskFormMode } from "./task-sidebar-provider";

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
        const updatedTask = result.data;
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
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter task title" readOnly={readOnly} {...field} />
                    </FormControl>
                    <FormDescription>
                      Choose a clear, descriptive title for your task.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the task..."
                        className="min-h-[100px] resize-none"
                        readOnly={readOnly}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide details about what needs to be done. (Optional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={readOnly}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Set the urgency level for this task.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={readOnly}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="todo">To Do</SelectItem>
                          <SelectItem value="in_progress">
                            In Progress
                          </SelectItem>
                          <SelectItem value="review">Review</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Set the current state of the task.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            disabled={readOnly}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0 z-50 pointer-events-auto"
                        align="start"
                        onOpenAutoFocus={(e) => e.preventDefault()}
                      >
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                          }}
                          disabled={(date) => date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input placeholder="frontend, api, urgent" readOnly={readOnly} {...field} />
                    </FormControl>
                    <FormDescription>
                      Separate tags with commas to organize tasks.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
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
