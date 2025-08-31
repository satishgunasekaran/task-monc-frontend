"use client";

import { useActiveOrg } from "@/components/providers/app-provider";
import { useOrganizations } from "@/hooks/use-sidebar-data";
import { MainContentLoadingSkeleton } from "@/components/ui/loading-skeletons";

interface AppLoadingWrapperProps {
  children: React.ReactNode;
}

export function AppLoadingWrapper({ children }: AppLoadingWrapperProps) {
  const { isLoading: appLoading, activeOrgId } = useActiveOrg();
  const { isLoading: orgsLoading } = useOrganizations();

  // Determine if we should show loading state
  const isInitialLoading = appLoading || (orgsLoading && !activeOrgId);

  if (isInitialLoading) {
    return <MainContentLoadingSkeleton />;
  }

  return <>{children}</>;
}