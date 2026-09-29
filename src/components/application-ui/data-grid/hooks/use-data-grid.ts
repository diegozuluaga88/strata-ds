import * as React from 'react';
import type { DataGridProps, HierarchicalData } from '../types';
import { isColumnFilterActive } from '../filters/filter-model';
import { useDataGridState } from '../state/use-data-grid-state';
import { densityRowHeight } from '../state/density';
import { LOCAL_STORAGE_KEY } from '../constants';
import { useFind } from './use-find';
import { useRowReorder } from './use-row-reorder';
import { useGridColumns } from './use-grid-columns';
import { useGridData } from './use-grid-data';
import { useGridLayout } from './use-grid-layout';
import { useLazyRangeRequest } from './use-lazy-range-request';
import { useVisibleRangeChange } from './use-visible-range-change';
import { useSelection } from './use-selection';
import { useKeyboardNav } from './keyboard/use-keyboard-nav';
import { useRangeSelection } from './use-range-selection';
import { useCellCommit } from './editing/use-cell-commit';
import { useEditSession } from './editing/use-edit-session';
import { useGridBasicActions } from './use-grid-basic-actions';
import { useGridToolbarActions } from './use-grid-toolbar-actions';
import { useGridConfigValue } from './use-grid-config-value';
import type { GridVolatileState } from '../internal-types';

/**
 * The single orchestrator for every DataGrid hook. Moved verbatim (Task 16) from the
 * component body — the call sequence is unchanged from Tasks 6-15. Returns three
 * buckets, per the design doc §5.1-5.2:
 *  - `config`: stable-ish grid configuration + every handler (useGridConfig()).
 *  - `data`: derived row data that changes on page/filter/sort (useGridDataContext()).
 *  - `volatile`: per-keystroke state, deliberately NOT in a context — passed as props
 *    straight into GridBody so memoised rows/cells are unaffected by it.
 *
 * The small local handlers and the config/data aggregation live in
 * `use-grid-basic-actions.ts` / `use-grid-toolbar-actions.ts` / `use-grid-config-value.ts` —
 * split out purely to keep this file under the 300-LOC ceiling (same escape hatch the
 * plan already used for `use-column-handlers.ts` and `use-fill-and-paste.ts`).
 */
