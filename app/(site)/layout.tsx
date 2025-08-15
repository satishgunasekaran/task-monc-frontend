import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Header } from "@/components/layout/header";

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

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="h-screen flex-1 flex flex-col">
        <Header />
        <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>
      </main>
    </SidebarProvider>
  );
}
