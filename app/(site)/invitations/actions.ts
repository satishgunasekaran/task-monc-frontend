"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { setActiveOrgIdServer } from "@/utils/active-org/server"

export async function acceptInvitation(formData: FormData) {
  const invitationId = String(formData.get("invitation_id") ?? "")
  if (!invitationId) return

  const supabase = await createClient()

  // Fetch the invitation (RLS ensures only the invitee/admin can see it)
  const { data: invitation, error: fetchError } = await supabase
    .from("organization_invitations")
    .select("id, token, organization_id, accepted_at, revoked_at, expires_at")
    .eq("id", invitationId)
    .is("accepted_at", null)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .single()

  if (fetchError || !invitation) {
    redirect("/error?reason=invite_not_found")
  }

  // Accept using secure RPC (validates email matches invite)
  const { data: membership, error: acceptError } = await supabase.rpc(
    "accept_org_invitation",
    { p_token: invitation.token }
  )

  if (acceptError) {
    redirect("/error?reason=invite_failed")
  }

  // Set active org to the joined org for convenience
  const orgId = (membership as any)?.organization_id || invitation.organization_id
  if (orgId) {
    await setActiveOrgIdServer(orgId)
  }

  redirect("/")
}


