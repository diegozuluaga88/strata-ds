import * as React from 'react';
import type { ColumnDefinition, DataGridState, HierarchicalData, ProcessedRow } from '../../types';
import { isColumnEditable } from '../../lib/utils';
import { extendRangeEnd, isArrowKey, isTextEntryTarget, nextFocusPosition, scrollFocusedCellIntoView } from './key-handlers';

export interface UseKeyboardNavArgs<TData extends HierarchicalData<TData>> {
  state: DataGridState<TData>;
  setState: (updater: (prev: DataGridState<TData>) => DataGridState<TData>) => void;
  paginatedData: ProcessedRow<TData>[];
  orderedVisibleColumnDefs: ColumnDefinition<TData>[];
  colDefsMap: Map<keyof TData & string, ColumnDefinition<TData>>;
  stickyOffsets: { totalLeftWidth: number; totalRightWidth: number };
  tableWrapperRef: React.RefObject<HTMLDivElement | null>;
  isTreeData: boolean;
  treeColumn?: keyof TData & string;
  enableGroupingPanel: boolean;
  enableRowSelection: boolean;
  enableRangeSelection: boolean;
  enableFind: boolean;
  undoRedoEnabled: boolean;
  rangeAnchor: { rowIndex: number; colIndex: number } | null;
  rangeEnd: { rowIndex: number; colIndex: number } | null;
  setRangeAnchor: (v: { rowIndex: number; colIndex: number } | null) => void;
  setRangeEnd: (v: { rowIndex: number; colIndex: number } | null) => void;
  contextMenuOpen: boolean;
  closeContextMenu: () => void;
  findOpen: boolean;
  openFind: () => void;
  closeFindBar: () => void;
  buildCopyText: (withHeaders: boolean) => string;
  onUndo: () => Promise<void>;
  onRedo: () => Promise<void>;
  onToggleExpandRow: (rowId: string | number) => void;
  onToggleExpandGroup: (groupKey: string) => void;
  onSelectRow: (rowId: string | number, isSelected: boolean) => void;
  onStartEditingCell: (rowId: string | number, field: keyof TData & string) => void;
  onEditCancel: () => void;
}

