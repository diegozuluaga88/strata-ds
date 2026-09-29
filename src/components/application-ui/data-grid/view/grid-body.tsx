"use client";
import * as React from 'react';
import { TableBody, TableCell, TableRow } from '@/components/application-ui/table';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/utils';
import type { HierarchicalData } from '../types';
import type { GridVolatileState } from '../internal-types';
import { useGridConfig, useGridDataContext } from '../context';
import { cellEditKey } from '../lib/utils';
import { sessionValue } from '../editing/edit-session';
import { computeAggregate } from '../lib/gridProcessing';
import { aggregateLabels } from './aggregate-labels';
import { GridRow, type GridRowCellFlags } from './grid-row';
import { GridSkeletonRow } from './grid-skeleton-row';
import { CHECKBOX_COLUMN_PX, REORDER_COLUMN_PX } from '../constants';

export interface GridBodyProps<TData extends HierarchicalData<TData>> {
  /** Volatile state, straight from useDataGrid().volatile. */
  volatile: GridVolatileState<TData>;
}

/**
 * The `<TableBody>` wrapper, the two virtualization spacer rows, the detail-row
 * branch, the group-header-row branch, the empty state, and the per-row flag
 * derivation that feeds GridRow. Deliberately NOT memoised — it re-renders on
 * volatile change by design, and it is cheap because the rows below it do not.
 * See the design doc, §5.2.
 */
