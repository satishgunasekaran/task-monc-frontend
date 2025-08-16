'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { createOrganization } from '@/app/(site)/profile/actions'

interface OrganizationFormProps {
  userId: string
}

export function OrganizationForm({ userId }: OrganizationFormProps) {
  const [loading, setLoading] = useState(false)
  const [slug, setSlug] = useState('')

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value
    setSlug(generateSlug(name))
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    try {
      const result = await createOrganization(formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Organization created successfully!')
        // Reset form
        const form = document.getElementById('org-form') as HTMLFormElement
        form.reset()
        setSlug('')
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border rounded-lg p-4 md:p-6">
      <form id="org-form" action={handleSubmit} className="space-y-4 md:space-y-6">
        <input type="hidden" name="userId" value={userId} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <div className="space-y-2">
            <Label htmlFor="org_name" className="text-sm font-medium">Organization Name</Label>
            <Input
              id="org_name"
              name="name"
              required
              placeholder="Acme Corporation"
              onChange={handleNameChange}
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="org_slug" className="text-sm font-medium">URL Slug</Label>
            <div className="flex items-center space-x-1 md:space-x-2">
              <span className="text-xs md:text-sm text-muted-foreground shrink-0">your-app.com/</span>
              <Input
                id="org_slug"
                name="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                placeholder="acme-corp"
                pattern="^[a-z0-9-]+$"
                title="Only lowercase letters, numbers, and hyphens are allowed"
                className="text-sm min-w-0"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Only lowercase letters, numbers, and hyphens. No spaces.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="org_description" className="text-sm font-medium">Description</Label>
          <textarea
            id="org_description"
            name="description"
            rows={3}
            placeholder="What does your organization do?"
            className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="org_logo" className="text-sm font-medium">Logo URL (optional)</Label>
          <Input
            id="org_logo"
            name="logo_url"
            type="url"
            placeholder="https://example.com/logo.png"
            className="text-sm"
          />
        </div>

        <div className="flex justify-start">
          <Button type="submit" disabled={loading} className="min-w-[140px]">
            {loading ? 'Creating...' : 'Create Organization'}
          </Button>
        </div>
      </form>
    </div>
  )
}
