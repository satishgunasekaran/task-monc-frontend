export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: "planning" | "active" | "on_hold" | "completed" | "cancelled";
  start_date: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  organization_id: string;
  created_by: string;
  user_profiles?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}
