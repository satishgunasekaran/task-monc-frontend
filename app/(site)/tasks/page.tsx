"use client";

import { useActiveOrg } from "@/components/providers/app-provider";
import { TasksTable } from "@/components/tasks/tasks-table";
import { CreateTaskForm } from "@/components/tasks/task-form";
import PageContainer from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import EmptyState from "@/components/ui/empty-state";
import { useTasks, useTaskMutations } from "@/hooks/use-tasks";

export default function TasksPage() {
  const { activeOrgId } = useActiveOrg();
  const { data: tasks = [], isLoading, error } = useTasks(activeOrgId);
  const { bulkDeleteTasks, bulkStatusUpdate } = useTaskMutations();

  if (error) {
    return (
      <PageContainer>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Error Loading Tasks</h1>
          <p className="text-muted-foreground">
            Failed to load tasks. Please try again.
          </p>
        </div>
      </PageContainer>
    );
  }

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-muted-foreground">Loading tasks...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!activeOrgId) {
    return (
      <PageContainer>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">No Organization Selected</h1>
          <p className="text-muted-foreground">
            Please select an organization to view tasks.
          </p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer scrollable={false}>
      <PageHeader
        title="Tasks"
        description="Manage and track all tasks across your organization's projects."
        action={
          <CreateTaskForm
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Task
              </Button>
            }
          />
        }
      />

      <div className="flex-1 space-y-4 flex flex-col">
        {tasks && tasks.length > 0 ? (
          <TasksTable
            tasks={tasks}
            defaultPageSize={20}
            onBulkDelete={bulkDeleteTasks}
            onBulkStatusUpdate={bulkStatusUpdate}
          />
        ) : (
          <EmptyState
            title="No Tasks Yet"
            description={
              "Get started by creating your first task for this organization."
            }
          />
        )}
      </div>
    </PageContainer>
  );
}
