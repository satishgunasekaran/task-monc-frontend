"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

type BreadcrumbItem = {
  title: string;
  link: string;
};

// This allows to add custom title as well
const routeMapping: Record<string, BreadcrumbItem[]> = {
  "/": [{ title: "Dashboard", link: "/" }],
  "/profile": [
    { title: "Dashboard", link: "/" },
    { title: "Profile", link: "/profile" },
  ],
  "/settings": [
    { title: "Dashboard", link: "/" },
    { title: "Settings", link: "/settings" },
  ],
  "/invitations": [
    { title: "Dashboard", link: "/" },
    { title: "Invitations", link: "/invitations" },
  ],
  "/projects": [
    { title: "Dashboard", link: "/" },
    { title: "Projects", link: "/projects" },
  ],
  "/tasks": [
    { title: "Dashboard", link: "/" },
    { title: "Tasks", link: "/tasks" },
  ],
  "/chat": [
    { title: "Dashboard", link: "/" },
    { title: "Chat", link: "/chat" },
  ],
  // Add more custom mappings as needed
};

export function useBreadcrumbs() {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    // Check if we have a custom mapping for this exact path
    if (routeMapping[pathname]) {
      return routeMapping[pathname];
    }

    // If no exact match, fall back to generating breadcrumbs from the path
    const segments = pathname.split("/").filter(Boolean);
    return segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join("/")}`;
      return {
        title: segment.charAt(0).toUpperCase() + segment.slice(1),
        link: path,
      };
    });
  }, [pathname]);

  return breadcrumbs;
}
