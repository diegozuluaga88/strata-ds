import * as React from 'react';
import type {
  ColumnDefinition,
  DataGridState,
  DataGridToolbarContext,
  FilterLink,
  HierarchicalData,
  ProcessedRow,
} from '../types';
import { dirtyCount, type EditSessionState } from '../editing/edit-session';
import { exportToCsv, exportToXlsx } from '../lib/exportUtils';
import { type GridDensity } from '../state/density';

export interface UseGridToolbarActionsArgs<TData extends HierarchicalData<TData>> {
  setState: (updater: (prev: DataGridState<TData>) => DataGridState<TData>) => void;
  sortedData: ProcessedRow<TData>[];
  orderedVisibleColumnDefs: ColumnDefinition<TData>[];
  processedColumnDefs: ColumnDefinition<TData>[];
  onBulkEdit: unknown;
  state: DataGridState<TData>;
  initialDataLength: number;
  serverSide: boolean;
  totalRowCount?: number;
  selectAllMatching: boolean;
  sessionMode: 'cell' | 'session';
  editSession: EditSessionState;
  isSaving: boolean;
  handleSessionBegin: () => void;
  handleSessionDiscard: () => void;
  handleSessionSaveAll: () => Promise<void> | void;
}

/**
 * Split out of `use-data-grid.ts` (same 300-LOC escape hatch as
 * `use-grid-basic-actions.ts`) — the toolbar-facing derived actions: export, filter
 * clearing, density, the bulk-edit dialog trigger, and the `toolbarContext` object
 * `DataGridToolbar` reads.
 */
export function useGridToolbarActions<TData extends HierarchicalData<TData>>({
  setState,
  sortedData,
  orderedVisibleColumnDefs,
  processedColumnDefs,
  onBulkEdit,
  state,
  initialDataLength,
  serverSide,
  totalRowCount,
  selectAllMatching,
  sessionMode,
  editSession,
  isSaving,
  handleSessionBegin,
  handleSessionDiscard,
  handleSessionSaveAll,
}: UseGridToolbarActionsArgs<TData>) {
  // Selection narrows the export; an empty selection means "I didn't narrow anything"
  // and exports the full filtered/sorted set (the current behavior).
  const exportRows = React.useMemo(
    () =>
      state.selectedRows.size > 0
        ? sortedData.filter(rowItem => state.selectedRows.has(rowItem.id))
        : sortedData,
    [sortedData, state.selectedRows],
  );

  const handleExportCsv = React.useCallback(() => {
    exportToCsv(exportRows, orderedVisibleColumnDefs, 'grid_export');
  }, [exportRows, orderedVisibleColumnDefs]);

  const handleExportXlsx = React.useCallback(() => {
    exportToXlsx(exportRows, orderedVisibleColumnDefs, 'grid_export');
  }, [exportRows, orderedVisibleColumnDefs]);

  const handleClearAllFilters = React.useCallback(() => {
    setState(prevState => ({ ...prevState, globalFilter: '', columnFilters: {}, currentPage: 1 }));
  }, [setState]);

  const handleDensityChange = React.useCallback((nextDensity: GridDensity) => {
    setState(prevState => ({ ...prevState, density: nextDensity }));
  }, [setState]);

  const handleFilterLogicOperatorChange = React.useCallback((link: FilterLink) => {
    setState(prevState => ({ ...prevState, filterLogicOperator: link, currentPage: 1 }));
  }, [setState]);

  const [bulkEditOpen, setBulkEditOpen] = React.useState(false);

  const bulkEditableColumns = React.useMemo(
    () => processedColumnDefs.filter(col => col.editable !== undefined && col.editable !== false),
    [processedColumnDefs],
  );

  const openBulkEdit = React.useCallback(() => {
    if (onBulkEdit) setBulkEditOpen(true);
  }, [onBulkEdit]);

  const toolbarContext: DataGridToolbarContext = {
    selectedIds: Array.from(state.selectedRows),
    allMatchingSelected: selectAllMatching,
    filteredCount: serverSide ? (totalRowCount ?? sortedData.length) : sortedData.length,
    totalCount: serverSide ? (totalRowCount ?? initialDataLength) : initialDataLength,
    clearFilters: handleClearAllFilters,
    editSession: {
      isEditing: sessionMode === 'session' && editSession.active,
      dirtyCount: dirtyCount(editSession),
      isSaving,
      begin: handleSessionBegin,
      saveAll: () => void handleSessionSaveAll(),
      discard: handleSessionDiscard,
    },
    openBulkEdit,
  };

  return {
    handleExportCsv,
    handleExportXlsx,
    handleClearAllFilters,
    handleDensityChange,
    handleFilterLogicOperatorChange,
    bulkEditOpen,
    setBulkEditOpen,
    bulkEditableColumns,
    openBulkEdit,
    toolbarContext,
  };
}
