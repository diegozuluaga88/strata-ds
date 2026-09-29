import * as React from 'react';
import type { ColumnDefinition, DataGridState, HierarchicalData, ProcessedRow } from '../types';
import { computeRangeStats } from '../lib/gridProcessing';
import { getCellValue } from '../lib/utils';
import type { RangeChartData } from '../lib/rangeChart';
import type { ContextMenuTarget, PendingEdit } from '../internal-types';
import { useFillAndPaste } from './use-fill-and-paste';

export interface UseRangeSelectionArgs<TData extends HierarchicalData<TData>> {
  state: DataGridState<TData>;
  setState: (updater: (prev: DataGridState<TData>) => DataGridState<TData>) => void;
  paginatedData: ProcessedRow<TData>[];
  sortedData: ProcessedRow<TData>[];
  orderedVisibleColumnDefs: ColumnDefinition<TData>[];
  enableRangeSelection: boolean;
  enableContextMenu: boolean;
  enableStatusBar: boolean;
  fillHandleEnabled: boolean;
  pasteEnabled: boolean;
  canEditCells: boolean;
  /** From use-cell-commit: coerces a raw value to the cell's editor type. */
  coerceValueForCell: (rowId: string | number, field: keyof TData & string, raw: any) => any;
  /** From use-cell-commit: commits a batch and pushes one undo entry. */
  applyEdits: (edits: PendingEdit<TData>[]) => Promise<void>;
}

