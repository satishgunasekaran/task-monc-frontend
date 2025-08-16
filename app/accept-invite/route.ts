import { type NextRequest } from 'next/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { setActiveOrgIdServer } from '@/utils/active-org/server'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const token = url.searchParams.get('token')
  if (!token) {
    redirect('/error?reason=missing_token')
  }

  const supabase = await createClient()
  const { data: userRes } = await supabase.auth.getUser()

  // If not authenticated, send to login with next back to this page
  if (!userRes?.user) {
    const nextParam = encodeURIComponent(`/accept-invite?token=${encodeURIComponent(token)}`)
    // Optional: default to signup mode
    redirect(`/login?signup=1&next=${nextParam}`)
  }

  const { data, error } = await supabase.rpc('accept_org_invitation', {
    p_token: token,
  })

  if (error) {
    redirect(`/error?reason=invite_failed`)
  }

  // Set active org to the one just joined
  if (data?.organization_id) {
    await setActiveOrgIdServer(data.organization_id)
  }

  redirect('/')
}


