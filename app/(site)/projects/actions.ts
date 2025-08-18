'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { getActiveOrgIdServer } from '@/utils/active-org/server'
import { ProjectInsert, ProjectUpdate } from '@/lib/types'
import { success, failure } from '@/lib/action-result'

export async function createProject(formData: FormData) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return failure('User not authenticated')
    }

    const activeOrgId = await getActiveOrgIdServer()

    if (!activeOrgId) {
        return failure('No active organization found. Please select an organization before creating a project.')
    }

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const start_date = formData.get('start_date') as string
    const due_date = formData.get('due_date') as string
    const status = formData.get('status') as string

    if (!name) {
        return failure('Project name is required')
    }

    const projectData: ProjectInsert = {
        name,
        description: description || null,
        start_date: start_date || null,
        due_date: due_date || null,
        status: (status as ProjectInsert['status']) || 'planning',
        organization_id: activeOrgId,
        created_by: user.id,
    }

    const { data: newProject, error } = await supabase
        .from('projects')
        .insert(projectData)
        .select('id')
        .single()

    if (error) {
        console.error('Project creation error:', error)
        return failure(`Failed to create project: ${error.message}`)
    }

    revalidatePath('/projects')
    return success({ project: newProject })
}

export async function updateProject(projectId: string, formData: FormData) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return failure('User not authenticated')
    }

    const activeOrgId = await getActiveOrgIdServer()

    if (!activeOrgId) {
        return failure('No active organization selected')
    }

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const start_date = formData.get('start_date') as string
    const due_date = formData.get('due_date') as string
    const status = formData.get('status') as string

    if (!name) {
        return failure('Project name is required')
    }

    const updateData: ProjectUpdate = {
        name,
        description: description || null,
        start_date: start_date || null,
        due_date: due_date || null,
        status: (status as ProjectUpdate['status']) || 'planning',
    }

    const { error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', projectId)
        .eq('organization_id', activeOrgId)

    if (error) {
        console.error('Project update error:', error)
        return failure('Failed to update project')
    }

    revalidatePath('/projects')
    revalidatePath(`/projects/${projectId}`)
    return success()
}

export async function deleteProject(projectId: string) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return failure('User not authenticated')
    }

    const activeOrgId = await getActiveOrgIdServer()

    if (!activeOrgId) {
        return failure('No active organization selected')
    }

    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('organization_id', activeOrgId)

    if (error) {
        console.error('Project deletion error:', error)
        return failure('Failed to delete project')
    }

    revalidatePath('/projects')
    return success()
}
