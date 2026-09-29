import * as React from 'react';
import type { ColumnDefinition, DataGridState, HierarchicalData, ProcessedRow } from '../types';
import { buildHeaderGroupSpans } from '../lib/gridProcessing';
import { computeLazyWindow } from '../lib/lazy-window';
import type { DisplayRow, HeaderGroupSpans } from '../internal-types';
import { CHECKBOX_COLUMN_PX, DEFAULT_COL_WIDTH, DETAIL_COLUMN_PX, REORDER_COLUMN_PX } from '../constants';
import { useColumnHandlers } from './use-column-handlers';

export interface UseGridLayoutArgs<TData extends HierarchicalData<TData>> {
  columnDefs: ColumnDefinition<TData>[];
  colDefsMap: Map<keyof TData & string, ColumnDefinition<TData>>;
  state: DataGridState<TData>;
  setState: (updater: (prev: DataGridState<TData>) => DataGridState<TData>) => void;
  displayRows: DisplayRow<TData>[];
  virtualized: boolean;
  virtualizedMaxHeight: number;
  rowHeight: number;
  detailRowHeight: number;
  showReorderColumn: boolean;
  showSelectionColumn: boolean;
  showDetailColumn: boolean;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  lazyEnabled: boolean;
  totalRowCount?: number;
  getRow?: (index: number) => TData | undefined;
  loadRangeOverscan: number;
}

