import * as React from 'react';
import type { ColumnDefinition, DataGridState, HierarchicalData } from '../types';
import type { useGridColumns } from './use-grid-columns';
import type { useGridLayout } from './use-grid-layout';
import type { useGridData } from './use-grid-data';
import type { useSelection } from './use-selection';
import type { useRangeSelection } from './use-range-selection';
import type { useFind } from './use-find';
import type { useRowReorder } from './use-row-reorder';
import type { useKeyboardNav } from './keyboard/use-keyboard-nav';
import type { useCellCommit } from './editing/use-cell-commit';
import type { useEditSession } from './editing/use-edit-session';
import type { useGridBasicActions } from './use-grid-basic-actions';
import type { useGridToolbarActions } from './use-grid-toolbar-actions';

/**
 * Every field `use-data-grid.ts` assembles from its sub-hooks, typed as an
 * intersection of those hooks' own return types (plus the handful of locally-derived
 * values) — this is what makes `GridConfig<TData>`/`GridData<TData>` in `context.tsx`
 * concrete instead of `Record<string, unknown>`. Split out of `use-data-grid.ts` (same
 * 300-LOC escape hatch as `use-grid-basic-actions.ts`) — pure aggregation, no logic.
 */
export type GridConfigValueParts<TData extends HierarchicalData<TData>> =
  Omit<ReturnType<typeof useGridColumns<TData>>, 'baseDataForProcessing'> &
  ReturnType<typeof useGridLayout<TData>> &
  Omit<ReturnType<typeof useGridData<TData>>, 'baseDataForProcessing'> &
  ReturnType<typeof useSelection<TData>> &
  Omit<ReturnType<typeof useRangeSelection<TData>>, 'rangeAnchor' | 'rangeEnd' | 'setRangeAnchor' | 'setRangeEnd' | 'isCellInRange' | 'isCellInFillZone' | 'rangeBounds' | 'isDraggingRange' | 'isFilling'> &
  Omit<ReturnType<typeof useFind<TData>>, 'findOpen' | 'findMatchSet' | 'activeMatch'> &
  Omit<ReturnType<typeof useRowReorder<TData>>, 'draggedRowId' | 'rowDropTarget'> &
  ReturnType<typeof useKeyboardNav<TData>> &
  Pick<ReturnType<typeof useCellCommit<TData>>, 'handleUndo' | 'handleRedo'> &
  Omit<ReturnType<typeof useEditSession<TData>>, 'editSession'> &
  ReturnType<typeof useGridBasicActions<TData>> &
  Omit<ReturnType<typeof useGridToolbarActions<TData>>, 'openBulkEdit'> &
  {
    tableWrapperRef: React.RefObject<HTMLDivElement | null>;
    scrollContainerRef: React.RefObject<HTMLDivElement | null>;
    scrollContainerWidth: number;
    isTreeData: boolean;
    treeColumn: (keyof TData & string) | undefined;
    masterDetail: boolean;
    detailRowHeight: number;
    virtualized: boolean;
    virtualizedMaxHeight: number;
    effectiveDensity: DataGridState<TData>['density'];
    effectiveRowHeight: number;
    effectiveFilterApplyMode: 'immediate' | 'manual';
    effectiveFilterLogicOperator: DataGridState<TData>['filterLogicOperator'];
    canEditCells: boolean;
    fillHandleEnabled: boolean;
    pasteEnabled: boolean;
    undoRedoEnabled: boolean;
    rowReorderEnabled: boolean;
    enableRowSelection: boolean;
    enableGroupingPanel: boolean;
    enableRangeSelection: boolean;
    enableRangeChart: boolean;
    enableFind: boolean;
    enableStatusBar: boolean;
    serverSide: boolean;
    lazyEnabled: boolean;
    totalRowCount?: number;
    // `getRow`, `onLoadRange` and the loadRange tuning props are deliberately NOT here.
    // They are consumed inside use-data-grid (by use-grid-layout and use-lazy-range-request)
    // and no context consumer reads them, so putting them in the shared config would buy
    // nothing -- and `getRow` would actively cost: its identity changes on every fetch (that
    // is how the grid learns new rows arrived), which would invalidate this memo, and with it
    // every GridRow/GridCell, on each page that loads.
    serverAggregates?: Record<string, number | undefined>;
    state: DataGridState<TData>;
    groupedByColumns: ColumnDefinition<TData>[];
    activeColumnFilterCount: number;
    activeFilterCount: number;
    renderedRowsCount: number;
    onBulkEdit: unknown;
    openFind: () => void;
    getRowStyle?: (row: TData) => React.CSSProperties | undefined;
    getCellClassName?: (row: TData, column: ColumnDefinition<TData>) => string | undefined;
    conditionalFormats?: import('../types').ConditionalFormatRule<TData>[];
    striped?: boolean;
    detailRenderer?: (row: TData) => React.ReactNode;
  };

