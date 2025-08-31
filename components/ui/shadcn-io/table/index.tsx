import type {
  Cell,
  Column,
  ColumnDef,
  Header,
  HeaderGroup,
  Row,
} from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";
import { memo, useCallback, useContext } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  TableBody as TableBodyRaw,
  TableCell as TableCellRaw,
  TableHeader as TableHeaderRaw,
  TableHead as TableHeadRaw,
  Table,
  TableRow as TableRowRaw,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { TableProvider, TableContext } from "./table-provider";

export type { ColumnDef } from "@tanstack/react-table";
export { TableProvider, TableContext } from "./table-provider";
export { Table };

export type TableHeadProps = {
  header: Header<unknown, unknown>;
  className?: string;
};

export const TableHead = memo(({ header, className }: TableHeadProps) => (
  <TableHeadRaw className={className} key={header.id}>
    {header.isPlaceholder
      ? null
      : flexRender(header.column.columnDef.header, header.getContext())}
  </TableHeadRaw>
));

TableHead.displayName = "TableHead";

export type TableHeaderGroupProps = {
  headerGroup: HeaderGroup<unknown>;
  children: (props: { header: Header<unknown, unknown> }) => ReactNode;
};

export const TableHeaderGroup = ({
  headerGroup,
  children,
}: TableHeaderGroupProps) => (
  <TableRowRaw key={headerGroup.id}>
    {headerGroup.headers.map((header) => children({ header }))}
  </TableRowRaw>
);

export type TableHeaderProps = {
  className?: string;
  children: (props: { headerGroup: HeaderGroup<unknown> }) => ReactNode;
};

export const TableHeader = ({ className, children }: TableHeaderProps) => {
  const { table } = useContext(TableContext);

  return (
    <TableHeaderRaw className={className}>
      {table?.getHeaderGroups().map((headerGroup) => children({ headerGroup }))}
    </TableHeaderRaw>
  );
};

export interface TableColumnHeaderProps<TData, TValue>
  extends HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function TableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: TableColumnHeaderProps<TData, TValue>) {
  // Extract inline event handlers to prevent unnecessary re-renders
  const handleSortAsc = useCallback(() => {
    column.toggleSorting(false);
  }, [column]);

  const handleSortDesc = useCallback(() => {
    column.toggleSorting(true);
  }, [column]);

  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="-ml-3 h-8 data-[state=open]:bg-accent"
            size="sm"
            variant="ghost"
          >
            <span>{title}</span>
            {column.getIsSorted() === "desc" ? (
              <ArrowDownIcon className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "asc" ? (
              <ArrowUpIcon className="ml-2 h-4 w-4" />
            ) : (
              <ChevronsUpDownIcon className="ml-2 h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={handleSortAsc}>
            <ArrowUpIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Asc
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSortDesc}>
            <ArrowDownIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Desc
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export type TableCellProps = {
  cell: Cell<unknown, unknown>;
  className?: string;
};

export const TableCell = ({ cell, className }: TableCellProps) => (
  <TableCellRaw className={className}>
    {flexRender(cell.column.columnDef.cell, cell.getContext())}
  </TableCellRaw>
);

export type TableRowProps = {
  row: Row<unknown>;
  children: (props: { cell: Cell<unknown, unknown> }) => ReactNode;
  className?: string;
};

export const TableRow = ({ row, children, className }: TableRowProps) => (
  <TableRowRaw
    className={className}
    data-state={row.getIsSelected() && "selected"}
    key={row.id}
  >
    {row.getVisibleCells().map((cell) => children({ cell }))}
  </TableRowRaw>
);

export type TableBodyProps = {
  children: (props: { row: Row<unknown> }) => ReactNode;
  className?: string;
};

export const TableBody = ({ children, className }: TableBodyProps) => {
  const { columns, table } = useContext(TableContext);
  const rows = table?.getRowModel().rows;

  return (
    <TableBodyRaw className={className}>
      {rows?.length ? (
        rows.map((row) => children({ row }))
      ) : (
        <TableRowRaw>
          <TableCellRaw className="h-24 text-center" colSpan={columns.length}>
            No results.
          </TableCellRaw>
        </TableRowRaw>
      )}
    </TableBodyRaw>
  );
};

// Hook to access selected rows
export function useTableSelection<TData = unknown>() {
  const { table, rowSelection } = useContext(TableContext);

  return {
    rowSelection,
    selectedRows: (table?.getSelectedRowModel().rows as Row<TData>[]) || [],
    selectedCount: table?.getSelectedRowModel().rows.length || 0,
    isAllRowsSelected: table?.getIsAllRowsSelected() || false,
    isSomeRowsSelected: table?.getIsSomeRowsSelected() || false,
    toggleAllRows: table?.toggleAllRowsSelected,
    resetSelection: () => table?.resetRowSelection(),
  };
}