export function useKeyboardNav<TData extends HierarchicalData<TData>>(
  args: UseKeyboardNavArgs<TData>,
): { handleGridKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void } {
  const {
    state,
    setState,
    paginatedData,
    orderedVisibleColumnDefs,
    colDefsMap,
    stickyOffsets,
    tableWrapperRef,
    isTreeData,
    treeColumn,
    enableGroupingPanel,
    enableRowSelection,
    enableRangeSelection,
    enableFind,
    undoRedoEnabled,
    rangeAnchor,
    rangeEnd,
    setRangeAnchor,
    setRangeEnd,
    contextMenuOpen,
    closeContextMenu,
    findOpen,
    openFind,
    closeFindBar,
    buildCopyText,
    onUndo,
    onRedo,
    onToggleExpandRow,
    onToggleExpandGroup,
    onSelectRow,
    onStartEditingCell,
    onEditCancel,
  } = args;

  const handleGridKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Keys typed into interactive elements rendered by custom cells (inputs,
    // popover search boxes, the find bar) belong to those elements. Only the
    // grid's own inline cell editor (state.editingCell) takes part in grid key
    // handling — without this, Space/arrows/Enter get preventDefault'ed and
    // never reach the field. Portaled popovers still bubble here through the
    // React tree, so a DOM-containment check would not cover them.
    const keyTarget = e.target as HTMLElement;
    if (!state.editingCell && isTextEntryTarget(keyTarget)) {
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && !state.editingCell) {
      const textToCopy = buildCopyText(false);
      if (textToCopy) {
        e.preventDefault();
        navigator.clipboard?.writeText(textToCopy);
      }
      return;
    }

    if ((e.ctrlKey || e.metaKey) && !state.editingCell) {
      const key = e.key.toLowerCase();
      if (undoRedoEnabled && key === 'z' && !e.shiftKey) {
        e.preventDefault();
        void onUndo();
        return;
      }
      if (undoRedoEnabled && (key === 'y' || (key === 'z' && e.shiftKey))) {
        e.preventDefault();
        void onRedo();
        return;
      }
      if (enableFind && key === 'f') {
        e.preventDefault();
        openFind();
        return;
      }
    }

    if (enableRangeSelection && e.shiftKey && isArrowKey(e.key) && state.focusedCell && !state.editingCell) {
      const focusedRowIndex = paginatedData.findIndex(r => r.id === state.focusedCell!.rowId);
      const focusedColIndex = orderedVisibleColumnDefs.findIndex(c => c.field === state.focusedCell!.colField);
      if (focusedRowIndex >= 0 && focusedColIndex >= 0) {
        e.preventDefault();
        const anchor = rangeAnchor ?? { rowIndex: focusedRowIndex, colIndex: focusedColIndex };
        const end = rangeEnd ?? anchor;
        const { rowIndex, colIndex } = extendRangeEnd({
          key: e.key,
          end,
          rowCount: paginatedData.length,
          colCount: orderedVisibleColumnDefs.length,
        });
        setRangeAnchor(anchor);
        setRangeEnd({ rowIndex, colIndex });
        return;
      }
    }

    if (isArrowKey(e.key) && !e.shiftKey && (rangeAnchor || rangeEnd)) {
      setRangeAnchor(null);
      setRangeEnd(null);
    }

    if (!state.focusedCell && !isArrowKey(e.key)) {
      const firstFocusableRow = paginatedData.find(r => !r.isGroupHeader);
      if (firstFocusableRow && orderedVisibleColumnDefs.length > 0) {
        if (e.key === 'Enter' || e.key === 'F2' || e.key === ' ') {
            setState(prev => ({ ...prev, focusedCell: { rowId: firstFocusableRow.id, colField: orderedVisibleColumnDefs[0].field } }));
        }
      } else {
          return;
      }
    }

    const { focusedCell } = state;
    if (state.editingCell && e.key === 'Escape') {
        e.preventDefault();
        onEditCancel();
        return;
    }
    if (state.editingCell) return;

    let nextRowId: string | number | undefined = focusedCell?.rowId;
    let nextColField: (keyof TData & string) | undefined = focusedCell?.colField;

    const currentRowIndex = paginatedData.findIndex(row => row.id === focusedCell?.rowId);
    const currentColIndex = orderedVisibleColumnDefs.findIndex(col => col.field === focusedCell?.colField);

    switch (e.key) {
      case 'ArrowUp': {
        e.preventDefault();
        const pos = nextFocusPosition({ key: 'ArrowUp', rows: paginatedData, columns: orderedVisibleColumnDefs, currentRowIndex, currentColIndex });
        if (pos) nextRowId = paginatedData[pos.rowIndex].id;
        break;
      }
      case 'ArrowDown': {
        e.preventDefault();
        const pos = nextFocusPosition({ key: 'ArrowDown', rows: paginatedData, columns: orderedVisibleColumnDefs, currentRowIndex, currentColIndex });
        if (pos) nextRowId = paginatedData[pos.rowIndex].id;
        break;
      }
      case 'ArrowLeft': {
        e.preventDefault();
        const pos = nextFocusPosition({ key: 'ArrowLeft', rows: paginatedData, columns: orderedVisibleColumnDefs, currentRowIndex, currentColIndex });
        if (pos) nextColField = orderedVisibleColumnDefs[pos.colIndex].field;
        break;
      }
      case 'ArrowRight': {
        e.preventDefault();
        const pos = nextFocusPosition({ key: 'ArrowRight', rows: paginatedData, columns: orderedVisibleColumnDefs, currentRowIndex, currentColIndex });
        if (pos) nextColField = orderedVisibleColumnDefs[pos.colIndex].field;
        break;
      }
      case ' ':
        e.preventDefault();
        if (focusedCell) {
          const focusedRow = paginatedData.find(r => r.id === focusedCell.rowId);
          if (focusedRow) {
            if (isTreeData && treeColumn && focusedCell.colField === treeColumn && focusedRow.hasChildren) {
              onToggleExpandRow(focusedCell.rowId);
            } else if (enableGroupingPanel && focusedRow.isGroupHeader && focusedRow.groupKey) {
                onToggleExpandGroup(focusedRow.groupKey);
            } else if (enableRowSelection && !focusedRow.isGroupHeader) {
              onSelectRow(focusedCell.rowId, !state.selectedRows.has(focusedCell.rowId));
            }
          }
        }
        break;
      case 'Enter':
      case 'F2':
        e.preventDefault();
        if (focusedCell) {
          const focusedRow = paginatedData.find(r => r.id === focusedCell.rowId);
           if (focusedRow) {
            if (isTreeData && treeColumn && focusedCell.colField === treeColumn && focusedRow.hasChildren && e.key === 'Enter') {
                 onToggleExpandRow(focusedCell.rowId);
            } else if (enableGroupingPanel && focusedRow.isGroupHeader && focusedRow.groupKey && e.key === 'Enter') {
                 onToggleExpandGroup(focusedRow.groupKey);
            } else if (!focusedRow.isGroupHeader) {
                const colDef = colDefsMap.get(focusedCell.colField);
                if (colDef && isColumnEditable(colDef, focusedRow.originalRow)) {
                    onStartEditingCell(focusedCell.rowId, focusedCell.colField);
                }
            }
           }
        }
        break;
      case 'Escape':
        if (rangeAnchor || rangeEnd || contextMenuOpen || findOpen) {
          e.preventDefault();
          setRangeAnchor(null);
          setRangeEnd(null);
          closeContextMenu();
          if (findOpen) closeFindBar();
        }
        break;
      default:
        return;
    }

    if ((nextRowId !== undefined && nextRowId !== focusedCell?.rowId) || (nextColField !== undefined && nextColField !== focusedCell?.colField)) {
        const finalRowId = nextRowId !== undefined ? nextRowId : focusedCell?.rowId;
        const finalColField = nextColField !== undefined ? nextColField : focusedCell?.colField;
        if (finalRowId !== undefined && finalColField !== undefined) {
          setState(prev => ({ ...prev, focusedCell: { rowId: finalRowId, colField: finalColField } }));
        }
    } else if (!focusedCell && nextRowId !== undefined && nextColField !== undefined) {
        setState(prev => ({ ...prev, focusedCell: { rowId: nextRowId!, colField: nextColField! } }));
    }
  };


  React.useEffect(() => {
    if (state.focusedCell && !state.editingCell && tableWrapperRef.current) {
      // Click only updates React state; without this, DOM focus stays on
      // <body>, so onKeyDown here never fires and arrow keys fall through
      // to the browser's default page-scroll instead of cell navigation.
      // But this effect also re-runs whenever `paginatedData` changes, i.e. on
      // every keystroke in the global filter: stealing focus then would kick the
      // user out of the field they are typing in. Same target check as
      // handleGridKeyDown.
      scrollFocusedCellIntoView({
        tableWrapperEl: tableWrapperRef.current,
        cellId: `cell-${state.focusedCell.rowId}-${state.focusedCell.colField}`,
        colField: String(state.focusedCell.colField),
        pinnedLeft: state.pinnedColumns.left as string[],
        pinnedRight: state.pinnedColumns.right as string[],
        totalLeftWidth: stickyOffsets.totalLeftWidth,
        totalRightWidth: stickyOffsets.totalRightWidth,
      });
    }
  }, [state.focusedCell, state.editingCell, paginatedData, state.pinnedColumns, stickyOffsets.totalLeftWidth, stickyOffsets.totalRightWidth]);

  return { handleGridKeyDown };
}
