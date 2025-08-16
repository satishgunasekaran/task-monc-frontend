"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { DraggableTaskCard } from "./draggable-task-card";
import { Task } from "./types";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TaskColumnProps {
  id: string;
  title: string;
  bgColor: string;
  tasks: Task[];
  isUpdating?: boolean;
}

export function TaskColumn({
  id,
  title,
  bgColor,
  tasks,
  isUpdating = false,
}: TaskColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  const taskIds = tasks.map((task) => task.id);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col gap-4 rounded-lg p-4 h-full transition-all duration-200",
        bgColor,
        isOver && "ring-2 ring-primary ring-offset-2 bg-opacity-80",
        isUpdating && "opacity-75",
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">{title}</h3>
        <span className="text-sm text-muted-foreground bg-background/50 px-2 py-1 rounded-full">
          {tasks.length}
        </span>
      </div>
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col space-y-4">
          <div className="relative flex flex-1">
            <div className="absolute inset-0 flex overflow-hidden rounded-lg border">
              <ScrollArea className="h-full w-full">
                <div className="flex flex-col gap-3 p-4">
                  {tasks.length > 0 ? (
                    tasks.map((task) => (
                      <DraggableTaskCard key={task.id} task={task} />
                    ))
                  ) : (
                    <div className="min-h-[120px] flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
                      <p className="text-sm text-muted-foreground">
                        Drop tasks here
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </SortableContext>
    </div>
  );
}
