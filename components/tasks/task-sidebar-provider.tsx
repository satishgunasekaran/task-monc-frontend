"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { TaskWithProfiles } from "@/lib/types";

type ExtendedTaskWithProfiles = TaskWithProfiles & {
  project_name?: string | null;
};

export type TaskFormMode = "view" | "edit" | "create";

interface TaskSidebarContextType {
  isOpen: boolean;
  selectedTask: ExtendedTaskWithProfiles | null;
  mode: TaskFormMode;
  projectId?: string;
  openSidebar: (task: ExtendedTaskWithProfiles, mode: TaskFormMode) => void;
  openCreateSidebar: (projectId?: string) => void;
  closeSidebar: () => void;
  setMode: (mode: TaskFormMode) => void;
}

const TaskSidebarContext = createContext<TaskSidebarContextType | undefined>(
  undefined
);

interface TaskSidebarProviderProps {
  children: ReactNode;
}

export function TaskSidebarProvider({ children }: TaskSidebarProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ExtendedTaskWithProfiles | null>(null);
  const [mode, setMode] = useState<TaskFormMode>("view");
  const [projectId, setProjectId] = useState<string | undefined>();

  const openSidebar = (task: ExtendedTaskWithProfiles, taskMode: TaskFormMode) => {
    setSelectedTask(task);
    setMode(taskMode);
    setProjectId(undefined);
    setIsOpen(true);
  };

  const openCreateSidebar = (taskProjectId?: string) => {
    setSelectedTask(null);
    setMode("create");
    setProjectId(taskProjectId);
    setIsOpen(true);
  };

  const closeSidebar = () => {
    setIsOpen(false);
    setSelectedTask(null);
    setMode("view");
    setProjectId(undefined);
  };

  const contextValue: TaskSidebarContextType = {
    isOpen,
    selectedTask,
    mode,
    projectId,
    openSidebar,
    openCreateSidebar,
    closeSidebar,
    setMode,
  };

  return (
    <TaskSidebarContext.Provider value={contextValue}>
      {children}
    </TaskSidebarContext.Provider>
  );
}

export function useTaskSidebar() {
  const context = useContext(TaskSidebarContext);
  if (context === undefined) {
    throw new Error("useTaskSidebar must be used within a TaskSidebarProvider");
  }
  return context;
}
