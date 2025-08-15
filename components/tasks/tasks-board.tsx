import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, User, Clock } from "lucide-react";

interface Task {
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
  created_by_profile: {
    first_name: string | null;
    last_name: string | null;
  } | null;
  assigned_to_profile: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

interface TasksBoardProps {
  tasks: Task[];
}

const statusColumns = [
  { id: "todo", title: "To Do", bgColor: "bg-gray-50" },
  { id: "in_progress", title: "In Progress", bgColor: "bg-blue-50" },
  { id: "review", title: "Review", bgColor: "bg-yellow-50" },
  { id: "completed", title: "Completed", bgColor: "bg-green-50" },
];

const priorityColors = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

export function TasksBoard({ tasks }: TasksBoardProps) {
  const groupedTasks = statusColumns.reduce(
    (acc, column) => {
      acc[column.id] = tasks.filter((task) => task.status === column.id);
      return acc;
    },
    {} as Record<string, Task[]>,
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-4">
      {statusColumns.map((column) => (
        <div key={column.id} className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">{column.title}</h3>
            <span className="text-sm text-muted-foreground">
              {groupedTasks[column.id].length}
            </span>
          </div>
          <div className="flex flex-col gap-4">
            {groupedTasks[column.id].map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold line-clamp-2">
            {task.title}
          </CardTitle>
          <Badge
            variant="secondary"
            className={`text-xs font-semibold ${priorityColors[task.priority]}`}
          >
            {task.priority}
          </Badge>
        </div>
        {task.description && (
          <CardDescription className="text-sm mt-2 line-clamp-3">
            {task.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {task.tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs font-medium"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            {task.assigned_to_profile && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>
                  {task.assigned_to_profile.first_name}{" "}
                  {task.assigned_to_profile.last_name}
                </span>
              </div>
            )}
            {task.due_date && (
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                <span>{new Date(task.due_date).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