export function useDataGrid<TData extends HierarchicalData<TData>>(props: DataGridProps<TData>) {
  const {
    data: initialData,
    columnDefs: initialColumnDefs,
    defaultPageSize = 10,
    enableRowSelection = true,
    onCellEdit,
    onSelectionChange,
    isTreeData = false,
    treeColumn: specifiedTreeColumn,
    enableGroupingPanel = false,
    storageKey = LOCAL_STORAGE_KEY,
    virtualized = false,
    rowHeight,
    density,
    virtualizedMaxHeight = 500,
    detailRenderer,
    detailRowHeight = 300,
    enableRangeSelection = true,
    enableContextMenu = true,
    onFilteredDataChange,
    globalFilterFields,
    enableRangeChart = true,
    enableFillHandle = true,
    enableClipboardPaste = true,
    enableUndoRedo = true,
    enableStatusBar = true,
    enableFind = true,
    enableRowReorder = false,
    onRowsReordered,
    serverSide = false,
    filterApplyMode,
    filterLogicOperator: filterLogicOperatorProp,
    onSaveEdits,
    editSessionMode,
    onBulkEdit,
    totalRowCount,
    onServerParamsChange,
    getRow,
    onLoadRange,
    onVisibleRangeChange,
    loadRangeDebounceMs = 150,
    loadRangeOverscan = 10,
    serverAggregates,
    enableSelectAllMatching,
    isRowSelectable,
    gridState,
    onGridStateChange,
    getRowStyle,
    getCellClassName,
    conditionalFormats,
    striped,
  } = props;

  const tableWrapperRef = React.useRef<HTMLDivElement>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // The empty-state row needs the scroller's own visible width (view/grid-body.tsx), not the
  // <table>'s -- a table wider than its scroller otherwise centres "No results found." against
  // the full table width, off-screen at most horizontal scroll positions.
  const [scrollContainerWidth, setScrollContainerWidth] = React.useState(0);

  React.useEffect(() => {
    const node = scrollContainerRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      setScrollContainerWidth(entry.contentRect.width);
    });
    observer.observe(node);
    setScrollContainerWidth(node.clientWidth);
    return () => observer.disconnect();
  }, [scrollContainerRef]);

  const [state, setState] = useDataGridState<TData>({
    columnDefs: initialColumnDefs,
    defaultPageSize,
    storageKey,
    gridState,
    onGridStateChange,
  });

  const effectiveDensity = density ?? state.density;
  // An explicit rowHeight wins: the virtualization window math needs a caller-fixed number.
  const effectiveRowHeight = rowHeight ?? densityRowHeight(effectiveDensity);

  // Lazy mode needs a total to size the scrollbar against. Without it we would build a
  // scroll container from a row count we do not know, so we refuse and say why rather
  // than rendering a grid whose scrollbar lies.
  const lazyMissingTotal = !!getRow && totalRowCount === undefined;
  // It equally needs `virtualized`. The window is expressed as spacer rows inside a
  // height-capped, scrollable container, and both of those come from `virtualized` alone —
  // without it the spacers are computed and never rendered, so there is nothing to scroll
  // against and `onLoadRange` never fires past the first window.
  const lazyMissingVirtualized = !!getRow && totalRowCount !== undefined && !virtualized;
  React.useEffect(() => {
    if (lazyMissingTotal) {
      console.warn(
        '[DataGrid] `getRow` was provided without `totalRowCount`. Lazy mode is disabled — ' +
          'the grid cannot size a virtualized scroll container without knowing the total row count.',
      );
    }
    if (lazyMissingVirtualized) {
      console.warn(
        '[DataGrid] `getRow` and `totalRowCount` were provided without `virtualized`. Lazy mode ' +
          'is disabled — it renders its window as spacer rows in a height-capped scroll ' +
          'container, which only `virtualized` sets up.',
      );
    }
  }, [lazyMissingTotal, lazyMissingVirtualized]);

  const lazyEnabled = !!getRow && totalRowCount !== undefined && !!virtualized;
  // Lazy implies server-side: filtering or sorting on the client over rows that are not
  // in memory would silently operate on a fraction of the dataset.
  const effectiveServerSide = serverSide || lazyEnabled;
  // Grouping is out of scope in lazy mode (see use-grid-data): gate every affordance
  // — panel, header drag-to-group, keyboard group toggles — off the same flag.
  const groupingPanelEnabled = enableGroupingPanel && !lazyEnabled;

  // A per-keystroke query is a bug in server mode, so manual is the default there.
  const effectiveFilterApplyMode = filterApplyMode ?? (effectiveServerSide ? 'manual' : 'immediate');
  const effectiveFilterLogicOperator = filterLogicOperatorProp ?? state.filterLogicOperator;

  const masterDetail = !!detailRenderer;
  // Master-detail expansion is deliberately not persisted to localStorage — detail
  // panels are transient drill-downs, not layout configuration.
  const [expandedDetails, setExpandedDetails] = React.useState<Set<string | number>>(new Set());

  const canEditCells = !!onCellEdit;
  const fillHandleEnabled = enableFillHandle && enableRangeSelection && canEditCells;
  const pasteEnabled = enableClipboardPaste && canEditCells;
  const undoRedoEnabled = enableUndoRedo && canEditCells;
  const rowReorderEnabled = enableRowReorder && !!onRowsReordered && !isTreeData;

  const treeColumn = specifiedTreeColumn || (initialColumnDefs.length > 0 ? initialColumnDefs[0].field : undefined);

  const { processedColumnDefs, colDefsMap, columnBoundsMap, baseDataForProcessing } = useGridColumns<TData>({
    columnDefs: initialColumnDefs,
    data: initialData,
    isTreeData,
    expandedRows: state.expandedRows,
  });

  const {
    handleSort, handleClearSort, handleGlobalFilterChange, handleColumnFilterChange, handlePageChange,
    handlePageSizeChange, handleToggleExpandRow, handleToggleDetail, handleToggleExpandGroup,
  } = useGridBasicActions<TData>({ setState, setExpandedDetails });

  const {
    cellEditStatus, setCellEditStatus, statusTimersRef, clearCellEditStatus, commitCellEdit,
    applyEdits, coerceValueForCell, handleUndo, handleRedo,
  } = useCellCommit<TData>({ colDefsMap, baseRows: baseDataForProcessing, undoRedoEnabled, onCellEdit });

  const {
    sessionMode, editSession, sessionError, isSaving, handleSessionBegin, handleSessionDiscard,
    handleSessionSaveAll, startEditingCell, handleCellClick, handleEditInputChange,
    handleEditCommit, handleEditCancel,
  } = useEditSession<TData>({
    state, setState, colDefsMap, processedColumnDefs, baseRows: baseDataForProcessing,
    editSessionMode, onCellEdit, onSaveEdits, clearCellEditStatus, setCellEditStatus,
    statusTimersRef, coerceValueForCell, applyEdits,
  });

  const {
    filteredData, sortedData, dataWithGroupHeaders, dataToPaginate, paginatedData, totalPages,
    displayRows,
  } = useGridData<TData>({
    dataLength: initialData?.length ?? 0, baseRows: baseDataForProcessing, processedColumnDefs,
    colDefsMap, state, isTreeData, serverSide: effectiveServerSide, lazyEnabled, virtualized, masterDetail, expandedDetails,
    totalRowCount, filterLogicOperator: effectiveFilterLogicOperator, globalFilterFields,
    onFilteredDataChange, onServerParamsChange,
  });

  const {
    selectAllMatching, canSelectAllMatching, isSelectable, isAllCurrentPageRowsSelected,
    handleSelectRow, handleSelectAllRows, handleSelectAllMatching, handleClearAllMatchingSelection,
  } = useSelection<TData>({
    state, setState, paginatedData, serverSide: effectiveServerSide, enableSelectAllMatching, totalRowCount,
    isRowSelectable, onSelectionChange,
  });

  const {
    scrollTop, handleScroll, orderedVisibleColumnDefs, getColumnWidth, stickyOffsets, rowOffsets,
    visibleDisplayRows, topSpacer, bottomSpacer, hasHeaderGroups, headerGroupSpans, headerTopClass,
    totalColSpan, handleColumnWidthChange, handleColumnVisibilityChange, handleDragStartColumn,
    handleDragOverReorder, handleDragLeaveReorder, handleDropReorder, handleDragEndColumn,
    handlePinColumn, handleGroupColumn, handleUngroupColumn, handleAggregateChange,
  } = useGridLayout<TData>({
    columnDefs: initialColumnDefs, colDefsMap, state, setState, displayRows, virtualized,
    virtualizedMaxHeight, rowHeight: effectiveRowHeight, detailRowHeight,
    showReorderColumn: rowReorderEnabled, showSelectionColumn: enableRowSelection,
    showDetailColumn: masterDetail, scrollContainerRef,
    lazyEnabled, totalRowCount, getRow, loadRangeOverscan,
  });

  const visibleStartIndex = visibleDisplayRows[0]?.dataIndex ?? 0;
  const visibleEndIndex = (visibleDisplayRows[visibleDisplayRows.length - 1]?.dataIndex ?? -1) + 1;

  useLazyRangeRequest({
    enabled: lazyEnabled,
    startIndex: visibleStartIndex,
    endIndex: visibleEndIndex,
    getRow,
    onLoadRange,
    debounceMs: loadRangeDebounceMs,
  });

  // Gated on `virtualized`, not `lazyEnabled`: the window is computed for every
  // virtualized grid, and a consumer paging a cursor API needs to see it without taking
  // on lazy mode's row-indirection (which would bypass the filter/sort pipeline).
  useVisibleRangeChange({
    enabled: virtualized,
    startIndex: visibleStartIndex,
    endIndex: visibleEndIndex,
    onVisibleRangeChange,
    debounceMs: loadRangeDebounceMs,
  });

  const {
    rangeAnchor, rangeEnd, setRangeAnchor, setRangeEnd, rangeBounds, rangeCellCount, rangeStats,
    isDraggingRange, isFilling, isCellInRange, isCellInFillZone, contextMenu, closeContextMenu,
    rangeChartData, setRangeChartData, handleCellMouseDown, handleCellMouseEnter, handleFillMouseDown,
    handlePaste, handleCellContextMenu, buildCopyText, copySelectionToClipboard,
  } = useRangeSelection<TData>({
    state, setState, paginatedData, sortedData, orderedVisibleColumnDefs, enableRangeSelection,
    enableContextMenu, enableStatusBar, fillHandleEnabled, pasteEnabled, canEditCells,
    coerceValueForCell, applyEdits,
  });

  const {
    findOpen, setFindOpen, findQuery, findActiveIdx, findMatches, findMatchSet, activeMatch,
    handleFindNext, handleFindPrevious, handleFindQueryChange, closeFindBar,
  } = useFind<TData>({
    enableFind, dataToPaginate, orderedVisibleColumnDefs, displayRows, virtualized,
    virtualizedMaxHeight, rowOffsets, scrollContainerRef, tableWrapperRef, setState,
  });

  const {
    rowReorderActive, draggedRowId, rowDropTarget, handleRowDragStart, handleRowDragOver,
    handleRowDrop, handleRowDragEnd,
  } = useRowReorder<TData>({
    rowReorderEnabled, sortConfig: state.sortConfig, groupedBy: state.groupedBy,
    data: initialData, onRowsReordered,
  });

  const openFind = React.useCallback(() => setFindOpen(true), [setFindOpen]);

  const { handleGridKeyDown } = useKeyboardNav<TData>({
    state, setState, paginatedData, orderedVisibleColumnDefs, colDefsMap, stickyOffsets,
    tableWrapperRef, isTreeData, treeColumn, enableGroupingPanel: groupingPanelEnabled, enableRowSelection,
    enableRangeSelection, enableFind, undoRedoEnabled, rangeAnchor, rangeEnd, setRangeAnchor,
    setRangeEnd, contextMenuOpen: !!contextMenu, closeContextMenu, findOpen, openFind, closeFindBar,
    buildCopyText, onUndo: handleUndo, onRedo: handleRedo, onToggleExpandRow: handleToggleExpandRow,
    onToggleExpandGroup: handleToggleExpandGroup, onSelectRow: handleSelectRow,
    onStartEditingCell: startEditingCell, onEditCancel: handleEditCancel,
  });

  const {
    handleExportCsv, handleExportXlsx, handleClearAllFilters, handleDensityChange,
    handleFilterLogicOperatorChange, bulkEditOpen, setBulkEditOpen, bulkEditableColumns,
    toolbarContext,
  } = useGridToolbarActions<TData>({
    setState, sortedData, orderedVisibleColumnDefs, processedColumnDefs, onBulkEdit, state,
    initialDataLength: initialData?.length ?? 0, serverSide: effectiveServerSide, totalRowCount, selectAllMatching,
    sessionMode, editSession, isSaving, handleSessionBegin, handleSessionDiscard, handleSessionSaveAll,
  });

  const activeColumnFilterCount = Object.values(state.columnFilters).filter(entry =>
    isColumnFilterActive(entry),
  ).length;
  const activeFilterCount = activeColumnFilterCount + (state.globalFilter ? 1 : 0);
  const groupedByColumns = state.groupedBy.map(field => colDefsMap.get(field)!).filter(Boolean);
  // In lazy mode `paginatedData` is empty -- rows are resolved by index through `getRow`,
  // not held in `data` -- so counting it would report 0 rows while thousands are on
  // screen, and gate the footer aggregates out of existence.
  const renderedRowsCount = lazyEnabled
    ? (totalRowCount ?? 0)
    : paginatedData.filter(r => !r.isGroupHeader).length;

  const { config, data } = useGridConfigValue({
    tableWrapperRef, scrollContainerRef, scrollContainerWidth, processedColumnDefs, colDefsMap, columnBoundsMap,
    orderedVisibleColumnDefs, getColumnWidth, stickyOffsets, hasHeaderGroups, headerGroupSpans,
    headerTopClass, totalColSpan, isTreeData, treeColumn, masterDetail, detailRowHeight, virtualized,
    virtualizedMaxHeight, effectiveDensity, effectiveRowHeight, effectiveFilterApplyMode,
    effectiveFilterLogicOperator, canEditCells, fillHandleEnabled, pasteEnabled, undoRedoEnabled,
    rowReorderEnabled, enableRowSelection, enableGroupingPanel: groupingPanelEnabled, enableRangeSelection,
    enableRangeChart, enableFind, enableStatusBar, serverSide: effectiveServerSide, state, groupedByColumns,
    lazyEnabled, totalRowCount, serverAggregates,
    getRowStyle, getCellClassName, conditionalFormats, striped, detailRenderer,
    handleSort, handleClearSort, handleGlobalFilterChange, handleColumnFilterChange, handlePageChange,
    handlePageSizeChange, handleToggleExpandRow, handleToggleDetail, handleToggleExpandGroup,
    handleColumnWidthChange, handleColumnVisibilityChange, handleDragStartColumn,
    handleDragOverReorder, handleDragLeaveReorder, handleDropReorder, handleDragEndColumn,
    handlePinColumn, handleGroupColumn, handleUngroupColumn, handleAggregateChange, handleSelectRow, handleSelectAllRows,
    handleSelectAllMatching, handleClearAllMatchingSelection, handleCellMouseDown,
    handleCellMouseEnter, handleFillMouseDown, handlePaste, handleCellContextMenu, buildCopyText,
    copySelectionToClipboard, closeContextMenu, setRangeChartData, handleFindNext,
    handleFindPrevious, handleFindQueryChange, closeFindBar, setFindOpen, openFind,
    handleRowDragStart, handleRowDragOver, handleRowDrop, handleRowDragEnd, rowReorderActive,
    handleGridKeyDown, handleScroll, startEditingCell, handleCellClick, handleEditInputChange,
    handleEditCommit, handleEditCancel, handleUndo, handleRedo, handleExportCsv, handleExportXlsx,
    handleClearAllFilters, handleDensityChange, handleFilterLogicOperatorChange, isSelectable,
    isAllCurrentPageRowsSelected, canSelectAllMatching, selectAllMatching, sessionMode,
    sessionError, isSaving, handleSessionBegin, handleSessionDiscard, handleSessionSaveAll,
    toolbarContext, activeColumnFilterCount, activeFilterCount, bulkEditableColumns, bulkEditOpen,
    setBulkEditOpen, onBulkEdit,
    filteredData, sortedData, dataWithGroupHeaders, dataToPaginate, paginatedData, totalPages,
    displayRows, visibleDisplayRows, topSpacer, bottomSpacer, scrollTop, rowOffsets, rangeCellCount,
    rangeStats, rangeChartData, contextMenu, findQuery, findActiveIdx, findMatches, renderedRowsCount,
  });

  // Volatile — NOT in a context. Returned for the shell to thread into GridBody,
  // which derives per-row primitives for the memoised rows. See the spec, §5.2.
  const volatile: GridVolatileState<TData> = {
    selectedRows: state.selectedRows,
    focusedCell: state.focusedCell,
    editingCell: state.editingCell,
    editInputValue: state.editInputValue,
    expandedDetails,
    rangeBounds,
    isDraggingRange,
    isFilling,
    isCellInRange,
    isCellInFillZone,
    cellEditStatus,
    editSession,
    findOpen,
    findMatchSet,
    activeMatch,
    draggedRowId,
    rowDropTarget,
  };

  return {
    state,
    setState,
    initialData,
    baseDataForProcessing,
    commitCellEdit,
    config,
    data,
    volatile,
  };
}
