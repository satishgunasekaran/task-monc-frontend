import { useQuery } from "@tanstack/react-query";
import { createClient as createSupabaseBrowserClient } from "@/utils/supabase/client";
import { getActiveOrgIdFromCookie } from "@/utils/active-org/client";

export type Organization = {
    id: string;
    name: string;
    slug: string | null;
};

export type Project = {
    id: string;
    name: string;
    status: string;
};

export function useOrganizations() {
    const supabase = createSupabaseBrowserClient();

    return useQuery({
        queryKey: ["organizations"],
        queryFn: async (): Promise<Organization[]> => {
            const { data: userRes, error: authErr } = await supabase.auth.getUser();
            if (authErr) throw authErr;
            const user = userRes?.user;
            if (!user) throw new Error("User not authenticated");

            const { data, error } = await supabase
                .from("organization_memberships")
                .select(
                    `
          organizations!inner (
            id,
            name,
            slug
          )
        `,
                )
                .eq("user_id", user.id);

            if (error) throw error;

            const orgs = data
                .map((item) => {
                    // Handle the actual structure returned by Supabase
                    const org = Array.isArray(item.organizations)
                        ? item.organizations[0]
                        : item.organizations;
                    return org;
                })
                .filter(Boolean)
                .sort((a: Organization, b: Organization) =>
                    a.name.localeCompare(b.name),
                );

            return orgs;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    });
}

export function useProjects(organizationId: string | null) {
    const supabase = createSupabaseBrowserClient();

    return useQuery({
        queryKey: ["projects", organizationId],
        queryFn: async (): Promise<Project[]> => {
            if (!organizationId) return [];

            const { data, error } = await supabase
                .from("projects")
                .select("id, name, status")
                .eq("organization_id", organizationId)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data || [];
        },
        enabled: !!organizationId, // Only run query if organizationId is provided
        staleTime: 2 * 60 * 1000, // 2 minutes
        gcTime: 5 * 60 * 1000, // 5 minutes
    });
}

export function useActiveOrganization() {
    const { data: organizations = [], isLoading } = useOrganizations();
    const activeOrgId = getActiveOrgIdFromCookie();

    const activeOrg = organizations.find((o) => o.id === activeOrgId) ?? null;

    return {
        activeOrganization: activeOrg,
        isLoading,
        organizations,
    };
}