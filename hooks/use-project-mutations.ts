import { useQueryClient } from "@tanstack/react-query";
import { createProject, updateProject, deleteProject } from "@/app/(site)/projects/actions";
import { toast } from "sonner";

export function useProjectMutations() {
    const queryClient = useQueryClient();

    const invalidateProjectQueries = () => {
        // Invalidate all project-related queries
        queryClient.invalidateQueries({ queryKey: ["projects"] });
    };

    const createProjectMutation = async (formData: FormData) => {
        const result = await createProject(formData);

        if (result.success) {
            // Invalidate projects query to refetch latest data
            invalidateProjectQueries();
            toast.success("Project created successfully");
        } else {
            toast.error(result.error || "Failed to create project");
        }

        return result;
    };

    const updateProjectMutation = async (projectId: string, formData: FormData) => {
        const result = await updateProject(projectId, formData);

        if (result.success) {
            // Invalidate projects query to refetch latest data
            invalidateProjectQueries();
            toast.success("Project updated successfully");
        } else {
            toast.error(result.error || "Failed to update project");
        }

        return result;
    };

    const deleteProjectMutation = async (projectId: string) => {
        const result = await deleteProject(projectId);

        if (result.success) {
            // Invalidate projects query to refetch latest data
            invalidateProjectQueries();
            toast.success("Project deleted successfully");
        } else {
            toast.error(result.error || "Failed to delete project");
        }

        return result;
    };

    return {
        createProject: createProjectMutation,
        updateProject: updateProjectMutation,
        deleteProject: deleteProjectMutation,
    };
}