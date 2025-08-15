export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "review" | "completed";
  priority: "low" | "medium" | "high" | "urgent";
  due_date: string | null;
  position: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  project_id?: string;
  created_by_profile?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
  assigned_to_profile?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}
