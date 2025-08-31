import type {
  ColumnDef,
  RowSelectionState,
  SortingState,
  Table,
} from "@tanstack/react-table";
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { atom, useAtom } from "jotai";
import type { ReactNode } from "react";
import { createContext } from "react";

const sortingAtom = atom<SortingState>([]);
const rowSelectionAtom = atom<RowSelectionState>({});

export const TableContext = createContext<{
  data: unknown[];
  columns: ColumnDef<unknown, unknown>[];
  table: Table<unknown> | null;
  rowSelection: RowSelectionState;
  setRowSelection: (selection: RowSelectionState) => void;
}>({
  data: [],
  columns: [],
  table: null,
  rowSelection: {},
  setRowSelection: () => {},
});

export type TableProviderProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  children: ReactNode;
};

export function TableProvider<TData, TValue>({
  columns,
  data,
  children,
}: TableProviderProps<TData, TValue>) {
  const [sorting, setSorting] = useAtom(sortingAtom);
  const [rowSelection, setRowSelection] = useAtom(rowSelectionAtom);
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
    onSortingChange: (updater) => {
      // @ts-expect-error updater is a function that returns a sorting object
      const newSorting = updater(sorting);

      setSorting(newSorting);
    },
    onRowSelectionChange: (updater) => {
      // @ts-expect-error updater is a function that returns a row selection object
      const newRowSelection = updater(rowSelection);

      setRowSelection(newRowSelection);
    },
    state: {
      sorting,
      rowSelection,
    },
  });

  return (
    <TableContext.Provider
      value={{
        data,
        columns: columns as never,
        table: table as never,
        rowSelection,
        setRowSelection,
      }}
    >
      {children}
    </TableContext.Provider>
  );
}