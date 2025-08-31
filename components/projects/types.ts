// Project type for components
export type Project = {
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
};
