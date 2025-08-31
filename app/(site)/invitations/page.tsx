import { createClient } from "@/utils/supabase/server";
import { acceptInvitation } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageContainer from "@/components/layout/page-container";

export default async function InvitationsPage() {
  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes?.user) {
    return null;
  }

  const userEmail = (userRes.user.email || "").toLowerCase();
  const { data: invites } = await supabase
    .from("organization_invitations")
    .select(
      "id, organization_id, email, role, created_at, expires_at, revoked_at, accepted_at, invited_by, organizations(name)",
    )
    .eq("email", userEmail)
    .is("accepted_at", null)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  // Resolve inviter profiles so we can show who invited the user
  const inviterProfiles: Record<
    string,
    { full_name: string | null; email: string | null }
  > = {};
  const inviterIds = Array.from(
    new Set(
      (invites ?? []).map((i) => i.invited_by).filter(Boolean) as string[],
    ),
  );
  if (inviterIds.length > 0) {
    const { data: profs } = await supabase
      .from("user_profiles")
      .select("id, full_name, email")
      .in("id", inviterIds);
    if (profs) {
      for (const p of profs as {
        id: string;
        full_name: string | null;
        email: string | null;
      }[]) {
        inviterProfiles[p.id] = { full_name: p.full_name, email: p.email };
      }
    }
  }

  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Pending invitations</CardTitle>
          </CardHeader>
          <CardContent>
            {(!invites || invites.length === 0) && (
              <p className="text-sm text-muted-foreground">
                No pending invitations.
              </p>
            )}

            {invites?.map((inv) => (
              <form
                key={inv.id}
                action={acceptInvitation}
                className="flex items-center justify-between border-b py-3 last:border-0"
              >
                <div className="flex flex-col">
                  <span className="font-medium">
                    {(inv as { organizations?: { name?: string } })
                      .organizations?.name ?? "Organization"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Role: {inv.role} • Expires{" "}
                    {new Date(inv.expires_at).toLocaleString()}
                  </span>
                  {inv.invited_by && (
                    <span className="text-xs text-muted-foreground">
                      Invited by:{" "}
                      {inviterProfiles[inv.invited_by]?.full_name ||
                        inviterProfiles[inv.invited_by]?.email ||
                        inv.invited_by}
                    </span>
                  )}
                </div>
                <input type="hidden" name="invitation_id" value={inv.id} />
                <Button type="submit" size="sm">
                  Accept
                </Button>
              </form>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
