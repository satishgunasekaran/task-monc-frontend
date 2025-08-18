'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { updateProfile } from '@/app/(site)/profile/actions'

interface ProfileFormProps {
  user: User
  profile: {
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
    bio?: string | null;
    website?: string | null;
    location?: string | null;
    timezone?: string | null;
    avatar_url?: string | null;
  } | null
}

export function ProfileForm({ user, profile }: ProfileFormProps) {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    try {
      const result = await updateProfile(formData)
      if (result.success) {
        toast.success('Profile updated successfully!')
      } else {
        // result is narrowed to the failure shape here
        toast.error(result.error)
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={user.email}
            disabled
            className="bg-muted text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Email cannot be changed. Contact support if needed.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={profile?.phone || ''}
            placeholder="+1 (555) 123-4567"
            className="text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="first_name" className="text-sm font-medium">First Name</Label>
          <Input
            id="first_name"
            name="first_name"
            defaultValue={profile?.first_name || ''}
            placeholder="John"
            className="text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_name" className="text-sm font-medium">Last Name</Label>
          <Input
            id="last_name"
            name="last_name"
            defaultValue={profile?.last_name || ''}
            placeholder="Doe"
            className="text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website" className="text-sm font-medium">Website</Label>
          <Input
            id="website"
            name="website"
            type="url"
            defaultValue={profile?.website || ''}
            placeholder="https://example.com"
            className="text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location" className="text-sm font-medium">Location</Label>
          <Input
            id="location"
            name="location"
            defaultValue={profile?.location || ''}
            placeholder="San Francisco, CA"
            className="text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="timezone" className="text-sm font-medium">Timezone</Label>
          <select
            id="timezone"
            name="timezone"
            defaultValue={profile?.timezone || 'UTC'}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="UTC">UTC</option>
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
            <option value="Europe/London">London</option>
            <option value="Europe/Paris">Paris</option>
            <option value="Asia/Tokyo">Tokyo</option>
            <option value="Asia/Shanghai">Shanghai</option>
            <option value="Australia/Sydney">Sydney</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="avatar_url" className="text-sm font-medium">Avatar URL</Label>
          <Input
            id="avatar_url"
            name="avatar_url"
            type="url"
            defaultValue={profile?.avatar_url || ''}
            placeholder="https://example.com/avatar.jpg"
            className="text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio" className="text-sm font-medium">Bio</Label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          defaultValue={profile?.bio || ''}
          placeholder="Tell us about yourself..."
          className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
        />
      </div>

      <div className="flex justify-start">
        <Button type="submit" disabled={loading} className="min-w-[120px]">
          {loading ? 'Updating...' : 'Update Profile'}
        </Button>
      </div>
    </form>
  )
}
