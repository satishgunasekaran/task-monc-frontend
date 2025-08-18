'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { getActiveOrgIdServer, clearActiveOrgIdServer } from '@/utils/active-org/server'
import { success, failure } from '@/lib/action-result'

export async function leaveOrganizationAction() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return failure('Not authenticated')

  const activeOrgId = await getActiveOrgIdServer()
  if (!activeOrgId) return failure('No active organization selected')

  // Check current role and owner count
  const { data: myMembership, error: memErr } = await supabase
    .from('organization_memberships')
    .select('role')
    .eq('organization_id', activeOrgId)
    .eq('user_id', user.id)
    .single()

  if (memErr || !myMembership) return failure('You are not a member of this organization')

  if (myMembership.role === 'owner') {
    const { count, error: cntErr } = await supabase
      .from('organization_memberships')
      .select('user_id', { count: 'exact', head: true })
      .eq('organization_id', activeOrgId)
      .eq('role', 'owner')
    if (cntErr) return failure('Failed to check owner status')
    if ((count ?? 0) <= 1) {
      return failure('You are the only owner. Transfer ownership or delete the organization first.')
    }
  }

  const { error: delErr } = await supabase
    .from('organization_memberships')
    .delete()
    .eq('organization_id', activeOrgId)
    .eq('user_id', user.id)

  if (delErr) return failure('Failed to leave organization')

  await clearActiveOrgIdServer()
  revalidatePath('/profile')
  return success()
}

export async function deleteOrganizationAction() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return failure('Not authenticated')

  const activeOrgId = await getActiveOrgIdServer()
  if (!activeOrgId) return failure('No active organization selected')

  // Ensure current user is an owner
  const { data: mem, error: memErr } = await supabase
    .from('organization_memberships')
    .select('role')
    .eq('organization_id', activeOrgId)
    .eq('user_id', user.id)
    .single()

  if (memErr || !mem || mem.role !== 'owner') {
    return failure('Only owners can delete the organization')
  }

  // Attempt to delete organization (assumes FK ON DELETE CASCADE on related tables)
  const { error: orgErr } = await supabase
    .from('organizations')
    .delete()
    .eq('id', activeOrgId)

  if (orgErr) return failure('Failed to delete organization')

  await clearActiveOrgIdServer()
  revalidatePath('/profile')
  return success()
}
