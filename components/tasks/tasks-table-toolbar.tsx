"use client";

import { Button } from "@/components/ui/button";
import { useTableSelection } from "@/components/ui/shadcn-io/table";
import { TaskWithProfiles } from "@/lib/types";
import { Trash2, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";

interface TasksTableToolbarProps {
  onBulkDelete?: (tasks: TaskWithProfiles[]) => Promise<void>;
  onBulkStatusUpdate?: (tasks: TaskWithProfiles[], status: string) => Promise<void>;
}

export function TasksTableToolbar({ onBulkDelete, onBulkStatusUpdate }: TasksTableToolbarProps) {
  const { selectedRows, selectedCount, resetSelection } = useTableSelection<TaskWithProfiles>();
  const [isLoading, setIsLoading] = useState(false);

  const handleBulkDelete = async () => {
    if (!onBulkDelete || selectedRows.length === 0) return;
    
    setIsLoading(true);
    try {
      const tasks = selectedRows.map(row => row.original);
      await onBulkDelete(tasks);
      resetSelection();
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (!onBulkStatusUpdate || selectedRows.length === 0) return;
    
    setIsLoading(true);
    try {
      const tasks = selectedRows.map(row => row.original);
      await onBulkStatusUpdate(tasks, status);
      resetSelection();
    } finally {
      setIsLoading(false);
    }
  };

  const hasSelection = selectedCount > 0;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
      <div className="flex items-center gap-2">
        {hasSelection ? (
          <span className="text-sm font-medium">
            {selectedCount} task{selectedCount === 1 ? "" : "s"} selected
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">
            Select tasks to perform bulk actions
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {onBulkStatusUpdate && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkStatusUpdate("completed")}
              disabled={isLoading || !hasSelection}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Mark Complete
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkStatusUpdate("cancelled")}
              disabled={isLoading || !hasSelection}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          </>
        )}
        
        {onBulkDelete && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkDelete}
            disabled={isLoading || !hasSelection}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={resetSelection}
          disabled={isLoading || !hasSelection}
        >
          Clear Selection
        </Button>
      </div>
    </div>
  );
}