import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Header from "@/components/layout/header";
import { AppLoadingWrapper } from "@/components/layout/app-loading-wrapper";

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/login");
  }

  const defaultOpen = true;

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      {/* set max height as dvh */}
      <SidebarInset>
        <Header />
        {/* page main content */}
        <AppLoadingWrapper>
          {children}
        </AppLoadingWrapper>
        {/* page main content ends */}
      </SidebarInset>
    </SidebarProvider>
  );
}
