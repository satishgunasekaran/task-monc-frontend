import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { createClient as createSupabaseBrowserClient } from "@/utils/supabase/client";
import { TaskWithProfiles } from "@/lib/types";
import { bulkDeleteTasks, createTask, updateTask, deleteTask, updateTaskPositionAndStatus } from "@/app/(site)/projects/task-actions";
import { toast } from "sonner";

export function useTasks(organizationId: string | null, projectId?: string | null) {
    const supabase = createSupabaseBrowserClient();

    return useQuery({
        queryKey: projectId 
            ? ["tasks", "project", projectId, organizationId]
            : ["tasks", "organization", organizationId],
        queryFn: async (): Promise<TaskWithProfiles[]> => {
            if (!organizationId) return [];

            // Build the query
            let query = supabase
                .from("tasks")
                .select(
                    `
                    id,
                    title,
                    description,
                    status,
                    priority,
                    due_datetime,
                    start_datetime,
                    position,
                    tags,
                    created_at,
                    updated_at,
                    completed_at,
                    created_by,
                    assigned_to,
                    project_id,
                    organization_id,
                    parent_task_id,
                    actual_hours,
                    estimated_hours,
                    projects!inner (
                        id,
                        name
                    )
                `,
                )
                .eq("organization_id", organizationId);

            // Add project filter if specified
            if (projectId) {
                query = query.eq("project_id", projectId);
            }

            const { data: tasksData, error: tasksError } = await query
                .order("created_at", { ascending: false });

            if (tasksError) throw tasksError;

            // Fetch user profiles for task creators and assignees
            let processedTasks: TaskWithProfiles[] = [];
            if (tasksData && tasksData.length > 0) {
                const userIds = [
                    ...new Set(
                        [
                            ...tasksData.map((t) => t.created_by),
                            ...tasksData.map((t) => t.assigned_to),
                        ].filter((id): id is string => Boolean(id)),
                    ),
                ];

                let userProfiles: Array<{
                    id: string;
                    first_name: string | null;
                    last_name: string | null;
                }> = [];

                if (userIds.length > 0) {
                    const { data: profiles, error: profilesError } = await supabase
                        .from("user_profiles")
                        .select("id, first_name, last_name")
                        .in("id", userIds);
                    
                    if (profilesError) throw profilesError;
                    userProfiles = profiles || [];
                }

                // Map user profiles to tasks and include project info
                processedTasks = tasksData.map((task) => ({
                    ...task,
                    tags: task.tags || [],
                    project_name: task.projects?.name || null,
                    created_by_profile:
                        userProfiles.find((profile) => profile.id === task.created_by) || null,
                    assigned_to_profile:
                        userProfiles.find((profile) => profile.id === task.assigned_to) || null,
                }));
            }

            return processedTasks;
        },
        enabled: !!organizationId, // Only run query if organizationId is provided
        staleTime: 2 * 60 * 1000, // 2 minutes
        gcTime: 5 * 60 * 1000, // 5 minutes
    });
}

export function useTaskMutations() {
    const queryClient = useQueryClient();

    const invalidateTaskQueries = (organizationId?: string, projectId?: string) => {
        // Invalidate specific task queries
        if (projectId) {
            // Invalidate project-specific tasks
            queryClient.invalidateQueries({ queryKey: ["tasks", "project", projectId] });
        }
        if (organizationId) {
            // Invalidate organization-wide tasks
            queryClient.invalidateQueries({ queryKey: ["tasks", "organization", organizationId] });
        }
        // Also invalidate all task queries as a fallback
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        queryClient.invalidateQueries({ queryKey: ["projects"] }); // Tasks affect projects too
    };

    const bulkDeleteTasksMutation = async (selectedTasks: TaskWithProfiles[]): Promise<void> => {
        if (selectedTasks.length === 0) {
            toast.error('No tasks selected');
            return;
        }

        try {
            const taskIds = selectedTasks.map(task => task.id);
            const result = await bulkDeleteTasks(taskIds);

            if (result.error) {
                toast.error(result.error);
                throw new Error(result.error);
            }

            // Invalidate and refetch queries
            const organizationId = selectedTasks[0]?.organization_id || undefined;
            const projectId = selectedTasks[0]?.project_id || undefined;
            invalidateTaskQueries(organizationId, projectId);
            
            toast.success(`Successfully deleted ${result.deletedCount} task${result.deletedCount === 1 ? '' : 's'}`);
        } catch (error) {
            console.error('Bulk delete error:', error);
            toast.error('Failed to delete tasks');
            throw error;
        }
    };

    const bulkStatusUpdateMutation = async (selectedTasks: TaskWithProfiles[], status: string): Promise<void> => {
        if (selectedTasks.length === 0) {
            toast.error('No tasks selected');
            return;
        }

        try {
            // You can implement bulk status update later if needed
            toast.info('Bulk status update not implemented yet');
        } catch (error) {
            console.error('Bulk status update error:', error);
            toast.error('Failed to update task status');
            throw error;
        }
    };

    const createTaskMutation = useMutation({
        mutationFn: async (formData: FormData) => {
            const result = await createTask(formData);
            if (result.error) {
                throw new Error(result.error);
            }
            return result;
        },
        onSuccess: (result) => {
            const projectId = result.task?.project_id || undefined;
            const organizationId = result.task?.organization_id || undefined;
            
            // Invalidate relevant queries
            invalidateTaskQueries(organizationId, projectId);
            
            toast.success('Task created successfully!');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to create task');
        },
    });

    const updateTaskMutation = useMutation({
        mutationFn: async ({ taskId, formData }: { taskId: string; formData: FormData }) => {
            const result = await updateTask(taskId, formData);
            if (result.error) {
                throw new Error(result.error);
            }
            return result;
        },
        onSuccess: (result) => {
            const projectId = result.task?.project_id || undefined;
            const organizationId = result.task?.organization_id || undefined;
            
            // Invalidate relevant queries
            invalidateTaskQueries(organizationId, projectId);
            
            toast.success('Task updated successfully!');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to update task');
        },
    });

    const deleteTaskMutation = useMutation({
        mutationFn: async (taskId: string) => {
            const result = await deleteTask(taskId);
            if (result.error) {
                throw new Error(result.error);
            }
            return result;
        },
        onSuccess: () => {
            // Invalidate all task queries since we don't have the task details after deletion
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            
            toast.success('Task deleted successfully!');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to delete task');
        },
    });

    return {
        bulkDeleteTasks: bulkDeleteTasksMutation,
        bulkStatusUpdate: bulkStatusUpdateMutation,
        createTask: createTaskMutation.mutateAsync,
        updateTask: updateTaskMutation.mutateAsync,
        deleteTask: deleteTaskMutation.mutateAsync,
        isCreating: createTaskMutation.isPending,
        isUpdating: updateTaskMutation.isPending,
        isDeleting: deleteTaskMutation.isPending,
    };
}