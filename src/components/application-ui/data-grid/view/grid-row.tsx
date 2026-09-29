"use client";
import * as React from 'react';
import { TableCell, TableRow } from '@/components/application-ui/table';
import { Checkbox } from '@/components/forms/checkbox';
import { ChevronRight, ChevronDown, GripVertical } from 'lucide-react';
import { cn } from '@/utils';
import type { HierarchicalData, ProcessedRow } from '../types';
import type { CellEditStatus } from '../editors/types';
import { useGridConfig } from '../context';
import { GridCell } from './grid-cell';
import { DETAIL_COLUMN_WIDTH, REORDER_COLUMN_WIDTH } from '../constants';

export interface GridRowCellFlags {
  isFocused: boolean;
  isEditing: boolean;
  inRange: boolean;
  inFillZone: boolean;
  isFillCorner: boolean;
  isFindMatch: boolean;
  isActiveFindMatch: boolean;
  editStatus?: CellEditStatus;
  bufferedValue: { has: boolean; value?: unknown };
}

/** Everything below is either a primitive or a fresh-but-comparable value derived by
 * GridBody per render — the custom comparator below compares `cellFlags`
 * element-wise, so a fresh array identity doesn't defeat the memo. See the design
 * doc, §5.2-5.3. */
export interface GridRowProps<TData extends HierarchicalData<TData>> {
  row: ProcessedRow<TData>;
  dataIndex: number;
  isSelected: boolean;
  isSelectable: boolean;
  isDetailExpanded: boolean;
  isDragged: boolean;
  /** Whether some row (not necessarily this one) is currently being drag-reordered. */
  dragInProgress: boolean;
  dropPosition?: 'above' | 'below';
  /** Pure layout numbers, identical for every row — computed once by GridBody. */
  checkboxColumnLeft: number;
  detailColumnLeft: number;
  /** One entry per visible column, in the same order. Derived by GridBody. */
  cellFlags: GridRowCellFlags[];
  editInputValue: unknown;
  anyCellEditing: boolean;
  onFillMouseDown: (e: React.MouseEvent) => void;
}

