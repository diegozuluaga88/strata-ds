"use client";
import * as React from 'react';
import { TableHead, TableHeader, TableRow } from '@/components/application-ui/table';
import { Checkbox } from '@/components/forms/checkbox';
import { DataGridHeaderCell } from '../DataGridHeaderCell';
import { toCssWidth } from './grid-col-group';
import type { HierarchicalData } from '../types';
import { useGridConfig } from '../context';
import {
  CHECKBOX_COLUMN_WIDTH,
  DEFAULT_COL_WIDTH,
  DETAIL_COLUMN_WIDTH,
  MIN_RESIZE_COL_WIDTH,
  REORDER_COLUMN_WIDTH,
} from '../constants';
import { cn } from '@/utils';

/** Everything else comes from useGridConfig() — see context.tsx. */
export interface GridHeaderRowProps {
  showReorderColumn: boolean;
  showSelectionColumn: boolean;
  showDetailColumn: boolean;
  checkboxColumnLeft: number;
  detailColumnLeft: number;
  allPageRowsSelected: boolean;
  selectAllDisabled: boolean;
  onSelectAllRows: (isSelected: boolean) => void;
}

export function GridHeaderRow<TData extends HierarchicalData<TData>>({
  showReorderColumn,
  showSelectionColumn,
  showDetailColumn,
  checkboxColumnLeft,
  detailColumnLeft,
  allPageRowsSelected,
  selectAllDisabled,
  onSelectAllRows,
}: GridHeaderRowProps) {
  const config = useGridConfig<TData>();
  const {
    orderedVisibleColumnDefs,
    hasHeaderGroups,
    headerGroupSpans,
    stickyOffsets,
    sortConfig,
    columnFilters,
    columnWidths,
    pinnedColumns,
    groupedBy,
    draggedColumn,
    draggedOverColumn,
    headerTopClass,
    effectiveFilterApplyMode: filterApplyMode,
    enableGroupingPanel,
    isTreeData,
    handleSort: onSort,
    handleColumnFilterChange: onColumnFilterChange,
    handleColumnWidthChange: onColumnWidthChange,
    handlePinColumn: onPinColumn,
    handleGroupColumn: onGroupColumn,
    handleUngroupColumn: onUngroupColumn,
    handleDragStartColumn: onDragStartColumn,
    handleDragOverReorder: onDragOverReorder,
    handleDragLeaveReorder: onDragLeaveReorder,
    handleDropReorder: onDropReorder,
    handleDragEndColumn: onDragEndColumn,
  } = config;
  const checkboxColumnWidth = CHECKBOX_COLUMN_WIDTH;
  const detailColumnWidth = DETAIL_COLUMN_WIDTH;
  const reorderColumnWidth = REORDER_COLUMN_WIDTH;

  return (
    <TableHeader className="sticky top-0 z-30 dg-header">
      {hasHeaderGroups && headerGroupSpans && (
        <TableRow className="hover:bg-transparent">
          {showReorderColumn && (
            <TableHead
              className="h-8 px-0 py-0 sticky-header-cell top-0 dg-header-cell-border"
              style={{ width: reorderColumnWidth, minWidth: reorderColumnWidth, left: 0, zIndex: 21 }}
            />
          )}
          {showSelectionColumn && (
            <TableHead
              className="h-8 px-0 py-0 sticky-header-cell top-0 dg-header-cell-border"
              style={{ width: checkboxColumnWidth, minWidth: checkboxColumnWidth, left: checkboxColumnLeft, zIndex: 21 }}
            />
          )}
          {showDetailColumn && (
            <TableHead
              className="h-8 px-0 py-0 sticky-header-cell top-0 dg-header-cell-border"
              style={{ width: detailColumnWidth, minWidth: detailColumnWidth, left: detailColumnLeft, zIndex: 21 }}
            />
          )}
          {(['left', 'middle', 'right'] as const).flatMap(region =>
            headerGroupSpans[region].map((span, spanIndex) => {
              const stickyStyle: React.CSSProperties = {};
              if (region === 'left') {
                stickyStyle.left = `${stickyOffsets.left[span.columns[0].field] || 0}px`;
              } else if (region === 'right') {
                stickyStyle.right = `${stickyOffsets.right[span.columns[span.columns.length - 1].field] || 0}px`;
              }
              return (
                <TableHead
                  key={`group-${region}-${spanIndex}-${span.columns[0].field}`}
                  colSpan={span.columns.length}
                  className={cn(
                    "h-8 px-2 py-1 sticky top-0 bg-card text-center align-middle dg-header-cell-border",
                    region !== 'middle' ? "sticky-header-cell" : "z-20",
                    span.group && "header-group-cell"
                  )}
                  style={region !== 'middle' ? { ...stickyStyle, zIndex: 21 } : stickyStyle}
                >
                  {span.group && (
                    <span className="text-xs font-semibold text-muted-foreground">{span.group}</span>
                  )}
                </TableHead>
              );
            })
          )}
        </TableRow>
      )}
      <TableRow>
        {showReorderColumn && (
          <TableHead
            className={cn("px-0 py-0 sticky-header-cell dg-header-cell-border", headerTopClass)}
            style={{
              width: reorderColumnWidth,
              minWidth: reorderColumnWidth,
              left: 0,
              zIndex: 21
            }}
            aria-label="Row reorder column"
          />
        )}
        {showSelectionColumn && (
          <TableHead
            className={cn("px-0 py-0 sticky-header-cell dg-header-cell-border", headerTopClass)}
            style={{
              width: checkboxColumnWidth,
              minWidth: checkboxColumnWidth,
              left: checkboxColumnLeft,
              zIndex: 21
            }}
          >
            <div className="px-3 py-2 h-full flex items-center justify-start">
              <Checkbox
                checked={allPageRowsSelected}
                onCheckedChange={(checked) => onSelectAllRows(!!checked)}
                aria-label="Select all rows on current page"
                disabled={selectAllDisabled}
              />
            </div>
          </TableHead>
        )}
        {showDetailColumn && (
          <TableHead
            className={cn("px-0 py-0 sticky-header-cell dg-header-cell-border", headerTopClass)}
            style={{
              width: detailColumnWidth,
              minWidth: detailColumnWidth,
              left: detailColumnLeft,
              zIndex: 21
            }}
            aria-label="Detail expander column"
          />
        )}
        {orderedVisibleColumnDefs.map((colDef) => {
          const isDraggableForReorder = colDef.reorderable !== false && !pinnedColumns.left.includes(colDef.field) && !pinnedColumns.right.includes(colDef.field);
          const currentWidth = toCssWidth(columnWidths[colDef.field] || colDef.defaultWidth || `${DEFAULT_COL_WIDTH}px`);
          const isLeftPinned = pinnedColumns.left.includes(colDef.field);
          const isRightPinned = pinnedColumns.right.includes(colDef.field);
          const isGrouped = groupedBy.includes(colDef.field);


          let stickyStyle: React.CSSProperties = {};
          if (isLeftPinned) {
            stickyStyle.left = `${stickyOffsets.left[colDef.field] || 0}px`;
            stickyStyle.zIndex = 21;
          } else if (isRightPinned) {
            stickyStyle.right = `${stickyOffsets.right[colDef.field] || 0}px`;
            stickyStyle.zIndex = 21;
          }

          return (
            <TableHead
              key={colDef.field}
              data-field={colDef.field}
              style={{
                width: currentWidth,
                // Falls back to the resize floor, NOT to `currentWidth`: pinning min-width
                // to the cell's own width makes the cell unable to shrink below whatever
                // it happens to be, which silently contradicts what the resize handle
                // allows. An explicit `colDef.minWidth` still wins.
                minWidth:
                  (colDef.minWidth != null && toCssWidth(colDef.minWidth)) ||
                  `${MIN_RESIZE_COL_WIDTH}px`,
                ...stickyStyle
              }}
              className={cn(
                // `overflow-hidden` is what lets the header label ellipsise: a table cell
                // defaults to `overflow: visible`, so under table-layout:fixed a long label
                // spills past a narrow column instead of clipping, and `truncate` on the
                // label never engages because nothing constrains it to the cell.
                "px-0 py-0 overflow-hidden dg-header-cell-border",
                headerTopClass,
                (isLeftPinned || isRightPinned) && "sticky-header-cell bg-card",
                isLeftPinned && pinnedColumns.left.length > 0 && "pinned-left-shadow",
                isRightPinned && pinnedColumns.right.length > 0 && "pinned-right-shadow",
                sortConfig?.field === colDef.field && "dg-col-sorted",
                isGrouped && "bg-muted/70"
              )}
              onDragOver={(e) => isDraggableForReorder && onDragOverReorder(e, colDef.field)}
              onDragLeave={() => isDraggableForReorder && onDragLeaveReorder()}
              onDrop={(e) => isDraggableForReorder && onDropReorder(colDef.field, e)}
              onDragEnd={() => isDraggableForReorder && onDragEndColumn()}
              onClick={() => colDef.sortable && onSort(colDef.field)}
              data-is-dragged={draggedColumn === colDef.field}
              data-is-drop-target={draggedOverColumn === colDef.field && draggedColumn !== colDef.field}
            >
              <DataGridHeaderCell
                column={colDef}
                sortConfig={sortConfig}
                onSort={onSort}
                onFilterChange={onColumnFilterChange}
                columnFilters={columnFilters}
                currentWidth={currentWidth}
                onColumnWidthChange={onColumnWidthChange}
                onPinColumn={onPinColumn}
                onGroupColumn={onGroupColumn}
                onUngroupColumn={onUngroupColumn}
                enableGroupingPanel={enableGroupingPanel && !isTreeData}
                isGrouped={isGrouped}
                isDraggableForReorder={isDraggableForReorder && !isGrouped}
                currentPinnedState={
                  isLeftPinned ? 'left' : isRightPinned ? 'right' : null
                }
                onDragStartColumn={onDragStartColumn}
                filterApplyMode={filterApplyMode}
              />
            </TableHead>
          );
        })}
      </TableRow>
    </TableHeader>
  );
}
