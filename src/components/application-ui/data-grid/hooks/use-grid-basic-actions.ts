import * as React from 'react';
import type { ColumnFilter, DataGridState, HierarchicalData } from '../types';

export interface UseGridBasicActionsArgs<TData extends HierarchicalData<TData>> {
  setState: (updater: (prev: DataGridState<TData>) => DataGridState<TData>) => void;
  setExpandedDetails: React.Dispatch<React.SetStateAction<Set<string | number>>>;
}

/**
 * Split out of `use-data-grid.ts` (Task 16/19 escape hatch, same one the plan already
 * used for `use-column-handlers.ts` and `use-fill-and-paste.ts`) purely to stay under
 * the 300-LOC ceiling — these are the small, self-contained state toggles that don't
 * need any of the grid's derived data.
 */
export function useGridBasicActions<TData extends HierarchicalData<TData>>({
  setState,
  setExpandedDetails,
}: UseGridBasicActionsArgs<TData>) {
  const handleSort = React.useCallback((field: keyof TData & string) => {
    setState((prevState) => {
      let direction: 'asc' | 'desc' = 'asc';
      if (prevState.sortConfig?.field === field && prevState.sortConfig.direction === 'asc') {
        direction = 'desc';
      }
      return { ...prevState, sortConfig: { field, direction }, currentPage: 1 };
    });
  }, [setState]);

  const handleClearSort = React.useCallback(() => {
    setState((prevState) => ({ ...prevState, sortConfig: null }));
  }, [setState]);

  const handleGlobalFilterChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setState((prevState) => ({ ...prevState, globalFilter: e.target.value, currentPage: 1 }));
  }, [setState]);

  const handleColumnFilterChange = React.useCallback((field: string, value?: ColumnFilter) => {
    setState((prevState) => {
      const newColumnFilters = { ...prevState.columnFilters };
      // `pruneColumnFilter` in the popover already dropped empty conditions, so an
      // undefined value is the one and only "no filter" signal — no second copy of
      // the emptiness rules lives here.
      if (!value) delete newColumnFilters[field as keyof TData & string];
      else newColumnFilters[field as keyof TData & string] = value;
      return { ...prevState, columnFilters: newColumnFilters, currentPage: 1 };
    });
  }, [setState]);

  const handlePageChange = React.useCallback((page: number) => {
    setState((prevState) => ({ ...prevState, currentPage: page, focusedCell: null }));
  }, [setState]);

  const handlePageSizeChange = React.useCallback((size: number) => {
    setState((prevState) => ({ ...prevState, pageSize: size, currentPage: 1, focusedCell: null }));
  }, [setState]);

  const handleToggleExpandRow = React.useCallback((rowId: string | number) => {
    setState(prevState => {
      const newExpandedRows = new Set(prevState.expandedRows);
      if (newExpandedRows.has(rowId)) {
        newExpandedRows.delete(rowId);
      } else {
        newExpandedRows.add(rowId);
      }
      return { ...prevState, expandedRows: newExpandedRows };
    });
  }, [setState]);

  const handleToggleDetail = React.useCallback((rowId: string | number) => {
    setExpandedDetails(prev => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  }, [setExpandedDetails]);

  const handleToggleExpandGroup = React.useCallback((groupKey: string) => {
    setState(prevState => {
      const newExpandedGroups = new Set(prevState.expandedGroups);
      if (newExpandedGroups.has(groupKey)) {
        newExpandedGroups.delete(groupKey);
      } else {
        newExpandedGroups.add(groupKey);
      }
      return { ...prevState, expandedGroups: newExpandedGroups, currentPage: 1 };
    });
  }, [setState]);

  return {
    handleSort,
    handleClearSort,
    handleGlobalFilterChange,
    handleColumnFilterChange,
    handlePageChange,
    handlePageSizeChange,
    handleToggleExpandRow,
    handleToggleDetail,
    handleToggleExpandGroup,
  };
}