function GridRowInner<TData extends HierarchicalData<TData>>({
  row,
  dataIndex,
  isSelected,
  isSelectable,
  isDetailExpanded,
  isDragged,
  dragInProgress,
  dropPosition,
  checkboxColumnLeft,
  detailColumnLeft,
  cellFlags,
  editInputValue,
  anyCellEditing,
  onFillMouseDown,
}: GridRowProps<TData>) {
  const config = useGridConfig<TData>();
  const {
    orderedVisibleColumnDefs,
    rowReorderEnabled,
    enableRowSelection,
    masterDetail,
    effectiveRowHeight,
    getRowStyle,
    handleSelectRow,
    handleToggleDetail,
    handleRowDragStart,
    handleRowDragOver,
    handleRowDrop,
    handleRowDragEnd,
    rowReorderActive,
  } = config;

  const reorderColumnWidth = REORDER_COLUMN_WIDTH;
  const detailColumnWidth = DETAIL_COLUMN_WIDTH;

  const rowStyle = getRowStyle?.(row.originalRow);
  const isZebraRow = dataIndex % 2 === 1;
  // Pinned cells need to stay opaque so a scrolled-under column can't show through -
  // but row tints are often translucent (alpha over the page background), so setting
  // backgroundColor directly would make the "opaque" pinned cell see-through too.
  // Layer the tint as a background-image over the cell's own solid bg-card instead:
  // still reads as the row color, still fully opaque underneath it. Same treatment for
  // zebra striping (below) so pinned columns don't fall out of the stripe pattern.
  // Blended against --color-card (not element opacity) so the pinned cell stays fully
  // opaque -- opacity would let scrolled-under columns show through underneath it.
  const zebraBg = 'color-mix(in oklab, var(--color-muted) 40%, var(--color-card))';
  const pinnedCellBg = rowStyle?.backgroundColor
    ? { backgroundImage: `linear-gradient(${rowStyle.backgroundColor}, ${rowStyle.backgroundColor})` }
    : isZebraRow
      ? { backgroundImage: `linear-gradient(${zebraBg}, ${zebraBg})` }
      : undefined;

  return (
    <TableRow
      data-state={isSelected ? "selected" : ""}
      className={cn(
        "dg-row",
        isZebraRow && "bg-muted/40",
        isDragged && "opacity-50",
        dropPosition && (dropPosition === 'above' ? "row-drop-above" : "row-drop-below")
      )}
      style={{ height: `${effectiveRowHeight}px`, ...rowStyle }}
      onDragOver={rowReorderActive && dragInProgress ? (e) => handleRowDragOver(e, row.id) : undefined}
      onDrop={rowReorderActive && dragInProgress ? handleRowDrop : undefined}
    >
      {rowReorderEnabled && (
        <TableCell
          className="px-0 py-2 sticky-body-cell"
          style={{ width: reorderColumnWidth, minWidth: reorderColumnWidth, left: 0, zIndex: 11, ...pinnedCellBg }}
        >
          <div
            draggable={rowReorderActive}
            onDragStart={rowReorderActive ? (e) => handleRowDragStart(e, row.id) : undefined}
            onDragEnd={rowReorderActive ? handleRowDragEnd : undefined}
            className={cn(
              "flex items-center justify-center",
              rowReorderActive
                ? "cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                : "cursor-not-allowed text-muted-foreground/40"
            )}
            title={rowReorderActive ? "Drag to reorder" : "Clear sorting/grouping to reorder rows"}
            aria-label="Drag to reorder row"
          >
            <GripVertical className="h-4 w-4" />
          </div>
        </TableCell>
      )}
      {enableRowSelection && (
        <TableCell
          className="px-3 py-2 sticky-body-cell"
          style={{ left: checkboxColumnLeft, zIndex: 11, ...pinnedCellBg }}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => handleSelectRow(row.id, !!checked)}
            aria-label={`Select row ${row.id}`}
            disabled={!isSelectable}
          />
        </TableCell>
      )}
      {masterDetail && (
        <TableCell
          className="px-1 py-2 sticky-body-cell"
          style={{ width: detailColumnWidth, minWidth: detailColumnWidth, left: detailColumnLeft, zIndex: 11, ...pinnedCellBg }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); handleToggleDetail(row.id); }}
            className="p-0.5 rounded hover:bg-accent focus:outline-none"
            aria-label={isDetailExpanded ? "Collapse row detail" : "Expand row detail"}
            aria-expanded={isDetailExpanded}
          >
            {isDetailExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </TableCell>
      )}
      {orderedVisibleColumnDefs.map((colDef, colIndex) => (
        <GridCell<TData>
          key={colDef.field}
          row={row}
          colDef={colDef}
          dataIndex={dataIndex}
          colIndex={colIndex}
          isFocused={cellFlags[colIndex].isFocused}
          isEditing={cellFlags[colIndex].isEditing}
          inRange={cellFlags[colIndex].inRange}
          inFillZone={cellFlags[colIndex].inFillZone}
          isFillCorner={cellFlags[colIndex].isFillCorner}
          isFindMatch={cellFlags[colIndex].isFindMatch}
          isActiveFindMatch={cellFlags[colIndex].isActiveFindMatch}
          editStatus={cellFlags[colIndex].editStatus}
          bufferedValue={cellFlags[colIndex].bufferedValue}
          editInputValue={editInputValue}
          pinnedCellBg={pinnedCellBg}
          onFillMouseDown={onFillMouseDown}
        />
      ))}
    </TableRow>
  );
}

// `cellFlags` is a fresh array on every GridBody render, so it defeats the default
// shallow compare — compare it element-wise instead. Every field of GridRowProps must
// appear here; a prop added later and forgotten here is a stale-render bug no test
// will catch.
export const GridRow = React.memo(GridRowInner, (prev, next) => {
  if (
    prev.row !== next.row ||
    prev.dataIndex !== next.dataIndex ||
    prev.isSelected !== next.isSelected ||
    prev.isSelectable !== next.isSelectable ||
    prev.isDetailExpanded !== next.isDetailExpanded ||
    prev.isDragged !== next.isDragged ||
    prev.dragInProgress !== next.dragInProgress ||
    prev.dropPosition !== next.dropPosition ||
    prev.checkboxColumnLeft !== next.checkboxColumnLeft ||
    prev.detailColumnLeft !== next.detailColumnLeft ||
    prev.editInputValue !== next.editInputValue ||
    prev.anyCellEditing !== next.anyCellEditing ||
    prev.onFillMouseDown !== next.onFillMouseDown ||
    prev.cellFlags.length !== next.cellFlags.length
  ) return false;
  for (let i = 0; i < prev.cellFlags.length; i++) {
    const a = prev.cellFlags[i];
    const b = next.cellFlags[i];
    if (
      a.isFocused !== b.isFocused ||
      a.isEditing !== b.isEditing ||
      a.inRange !== b.inRange ||
      a.inFillZone !== b.inFillZone ||
      a.isFillCorner !== b.isFillCorner ||
      a.isFindMatch !== b.isFindMatch ||
      a.isActiveFindMatch !== b.isActiveFindMatch ||
      a.editStatus !== b.editStatus ||
      a.bufferedValue.has !== b.bufferedValue.has ||
      a.bufferedValue.value !== b.bufferedValue.value
    ) return false;
  }
  return true;
}) as typeof GridRowInner;
