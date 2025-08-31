import { useQuery } from "@tanstack/react-query";
import { createClient as createSupabaseBrowserClient } from "@/utils/supabase/client";

export interface ProjectWithDetails {
  id: string;
  name: string;
  description: string | null;
  status: "completed" | "planning" | "active" | "on_hold" | "cancelled";
  start_date: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  task_count: number;
}

export function useProjects(organizationId: string | null) {
  const supabase = createSupabaseBrowserClient();

  return useQuery({
    queryKey: ["projects", organizationId],
    queryFn: async (): Promise<ProjectWithDetails[]> => {
      if (!organizationId) return [];

      // Fetch projects with task count using join
      const { data: projectsData, error } = await supabase
        .from("projects")
        .select(`
          id,
          name,
          description,
          status,
          start_date,
          due_date,
          created_at,
          updated_at,
          created_by,
          tasks(count)
        `)
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      console.log(projectsData);

      if (error) throw error;

      if (!projectsData || projectsData.length === 0) {
        return [];
      }

      // Map the data to include task count
      const projects: ProjectWithDetails[] = projectsData.map((project) => ({
        ...project,
        task_count: project.tasks?.[0]?.count || 0,
      }));

      return projects;
    },
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useProject(projectId: string | null, organizationId: string | null) {
  const supabase = createSupabaseBrowserClient();

  return useQuery({
    queryKey: ["project", projectId, organizationId],
    queryFn: async () => {
      if (!projectId || !organizationId) return null;

      // Fetch project details with task count using join
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select(`
          id,
          name,
          description,
          status,
          priority,
          start_date,
          due_date,
          created_at,
          updated_at,
          completed_at,
          created_by,
          assigned_to,
          color,
          organization_id,
          tasks(count)
        `)
        .eq("id", projectId)
        .eq("organization_id", organizationId)
        .single();

      if (projectError || !projectData) {
        throw new Error("Project not found");
      }

      return {
        ...projectData,
        task_count: projectData.tasks?.[0]?.count || 0,
      };
    },
    enabled: !!projectId && !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}