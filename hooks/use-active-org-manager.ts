import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
    getActiveOrgIdFromCookie,
    setActiveOrgIdCookie,
    ACTIVE_ORG_COOKIE_MAX_AGE
} from "@/utils/active-org/client";
import type { Organization } from "./use-sidebar-data";

export function useActiveOrganizationManager() {
    const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
    const queryClient = useQueryClient();
    const router = useRouter();

    // Initialize active org from cookie
    useEffect(() => {
        const initial = getActiveOrgIdFromCookie();
        setActiveOrgId(initial);
    }, []);

    // Update active organization
    const setActiveOrganization = (orgId: string) => {
        setActiveOrgIdCookie(orgId, ACTIVE_ORG_COOKIE_MAX_AGE);
        setActiveOrgId(orgId);

        // Invalidate projects query to refetch for new org
        queryClient.invalidateQueries({ queryKey: ["projects"] });

        // Refresh server components
        router.refresh();
    };

    // Clear active organization
    const clearActiveOrganization = () => {
        // Clear cookie by setting maxAge to 0
        setActiveOrgIdCookie("", 0);
        setActiveOrgId(null);

        // Clear projects cache
        queryClient.removeQueries({ queryKey: ["projects"] });

        // Refresh server components
        router.refresh();
    };

    // Validate and update active org based on available organizations
    const validateActiveOrganization = (organizations: Organization[]) => {
        const cookiePointsToValidOrg = activeOrgId && organizations.some((o) => o.id === activeOrgId);
        const needsFallback = !activeOrgId || !cookiePointsToValidOrg;

        if (organizations.length > 0 && needsFallback) {
            const fallbackId = organizations[0].id;
            setActiveOrganization(fallbackId);
        } else if (organizations.length === 0 && activeOrgId) {
            // User is not a member of any orgs anymore
            clearActiveOrganization();
        }
    };

    return {
        activeOrgId,
        setActiveOrganization,
        clearActiveOrganization,
        validateActiveOrganization,
    };
}