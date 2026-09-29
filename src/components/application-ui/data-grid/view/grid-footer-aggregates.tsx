"use client";
import * as React from 'react';
import { TableCell, TableRow } from '@/components/application-ui/table';
import { TableFooter } from '../table-footer';
import type { AggregateFunction, HierarchicalData } from '../types';
import { computeAggregate } from '../lib/gridProcessing';
import { aggregateLabels } from './aggregate-labels';
import {
  DEFAULT_COL_WIDTH,
  DETAIL_COLUMN_WIDTH,
  REORDER_COLUMN_WIDTH,
} from '../constants';
import { cn } from '@/utils';
import { useGridConfig, useGridDataContext } from '../context';
import { Button } from '@/components/application-ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/overlays/dropdown-menu';
import { ChevronDown } from 'lucide-react';

/** Everything else comes from useGridConfig() / useGridDataContext() — see context.tsx. */
export interface GridFooterAggregatesProps {
  showReorderColumn: boolean;
  showSelectionColumn: boolean;
  showDetailColumn: boolean;
  checkboxColumnLeft: number;
  detailColumnLeft: number;
  /** The user's chosen aggregate per field, for a column whose `aggregate` is an array
   * of 2+ options. Absent/missing entries default to the first declared aggregate. */
  groupAggregations: Record<string, AggregateFunction>;
  onAggregateChange: (field: string, aggregate: AggregateFunction) => void;
}

export function GridFooterAggregates<TData extends HierarchicalData<TData>>({
  showReorderColumn,
  showSelectionColumn,
  showDetailColumn,
  checkboxColumnLeft,
  detailColumnLeft,
  groupAggregations,
  onAggregateChange,
}: GridFooterAggregatesProps) {
  const { orderedVisibleColumnDefs, columnWidths, pinnedColumns, stickyOffsets, lazyEnabled, serverAggregates } =
    useGridConfig<TData>();
  // The full filtered+sorted set — aggregates span every page, not just this one.
  const { sortedData } = useGridDataContext<TData>();
  if (!orderedVisibleColumnDefs.some(col => col.aggregate)) return null;

  return (
    <TableFooter>
      <TableRow className="bg-muted/30 font-semibold border-t">
        {showReorderColumn && (
          <TableCell
            className="px-0 py-2 sticky-body-cell"
            style={{
              width: REORDER_COLUMN_WIDTH,
              minWidth: REORDER_COLUMN_WIDTH,
              left: 0,
              zIndex: 11,
            }}
          />
        )}
        {showSelectionColumn && (
          <TableCell className="px-3 py-2 sticky-body-cell" style={{ left: checkboxColumnLeft, zIndex: 11 }}>
            Total
          </TableCell>
        )}
        {showDetailColumn && (
          <TableCell
            className="px-1 py-2 sticky-body-cell"
            style={{
              width: DETAIL_COLUMN_WIDTH,
              minWidth: DETAIL_COLUMN_WIDTH,
              left: detailColumnLeft,
              zIndex: 11,
            }}
          />
        )}
        {orderedVisibleColumnDefs.map((colDef) => {
          const isLeftPinned = pinnedColumns.left.includes(colDef.field);
          const isRightPinned = pinnedColumns.right.includes(colDef.field);
          const stickyStyle: React.CSSProperties = {};
          if (isLeftPinned) {
            stickyStyle.left = `${stickyOffsets.left[colDef.field] || 0}px`;
          } else if (isRightPinned) {
            stickyStyle.right = `${stickyOffsets.right[colDef.field] || 0}px`;
          }

          const aggregateList = Array.isArray(colDef.aggregate)
            ? colDef.aggregate
            : colDef.aggregate
              ? [colDef.aggregate]
              : [];
          const hasChoice = aggregateList.length > 1;
          const activeAggregate = (hasChoice ? groupAggregations[colDef.field] : undefined) ?? aggregateList[0];
          const hasAggregate = aggregateList.length > 0;
          // In lazy mode only part of the dataset is in memory, so a locally computed
          // aggregate would be a partial number presented as a final one. The server is
          // the only source that can answer; with no answer we render nothing.
          const aggVal = !hasAggregate
            ? ''
            : lazyEnabled
              ? serverAggregates?.[colDef.field] ?? ''
              : computeAggregate(sortedData, { ...colDef, aggregate: activeAggregate });
          const aggregateLabel = activeAggregate ? aggregateLabels[activeAggregate] : '';
          const width = columnWidths[colDef.field] || colDef.defaultWidth || `${DEFAULT_COL_WIDTH}px`;

          return (
            <TableCell
              key={colDef.field}
              className={cn(
                "px-3 py-2 truncate",
                (isLeftPinned || isRightPinned) && "sticky-body-cell",
                isLeftPinned && pinnedColumns.left.length > 0 && "pinned-left-shadow",
                isRightPinned && pinnedColumns.right.length > 0 && "pinned-right-shadow"
              )}
              style={{ width, maxWidth: width, ...stickyStyle }}
            >
              {hasAggregate && aggVal ? (
                hasChoice ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto px-1 py-0.5 font-semibold"
                        aria-label={`Change aggregate for ${colDef.headerText}`}
                      >
                        <span className="text-xs text-muted-foreground mr-1">
                          {aggregateLabel}
                        </span>
                        {aggVal}
                        <ChevronDown className="ml-1 h-3 w-3 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {aggregateList.map((agg) => (
                        <DropdownMenuItem key={agg} onClick={() => onAggregateChange(colDef.field, agg)}>
                          {aggregateLabels[agg]}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <span>
                    <span className="text-xs text-muted-foreground mr-1">
                      {aggregateLabel}
                    </span>
                    {aggVal}
                  </span>
                )
              ) : ''}
            </TableCell>
          );
        })}
      </TableRow>
    </TableFooter>
  );
}
