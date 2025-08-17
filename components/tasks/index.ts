// Main table components
export { TasksTable } from './tasks-table';

// Task forms and management
export { TaskForm, CreateTaskForm } from './task-form';
export { TaskSidebarProvider, useTaskSidebar } from './task-sidebar-provider';
export type { TaskFormMode } from './task-sidebar-provider';

// Modular components for reuse
export { TasksTableFilters } from './tasks-table-filters';
export { getTasksTableColumns } from './tasks-table-columns';

// Utility functions
export * from './tasks-table-utils';

// Types
export type { DateFilter } from './tasks-table-filters';
