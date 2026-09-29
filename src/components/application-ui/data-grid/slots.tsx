"use client";
import * as React from 'react';
import { cn } from '@/utils';
import type { ColumnDefinition, DataGridToolbarContext, HierarchicalData } from './types';
import { useGridConfig, useGridDataContext } from './context';
import { DataGridToolbar } from './parts/data-grid-toolbar';
import { DataGridStatusBar } from './DataGridStatusBar';
import { DataGridPagination } from './DataGridPagination';
import { GridColGroup, specifiedTotalWidth } from './view/grid-col-group';
import { GridHeaderRow } from './view/grid-header-row';
import { GridFooterAggregates } from './view/grid-footer-aggregates';
import { isColumnFilterActive } from './filters/filter-model';

/**
 * Composed slots — an escape hatch for layouts the flat `<DataGrid {...props} />`
 * props can't express (per the design doc §4.3). Each slot is a thin component that
 * reads the two contexts and renders the band the default shell renders today. No
 * existing consumer migrates to these; they exist for a future caller that needs to
 * re-arrange the grid's chrome around a custom body.
 *
 * The pieces each slot needs that are genuinely volatile (typed while the user is
 * still typing, or a per-click selection count) are NOT read from `GridConfigContext`
 * — putting them there would retaint the same context `GridRow`/`GridCell` consume
 * and undo Task 17's memoisation. They're passed as small explicit props instead,
 * the same pattern `GridContextMenu` already uses for its volatile `target` prop.
 */

export interface GridToolbarSlotProps<TData extends HierarchicalData<TData>> {
  globalFilter: string;
  visibleColumns: (keyof TData & string)[];
  toolbarActions?: React.ReactNode | ((ctx: DataGridToolbarContext) => React.ReactNode);
  toolbarViewSelector?: React.ReactNode;
  globalFilterPlaceholder: string;
  showDensityControl: boolean;
  showColumnsControl?: boolean;
  showFiltersControl?: boolean;
  showExportControl?: boolean;
  showEditSession: boolean;
}

export function GridToolbarSlot<TData extends HierarchicalData<TData>>({
  globalFilter,
  visibleColumns,
  toolbarActions,
  toolbarViewSelector,
  globalFilterPlaceholder,
  showDensityControl,
  showColumnsControl = true,
  showFiltersControl = true,
  showExportControl = true,
  showEditSession,
}: GridToolbarSlotProps<TData>) {
  const config = useGridConfig<TData>();
  const activeColumnFilterEntries = React.useMemo(
    () =>
      (Object.keys(config.columnFilters) as (keyof TData & string)[])
        .filter(field => isColumnFilterActive(config.columnFilters[field]))
        .map(field => ({
          field: field as string,
          label: config.colDefsMap.get(field)?.headerText ?? String(field),
          onRemove: () => config.handleColumnFilterChange(field, undefined),
        })),
    [config.columnFilters, config.colDefsMap, config.handleColumnFilterChange],
  );
  return (
    <DataGridToolbar
      globalFilter={globalFilter}
      globalFilterPlaceholder={globalFilterPlaceholder}
      onGlobalFilterChange={config.handleGlobalFilterChange}
      activeFilterCount={config.activeFilterCount}
      activeColumnFilterCount={config.activeColumnFilterCount}
      activeColumnFilterEntries={activeColumnFilterEntries}
      onClearAllFilters={config.handleClearAllFilters}
      enableFind={config.enableFind}
      onOpenFind={config.openFind}
      allColumns={config.processedColumnDefs}
      visibleColumns={visibleColumns}
      onColumnVisibilityChange={config.handleColumnVisibilityChange}
      onExportCsv={config.handleExportCsv}
      onExportXlsx={config.handleExportXlsx}
      toolbarActions={toolbarActions}
      toolbarViewSelector={toolbarViewSelector}
      toolbarContext={config.toolbarContext}
      showEditSession={showEditSession}
      sessionError={config.sessionError}
      density={config.effectiveDensity}
      onDensityChange={config.handleDensityChange}
      showDensityControl={showDensityControl}
      showColumnsControl={showColumnsControl}
      showFiltersControl={showFiltersControl}
      showExportControl={showExportControl}
      filterLogicOperator={config.effectiveFilterLogicOperator}
      onFilterLogicOperatorChange={config.handleFilterLogicOperatorChange}
      sortConfig={config.sortConfig}
      onClearSort={config.handleClearSort}
    />
  );
}

