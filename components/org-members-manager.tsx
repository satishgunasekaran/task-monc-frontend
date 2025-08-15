"use client"

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { createClient as createSupabaseBrowserClient } from '@/utils/supabase/client'
import { getActiveOrgIdFromCookie } from '@/utils/active-org/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { inviteToOrganization } from '@/app/(site)/profile/actions'

type MemberRow = { user_id: string; role: 'owner' | 'admin' | 'member' }
type UserProfile = { id: string; full_name: string | null; email: string | null }

export function OrgMembersManager() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null)
  const [members, setMembers] = useState<MemberRow[]>([])
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({})
  const [pendingInvites, setPendingInvites] = useState<Array<{ id: string; email: string; role: string; invited_by: string | null }>>([])

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'member' | 'admin' | 'owner'>('member')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setActiveOrgId(getActiveOrgIdFromCookie())
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data } = await supabase.auth.getUser()
      if (!cancelled) setCurrentUserId(data.user?.id ?? null)
    })()
    return () => {
      cancelled = true
    }
  }, [supabase])

  useEffect(() => {
    if (!activeOrgId) return
    let cancelled = false
    ;(async () => {
      const [{ data: memData }, { data: invData }] = await Promise.all([
        supabase
          .from('organization_memberships')
          .select('user_id, role')
          .eq('organization_id', activeOrgId),
        supabase
          .from('organization_invitations')
          .select('id, email, role, invited_by')
          .eq('organization_id', activeOrgId)
          .is('accepted_at', null)
          .is('revoked_at', null)
          .order('created_at', { ascending: false }),
      ])

      if (cancelled) return
      const safeMembers = (memData ?? []) as MemberRow[]
      setMembers(safeMembers)
      setPendingInvites((invData ?? []) as Array<{ id: string; email: string; role: string; invited_by: string | null }>)

      const userIds = Array.from(new Set(safeMembers.map((m) => m.user_id)))
      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from('user_profiles')
          .select('id, full_name, email')
          .in('id', userIds)
        if (!cancelled && profs) {
          const map: Record<string, UserProfile> = {}
          for (const p of profs as UserProfile[]) map[p.id] = p
          setProfiles(map)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [supabase, activeOrgId])

  async function onInviteSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!activeOrgId) {
      toast.error('Select an organization first')
      return
    }
    setSubmitting(true)
    try {
      const form = new FormData()
      form.set('organization_id', activeOrgId)
      form.set('email', email)
      form.set('role', role)
      const res = await inviteToOrganization(form)
      if (res && (res as { error?: string }).error) {
        toast.error((res as { error?: string }).error)
      } else {
        toast.success('Invitation sent')
        setEmail('')
        setRole('member')
        const newInvitation = (res as { invitation?: { id: string; email: string; role: string; invited_by: string | null } }).invitation
        setPendingInvites((prev) => [
          newInvitation ?? { id: 'temp-id', email, role, invited_by: currentUserId },
          ...prev,
        ])
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function revokeInvitation(invitationId: string) {
    try {
      setRevokingId(invitationId)
      const { error } = await supabase
        .from('organization_invitations')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', invitationId)
      if (error) {
        toast.error('Failed to revoke invitation')
        return
      }
      setPendingInvites((prev) => prev.filter((i) => i.id !== invitationId))
      toast.success('Invitation revoked')
    } finally {
      setRevokingId(null)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map((m) => {
              const p = profiles[m.user_id]
              return (
                <div key={m.user_id} className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-medium">{p?.full_name || p?.email || m.user_id}</div>
                    {p?.email && <div className="text-xs text-muted-foreground">{p.email}</div>}
                  </div>
                  <div className="text-xs rounded border px-1.5 py-0.5 capitalize">{m.role}</div>
                </div>
              )
            })}
            {members.length === 0 && (
              <div className="text-sm text-muted-foreground">No members</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending invitations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pendingInvites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between gap-2">
                <div className="truncate">{inv.email}</div>
                <div className="flex items-center gap-2">
                  <div className="text-xs rounded border px-1.5 py-0.5 capitalize">{inv.role}</div>
                  {inv.invited_by && inv.invited_by === currentUserId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => revokeInvitation(inv.id)}
                      disabled={revokingId === inv.id}
                    >
                      {revokingId === inv.id ? 'Revoking…' : 'Revoke'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {pendingInvites.length === 0 && (
              <div className="text-sm text-muted-foreground">No pending invites</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Invite new member</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onInviteSubmit} className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="inv_email">Email</Label>
              <Input
                id="inv_email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv_role">Role</Label>
              <select
                id="inv_role"
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                value={role}
                onChange={(e) => setRole(e.target.value as 'member' | 'admin' | 'owner')}
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Sending…' : 'Send Invite'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}



