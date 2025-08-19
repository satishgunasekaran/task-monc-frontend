"use client";

import { TaskWithProfiles } from "@/lib/types";
import { DateFilter } from "./tasks-table-filters";
import { 
  isToday, 
  isThisWeek, 
  isThisMonth, 
  isPast, 
  startOfDay 
} from "date-fns";

type ExtendedTaskWithProfiles = TaskWithProfiles & {
  project_name?: string | null;
};

export function applyDateFilter(
  tasks: ExtendedTaskWithProfiles[], 
  dateFilter: DateFilter
): ExtendedTaskWithProfiles[] {
  if (dateFilter === "all") return tasks;

  return tasks.filter((task) => {
    const dueDate = task.due_datetime ? new Date(task.due_datetime) : null;

    switch (dateFilter) {
      case "today":
        return dueDate && isToday(dueDate);
        
      case "this_week":
        return dueDate && isThisWeek(dueDate, { weekStartsOn: 1 }); // Monday start
        
      case "this_month":
        return dueDate && isThisMonth(dueDate);
        
      case "overdue":
        return dueDate && 
               isPast(startOfDay(dueDate)) && 
               task.status !== "completed" &&
               task.status !== "cancelled";
        
      case "no_due_date":
        return !dueDate;
        
      default:
        return true;
    }
  });
}

export function applyTextFilter(
  tasks: ExtendedTaskWithProfiles[], 
  globalFilter: string
): ExtendedTaskWithProfiles[] {
  if (!globalFilter) return tasks;

  const searchTerm = globalFilter.toLowerCase();
  
  return tasks.filter((task) =>
    task.title.toLowerCase().includes(searchTerm) ||
    task.description?.toLowerCase().includes(searchTerm) ||
    task.project_name?.toLowerCase().includes(searchTerm) ||
    task.assigned_to_profile?.first_name?.toLowerCase().includes(searchTerm) ||
    task.assigned_to_profile?.last_name?.toLowerCase().includes(searchTerm) ||
    task.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
  );
}

export function applyStatusFilter(
  tasks: ExtendedTaskWithProfiles[], 
  statusFilter: string[]
): ExtendedTaskWithProfiles[] {
  if (statusFilter.length === 0) return tasks;
  
  return tasks.filter((task) => statusFilter.includes(task.status));
}

export function applyPriorityFilter(
  tasks: ExtendedTaskWithProfiles[], 
  priorityFilter: string[]
): ExtendedTaskWithProfiles[] {
  if (priorityFilter.length === 0) return tasks;
  
  return tasks.filter((task) => priorityFilter.includes(task.priority));
}

export function applyProjectFilter(
  tasks: ExtendedTaskWithProfiles[], 
  projectFilter: string[]
): ExtendedTaskWithProfiles[] {
  if (projectFilter.length === 0) return tasks;
  
  return tasks.filter((task) => {
    const projectName = task.project_name || "No Project";
    return projectFilter.includes(projectName);
  });
}

export function applyAllFilters(
  tasks: ExtendedTaskWithProfiles[],
  filters: {
    globalFilter: string;
    statusFilter: string[];
    priorityFilter: string[];
    projectFilter: string[];
    dateFilter: DateFilter;
  }
): ExtendedTaskWithProfiles[] {
  let filteredTasks = tasks;
  
  filteredTasks = applyTextFilter(filteredTasks, filters.globalFilter);
  filteredTasks = applyStatusFilter(filteredTasks, filters.statusFilter);
  filteredTasks = applyPriorityFilter(filteredTasks, filters.priorityFilter);
  filteredTasks = applyProjectFilter(filteredTasks, filters.projectFilter);
  filteredTasks = applyDateFilter(filteredTasks, filters.dateFilter);
  
  return filteredTasks;
}