export function useRangeSelection<TData extends HierarchicalData<TData>>(args: UseRangeSelectionArgs<TData>) {
  const {
    state,
    setState,
    paginatedData,
    sortedData,
    orderedVisibleColumnDefs,
    enableRangeSelection,
    enableContextMenu,
    enableStatusBar,
    fillHandleEnabled,
    pasteEnabled,
    canEditCells,
    coerceValueForCell,
    applyEdits,
  } = args;

  // Range selection: indices are positions in the current display list (paginatedData)
  // and in orderedVisibleColumnDefs, so ranges follow what the user actually sees.
  const [rangeAnchor, setRangeAnchor] = React.useState<{ rowIndex: number; colIndex: number } | null>(null);
  const [rangeEnd, setRangeEnd] = React.useState<{ rowIndex: number; colIndex: number } | null>(null);
  const [isDraggingRange, setIsDraggingRange] = React.useState(false);
  const [contextMenu, setContextMenu] = React.useState<ContextMenuTarget<TData> | null>(null);
  const closeContextMenu = React.useCallback(() => setContextMenu(null), []);

  // Fill handle: fillEnd tracks the cell under the pointer while dragging the range corner.
  const [isFilling, setIsFilling] = React.useState(false);
  const [fillEnd, setFillEnd] = React.useState<{ rowIndex: number; colIndex: number } | null>(null);

  // Chart Selection dialog. The extraction is snapshotted when the menu item is
  // clicked so the open chart survives the range clearing underneath it.
  const [rangeChartData, setRangeChartData] = React.useState<RangeChartData | null>(null);

  const rangeBounds = React.useMemo(() => {
    if (!rangeAnchor || !rangeEnd) return null;
    return {
      top: Math.min(rangeAnchor.rowIndex, rangeEnd.rowIndex),
      bottom: Math.max(rangeAnchor.rowIndex, rangeEnd.rowIndex),
      left: Math.min(rangeAnchor.colIndex, rangeEnd.colIndex),
      right: Math.max(rangeAnchor.colIndex, rangeEnd.colIndex),
    };
  }, [rangeAnchor, rangeEnd]);

  const isCellInRange = (dataIndex: number, colIndex: number): boolean =>
    !!rangeBounds &&
    dataIndex >= rangeBounds.top && dataIndex <= rangeBounds.bottom &&
    colIndex >= rangeBounds.left && colIndex <= rangeBounds.right;

  // Any change to the underlying display list shifts row indices, so an existing
  // range would silently point at different cells — drop it instead. Keyed on the
  // row id sequence, not array identity: a re-render that reproduces the same rows
  // (e.g. a parent setState from onFilteredDataChange) must not clear the range.
  const paginatedRowIdsKey = React.useMemo(
    () => paginatedData.map(r => r.id).join(' '),
    [paginatedData]
  );
  const prevRowIdsKeyRef = React.useRef(paginatedRowIdsKey);
  React.useEffect(() => {
    if (prevRowIdsKeyRef.current === paginatedRowIdsKey) return;
    prevRowIdsKeyRef.current = paginatedRowIdsKey;
    setRangeAnchor(null);
    setRangeEnd(null);
  }, [paginatedRowIdsKey]);

  const handleCellMouseDown = (e: React.MouseEvent, dataIndex: number, colIndex: number) => {
    if (!enableRangeSelection || e.button !== 0 || state.editingCell) return;
    // Let buttons, links, and inputs inside cells behave normally.
    if ((e.target as HTMLElement).closest('button, a, input, select, textarea, [role="checkbox"]')) return;
    e.preventDefault();
    if (e.shiftKey && rangeAnchor) {
      setRangeEnd({ rowIndex: dataIndex, colIndex });
    } else {
      // The anchor cell becomes the active cell. Set focus here rather than relying
      // on the click event — a drag that ends on another cell never fires click.
      // navigable: false (ColumnDefinition) opts out of this the same way it opts
      // out of handleCellClick's focus set in use-edit-session.ts — otherwise a
      // mousedown on a non-interactive cellRenderer element (not caught by the
      // button/a/input/etc. closest() check above) would still trigger the
      // scroll-into-view effect this flag exists to prevent.
      const row = paginatedData[dataIndex];
      const colDef = orderedVisibleColumnDefs[colIndex];
      if (row && !row.isGroupHeader && colDef && colDef.navigable !== false) {
        setState(prev => ({ ...prev, focusedCell: { rowId: row.id, colField: colDef.field } }));
      }
      setRangeAnchor({ rowIndex: dataIndex, colIndex });
      setRangeEnd({ rowIndex: dataIndex, colIndex });
      setIsDraggingRange(true);
    }
  };

  const handleCellMouseEnter = (dataIndex: number, colIndex: number) => {
    if (isFilling) {
      setFillEnd({ rowIndex: dataIndex, colIndex });
      return;
    }
    if (isDraggingRange) {
      setRangeEnd({ rowIndex: dataIndex, colIndex });
    }
  };

  React.useEffect(() => {
    if (!isDraggingRange) return;
    const onMouseUp = () => setIsDraggingRange(false);
    document.addEventListener('mouseup', onMouseUp);
    return () => document.removeEventListener('mouseup', onMouseUp);
  }, [isDraggingRange]);

  // The rectangle the fill will extend into. Vertical extension wins over horizontal
  // when the pointer is diagonal, matching Excel.
  const fillZone = React.useMemo(() => {
    if (!isFilling || !fillEnd || !rangeBounds) return null;
    const { top, bottom, left, right } = rangeBounds;
    if (fillEnd.rowIndex > bottom) return { top: bottom + 1, bottom: fillEnd.rowIndex, left, right, direction: 'down' as const };
    if (fillEnd.rowIndex < top) return { top: fillEnd.rowIndex, bottom: top - 1, left, right, direction: 'up' as const };
    if (fillEnd.colIndex > right) return { top, bottom, left: right + 1, right: fillEnd.colIndex, direction: 'right' as const };
    if (fillEnd.colIndex < left) return { top, bottom, left: fillEnd.colIndex, right: left - 1, direction: 'left' as const };
    return null;
  }, [isFilling, fillEnd, rangeBounds]);

  const isCellInFillZone = (dataIndex: number, colIndex: number): boolean =>
    !!fillZone &&
    dataIndex >= fillZone.top && dataIndex <= fillZone.bottom &&
    colIndex >= fillZone.left && colIndex <= fillZone.right;

  const handleFillMouseDown = (e: React.MouseEvent) => {
    if (!fillHandleEnabled || !rangeBounds || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    setIsFilling(true);
    setFillEnd(null);
  };

  const { handlePaste } = useFillAndPaste<TData>({
    state,
    paginatedData,
    orderedVisibleColumnDefs,
    rangeBounds,
    fillZone,
    isFilling,
    setIsFilling,
    setFillEnd,
    pasteEnabled,
    canEditCells,
    coerceValueForCell,
    applyEdits,
  });

  // ---- Status bar range statistics ----
  const rangeCellCount = rangeBounds
    ? (rangeBounds.bottom - rangeBounds.top + 1) * (rangeBounds.right - rangeBounds.left + 1)
    : 0;
  const rangeStats = React.useMemo(() => {
    if (!enableStatusBar || !rangeBounds) return null;
    const values: any[] = [];
    for (let r = rangeBounds.top; r <= rangeBounds.bottom; r++) {
      const row = paginatedData[r];
      if (!row || row.isGroupHeader) continue;
      for (let c = rangeBounds.left; c <= rangeBounds.right; c++) {
        const colDef = orderedVisibleColumnDefs[c];
        if (colDef) values.push(getCellValue(row, colDef.field, colDef));
      }
    }
    return computeRangeStats(values);
  }, [enableStatusBar, rangeBounds, paginatedData, orderedVisibleColumnDefs]);

  // Copy precedence: a multi-cell range wins, then checkbox-selected rows (always
  // with a header row, matching pre-range behavior), then the focused cell.
  const buildCopyText = (withHeaders: boolean): string => {
    const isMultiCellRange = !!rangeBounds && (rangeBounds.bottom > rangeBounds.top || rangeBounds.right > rangeBounds.left);
    if (rangeBounds && (isMultiCellRange || withHeaders)) {
      const rangeCols = orderedVisibleColumnDefs.slice(rangeBounds.left, rangeBounds.right + 1);
      const lines: string[] = [];
      if (withHeaders) lines.push(rangeCols.map(c => c.headerText).join('\t'));
      for (let r = rangeBounds.top; r <= rangeBounds.bottom; r++) {
        const row = paginatedData[r];
        if (!row || row.isGroupHeader) continue;
        lines.push(rangeCols.map(c => String(getCellValue(row, c.field, c) ?? '')).join('\t'));
      }
      return lines.join('\n');
    }
    const selectedProcessedRows = sortedData.filter(r => !r.isGroupHeader && state.selectedRows.has(r.id));
    if (selectedProcessedRows.length > 0) {
      const header = orderedVisibleColumnDefs.map(c => c.headerText).join('\t');
      const rows = selectedProcessedRows.map(r =>
        orderedVisibleColumnDefs.map(c => String(getCellValue(r, c.field, c) ?? '')).join('\t')
      );
      return [header, ...rows].join('\n');
    }
    if (state.focusedCell) {
      const focusedRow = paginatedData.find(r => r.id === state.focusedCell!.rowId);
      if (focusedRow) return String(getCellValue(focusedRow, state.focusedCell.colField) ?? '');
    }
    return '';
  };

  const copySelectionToClipboard = (withHeaders: boolean) => {
    const text = buildCopyText(withHeaders);
    if (text) navigator.clipboard?.writeText(text);
  };

  const handleCellContextMenu = (e: React.MouseEvent, dataIndex: number, colIndex: number, rowId: string | number, colField: keyof TData & string) => {
    if (!enableContextMenu) return;
    e.preventDefault();
    setState(prev => ({ ...prev, focusedCell: { rowId, colField } }));
    if (enableRangeSelection && !isCellInRange(dataIndex, colIndex)) {
      setRangeAnchor({ rowIndex: dataIndex, colIndex });
      setRangeEnd({ rowIndex: dataIndex, colIndex });
    }
    setContextMenu({ x: e.clientX, y: e.clientY, rowId, colField });
  };

  return {
    rangeAnchor,
    rangeEnd,
    setRangeAnchor,
    setRangeEnd,
    rangeBounds,
    rangeCellCount,
    rangeStats,
    isDraggingRange,
    isFilling,
    isCellInRange,
    isCellInFillZone,
    contextMenu,
    closeContextMenu,
    rangeChartData,
    setRangeChartData,
    handleCellMouseDown,
    handleCellMouseEnter,
    handleFillMouseDown,
    handlePaste,
    handleCellContextMenu,
    buildCopyText,
    copySelectionToClipboard,
  };
}
