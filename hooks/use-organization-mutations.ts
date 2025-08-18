import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { leaveOrganizationAction, deleteOrganizationAction } from "@/app/(site)/settings/actions";
import { createOrganization } from "@/app/(site)/profile/actions";
import { useActiveOrg } from "@/components/providers/app-provider";

export function useLeaveOrganizationMutation() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const { clearActiveOrg } = useActiveOrg();

    return useMutation({
        mutationFn: leaveOrganizationAction,
        onSuccess: (result) => {
            if (result.success) {
                // Invalidate organizations query to refetch the list
                queryClient.invalidateQueries({ queryKey: ["organizations"] });

                // Clear active organization
                clearActiveOrg();

                // Navigate to profile
                router.push("/profile");

                toast.success("Left organization successfully");
            } else if (result.error) {
                toast.error(result.error);
            }
        },
        onError: (error) => {
            console.error("Error leaving organization:", error);
            toast.error("Failed to leave organization");
        },
    });
}

export function useDeleteOrganizationMutation() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const { clearActiveOrg } = useActiveOrg();

    return useMutation({
        mutationFn: deleteOrganizationAction,
        onSuccess: (result) => {
            if (result.success) {
                // Invalidate organizations query to refetch the list
                queryClient.invalidateQueries({ queryKey: ["organizations"] });

                // Clear active organization
                clearActiveOrg();

                // Navigate to profile
                router.push("/profile");

                toast.success("Organization deleted successfully");
            } else if (result.error) {
                toast.error(result.error);
            }
        },
        onError: (error) => {
            console.error("Error deleting organization:", error);
            toast.error("Failed to delete organization");
        },
    });
}

export function useCreateOrganizationMutation() {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: createOrganization,
        onSuccess: (result) => {
            if (result.success) {
                // Invalidate organizations query to refetch the list
                queryClient.invalidateQueries({ queryKey: ["organizations"] });

                toast.success("Organization created successfully");

                // Optionally navigate or refresh
                router.refresh();
            } else if (result.error) {
                toast.error(result.error);
            }
        },
        onError: (error) => {
            console.error("Error creating organization:", error);
            toast.error("Failed to create organization");
        },
    });
}