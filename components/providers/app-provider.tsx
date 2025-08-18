"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  getActiveOrgIdFromCookie,
  setActiveOrgIdCookie,
  ACTIVE_ORG_COOKIE_MAX_AGE,
} from "@/utils/active-org/client";

export type Organization = {
  id: string;
  name: string;
  slug: string | null;
};

interface AppContextType {
  activeOrgId: string | null;
  activeOrg: Organization | null;
  setActiveOrg: (org: Organization | null) => void;
  setActiveOrgId: (orgId: string | null) => void;
  setActiveOrganization: (orgId: string) => void;
  clearActiveOrg: () => void;
  validateActiveOrganization: (organizations: Organization[]) => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activeOrgId, setActiveOrgIdState] = useState<string | null>(null);
  const [activeOrg, setActiveOrgState] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  // Function to check if current path is organization-specific
  const isOrganizationSpecificPath = useCallback((path: string) => {
    // Pages that are specific to an organization and should redirect on org switch
    const orgSpecificPaths = ["/projects/", "/tasks", "/settings"];

    return orgSpecificPaths.some(
      (specificPath) =>
        path.startsWith(specificPath) || path === specificPath.slice(0, -1),
    );
  }, []);

  // Initialize active org from cookie on mount
  useEffect(() => {
    const orgId = getActiveOrgIdFromCookie();
    setActiveOrgIdState(orgId);
    setIsLoading(false);
  }, []);

  // Set active organization and update cookie
  const setActiveOrg = useCallback(
    (org: Organization | null) => {
      setActiveOrgState(org);
      setActiveOrgIdState(org?.id || null);

      if (org) {
        setActiveOrgIdCookie(org.id);
      } else {
        // clear cookie by setting max-age to 0
        setActiveOrgIdCookie("", 0);
      }

      // Refresh the router to ensure server components get the updated cookie
      router.refresh();
    },
    [router],
  );

  // Set active organization ID and update cookie
  const setActiveOrgId = useCallback(
    (orgId: string | null) => {
      setActiveOrgIdState(orgId);

      if (orgId) {
        setActiveOrgIdCookie(orgId);
      } else {
        // clear cookie by setting max-age to 0
        setActiveOrgIdCookie("", 0);
        setActiveOrgState(null);
      }

      // Refresh the router to ensure server components get the updated cookie
      router.refresh();
    },
    [router],
  );

  // Set active organization (legacy method for compatibility)
  const setActiveOrganization = useCallback(
    (orgId: string) => {
      const previousOrgId = activeOrgId;

      setActiveOrgIdCookie(orgId, ACTIVE_ORG_COOKIE_MAX_AGE);
      setActiveOrgIdState(orgId);

      // Invalidate projects query to refetch for new org
      queryClient.invalidateQueries({ queryKey: ["projects"] });

      // If switching to a different organization and on org-specific page, navigate to home
      if (
        previousOrgId &&
        previousOrgId !== orgId &&
        isOrganizationSpecificPath(pathname)
      ) {
        router.push("/");
      } else {
        // Refresh server components
        router.refresh();
      }
    },
    [router, queryClient, activeOrgId, pathname, isOrganizationSpecificPath],
  );

  // Clear active organization
  const clearActiveOrg = useCallback(() => {
    setActiveOrgState(null);
    setActiveOrgIdState(null);
    // clear cookie by setting max-age to 0
    setActiveOrgIdCookie("", 0);

    // Clear projects cache
    queryClient.removeQueries({ queryKey: ["projects"] });

    // If on org-specific page, navigate to home, otherwise just refresh
    if (isOrganizationSpecificPath(pathname)) {
      router.push("/");
    } else {
      router.refresh();
    }
  }, [router, queryClient, pathname, isOrganizationSpecificPath]);

  // Validate and update active org based on available organizations
  const validateActiveOrganization = useCallback(
    (organizations: Organization[]) => {
      const cookiePointsToValidOrg =
        activeOrgId && organizations.some((o) => o.id === activeOrgId);
      const needsFallback = !activeOrgId || !cookiePointsToValidOrg;

      if (organizations.length > 0 && needsFallback) {
        const fallbackId = organizations[0].id;

        // If switching to fallback org and on org-specific page, navigate to home
        if (
          activeOrgId &&
          activeOrgId !== fallbackId &&
          isOrganizationSpecificPath(pathname)
        ) {
          setActiveOrgIdCookie(fallbackId, ACTIVE_ORG_COOKIE_MAX_AGE);
          setActiveOrgIdState(fallbackId);
          queryClient.invalidateQueries({ queryKey: ["projects"] });
          router.push("/");
        } else {
          setActiveOrganization(fallbackId);
        }
      } else if (organizations.length === 0 && activeOrgId) {
        // User is not a member of any orgs anymore
        clearActiveOrg();
      }
    },
    [
      activeOrgId,
      setActiveOrganization,
      clearActiveOrg,
      pathname,
      isOrganizationSpecificPath,
      queryClient,
      router,
    ],
  );

  const value: AppContextType = {
    activeOrgId,
    activeOrg,
    setActiveOrg,
    setActiveOrgId,
    setActiveOrganization,
    clearActiveOrg,
    validateActiveOrganization,
    isLoading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useActiveOrg() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useActiveOrg must be used within an AppProvider");
  }
  return context;
}
