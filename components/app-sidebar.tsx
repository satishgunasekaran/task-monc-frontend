"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Home,
  Inbox,
  Settings,
  User,
  LogOut,
  ChevronUp,
  UserCog,
  Building2,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  CheckSquare,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { logout } from "@/app/login/actions";
import { useOrganizations, useProjects } from "@/hooks/use-sidebar-data";
import { useActiveOrg } from "@/components/providers/app-provider";
import { SidebarOrgLoadingSkeleton } from "@/components/ui/loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

// Menu items.
const items = [
  { title: "Home", url: "/", icon: Home },
  { title: "Profile", url: "/profile", icon: UserCog },
  { title: "Org Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  // Use our custom hooks for data fetching and active org management
  const { data: organizations = [], isLoading: orgsLoading } =
    useOrganizations();
  const { activeOrgId, setActiveOrganization, validateActiveOrganization, isLoading: appLoading } =
    useActiveOrg();

  const { data: projects = [] } = useProjects(activeOrgId);

  const [projectsOpen, setProjectsOpen] = useState(() => {
    // Auto-open if we're on a projects page
    return pathname?.startsWith("/projects") ?? true;
  });

  const activeOrg = useMemo(
    () => organizations.find((o) => o.id === activeOrgId) ?? null,
    [organizations, activeOrgId],
  );

  // Validate active organization when organizations change
  useEffect(() => {
    if (!orgsLoading && organizations.length >= 0) {
      validateActiveOrganization(organizations);
    }
  }, [organizations, orgsLoading, validateActiveOrganization]);

  // Auto-open projects section when navigating to projects pages
  useEffect(() => {
    if (pathname?.startsWith("/projects")) {
      setProjectsOpen(true);
    }
  }, [pathname]);

  function handlePickOrg(orgId: string) {
    setActiveOrganization(orgId);
  }

  // Show loading skeleton if app is initializing or organizations are loading
  const isLoading = appLoading || orgsLoading;

  return (
    <Sidebar collapsible="icon" className="select-none">
      <SidebarContent>
        {isLoading ? (
          <SidebarOrgLoadingSkeleton />
        ) : (
          <SidebarGroup>
          <SidebarGroupLabel>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 text-left outline-none">
                    <span className="truncate max-w-[10rem]">
                      {activeOrg?.name || "Select organization"}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-70" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="min-w-56 rounded-lg"
                >
                  {orgsLoading ? (
                    <div className="px-2 py-1.5 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  ) : organizations.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No organizations
                    </div>
                  ) : (
                    organizations.map((org) => (
                      <DropdownMenuItem
                        key={org.id}
                        onClick={() => handlePickOrg(org.id)}
                        className={org.id === activeOrgId ? "font-medium" : ""}
                      >
                        {org.name}
                      </DropdownMenuItem>
                    ))
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/profile#create-organization">
                      + Create organization
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Quick link to organization settings */}
              <Link
                href="/settings"
                className="ml-1 rounded p-1 hover:bg-muted/60 hover:text-muted-foreground"
                aria-label="Organization settings"
              >
                <Settings className="h-4 w-4 opacity-80" />
              </Link>
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/invitations">
                    <Inbox />
                    <span>Invitations</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Tasks Menu Item */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/tasks"}>
                  <Link href="/tasks">
                    <CheckSquare />
                    <span>Tasks</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Projects Section with Sub-navigation */}
              <Collapsible open={projectsOpen} onOpenChange={setProjectsOpen}>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip="Projects"
                      isActive={pathname?.startsWith("/projects")}
                    >
                      <FolderOpen />
                      <span>Projects</span>
                      <ChevronRight
                        className={`ml-auto h-4 w-4 transition-transform duration-200 ${projectsOpen ? "rotate-90" : ""}`}
                      />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          isActive={pathname === "/projects"}
                        >
                          <Link href="/projects">
                            <span>All Projects</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      {projects.map((project) => (
                        <SidebarMenuSubItem key={project.id}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === `/projects/${project.id}`}
                          >
                            <Link href={`/projects/${project.id}`}>
                              <span className="truncate">{project.name}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <User className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Profile</span>
                    <span className="truncate text-xs">Manage account</span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => logout()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