export function useGridConfigValue<TData extends HierarchicalData<TData>>(parts: GridConfigValueParts<TData>) {
  const config = React.useMemo(() => ({
    // refs
    tableWrapperRef: parts.tableWrapperRef,
    scrollContainerRef: parts.scrollContainerRef,
    scrollContainerWidth: parts.scrollContainerWidth,
    // columns / layout
    processedColumnDefs: parts.processedColumnDefs,
    colDefsMap: parts.colDefsMap,
    columnBoundsMap: parts.columnBoundsMap,
    orderedVisibleColumnDefs: parts.orderedVisibleColumnDefs,
    getColumnWidth: parts.getColumnWidth,
    stickyOffsets: parts.stickyOffsets,
    hasHeaderGroups: parts.hasHeaderGroups,
    headerGroupSpans: parts.headerGroupSpans,
    headerTopClass: parts.headerTopClass,
    totalColSpan: parts.totalColSpan,
    // flags
    isTreeData: parts.isTreeData,
    treeColumn: parts.treeColumn,
    masterDetail: parts.masterDetail,
    detailRowHeight: parts.detailRowHeight,
    virtualized: parts.virtualized,
    virtualizedMaxHeight: parts.virtualizedMaxHeight,
    effectiveDensity: parts.effectiveDensity,
    effectiveRowHeight: parts.effectiveRowHeight,
    effectiveFilterApplyMode: parts.effectiveFilterApplyMode,
    effectiveFilterLogicOperator: parts.effectiveFilterLogicOperator,
    canEditCells: parts.canEditCells,
    fillHandleEnabled: parts.fillHandleEnabled,
    pasteEnabled: parts.pasteEnabled,
    undoRedoEnabled: parts.undoRedoEnabled,
    rowReorderEnabled: parts.rowReorderEnabled,
    enableRowSelection: parts.enableRowSelection,
    enableGroupingPanel: parts.enableGroupingPanel,
    enableRangeSelection: parts.enableRangeSelection,
    enableRangeChart: parts.enableRangeChart,
    enableFind: parts.enableFind,
    enableStatusBar: parts.enableStatusBar,
    serverSide: parts.serverSide,
    lazyEnabled: parts.lazyEnabled,
    totalRowCount: parts.totalRowCount,
    serverAggregates: parts.serverAggregates,
    // per-render state slices that consumers key styling off of
    columnWidths: parts.state.columnWidths,
    pinnedColumns: parts.state.pinnedColumns,
    groupedBy: parts.state.groupedBy,
    groupedByColumns: parts.groupedByColumns,
    groupAggregations: parts.state.groupAggregations,
    sortConfig: parts.state.sortConfig,
    columnFilters: parts.state.columnFilters,
    draggedColumn: parts.state.draggedColumn,
    draggedOverColumn: parts.state.draggedOverColumn,
    // handlers
    handleSort: parts.handleSort,
    handleClearSort: parts.handleClearSort,
    handleGlobalFilterChange: parts.handleGlobalFilterChange,
    handleColumnFilterChange: parts.handleColumnFilterChange,
    handlePageChange: parts.handlePageChange,
    handlePageSizeChange: parts.handlePageSizeChange,
    handleToggleExpandRow: parts.handleToggleExpandRow,
    handleToggleDetail: parts.handleToggleDetail,
    handleToggleExpandGroup: parts.handleToggleExpandGroup,
    handleColumnWidthChange: parts.handleColumnWidthChange,
    handleColumnVisibilityChange: parts.handleColumnVisibilityChange,
    handleDragStartColumn: parts.handleDragStartColumn,
    handleDragOverReorder: parts.handleDragOverReorder,
    handleDragLeaveReorder: parts.handleDragLeaveReorder,
    handleDropReorder: parts.handleDropReorder,
    handleDragEndColumn: parts.handleDragEndColumn,
    handlePinColumn: parts.handlePinColumn,
    handleGroupColumn: parts.handleGroupColumn,
    handleUngroupColumn: parts.handleUngroupColumn,
    handleAggregateChange: parts.handleAggregateChange,
    handleSelectRow: parts.handleSelectRow,
    handleSelectAllRows: parts.handleSelectAllRows,
    handleSelectAllMatching: parts.handleSelectAllMatching,
    handleClearAllMatchingSelection: parts.handleClearAllMatchingSelection,
    handleCellMouseDown: parts.handleCellMouseDown,
    handleCellMouseEnter: parts.handleCellMouseEnter,
    handleFillMouseDown: parts.handleFillMouseDown,
    handlePaste: parts.handlePaste,
    handleCellContextMenu: parts.handleCellContextMenu,
    buildCopyText: parts.buildCopyText,
    copySelectionToClipboard: parts.copySelectionToClipboard,
    closeContextMenu: parts.closeContextMenu,
    setRangeChartData: parts.setRangeChartData,
    handleFindNext: parts.handleFindNext,
    handleFindPrevious: parts.handleFindPrevious,
    handleFindQueryChange: parts.handleFindQueryChange,
    closeFindBar: parts.closeFindBar,
    setFindOpen: parts.setFindOpen,
    openFind: parts.openFind,
    handleRowDragStart: parts.handleRowDragStart,
    handleRowDragOver: parts.handleRowDragOver,
    handleRowDrop: parts.handleRowDrop,
    handleRowDragEnd: parts.handleRowDragEnd,
    rowReorderActive: parts.rowReorderActive,
    handleGridKeyDown: parts.handleGridKeyDown,
    handleScroll: parts.handleScroll,
    startEditingCell: parts.startEditingCell,
    handleCellClick: parts.handleCellClick,
    handleEditInputChange: parts.handleEditInputChange,
    handleEditCommit: parts.handleEditCommit,
    handleEditCancel: parts.handleEditCancel,
    handleUndo: parts.handleUndo,
    handleRedo: parts.handleRedo,
    handleExportCsv: parts.handleExportCsv,
    handleExportXlsx: parts.handleExportXlsx,
    handleClearAllFilters: parts.handleClearAllFilters,
    handleDensityChange: parts.handleDensityChange,
    handleFilterLogicOperatorChange: parts.handleFilterLogicOperatorChange,
    isSelectable: parts.isSelectable,
    isAllCurrentPageRowsSelected: parts.isAllCurrentPageRowsSelected,
    canSelectAllMatching: parts.canSelectAllMatching,
    selectAllMatching: parts.selectAllMatching,
    // selection/editing sessions surfaced for the toolbar
    sessionMode: parts.sessionMode,
    sessionError: parts.sessionError,
    isSaving: parts.isSaving,
    handleSessionBegin: parts.handleSessionBegin,
    handleSessionDiscard: parts.handleSessionDiscard,
    handleSessionSaveAll: parts.handleSessionSaveAll,
    toolbarContext: parts.toolbarContext,
    activeColumnFilterCount: parts.activeColumnFilterCount,
    activeFilterCount: parts.activeFilterCount,
    bulkEditableColumns: parts.bulkEditableColumns,
    bulkEditOpen: parts.bulkEditOpen,
    setBulkEditOpen: parts.setBulkEditOpen,
    onBulkEdit: parts.onBulkEdit,
    getRowStyle: parts.getRowStyle,
    getCellClassName: parts.getCellClassName,
    conditionalFormats: parts.conditionalFormats,
    striped: parts.striped,
    detailRenderer: parts.detailRenderer,
  }), [
    parts.processedColumnDefs, parts.colDefsMap, parts.columnBoundsMap, parts.orderedVisibleColumnDefs,
    parts.getColumnWidth, parts.stickyOffsets, parts.hasHeaderGroups, parts.headerGroupSpans,
    parts.headerTopClass, parts.totalColSpan, parts.isTreeData, parts.treeColumn, parts.masterDetail,
    parts.detailRowHeight, parts.virtualized, parts.virtualizedMaxHeight, parts.effectiveDensity,
    parts.effectiveRowHeight, parts.effectiveFilterApplyMode, parts.effectiveFilterLogicOperator,
    parts.canEditCells, parts.fillHandleEnabled, parts.pasteEnabled, parts.undoRedoEnabled,
    parts.rowReorderEnabled, parts.enableRowSelection, parts.enableGroupingPanel,
    parts.enableRangeSelection, parts.enableRangeChart, parts.enableFind, parts.enableStatusBar,
    parts.serverSide, parts.lazyEnabled, parts.totalRowCount, parts.serverAggregates,
    parts.state.columnWidths, parts.state.pinnedColumns, parts.state.groupedBy,
    parts.groupedByColumns, parts.state.groupAggregations, parts.state.sortConfig, parts.state.columnFilters,
    parts.state.draggedColumn, parts.state.draggedOverColumn, parts.handleSort, parts.handleClearSort,
    parts.handleGlobalFilterChange, parts.handleColumnFilterChange, parts.handlePageChange,
    parts.handlePageSizeChange, parts.handleToggleExpandRow, parts.handleToggleDetail,
    parts.handleToggleExpandGroup, parts.handleColumnWidthChange, parts.handleColumnVisibilityChange,
    parts.handleDragStartColumn, parts.handleDragOverReorder, parts.handleDragLeaveReorder,
    parts.handleDropReorder, parts.handleDragEndColumn, parts.handlePinColumn, parts.handleGroupColumn,
    parts.handleUngroupColumn, parts.handleAggregateChange, parts.handleSelectRow, parts.handleSelectAllRows,
    parts.handleSelectAllMatching, parts.handleClearAllMatchingSelection, parts.handleCellMouseDown,
    parts.handleCellMouseEnter, parts.handleFillMouseDown, parts.handlePaste,
    parts.handleCellContextMenu, parts.buildCopyText, parts.copySelectionToClipboard,
    parts.closeContextMenu, parts.setRangeChartData, parts.handleFindNext, parts.handleFindPrevious,
    parts.handleFindQueryChange, parts.closeFindBar, parts.setFindOpen, parts.openFind,
    parts.handleRowDragStart, parts.handleRowDragOver, parts.handleRowDrop, parts.handleRowDragEnd,
    parts.rowReorderActive, parts.handleGridKeyDown, parts.handleScroll, parts.startEditingCell,
    parts.handleCellClick, parts.handleEditInputChange, parts.handleEditCommit, parts.handleEditCancel,
    parts.handleUndo, parts.handleRedo, parts.handleExportCsv, parts.handleExportXlsx,
    parts.handleClearAllFilters, parts.handleDensityChange, parts.handleFilterLogicOperatorChange,
    parts.isSelectable, parts.isAllCurrentPageRowsSelected, parts.canSelectAllMatching,
    parts.selectAllMatching, parts.sessionMode, parts.sessionError, parts.isSaving,
    parts.handleSessionBegin, parts.handleSessionDiscard, parts.handleSessionSaveAll,
    parts.toolbarContext, parts.activeColumnFilterCount, parts.activeFilterCount,
    parts.bulkEditableColumns, parts.bulkEditOpen, parts.onBulkEdit, parts.getRowStyle,
    parts.getCellClassName, parts.conditionalFormats, parts.striped, parts.detailRenderer,
    parts.scrollContainerWidth,
  ]);

  const data = React.useMemo(() => ({
    filteredData: parts.filteredData,
    sortedData: parts.sortedData,
    dataWithGroupHeaders: parts.dataWithGroupHeaders,
    dataToPaginate: parts.dataToPaginate,
    paginatedData: parts.paginatedData,
    totalPages: parts.totalPages,
    displayRows: parts.displayRows,
    visibleDisplayRows: parts.visibleDisplayRows,
    topSpacer: parts.topSpacer,
    bottomSpacer: parts.bottomSpacer,
    scrollTop: parts.scrollTop,
    rowOffsets: parts.rowOffsets,
    rangeCellCount: parts.rangeCellCount,
    rangeStats: parts.rangeStats,
    rangeChartData: parts.rangeChartData,
    contextMenu: parts.contextMenu,
    findQuery: parts.findQuery,
    findActiveIdx: parts.findActiveIdx,
    findMatches: parts.findMatches,
    renderedRowsCount: parts.renderedRowsCount,
  }), [
    parts.filteredData, parts.sortedData, parts.dataWithGroupHeaders, parts.dataToPaginate,
    parts.paginatedData, parts.totalPages, parts.displayRows, parts.visibleDisplayRows,
    parts.topSpacer, parts.bottomSpacer, parts.scrollTop, parts.rowOffsets, parts.rangeCellCount,
    parts.rangeStats, parts.rangeChartData, parts.contextMenu, parts.findQuery,
    parts.findActiveIdx, parts.findMatches, parts.renderedRowsCount,
  ]);

  return { config, data };
}
