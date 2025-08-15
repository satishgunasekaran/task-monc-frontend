"use client";

import { ModeToggle } from "@/components/ui/theme-toggle";

import React from "react";
import { useParams, usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useEffect, useState } from "react";
import { createClient as createSupabaseBrowserClient } from "@/utils/supabase/client";

export function Header() {
  const pathname = usePathname();
  const params = useParams();
  const [chatTitle, setChatTitle] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState<string | null>(null);
  const supabase = createSupabaseBrowserClient();

  // Fetch chat title if we're on a chat page
  useEffect(() => {
    if (pathname?.includes("/chat/") && params?.id) {
      const fetchChatTitle = async () => {
        const { data } = await supabase
          .from("chats")
          .select("title")
          .eq("id", params.id)
          .single();
        setChatTitle(data?.title || null);
      };
      fetchChatTitle();
    } else {
      setChatTitle(null);
    }
  }, [pathname, params?.id, supabase]);

  // Fetch project title if we're on a project page
  useEffect(() => {
    if (pathname?.includes("/projects/") && params?.id) {
      const fetchProjectTitle = async () => {
        const { data } = await supabase
          .from("projects")
          .select("name")
          .eq("id", params.id)
          .single();
        setProjectTitle(data?.name || null);
      };
      fetchProjectTitle();
    } else {
      setProjectTitle(null);
    }
  }, [pathname, params?.id, supabase]);

  // Generate breadcrumbs based on current path
  const getBreadcrumbs = () => {
    if (pathname === "/") {
      return [{ label: "Home", href: "/" }];
    }

    if (pathname === "/profile") {
      return [
        { label: "Home", href: "/" },
        { label: "Profile", href: "/profile" },
      ];
    }

    if (pathname === "/settings") {
      return [
        { label: "Home", href: "/" },
        { label: "Organization Settings", href: "/settings" },
      ];
    }

    if (pathname === "/invitations") {
      return [
        { label: "Home", href: "/" },
        { label: "Invitations", href: "/invitations" },
      ];
    }

    if (pathname === "/projects") {
      return [
        { label: "Home", href: "/" },
        { label: "Projects", href: "/projects" },
      ];
    }

    if (pathname?.includes("/projects/") && params?.id) {
      return [
        { label: "Home", href: "/" },
        { label: "Projects", href: "/projects" },
        { label: projectTitle || "Project", href: `/projects/${params.id}` },
      ];
    }

    if (pathname === "/chat") {
      return [
        { label: "Home", href: "/" },
        { label: "Chat", href: "/chat" },
      ];
    }

    if (pathname?.includes("/chat/") && params?.id) {
      return [
        { label: "Home", href: "/" },
        { label: "Chat", href: "/chat" },
        { label: chatTitle || "Chat", href: `/chat/${params.id}` },
      ];
    }

    return [{ label: "Home", href: "/" }];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="flex h-14 items-center border-b bg-background px-6 select-none">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((breadcrumb, index) => (
              <React.Fragment key={`breadcrumb-${index}`}>
                <BreadcrumbItem>
                  {index === breadcrumbs.length - 1 ? (
                    <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={breadcrumb.href}>
                      {breadcrumb.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="ml-auto">
        <ModeToggle />
      </div>
    </header>
  );
}
