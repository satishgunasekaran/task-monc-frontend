import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { ProfileForm } from '@/components/profile-form'
import { OrganizationForm } from '@/components/organization-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default async function ProfilePage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  // Get user profile data
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get user's organizations
  const { data: organizations } = await supabase
    .from('organization_memberships')
    .select(`
      role,
      organizations (
        id,
        name,
        slug,
        description,
        logo_url,
        created_at
      )
    `)
    .eq('user_id', user.id)

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Profile Settings</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Manage your account settings and organization memberships.
        </p>
      </div>

      <div className="space-y-6 md:space-y-8">
        {/* Profile Information */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg md:text-xl">Profile Information</CardTitle>
            <CardDescription className="text-sm">
              Update your personal information and preferences.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm user={user} profile={profile} />
          </CardContent>
        </Card>

        {/* Organizations */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg md:text-xl">Organizations</CardTitle>
            <CardDescription className="text-sm">
              Manage your organizations and create new ones.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Existing Organizations */}
            {organizations && organizations.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-base md:text-lg font-semibold">Your Organizations</h3>
                <div className="space-y-3">
                  {organizations.map((membership: any) => (
                    <div
                      key={membership.organizations.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium truncate">{membership.organizations.name}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {membership.organizations.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Role: <span className="capitalize">{membership.role}</span>
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground font-mono shrink-0">
                        /{membership.organizations.slug}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {organizations && organizations.length > 0 && <Separator />}

            {/* Create New Organization */}
            <div className="space-y-4">
              <h3 className="text-base md:text-lg font-semibold">Create New Organization</h3>
              <OrganizationForm userId={user.id} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