export interface GridTableSlotProps {
  children?: React.ReactNode;
  striped?: boolean;
  checkboxColumnLeft: number;
  detailColumnLeft: number;
  /** True while a range drag or a fill-handle drag is in progress — both are
   * volatile, so they stay a prop instead of living in GridConfigContext (which
   * GridRow/GridCell also consume; putting per-drag state there would retaint their
   * memo on every mouse-move). */
  selectNone: boolean;
}

export function GridTableSlot<TData extends HierarchicalData<TData>>({
  children,
  striped,
  checkboxColumnLeft,
  detailColumnLeft,
  selectNone,
}: GridTableSlotProps) {
  const config = useGridConfig<TData>();
  const { paginatedData, renderedRowsCount } = useGridDataContext<TData>();
  // In lazy mode rows are resolved by index through `getRow`, so `paginatedData` is
  // empty even with thousands of rows on screen -- gate select-all on the real total.
  const rowsPresent = config.lazyEnabled
    ? (config.totalRowCount ?? 0) > 0
    : paginatedData.filter(r => !r.isGroupHeader).length > 0;
  return (
    <div
      ref={config.scrollContainerRef}
      onScroll={config.handleScroll}
      className={cn(
        "overflow-x-auto relative scrollbar-thin",
        config.virtualized && "overflow-y-auto",
        selectNone && "select-none"
      )}
      style={config.virtualized ? { maxHeight: `${config.virtualizedMaxHeight}px` } : undefined}
    >
      <table
        className={cn(
          // `table-fixed` is load-bearing, not cosmetic -- see the colgroup comment below.
          // It was documented as coming from ui/table.tsx but that primitive never set it,
          // so the grid had been running on content-driven `auto` layout: configured widths
          // were treated as suggestions, a column could not be resized narrower than its own
          // header text, and header truncation never engaged because the column simply grew
          // to fit.
          //
          // `min-w-full` (not `w-full`) + an explicit `style.width` below is what makes
          // single-column resize possible: when the sum of specified column widths is
          // under the container, `min-width:100%` wins and the table fills it exactly as
          // before; once a resize grows that sum past the container, the explicit px
          // `width` wins and the scroll container above (`overflow-x-auto`) scrolls
          // instead of the browser shrinking some other column to compensate.
          "min-w-full table-fixed text-left text-sm",
          striped && "[&_tbody_tr:nth-child(even)]:bg-zinc-950/[2.5%] dark:[&_tbody_tr:nth-child(even)]:bg-white/[2.5%]"
        )}
        style={{
          width: specifiedTotalWidth(config.orderedVisibleColumnDefs as ColumnDefinition<unknown>[], config.columnWidths, {
            showReorderColumn: config.rowReorderEnabled,
            showSelectionColumn: config.enableRowSelection,
            showDetailColumn: config.masterDetail,
          }),
        }}
      >
        {/*
          table-layout:fixed makes column widths authoritative instead of content-driven -
          without it, a header's text+icons can force a column wider than its configured
          width, while sticky offsets (computed from that same configured width) don't know
          it happened, so later pinned columns render short and overlap real content. A
          <colgroup> is what makes the configured width stick even though the header has a
          colSpan'd group row above it, which fixed layout can't otherwise derive
          per-column widths from.
        */}
        <GridColGroup
          orderedVisibleColumnDefs={config.orderedVisibleColumnDefs}
          columnWidths={config.columnWidths}
          showReorderColumn={config.rowReorderEnabled}
          showSelectionColumn={config.enableRowSelection}
          showDetailColumn={config.masterDetail}
        />
        <GridHeaderRow<TData>
          showReorderColumn={config.rowReorderEnabled}
          showSelectionColumn={config.enableRowSelection}
          showDetailColumn={config.masterDetail}
          checkboxColumnLeft={checkboxColumnLeft}
          detailColumnLeft={detailColumnLeft}
          allPageRowsSelected={config.isAllCurrentPageRowsSelected}
          selectAllDisabled={!rowsPresent}
          onSelectAllRows={config.handleSelectAllRows}
        />
        {children}
        {renderedRowsCount > 0 && (
          <GridFooterAggregates<TData>
            showReorderColumn={config.rowReorderEnabled}
            showSelectionColumn={config.enableRowSelection}
            showDetailColumn={config.masterDetail}
            checkboxColumnLeft={checkboxColumnLeft}
            detailColumnLeft={detailColumnLeft}
            groupAggregations={config.groupAggregations}
            onAggregateChange={config.handleAggregateChange}
          />
        )}
      </table>
    </div>
  );
}

