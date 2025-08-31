"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableHeaderGroup,
  TableProvider,
  TableRow,
} from "@/components/ui/shadcn-io/table";
import { TaskWithProfiles } from "@/lib/types";
import { TasksTableFilters, DateFilter } from "./tasks-table-filters";
import { getTasksTableColumns } from "./tasks-table-columns";
import { TasksTableToolbar } from "./tasks-table-toolbar";
import { TablePagination } from "@/components/ui/table-pagination";
import { applyAllFilters } from "./tasks-table-utils";
import ScrollableContainer from "../layout/scrollable-container";

type ExtendedTaskWithProfiles = TaskWithProfiles & {
  project_name?: string | null;
};

interface TasksTableProps {
  tasks: ExtendedTaskWithProfiles[];
  defaultPageSize?: number;
  onBulkDelete?: (tasks: TaskWithProfiles[]) => Promise<void>;
  onBulkStatusUpdate?: (
    tasks: TaskWithProfiles[],
    status: string,
  ) => Promise<void>;
}

export function TasksTable({
  tasks,
  defaultPageSize = 20,
  onBulkDelete,
  onBulkStatusUpdate,
}: TasksTableProps) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [projectFilter, setProjectFilter] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // Apply all filters
  const filteredTasks = useMemo(() => {
    return applyAllFilters(tasks, {
      globalFilter,
      statusFilter,
      priorityFilter,
      projectFilter,
      dateFilter,
    });
  }, [
    tasks,
    globalFilter,
    statusFilter,
    priorityFilter,
    projectFilter,
    dateFilter,
  ]);

  // Apply pagination
  const paginatedTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredTasks.slice(startIndex, endIndex);
  }, [filteredTasks, currentPage, pageSize]);

  // Calculate pagination values
  const totalPages = Math.ceil(filteredTasks.length / pageSize);

  // Generate columns
  const columns = useMemo(() => getTasksTableColumns(), []);

  const uniqueStatuses = Array.from(new Set(tasks.map((task) => task.status)));
  const uniquePriorities = Array.from(
    new Set(tasks.map((task) => task.priority)),
  );
  const uniqueProjects = Array.from(
    new Set(tasks.map((task) => task.project_name || "No Project")),
  ).sort();

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [globalFilter, statusFilter, priorityFilter, projectFilter, dateFilter]);

  return (
    <div className="flex flex-col h-full">
      {/* Filters - Fixed at top */}
      <div className="shrink-0 p-4 pb-0">
        <TasksTableFilters
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          priorityFilter={priorityFilter}
          setPriorityFilter={setPriorityFilter}
          projectFilter={projectFilter}
          setProjectFilter={setProjectFilter}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          uniqueStatuses={uniqueStatuses}
          uniquePriorities={uniquePriorities}
          uniqueProjects={uniqueProjects}
          totalTasks={tasks.length}
          filteredTasks={filteredTasks.length}
        />
      </div>
      {/* Table - Scrollable content */}
      <ScrollableContainer>
        <div className="border rounded-lg">
          <TableProvider columns={columns} data={paginatedTasks}>
            <TasksTableToolbar
              onBulkDelete={onBulkDelete}
              onBulkStatusUpdate={onBulkStatusUpdate}
            />
            <Table>
              <TableHeader>
                {({ headerGroup }) => (
                  <TableHeaderGroup
                    headerGroup={headerGroup}
                    key={headerGroup.id}
                  >
                    {({ header }) => (
                      <TableHead header={header} key={header.id} />
                    )}
                  </TableHeaderGroup>
                )}
              </TableHeader>
              <TableBody>
                {({ row }) => (
                  <TableRow
                    key={row.id}
                    row={row}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    {({ cell }) => <TableCell cell={cell} key={cell.id} />}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableProvider>
        </div>
      </ScrollableContainer>

      {/* Pagination - Fixed at bottom */}
      {filteredTasks.length > 0 && (
        <div className="shrink-0">
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filteredTasks.length}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={[10, 20, 50, 100]}
          />
        </div>
      )}
    </div>
  );
}