export function GridBody<TData extends HierarchicalData<TData>>({ volatile }: GridBodyProps<TData>) {
  const config = useGridConfig<TData>();
  const { visibleDisplayRows, topSpacer, bottomSpacer } = useGridDataContext<TData>();
  const {
    orderedVisibleColumnDefs,
    colDefsMap,
    totalColSpan,
    virtualized,
    lazyEnabled,
    masterDetail,
    detailRenderer,
    detailRowHeight,
    effectiveRowHeight,
    rowReorderEnabled,
    enableRowSelection,
    isSelectable,
    fillHandleEnabled,
    handleToggleExpandGroup,
    handleFillMouseDown,
    scrollContainerWidth,
  } = config;

  const checkboxColumnLeft = rowReorderEnabled ? REORDER_COLUMN_PX : 0;
  const detailColumnLeft = (enableRowSelection ? CHECKBOX_COLUMN_PX : 0) + (rowReorderEnabled ? REORDER_COLUMN_PX : 0);
  const dragInProgress = volatile.draggedRowId !== null;

  return (
    <TableBody>
      {/* `lazyEnabled` is spelled out even though it currently implies `virtualized`: the
        * spacers are how a lazy window claims the height of the rows it is not rendering, so
        * the condition should say that rather than leave a reader to infer it from a gate in
        * another file -- and it stays correct if that gate is ever relaxed. */}
      {(virtualized || lazyEnabled) && topSpacer > 0 && (
        <TableRow style={{ height: `${topSpacer}px` }} className="hover:bg-transparent">
          <TableCell colSpan={totalColSpan} className="p-0 border-0" style={{ height: `${topSpacer}px` }} />
        </TableRow>
      )}
      {visibleDisplayRows.length > 0 ? (
        visibleDisplayRows.map(({ row, isDetail, dataIndex, isPlaceholder }) => {
          // Checked FIRST: a placeholder's `row.originalRow` is an empty object and must
          // never be read. Nothing below this line is safe for an unloaded index.
          if (isPlaceholder) {
            return <GridSkeletonRow key={row.id} columnCount={totalColSpan} rowHeight={effectiveRowHeight} />;
          }
          if (isDetail) {
            return (
              <TableRow key={`${row.id}-detail`} className="detail-row hover:bg-transparent">
                <TableCell
                  colSpan={totalColSpan}
                  className="p-0 bg-muted/20"
                  style={virtualized ? { height: `${detailRowHeight}px` } : undefined}
                >
                  <div className={cn("p-4", virtualized && "h-full overflow-auto scrollbar-minimal")}>
                    {detailRenderer!(row.originalRow)}
                  </div>
                </TableCell>
              </TableRow>
            );
          }
          if (row.isGroupHeader) {
            const groupColDef = colDefsMap.get(row.groupField as keyof TData & string);
            const groupHeaderText = groupColDef ? groupColDef.headerText : String(row.groupField);
            return (
              <TableRow key={row.id} className="group-header-row">
                <TableCell
                  colSpan={totalColSpan}
                  className="px-3 py-2 cursor-pointer"
                  onClick={() => row.groupKey && handleToggleExpandGroup(row.groupKey)}
                >
                  <div className="flex items-center" style={{ paddingLeft: `${row.level * 1.5}rem` }}>
                    <button
                      className="mr-1 p-0.5 rounded hover:bg-accent focus:outline-none"
                      aria-label={row.isExpanded ? `Collapse group ${row.groupValue}` : `Expand group ${row.groupValue}`}
                    >
                      {row.isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                    <strong>{groupHeaderText}:</strong>&nbsp;{String(row.groupValue)}
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({row.groupItems?.length ?? 0} item{(row.groupItems?.length ?? 0) === 1 ? '' : 's'}
                      {orderedVisibleColumnDefs
                        .filter(c => c.aggregate)
                        .map(c => {
                          const aggValue = computeAggregate(row.groupItems || [], c);
                          const label = typeof c.aggregate === 'string' ? aggregateLabels[c.aggregate] : '';
                          return aggValue ? ` · ${label ? label + ' ' : ''}${c.headerText}: ${aggValue}` : '';
                        })
                        .join('')})
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            );
          }

          const cellFlags: GridRowCellFlags[] = orderedVisibleColumnDefs.map((colDef, colIndex) => {
            const isFocused = volatile.focusedCell?.rowId === row.id && volatile.focusedCell?.colField === colDef.field;
            const isFillCorner = fillHandleEnabled && !!volatile.rangeBounds &&
              dataIndex === volatile.rangeBounds.bottom && colIndex === volatile.rangeBounds.right;
            const isFindMatch = volatile.findOpen && volatile.findMatchSet.has(`${row.id}|${colDef.field}`);
            const isActiveFindMatch = isFindMatch && volatile.activeMatch?.rowId === row.id && volatile.activeMatch?.field === colDef.field;
            const isEditing = volatile.editingCell?.rowId === row.id && volatile.editingCell?.field === colDef.field;
            const editStatus = volatile.cellEditStatus.get(cellEditKey(row.id, colDef.field));
            const bufferedValue = sessionValue(volatile.editSession, row.id, colDef.field);
            return {
              isFocused,
              isEditing,
              inRange: volatile.isCellInRange(dataIndex, colIndex),
              inFillZone: volatile.isCellInFillZone(dataIndex, colIndex),
              isFillCorner,
              isFindMatch,
              isActiveFindMatch,
              editStatus,
              bufferedValue,
            };
          });

          return (
            <GridRow<TData>
              key={row.id}
              row={row}
              dataIndex={dataIndex}
              isSelected={volatile.selectedRows.has(row.id)}
              isSelectable={isSelectable(row)}
              isDetailExpanded={volatile.expandedDetails.has(row.id)}
              isDragged={volatile.draggedRowId === row.id}
              dragInProgress={dragInProgress}
              dropPosition={volatile.rowDropTarget?.rowId === row.id ? volatile.rowDropTarget.position : undefined}
              checkboxColumnLeft={checkboxColumnLeft}
              detailColumnLeft={detailColumnLeft}
              cellFlags={cellFlags}
              editInputValue={volatile.editInputValue}
              anyCellEditing={!!volatile.editingCell}
              onFillMouseDown={handleFillMouseDown}
            />
          );
        })
      ) : (
        <TableRow>
          {/* A plain table cell's rendered width comes from the <table>'s own layout (every
            * column summed), not from what the user can see through the scroller -- on a grid
            * wider than its viewport this centred off-screen at most horizontal scroll
            * positions. Pinning it to the scroller's own measured width (config.scrollContainerWidth,
            * tracked via ResizeObserver in use-data-grid.ts) makes it behave like a sticky
            * column instead: always on screen, centred in what the user can actually see.
            * `display: block` is load-bearing, not cosmetic: on a `table-cell` the used width
            * comes from the table layout algorithm, so `width` below would otherwise be
            * ignored and the cell would stay as wide as the table -- taking it out of table
            * layout is what makes both the width and the sticky positioning take effect. */}
          <TableCell
            colSpan={totalColSpan}
            className="h-24 text-center"
            style={{
              position: 'sticky',
              left: 0,
              display: 'block',
              boxSizing: 'border-box',
              width: scrollContainerWidth || '100%',
            }}
          >
            No results found.
          </TableCell>
        </TableRow>
      )}
      {(virtualized || lazyEnabled) && bottomSpacer > 0 && (
        <TableRow style={{ height: `${bottomSpacer}px` }} className="hover:bg-transparent">
          <TableCell colSpan={totalColSpan} className="p-0 border-0" style={{ height: `${bottomSpacer}px` }} />
        </TableRow>
      )}
    </TableBody>
  );
}
