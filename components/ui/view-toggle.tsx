"use client";

import { Button } from "@/components/ui/button";
import { LayoutGrid, Table } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "table" | "kanban";

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  className?: string;
}

export function ViewToggle({ viewMode, onViewModeChange, className }: ViewToggleProps) {
  return (
    <div className={cn("flex items-center border rounded-lg p-1", className)}>
      <Button
        size="sm"
        variant={viewMode === "table" ? "default" : "ghost"}
        onClick={() => onViewModeChange("table")}
        className="h-7 px-2"
      >
        <Table className="h-4 w-4 mr-1" />
        Table
      </Button>
      <Button
        size="sm"
        variant={viewMode === "kanban" ? "default" : "ghost"}
        onClick={() => onViewModeChange("kanban")}
        className="h-7 px-2"
      >
        <LayoutGrid className="h-4 w-4 mr-1" />
        Kanban
      </Button>
    </div>
  );
}