export function useGridLayout<TData extends HierarchicalData<TData>>(args: UseGridLayoutArgs<TData>) {
  const {
    columnDefs,
    colDefsMap,
    state,
    setState,
    displayRows,
    virtualized,
    virtualizedMaxHeight,
    rowHeight,
    detailRowHeight,
    showReorderColumn,
    showSelectionColumn,
    showDetailColumn,
    scrollContainerRef,
    lazyEnabled,
    totalRowCount,
    getRow,
    loadRangeOverscan,
  } = args;

  const [scrollTop, setScrollTop] = React.useState(0);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (virtualized || lazyEnabled) {
      setScrollTop(e.currentTarget.scrollTop);
    }
  };

  // Prefix-sum row offsets make the window math exact even though detail panels
  // are taller than data rows. offsets[i] is the top of display row i.
  const rowOffsets = React.useMemo(() => {
    if (!virtualized) return null;
    const offsets = new Array<number>(displayRows.length + 1);
    offsets[0] = 0;
    for (let i = 0; i < displayRows.length; i++) {
      offsets[i + 1] = offsets[i] + (displayRows[i].isDetail ? detailRowHeight : rowHeight);
    }
    return offsets;
  }, [virtualized, displayRows, rowHeight, detailRowHeight]);

  const { visibleDisplayRows, topSpacer, bottomSpacer } = React.useMemo(() => {
    // Lazy mode: the window is derived from the SERVER's total, not from the array we
    // were handed, and each index is resolved through getRow. Rows are uniform height
    // here (grouping and detail panels are out of scope in lazy mode), so the geometry
    // is arithmetic rather than a walk over rowOffsets.
    if (lazyEnabled && totalRowCount !== undefined && getRow) {
      const viewportHeight = scrollContainerRef.current?.clientHeight || virtualizedMaxHeight;
      const win = computeLazyWindow({
        scrollTop,
        viewportHeight,
        rowHeight,
        totalRowCount,
        overscan: loadRangeOverscan,
      });
      const rows: DisplayRow<TData>[] = [];
      for (let i = win.startIndex; i < win.endIndex; i++) {
        const loaded = getRow(i);
        rows.push(
          loaded === undefined
            ? {
                // A synthetic id keyed by absolute index: unique, stable while the row
                // stays unloaded, and impossible to confuse with a real row's id.
                row: {
                  id: `__lazy_placeholder_${i}`,
                  originalRow: {} as TData,
                  // Not padding for the cast's sake: `level`/`hasChildren`/`isGroupHeader` are
                  // required on ProcessedRow, and a reader that forgets to check `isPlaceholder`
                  // first should find a benign leaf rather than `undefined`.
                  level: 0,
                  hasChildren: false,
                  isGroupHeader: false,
                },
                isDetail: false,
                dataIndex: i,
                isPlaceholder: true,
              }
            : {
                row: {
                  id: (loaded as { id?: string | number }).id ?? i,
                  originalRow: loaded,
                  // Lazy rows are always flat leaves: grouping and tree data are both out of
                  // scope in lazy mode, so there is no hierarchy for these to describe.
                  level: 0,
                  hasChildren: false,
                  isGroupHeader: false,
                },
                isDetail: false,
                dataIndex: i,
              },
        );
      }
      return { visibleDisplayRows: rows, topSpacer: win.topSpacer, bottomSpacer: win.bottomSpacer };
    }

    if (!virtualized || !rowOffsets) {
      return { visibleDisplayRows: displayRows, topSpacer: 0, bottomSpacer: 0 };
    }
    const viewportHeight = scrollContainerRef.current?.clientHeight || virtualizedMaxHeight;
    // Binary search for the first row whose bottom edge is below the viewport top.
    let lo = 0;
    let hi = displayRows.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (rowOffsets[mid + 1] > scrollTop) hi = mid; else lo = mid + 1;
    }
    const buffer = 5;
    let eIdx = lo;
    while (eIdx < displayRows.length && rowOffsets[eIdx] < scrollTop + viewportHeight) eIdx++;
    const sIdx = Math.max(0, lo - buffer);
    eIdx = Math.min(displayRows.length, eIdx + buffer);
    return {
      visibleDisplayRows: displayRows.slice(sIdx, eIdx),
      topSpacer: rowOffsets[sIdx],
      bottomSpacer: rowOffsets[displayRows.length] - rowOffsets[eIdx],
    };
  }, [lazyEnabled, totalRowCount, getRow, loadRangeOverscan, virtualized, rowOffsets, displayRows, scrollTop, virtualizedMaxHeight, rowHeight, scrollContainerRef]);

  const orderedVisibleColumnDefs = React.useMemo(() => {
    const leftPinned = state.pinnedColumns.left
      .map(field => colDefsMap.get(field)!)
      .filter(col => col && state.visibleColumns.includes(col.field));

    const rightPinned = state.pinnedColumns.right
      .map(field => colDefsMap.get(field)!)
      .filter(col => col && state.visibleColumns.includes(col.field));

    const scrollable = state.columnOrder
      .map(field => colDefsMap.get(field)!)
      .filter(col => col && state.visibleColumns.includes(col.field) && !state.pinnedColumns.left.includes(col.field) && !state.pinnedColumns.right.includes(col.field));

    return [...leftPinned, ...scrollable, ...rightPinned];
  }, [colDefsMap, state.columnOrder, state.visibleColumns, state.pinnedColumns]);

  const getColumnWidth = React.useCallback((field: keyof TData & string): number => {
    const width = state.columnWidths[field] || colDefsMap.get(field)?.defaultWidth || DEFAULT_COL_WIDTH;
    return typeof width === 'number' ? width : parseInt(String(width), 10) || DEFAULT_COL_WIDTH;
  }, [state.columnWidths, colDefsMap]);

  const stickyOffsets = React.useMemo(() => {
    const left: Record<string, number> = {};
    let currentLeftOffset = 0;
    if (showReorderColumn) {
        currentLeftOffset += REORDER_COLUMN_PX; // drag-handle column
    }
    if (showSelectionColumn) {
        currentLeftOffset += CHECKBOX_COLUMN_PX;
    }
    if (showDetailColumn) {
        currentLeftOffset += DETAIL_COLUMN_PX; // detail expander column
    }
    state.pinnedColumns.left.forEach(field => {
      if (state.visibleColumns.includes(field)) {
        left[field] = currentLeftOffset;
        currentLeftOffset += getColumnWidth(field);
      }
    });

    const right: Record<string, number> = {};
    let currentRightOffset = 0;
    state.pinnedColumns.right.slice().reverse().forEach(field => {
       if (state.visibleColumns.includes(field)) {
        right[field] = currentRightOffset;
        currentRightOffset += getColumnWidth(field);
      }
    });
    return { left, right, totalLeftWidth: currentLeftOffset, totalRightWidth: currentRightOffset };
  }, [state.pinnedColumns, state.visibleColumns, getColumnWidth, showSelectionColumn, showDetailColumn, showReorderColumn]);

  // ---- Column header groups ----
  // Spans are built per sticky region so a group can never straddle a pinned
  // boundary; pinned spans reuse the offset of their first (left) / last (right) column.
  const hasHeaderGroups = orderedVisibleColumnDefs.some(c => c.group);
  const headerGroupSpans: HeaderGroupSpans<TData> | null = React.useMemo(() => {
    if (!hasHeaderGroups) return null;
    const leftCount = orderedVisibleColumnDefs.filter(c => state.pinnedColumns.left.includes(c.field)).length;
    const rightCount = orderedVisibleColumnDefs.filter(c => state.pinnedColumns.right.includes(c.field)).length;
    return {
      left: buildHeaderGroupSpans(orderedVisibleColumnDefs.slice(0, leftCount)),
      middle: buildHeaderGroupSpans(orderedVisibleColumnDefs.slice(leftCount, orderedVisibleColumnDefs.length - rightCount)),
      right: buildHeaderGroupSpans(orderedVisibleColumnDefs.slice(orderedVisibleColumnDefs.length - rightCount)),
    };
  }, [hasHeaderGroups, orderedVisibleColumnDefs, state.pinnedColumns]);

  const headerTopClass = hasHeaderGroups ? 'top-8' : 'top-0';
  const totalColSpan =
    orderedVisibleColumnDefs.length +
    (showSelectionColumn ? 1 : 0) +
    (showDetailColumn ? 1 : 0) +
    (showReorderColumn ? 1 : 0);

  const {
    handleColumnVisibilityChange,
    handleColumnWidthChange,
    handleDragStartColumn,
    handleDragOverReorder,
    handleDragLeaveReorder,
    handleDropReorder,
    handleDragEndColumn,
    handlePinColumn,
    handleGroupColumn,
    handleUngroupColumn,
    handleAggregateChange,
  } = useColumnHandlers<TData>({ columnDefs, state, setState });

  return {
    scrollTop,
    handleScroll,
    orderedVisibleColumnDefs,
    getColumnWidth,
    stickyOffsets,
    rowOffsets,
    visibleDisplayRows,
    topSpacer,
    bottomSpacer,
    hasHeaderGroups,
    headerGroupSpans,
    headerTopClass,
    totalColSpan,
    handleColumnWidthChange,
    handleColumnVisibilityChange,
    handleDragStartColumn,
    handleDragOverReorder,
    handleDragLeaveReorder,
    handleDropReorder,
    handleDragEndColumn,
    handlePinColumn,
    handleGroupColumn,
    handleUngroupColumn,
    handleAggregateChange,
  };
}
