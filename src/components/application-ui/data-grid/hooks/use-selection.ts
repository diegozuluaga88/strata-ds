import * as React from 'react';
import type { DataGridState, HierarchicalData, ProcessedRow } from '../types';

export interface UseSelectionArgs<TData extends HierarchicalData<TData>> {
  state: DataGridState<TData>;
  setState: (updater: (prev: DataGridState<TData>) => DataGridState<TData>) => void;
  /** The rows currently on screen — the scope of "select all on this page". */
  paginatedData: ProcessedRow<TData>[];
  serverSide: boolean;
  enableSelectAllMatching?: boolean;
  totalRowCount?: number;
  isRowSelectable?: (row: TData) => boolean;
  onSelectionChange?: (selectedIds: (string | number)[], meta: { allMatching: boolean }) => void;
}

export function useSelection<TData extends HierarchicalData<TData>>({
  state,
  setState,
  paginatedData,
  serverSide,
  enableSelectAllMatching,
  totalRowCount,
  isRowSelectable,
  onSelectionChange,
}: UseSelectionArgs<TData>) {
  const [selectAllMatching, setSelectAllMatching] = React.useState(false);

  const canSelectAllMatching = !!enableSelectAllMatching && serverSide && typeof totalRowCount === 'number';

  React.useEffect(() => {
    if (enableSelectAllMatching && !canSelectAllMatching && process.env.NODE_ENV !== 'production') {
      console.error(
        '[DataGrid] enableSelectAllMatching needs `serverSide` and a numeric `totalRowCount`; the option is hidden.',
      );
    }
  }, [enableSelectAllMatching, canSelectAllMatching]);

  // If totalRowCount regresses to a non-number (or serverSide/enableSelectAllMatching turns
  // off) while "select all matching" is already active, drop the flag rather than let the
  // bulk-edit dialog silently fall back to state.selectedRows.size — a real but smaller count
  // than what the "all matching" banner is still telling the user is selected. Notify the
  // consumer too, so any app-side "all matching selected" state doesn't go stale silently.
  React.useEffect(() => {
    if (!canSelectAllMatching && selectAllMatching) {
      setSelectAllMatching(false);
      onSelectionChange?.(Array.from(state.selectedRows), { allMatching: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSelectAllMatching]);

  const warnedRowSelectableRef = React.useRef(false);

  const isSelectable = (row: ProcessedRow<TData>): boolean => {
    if (row.isGroupHeader || !isRowSelectable) return !row.isGroupHeader;
    try {
      return isRowSelectable(row.originalRow);
    } catch (error) {
      // A throwing predicate must not take the row down with it — fail closed.
      if (process.env.NODE_ENV !== 'production' && !warnedRowSelectableRef.current) {
        warnedRowSelectableRef.current = true;
        console.error('[DataGrid] isRowSelectable threw:', error);
      }
      return false;
    }
  };

  const handleSelectRow = (rowId: string | number, isSelected: boolean) => {
    setSelectAllMatching(false);
    setState(prevState => {
      const newSelectedRows = new Set(prevState.selectedRows);
      if (isSelected) {
        newSelectedRows.add(rowId);
      } else {
        newSelectedRows.delete(rowId);
      }
      onSelectionChange?.(Array.from(newSelectedRows), { allMatching: false });
      return { ...prevState, selectedRows: newSelectedRows };
    });
  };

  const handleSelectAllRows = (isSelected: boolean) => {
    setSelectAllMatching(false);
    setState(prevState => {
      const newSelectedRows = new Set<string | number>();
      if (isSelected) {
        paginatedData.forEach(row => {
          if (isSelectable(row)) newSelectedRows.add(row.id)
        });
      }
      onSelectionChange?.(Array.from(newSelectedRows), { allMatching: false });
      return { ...prevState, selectedRows: newSelectedRows };
    });
  };

  const handleSelectAllMatching = () => {
    setSelectAllMatching(true);
    // The ids of unloaded server pages do not exist here — the flag is the payload.
    onSelectionChange?.(Array.from(state.selectedRows), { allMatching: true });
  };

  const handleClearAllMatchingSelection = () => {
    setSelectAllMatching(false);
    setState(prev => {
      onSelectionChange?.([], { allMatching: false });
      return { ...prev, selectedRows: new Set() };
    });
  };

  const isAllCurrentPageRowsSelected = paginatedData.length > 0 && paginatedData.filter(isSelectable).every(row => state.selectedRows.has(row.id));

  return {
    selectAllMatching,
    canSelectAllMatching,
    isSelectable,
    isAllCurrentPageRowsSelected,
    handleSelectRow,
    handleSelectAllRows,
    handleSelectAllMatching,
    handleClearAllMatchingSelection,
  };
}
