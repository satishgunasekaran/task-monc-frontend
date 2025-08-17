"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Calendar, Filter, Search } from "lucide-react";

export type DateFilter = "all" | "today" | "this_week" | "this_month" | "overdue" | "no_due_date";

export interface TasksTableFiltersProps {
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
  statusFilter: string[];
  setStatusFilter: (value: string[]) => void;
  priorityFilter: string[];
  setPriorityFilter: (value: string[]) => void;
  projectFilter: string[];
  setProjectFilter: (value: string[]) => void;
  dateFilter: DateFilter;
  setDateFilter: (value: DateFilter) => void;
  uniqueStatuses: string[];
  uniquePriorities: string[];
  uniqueProjects: string[];
  totalTasks: number;
  filteredTasks: number;
}

const statusLabels = {
  todo: "To Do",
  in_progress: "In Progress", 
  review: "Review",
  completed: "Completed",
  cancelled: "Cancelled",
};

const dateFilterLabels = {
  all: "All Dates",
  today: "Due Today",
  this_week: "This Week",
  this_month: "This Month",
  overdue: "Overdue",
  no_due_date: "No Due Date",
};

export function TasksTableFilters({
  globalFilter,
  setGlobalFilter,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  projectFilter,
  setProjectFilter,
  dateFilter,
  setDateFilter,
  uniqueStatuses,
  uniquePriorities,
  uniqueProjects,
  totalTasks,
  filteredTasks,
}: TasksTableFiltersProps) {
  const hasActiveFilters = statusFilter.length > 0 || priorityFilter.length > 0 || projectFilter.length > 0 || dateFilter !== "all";

  const clearAllFilters = () => {
    setStatusFilter([]);
    setPriorityFilter([]);
    setProjectFilter([]);
    setDateFilter("all");
    setGlobalFilter("");
  };

  return (
    <div className="space-y-4">
      {/* Search and Clear Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search tasks..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearAllFilters}>
              Clear Filters
            </Button>
          )}
          <div className="text-sm text-muted-foreground">
            {filteredTasks} of {totalTasks} tasks
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {/* Date Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              {dateFilterLabels[dateFilter]}
              {dateFilter !== "all" && (
                <Badge variant="secondary" className="ml-2 px-1 py-0 text-xs">
                  1
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Filter by date</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {Object.entries(dateFilterLabels).map(([key, label]) => (
              <DropdownMenuCheckboxItem
                key={key}
                checked={dateFilter === key}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setDateFilter(key as DateFilter);
                  } else if (dateFilter === key) {
                    setDateFilter("all");
                  }
                }}
              >
                {label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Status
              {statusFilter.length > 0 && (
                <Badge variant="secondary" className="ml-2 px-1 py-0 text-xs">
                  {statusFilter.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {uniqueStatuses.map((status) => (
              <DropdownMenuCheckboxItem
                key={status}
                checked={statusFilter.includes(status)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setStatusFilter([...statusFilter, status]);
                  } else {
                    setStatusFilter(statusFilter.filter(s => s !== status));
                  }
                }}
              >
                {statusLabels[status as keyof typeof statusLabels] || status}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Priority Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Priority
              {priorityFilter.length > 0 && (
                <Badge variant="secondary" className="ml-2 px-1 py-0 text-xs">
                  {priorityFilter.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Filter by priority</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {uniquePriorities.map((priority) => (
              <DropdownMenuCheckboxItem
                key={priority}
                checked={priorityFilter.includes(priority)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setPriorityFilter([...priorityFilter, priority]);
                  } else {
                    setPriorityFilter(priorityFilter.filter(p => p !== priority));
                  }
                }}
              >
                <span className="capitalize">{priority}</span>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Project Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Projects
              {projectFilter.length > 0 && (
                <Badge variant="secondary" className="ml-2 px-1 py-0 text-xs">
                  {projectFilter.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 max-h-[300px] overflow-y-auto">
            <DropdownMenuLabel>Filter by project</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {uniqueProjects.map((project) => (
              <DropdownMenuCheckboxItem
                key={project}
                checked={projectFilter.includes(project)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setProjectFilter([...projectFilter, project]);
                  } else {
                    setProjectFilter(projectFilter.filter(p => p !== project));
                  }
                }}
              >
                {project || "No Project"}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
