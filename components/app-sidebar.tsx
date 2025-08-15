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
} from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

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
import { createClient as createSupabaseBrowserClient } from "@/utils/supabase/client";
import {
  getActiveOrgIdFromCookie,
  setActiveOrgIdCookie,
  ACTIVE_ORG_COOKIE_MAX_AGE,
} from "@/utils/active-org/client";
import { clearActiveOrgIdCookie } from "@/utils/active-org/client";

// Menu items.
const items = [
  { title: "Home", url: "/", icon: Home },
  { title: "Profile", url: "/profile", icon: UserCog },
  { title: "Org Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  type Organization = { id: string; name: string; slug: string | null };
  type Project = { id: string; name: string; status: string };

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsOpen, setProjectsOpen] = useState(() => {
    // Auto-open if we're on a projects page
    return pathname?.startsWith("/projects") ?? true;
  });

  const activeOrg = useMemo(
    () => organizations.find((o) => o.id === activeOrgId) ?? null,
    [organizations, activeOrgId],
  );

  useEffect(() => {
    const initial = getActiveOrgIdFromCookie();
    setActiveOrgId(initial);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: userRes, error: authErr } = await supabase.auth.getUser();
      if (authErr) return;
      const user = userRes?.user;
      if (!user) return;

      const { data, error } = await supabase
        .from("organization_memberships")
        .select("organizations ( id, name, slug )")
        .eq("user_id", user.id);

      if (cancelled) return;
      if (!error && data) {
        const orgs = data
          .map((item: any) => item.organizations)
          .filter(Boolean)
          .sort((a: Organization, b: Organization) =>
            a.name.localeCompare(b.name),
          );

        setOrganizations(orgs);

        // If no active org set, or cookie points to an org the user isn't a member of,
        // default to the first available org. If the user has no orgs, clear any cookie.
        const cookiePointsToValidOrg =
          activeOrgId && orgs.some((o) => o.id === activeOrgId);
        const needsFallback = !activeOrgId || !cookiePointsToValidOrg;

        if (orgs.length > 0 && needsFallback) {
          const fallbackId = orgs[0].id;
          setActiveOrgIdCookie(fallbackId, ACTIVE_ORG_COOKIE_MAX_AGE);
          setActiveOrgId(fallbackId);
          router.refresh();
        } else if (orgs.length === 0 && activeOrgId) {
          // User is not a member of any orgs anymore; clear cookie
          clearActiveOrgIdCookie();
          setActiveOrgId(null);
          router.refresh();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, router, activeOrgId]);

  // Fetch projects when active organization changes
  useEffect(() => {
    if (!activeOrgId) {
      setProjects([]);
      return;
    }

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, status")
        .eq("organization_id", activeOrgId)
        .order("created_at", { ascending: false });

      if (cancelled) return;
      if (!error && data) {
        setProjects(data);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeOrgId, supabase]);

  // Auto-open projects section when navigating to projects pages
  useEffect(() => {
    if (pathname?.startsWith("/projects")) {
      setProjectsOpen(true);
    }
  }, [pathname]);

  function handlePickOrg(orgId: string) {
    setActiveOrgIdCookie(orgId, ACTIVE_ORG_COOKIE_MAX_AGE);
    setActiveOrgId(orgId);
    router.refresh();
  }

  return (
    <Sidebar collapsible="icon" className="select-none">
      <SidebarContent>
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
                  {organizations.length === 0 ? (
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
                    <Link href="/profile">+ Create organization</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
