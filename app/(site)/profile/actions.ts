'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { UserProfileUpdate, OrganizationInsert } from '@/lib/types'
import { ActionResult, success, failure } from '@/lib/action-result'

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return failure('User not authenticated')
  }

  const data: UserProfileUpdate = {
    first_name: formData.get('first_name') as string,
    last_name: formData.get('last_name') as string,
    phone: formData.get('phone') as string,
    bio: formData.get('bio') as string,
    website: formData.get('website') as string,
    location: formData.get('location') as string,
    timezone: formData.get('timezone') as string,
    avatar_url: formData.get('avatar_url') as string,
  }

  // Remove empty strings and replace with null
  const cleanData: UserProfileUpdate = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, value || null])
  ) as UserProfileUpdate

  const { error } = await supabase
    .from('user_profiles')
    .update(cleanData)
    .eq('id', user.id)

  if (error) {
    console.error('Profile update error:', error)
    return failure('Failed to update profile')
  }

  revalidatePath('/profile')
  return success()
}

export async function createOrganization(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return failure('User not authenticated')
  }

  const name = formData.get('name') as string
  const slug = formData.get('slug') as string
  const description = formData.get('description') as string
  const logo_url = formData.get('logo_url') as string

  if (!name || !slug) {
    return failure('Name and slug are required')
  }

  // Validate slug format
  const slugRegex = /^[a-z0-9-]+$/
  if (!slugRegex.test(slug)) {
    return failure('Slug must contain only lowercase letters, numbers, and hyphens')
  }

  // Check if slug is already taken
  const { data: existingOrg } = await supabase
    .from('organizations')
    .select('id')
    .eq('created_by', user.id)
    .eq('slug', slug)
    .single()

  if (existingOrg) {
    return failure('This slug is already taken. Please choose a different one.')
  }

  console.log('Existing org:', existingOrg)

  // Create the organization
  const orgData: OrganizationInsert = {
    name,
    slug,
    description: description || null,
    logo_url: logo_url || null,
    created_by: user.id,
  }

  const { data: newOrg, error: orgError } = await supabase
    .from('organizations')
    .insert(orgData)
    .select('id')
    .single()

  if (orgError) {
    console.error('Organization creation error:', orgError)
    return failure('Failed to create organization')
  }

  // Add the user as owner of the organization
  const { error: membershipError } = await supabase
    .from('organization_memberships')
    .insert({
      organization_id: newOrg.id,
      user_id: user.id,
      role: 'owner',
    })

  if (membershipError) {
    console.error('Membership creation error:', membershipError)
    // Try to clean up the organization if membership creation fails
    await supabase.from('organizations').delete().eq('id', newOrg.id)
    return failure('Failed to create organization membership')
  }

  revalidatePath('/profile')
  return success()
}

export async function inviteToOrganization(formData: FormData): Promise<ActionResult<{ invitation: Record<string, unknown> }>> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return failure('User not authenticated')
  }

  const organization_id = formData.get('organization_id') as string
  const email = formData.get('email') as string
  const role = (formData.get('role') as 'owner' | 'admin' | 'member') || 'member'

  if (!organization_id || !email) {
    return failure('Organization and email are required')
  }

  const { data, error } = await supabase.rpc('create_org_invitation', {
    p_organization_id: organization_id,
    p_email: email,
    p_role: role,
  })

  if (error) {
    console.error('Invite error:', error)
    const errorMessage = (error as { message?: string }).message;
    if (errorMessage && errorMessage.includes('invitation_already_exists')) {
      return failure('An active invitation already exists for this email.')
    }
    if (errorMessage && errorMessage.includes('duplicate key value')) {
      return failure('An active invitation already exists for this email.')
    }
    return failure('Failed to create invitation')
  }

  revalidatePath('/profile')
  return success({ invitation: data })
}

export async function acceptInvitation(token: string): Promise<ActionResult<{ membership: Record<string, unknown> }>> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return failure('User not authenticated')
  }

  const { data, error } = await supabase.rpc('accept_org_invitation', {
    p_token: token,
  })

  if (error) {
    console.error('Accept invite error:', error)
    return failure('Failed to accept invitation')
  }

  revalidatePath('/profile')
  return success({ membership: data })
}