export function GridFooterSlot<TData extends HierarchicalData<TData>>() {
  const config = useGridConfig<TData>();
  const { rangeCellCount, rangeStats } = useGridDataContext<TData>();
  // The status bar exists for range statistics (Sum/Avg/Min/Max/Count over a selected
  // block of cells) — nothing else shows those. Its row and selection counters moved
  // to the pagination bar, so with no range selected it has nothing left to say.
  if (!config.enableStatusBar || rangeCellCount <= 1) return null;
  return <DataGridStatusBar rangeCellCount={rangeCellCount} rangeStats={rangeStats} />;
}

export interface GridPaginationSlotProps {
  currentPage: number;
  pageSize: number;
  selectedRowsCount: number;
  pageSizeOptions: number[];
  isTreeData: boolean;
  groupedByLength: number;
}

export function GridPaginationSlot<TData extends HierarchicalData<TData>>({
  currentPage,
  pageSize,
  selectedRowsCount,
  pageSizeOptions,
  isTreeData,
  groupedByLength,
}: GridPaginationSlotProps) {
  const config = useGridConfig<TData>();
  const { totalPages, sortedData, dataWithGroupHeaders } = useGridDataContext<TData>();

  if (config.virtualized) {
    // In lazy mode `sortedData` is derived from `data={[]}` -- the rows live behind
    // `getRow`, so its length is 0 no matter how many rows exist. Counting it would
    // announce "No items to display." over a fully scrollable dataset.
    const lazyTotal = config.lazyEnabled ? (config.totalRowCount ?? 0) : null;
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t gap-4">
        <div className="text-sm text-muted-foreground">
          {lazyTotal !== null
            ? (selectedRowsCount > 0
                ? `${selectedRowsCount} of ${lazyTotal.toLocaleString()} row(s) selected.`
                : lazyTotal > 0 ? `${lazyTotal.toLocaleString()} items` : 'No items to display.')
            : selectedRowsCount > 0
            ? `${selectedRowsCount} of ${sortedData.length} row(s) selected.`
            : sortedData.length > 0 ? `Showing all ${sortedData.length} items.` : 'No items to display.'}
        </div>
      </div>
    );
  }

  return (
    <DataGridPagination
      currentPage={currentPage}
      totalPages={totalPages}
      pageSize={pageSize}
      totalItems={(groupedByLength > 0 && !isTreeData ? dataWithGroupHeaders : sortedData).length}
      selectedRowsCount={selectedRowsCount}
      onPageChange={config.handlePageChange}
      onPageSizeChange={config.handlePageSizeChange}
      pageSizeOptions={pageSizeOptions}
    />
  );
}

// Re-exported so `slots.tsx` type-checks standalone; the shell imports ColumnDefinition
// only for the JSX props above.
export type { ColumnDefinition };
