"use client";

import { useEffect, useMemo, useState } from "react";
// Button import not used here
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmButton } from "@/components/confirm-button";
import {
  useLeaveOrganizationMutation,
  useDeleteOrganizationMutation,
} from "@/hooks/use-organization-mutations";
import { getActiveOrgIdFromCookie } from "@/utils/active-org/client";
import { createClient as createSupabaseBrowserClient } from "@/utils/supabase/client";

export function SettingsDangerZone() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [role, setRole] = useState<"owner" | "admin" | "member" | null>(null);

  const leaveOrgMutation = useLeaveOrganizationMutation();
  const deleteOrgMutation = useDeleteOrganizationMutation();

  useEffect(() => {
    const id = getActiveOrgIdFromCookie();
    setActiveOrgId(id);
  }, []);

  useEffect(() => {
    if (!activeOrgId) return;
    let cancelled = false;
    (async () => {
      const [{ data: org }, { data: userData }] = await Promise.all([
        supabase
          .from("organizations")
          .select("name")
          .eq("id", activeOrgId)
          .single(),
        supabase.auth.getUser(),
      ]);
      if (cancelled) return;
      setOrgName(org?.name ?? null);
      const uid = userData.user?.id;
      if (!uid) return;
      const { data: mem } = await supabase
        .from("organization_memberships")
        .select("role")
        .eq("organization_id", activeOrgId)
        .eq("user_id", uid)
        .single();
      setRole((mem?.role as unknown as "owner" | "admin" | "member") ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, activeOrgId]);

  const onLeave = async () => {
    leaveOrgMutation.mutate();
  };

  const onDelete = async () => {
    deleteOrgMutation.mutate();
  };

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-destructive">Danger Zone</CardTitle>
      </CardHeader>
      <CardContent>
        {!activeOrgId ? (
          <div className="text-sm text-muted-foreground">
            Select an organization to manage
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border p-4">
              <div className="mb-2 font-medium">Leave organization</div>
              <div className="mb-3 text-sm text-muted-foreground">
                You will be removed from {orgName ?? "this organization"}. You
                can rejoin via a new invite.
              </div>
              <ConfirmButton
                onConfirm={onLeave}
                variant="destructive"
                confirmText={leaveOrgMutation.isPending ? "Leaving…" : "Leave"}
                disabled={
                  leaveOrgMutation.isPending || deleteOrgMutation.isPending
                }
                title="Leave organization?"
                description="Are you sure you want to leave this organization? You may lose access to its projects."
              >
                {leaveOrgMutation.isPending ? "Leaving…" : "Leave organization"}
              </ConfirmButton>
            </div>

            <div className="rounded-md border p-4">
              <div className="mb-2 font-medium">Delete organization</div>
              <div className="mb-3 text-sm text-muted-foreground">
                Permanently delete {orgName ?? "this organization"} and all
                related data. This action cannot be undone.
              </div>
              <ConfirmButton
                onConfirm={onDelete}
                variant="destructive"
                confirmText={
                  deleteOrgMutation.isPending ? "Deleting…" : "Delete"
                }
                disabled={
                  leaveOrgMutation.isPending ||
                  deleteOrgMutation.isPending ||
                  role !== "owner"
                }
                title="Delete organization?"
                description="This will permanently remove the organization and all related data."
              >
                {role !== "owner"
                  ? "Only owners can delete"
                  : deleteOrgMutation.isPending
                    ? "Deleting…"
                    : "Delete organization"}
              </ConfirmButton>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
