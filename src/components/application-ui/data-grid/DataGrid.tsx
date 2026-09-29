
"use client";
import * as React from 'react';
import type {
  ColumnDefinition,
  DataGridProps,
  HierarchicalData,
} from './types';
import { DataGridGroupingPanel } from './DataGridGroupingPanel';
import { RangeChartDialog } from './RangeChartDialog';
import { BulkEditDialog } from './parts/bulk-edit-dialog';
import { Skeleton } from '@/components/application-ui/skeleton';
import { densityCellPadding } from './state/density';
import { LoadingBody } from './parts/loading-overlay';
import {
  CHECKBOX_COLUMN_PX,
  REORDER_COLUMN_PX,
} from './constants';
import { GridContextMenu } from './view/grid-context-menu';
import { GridBanners } from './view/grid-banners';
import { GridBody } from './view/grid-body';
import { useDataGrid } from './hooks/use-data-grid';
import { GridProvider } from './context';
import { GridToolbarSlot, GridTableSlot, GridFooterSlot, GridPaginationSlot } from './slots';

function DataGridComponent<TData extends HierarchicalData<TData>>(props: DataGridProps<TData>) {
  const {
    defaultPageSize = 10,
    pageSizeOptions = [10, 25, 50, 100],
    enableRowSelection = true,
    onCellEdit,
    striped,
    getRowStyle,
    getCellClassName,
    globalFilterPlaceholder = 'Find in Current Page',
    conditionalFormats,
    toolbarActions,
    toolbarViewSelector,
    viewSaveError,
    viewPartialRestoreNotice,
    onDismissViewPartialRestoreNotice,
    onSaveEdits,
    onBulkEdit,
    showDensityControl,
    showColumnsControl,
    showFiltersControl,
    showExportControl,
    showPagination,
    totalRowCount,
    pivotMode: _pivotMode = false,
    pivotColumns: _pivotColumns = [],
    loading = false,
  } = props;

  const { state, initialData, baseDataForProcessing, config, data, volatile } = useDataGrid<TData>(props);

  if (!initialData) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  const checkboxColumnLeft = config.rowReorderEnabled ? REORDER_COLUMN_PX : 0;
  const detailColumnLeft =
    (enableRowSelection ? CHECKBOX_COLUMN_PX : 0) + (config.rowReorderEnabled ? REORDER_COLUMN_PX : 0);

  return (
    <GridProvider config={config} data={data}>
      <div
        ref={config.tableWrapperRef}
        className="rounded-xl border bg-card text-card-foreground shadow-sm focus:outline-none"
        tabIndex={0}
        onKeyDown={config.handleGridKeyDown}
        onPaste={config.handlePaste}
        aria-busy={loading || undefined}
      >
        {config.enableGroupingPanel && !config.isTreeData && config.groupedByColumns.length > 0 && (
          <DataGridGroupingPanel
            groupedColumns={config.groupedByColumns as ColumnDefinition<TData>[]}
            onUngroupColumn={config.handleUngroupColumn}
          />
        )}
        <GridToolbarSlot<TData>
          globalFilter={state.globalFilter}
          visibleColumns={state.visibleColumns}
          toolbarActions={toolbarActions}
          toolbarViewSelector={toolbarViewSelector}
          globalFilterPlaceholder={globalFilterPlaceholder}
          showEditSession={config.sessionMode === 'session' && !!onSaveEdits}
          // Hide the picker when the consumer controls density via the `density` prop: the prop
          // always wins over any state change, so clicking a menu item would be inert — a picker
          // that does nothing is worse than no picker.
          showDensityControl={(showDensityControl ?? true) && props.density === undefined}
          showColumnsControl={showColumnsControl ?? true}
          showFiltersControl={showFiltersControl ?? true}
          showExportControl={showExportControl ?? true}
        />
        <GridBanners
          viewSaveError={viewSaveError}
          viewPartialRestoreNotice={viewPartialRestoreNotice}
          onDismissViewPartialRestoreNotice={onDismissViewPartialRestoreNotice}
          canSelectAllMatching={config.canSelectAllMatching}
          allMatchingSelected={config.selectAllMatching}
          selectedCount={state.selectedRows.size}
          pageFullySelected={data.paginatedData.filter(config.isSelectable).every(row => state.selectedRows.has(row.id))}
          totalRowCount={totalRowCount}
          onSelectAllMatching={config.handleSelectAllMatching}
          onClearSelection={config.handleClearAllMatchingSelection}
          findOpen={volatile.findOpen}
          enableFind={config.enableFind}
          findQuery={data.findQuery}
          findMatchCount={data.findMatches.length}
          findActiveMatchIndex={volatile.activeMatch ? Math.min(data.findActiveIdx, data.findMatches.length - 1) : 0}
          onFindQueryChange={config.handleFindQueryChange}
          onFindNext={config.handleFindNext}
          onFindPrevious={config.handleFindPrevious}
          onFindClose={config.closeFindBar}
        />
        <GridTableSlot<TData>
          striped={striped}
          checkboxColumnLeft={checkboxColumnLeft}
          detailColumnLeft={detailColumnLeft}
          selectNone={volatile.isDraggingRange || volatile.isFilling}
        >
          {loading ? (
            <LoadingBody
              columnCount={config.orderedVisibleColumnDefs.length}
              rowHeight={config.effectiveRowHeight}
              cellPadding={densityCellPadding(config.effectiveDensity)}
            />
          ) : (
            <GridBody<TData> volatile={volatile} />
          )}
        </GridTableSlot>
        <GridFooterSlot<TData> />
        {showPagination !== false && (
          <GridPaginationSlot<TData>
            currentPage={state.currentPage}
            pageSize={state.pageSize}
            selectedRowsCount={state.selectedRows.size}
            pageSizeOptions={pageSizeOptions}
            isTreeData={config.isTreeData}
            groupedByLength={state.groupedBy.length}
          />
        )}
        {data.contextMenu && (
          <GridContextMenu<TData> target={data.contextMenu} rangeBounds={volatile.rangeBounds} />
        )}
        {data.rangeChartData && (
          <RangeChartDialog data={data.rangeChartData} onClose={() => config.setRangeChartData(null)} />
        )}
        {onBulkEdit && (
          <BulkEditDialog
            open={config.bulkEditOpen}
            onOpenChange={config.setBulkEditOpen}
            columns={config.bulkEditableColumns}
            sampleRow={baseDataForProcessing[0]?.originalRow}
            targetCount={config.selectAllMatching ? (totalRowCount ?? state.selectedRows.size) : state.selectedRows.size}
            onApply={patch =>
              onBulkEdit(patch, {
                ids: Array.from(state.selectedRows),
                allMatching: config.selectAllMatching,
              })
            }
          />
        )}
      </div>
    </GridProvider>
  );
}

/** Composed slots — an escape hatch for layouts the flat props can't express. See
 * slots.tsx and the design doc §4.3. No existing consumer migrates to these; the
 * shell above renders through them too, so the default path and the composed path
 * are the same code. `Object.assign` (rather than a plain property assignment) keeps
 * the generic on `DataGridComponent` intact. */
export const DataGrid = Object.assign(DataGridComponent, {
  Toolbar: GridToolbarSlot,
  Table: GridTableSlot,
  Footer: GridFooterSlot,
  Pagination: GridPaginationSlot,
});
