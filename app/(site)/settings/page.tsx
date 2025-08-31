import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { OrgMembersManager } from "@/components/org-members-manager";
import { getActiveOrgIdServer } from "@/utils/active-org/server";
import PageContainer from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsDangerZone } from "@/components/settings/danger-zone";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const activeOrgId = await getActiveOrgIdServer();
  let orgName: string | null = null;
  if (activeOrgId) {
    const { data } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", activeOrgId)
      .single();
    orgName = data?.name ?? null;
  }

  return (
    <PageContainer>
      <PageHeader
        title="Organization Settings"
        description={orgName ? 
          `Current organization: ${orgName}` : 
          "No organization selected. Pick one from the top-left dropdown."
        }
      />
      
      <div className="space-y-6">
        <OrgMembersManager />
        <SettingsDangerZone />
      </div>
    </PageContainer>
  );
}
