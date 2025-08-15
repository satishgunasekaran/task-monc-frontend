import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { OrgMembersManager } from '@/components/org-members-manager'
import { getActiveOrgIdServer } from '@/utils/active-org/server'

export default async function SettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const activeOrgId = await getActiveOrgIdServer()
    let orgName: string | null = null
    if (activeOrgId) {
        const { data } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', activeOrgId)
            .single()
        orgName = data?.name ?? null
    }

    return (
        <div className="p-4 md:p-6 space-y-6">
            <h1 className="text-2xl font-semibold tracking-tight">Org Settings</h1>
            <p className="text-sm text-muted-foreground">
                {orgName ? (
                    <>Current organization: <span className="font-medium">{orgName}</span></>
                ) : (
                    <>No organization selected. Pick one from the top-left dropdown.</>
                )}
            </p>

            <OrgMembersManager />
        </div>
    )
}


