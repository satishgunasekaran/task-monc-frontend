'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { getActiveOrgIdServer } from '@/utils/active-org/server'

export async function createTask(formData: FormData) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'User not authenticated' }
    }

    const activeOrgId = await getActiveOrgIdServer()

    if (!activeOrgId) {
        return { error: 'No active organization found. Please select an organization before creating a task.' }
    }

    const project_id = formData.get('project_id') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const priority = formData.get('priority') as string
    const status = formData.get('status') as string
    const due_date = formData.get('due_date') as string
    const tags = formData.get('tags') as string

    if (!project_id || !title) {
        return { error: 'Project ID and title are required' }
    }

    // Verify project belongs to the active organization
    const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', project_id)
        .eq('organization_id', activeOrgId)
        .single()

    if (projectError || !project) {
        return { error: 'Project not found or access denied' }
    }

    // Get the highest position for this project
    const { data: lastTask } = await supabase
        .from('tasks')
        .select('position')
        .eq('project_id', project_id)
        .order('position', { ascending: false })
        .limit(1)
        .single()

    const position = (lastTask?.position || 0) + 1

    const taskData = {
        title,
        description: description || null,
        priority: priority || 'medium',
        status: status || 'todo',
        due_date: due_date || null,
        tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        project_id,
        organization_id: activeOrgId,
        created_by: user.id,
        position,
    }

    const { data: newTask, error } = await supabase
        .from('tasks')
        .insert(taskData)
        .select('id')
        .single()

    if (error) {
        console.error('Task creation error:', error)
        return { error: `Failed to create task: ${error.message}` }
    }

    revalidatePath('/tasks')
    revalidatePath(`/projects/${project_id}`)
    return { success: true, task: newTask }
}

export async function updateTask(taskId: string, formData: FormData) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'User not authenticated' }
    }

    const activeOrgId = await getActiveOrgIdServer()

    if (!activeOrgId) {
        return { error: 'No active organization selected' }
    }

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const priority = formData.get('priority') as string
    const status = formData.get('status') as string
    const due_date = formData.get('due_date') as string
    const tags = formData.get('tags') as string
    const assigned_to = formData.get('assigned_to') as string

    if (!title) {
        return { error: 'Title is required' }
    }

    const updateData = {
        title,
        description: description || null,
        priority: priority || 'medium',
        status: status || 'todo',
        due_date: due_date || null,
        tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        assigned_to: assigned_to || null,
    }

    // Verify task belongs to a project in the active organization
    const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select(`
      project_id,
      projects!inner (
        organization_id
      )
    `)
        .eq('id', taskId)
        .single()

    const projectOrgId = Array.isArray(task?.projects) 
        ? task.projects[0]?.organization_id 
        : task?.projects ? (task.projects as { organization_id: string }).organization_id : undefined;
    if (taskError || !task || projectOrgId !== activeOrgId) {
        return { error: 'Task not found or access denied' }
    }

    const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)

    if (error) {
        console.error('Task update error:', error)
        return { error: 'Failed to update task' }
    }

    revalidatePath('/tasks')
    revalidatePath(`/projects/${task.project_id}`)
    return { success: true }
}

export async function updateTaskPositionAndStatus(
    taskId: string,
    newStatus: string,
    newPosition: number,
    projectId?: string
) {
    console.log('Server action called with:', { taskId, newStatus, newPosition, projectId })
    
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        console.log('User not authenticated')
        return { error: 'User not authenticated' }
    }

    const activeOrgId = await getActiveOrgIdServer()

    if (!activeOrgId) {
        console.log('No active organization selected')
        return { error: 'No active organization selected' }
    }
    
    console.log('Active org ID:', activeOrgId)

    // Verify task belongs to a project in the active organization
    const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select(`
      id,
      project_id,
      status,
      position,
      projects!inner (
        organization_id
      )
    `)
        .eq('id', taskId)
        .single()

    const projectOrgId = Array.isArray(task?.projects) 
        ? task.projects[0]?.organization_id 
        : task?.projects ? (task.projects as { organization_id: string }).organization_id : undefined;
    if (taskError || !task || projectOrgId !== activeOrgId) {
        console.log('Task verification failed:', { taskError, task, activeOrgId })
        return { error: 'Task not found or access denied' }
    }
    
    console.log('Task found:', task)

    const updateData: {
        status: string;
        position: number;
        completed_at?: string | null;
    } = {
        status: newStatus,
        position: newPosition,
    }

    // If status changed to completed, set completed_at
    if (newStatus === 'completed' && task.status !== 'completed') {
        updateData.completed_at = new Date().toISOString()
    } else if (newStatus !== 'completed' && task.status === 'completed') {
        updateData.completed_at = null
    }

    console.log('Updating task with data:', updateData)
    
    const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)

    if (error) {
        console.error('Task position update error:', error)
        return { error: 'Failed to update task position' }
    }
    
    console.log('Task updated successfully in database')

    // Reorder other tasks if needed
    
    let query = supabase
        .from('tasks')
        .select('id, position')
        .eq('status', newStatus)
        .neq('id', taskId)
        .order('position', { ascending: true })
    
    // If we have a specific project, filter by it; otherwise get all tasks in the status column
    if (projectId) {
        query = query.eq('project_id', projectId)
    } else if (task.project_id) {
        // For the all-tasks view, we should reorder within the same project
        query = query.eq('project_id', task.project_id)
    }
    
    const { data: tasksInColumn } = await query

    if (tasksInColumn) {
        // Reorder positions to avoid conflicts
        const updates = tasksInColumn
            .filter(t => t.position >= newPosition)
            .map((t, index) => ({
                id: t.id,
                position: newPosition + index + 1,
            }))

        // Batch update positions
        for (const update of updates) {
            await supabase
                .from('tasks')
                .update({ position: update.position })
                .eq('id', update.id)
        }
    }

    revalidatePath('/tasks')
    if (projectId || task.project_id) {
        revalidatePath(`/projects/${projectId || task.project_id}`)
    }
    return { success: true }
}

export async function deleteTask(taskId: string) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'User not authenticated' }
    }

    const activeOrgId = await getActiveOrgIdServer()

    if (!activeOrgId) {
        return { error: 'No active organization selected' }
    }

    // Verify task belongs to a project in the active organization
    const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select(`
      project_id,
      projects!inner (
        organization_id
      )
    `)
        .eq('id', taskId)
        .single()

    const projectOrgId = Array.isArray(task?.projects) 
        ? task.projects[0]?.organization_id 
        : task?.projects ? (task.projects as { organization_id: string }).organization_id : undefined;
    if (taskError || !task || projectOrgId !== activeOrgId) {
        return { error: 'Task not found or access denied' }
    }

    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

    if (error) {
        console.error('Task deletion error:', error)
        return { error: 'Failed to delete task' }
    }

    revalidatePath('/tasks')
    revalidatePath(`/projects/${task.project_id}`)
    return { success: true }
}
