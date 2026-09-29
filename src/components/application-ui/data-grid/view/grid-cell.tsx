"use client";
import * as React from 'react';
import { TableCell } from '@/components/application-ui/table';
import { cn } from '@/utils';
import type { ColumnDefinition, HierarchicalData, ProcessedRow } from '../types';
import { useGridConfig } from '../context';
import { getCellValue, isColumnEditable, cellEditKey, formatCellDisplay, getSafeCellClassName } from '../lib/utils';
import { getEditRenderer } from '../editors/registry';
import { FieldError } from '@/components/forms/field';
import { Sparkline } from '../Sparkline';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { densityCellPadding } from '../state/density';
import { getConditionalCellStyle } from '../lib/conditionalFormatting';
import { DEFAULT_COL_WIDTH } from '../constants';
import type { CellEditStatus } from '../editors/types';

/** Props are primitives only — that's what makes the memo comparison in GridRow cheap
 * and correct. Everything the cell needs beyond this (stickyOffsets, columnWidths,
 * pinnedColumns, density, conditionalFormats, columnBoundsMap, getCellClassName,
 * isTreeData, treeColumn, and every handler) comes from useGridConfig() — config is
 * stable, so reading it does not defeat the memo. See the design doc, §5.2-5.3. */
export interface GridCellProps<TData extends HierarchicalData<TData>> {
  row: ProcessedRow<TData>;
  colDef: ColumnDefinition<TData>;
  dataIndex: number;
  colIndex: number;
  isFocused: boolean;
  isEditing: boolean;
  inRange: boolean;
  inFillZone: boolean;
  isFillCorner: boolean;
  isFindMatch: boolean;
  isActiveFindMatch: boolean;
  editStatus?: CellEditStatus;
  /** The session's buffered value, when this cell has one. */
  bufferedValue: { has: boolean; value?: unknown };
  editInputValue: unknown;
  pinnedCellBg?: React.CSSProperties;
  onFillMouseDown: (e: React.MouseEvent) => void;
}

function GridCellInner<TData extends HierarchicalData<TData>>({
  row,
  colDef,
  dataIndex,
  colIndex,
  isFocused,
  isEditing,
  inRange,
  inFillZone,
  isFillCorner,
  isFindMatch,
  isActiveFindMatch,
  editStatus,
  bufferedValue,
  editInputValue,
  pinnedCellBg,
  onFillMouseDown,
}: GridCellProps<TData>) {
  const config = useGridConfig<TData>();
  const {
    isTreeData,
    treeColumn,
    handleToggleExpandRow,
    effectiveDensity,
    columnWidths,
    pinnedColumns,
    stickyOffsets,
    columnBoundsMap,
    getCellClassName,
    conditionalFormats,
    handleCellClick,
    startEditingCell,
    handleCellMouseDown,
    handleCellMouseEnter,
    handleCellContextMenu,
    handleEditInputChange,
    handleEditCommit,
    handleEditCancel,
  } = config;

  const isLeftPinned = pinnedColumns.left.includes(colDef.field);
  const isRightPinned = pinnedColumns.right.includes(colDef.field);
  const stickyStyle: React.CSSProperties = {};
  if (isLeftPinned) {
    stickyStyle.left = `${stickyOffsets.left[colDef.field] || 0}px`;
    if (pinnedCellBg) Object.assign(stickyStyle, pinnedCellBg);
  } else if (isRightPinned) {
    stickyStyle.right = `${stickyOffsets.right[colDef.field] || 0}px`;
    if (pinnedCellBg) Object.assign(stickyStyle, pinnedCellBg);
  }

  const cellRules = [
    ...(conditionalFormats || []),
    ...(colDef.conditionalFormats || []),
  ];
  const conditionalStyle = getConditionalCellStyle(row, colDef.field, cellRules, columnBoundsMap[colDef.field]);

  // Amounts jump width between pages with proportional figures. ColumnDefinition has
  // no `type` field and this project adds no props, so the signal is the value
  // itself; a cellRenderer or a sparkline owns its own layout and is left alone.
  const isNumericCell =
    !colDef.cellRenderer && !colDef.sparkline && typeof getCellValue(row, colDef.field, colDef) === 'number';

  const renderCellContent = (): React.ReactNode => {
    const cellValue = getCellValue(row, colDef.field, colDef);

    if (isEditing) {
      const Editor = getEditRenderer(colDef, cellValue);
      const key = cellEditKey(row.id, colDef.field);
      const status = editStatus;

      return (
        <div className="relative h-full">
          <Editor
            value={editInputValue}
            row={row.originalRow}
            column={colDef}
            onChange={handleEditInputChange}
            onCommit={handleEditCommit}
            onCancel={handleEditCancel}
            autoFocus
            aria-invalid={status?.status === 'error'}
            aria-describedby={status?.message ? `${key}-status` : undefined}
          />
          {status?.message && (
            <FieldError
              id={`${key}-status`}
              className="absolute top-full left-0 z-30 mt-0.5 whitespace-nowrap rounded border bg-card px-1 py-0.5 shadow-sm"
            >
              {status.message}
            </FieldError>
          )}
          {status?.status === 'pending' && (
            <span
              className="absolute right-1 top-1 h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground"
              role="status"
              aria-label="Saving"
            />
          )}
        </div>
      );
    }

    // While a commit is pending or was rolled back, the grid renders its own value
    // rather than the parent's — rollback must not depend on how fast the parent
    // re-renders (or whether it re-renders at all).
    const displayValue = editStatus ? editStatus.value : bufferedValue.has ? bufferedValue.value : cellValue;

    const staticContent = (): React.ReactNode => {
      if (isTreeData && treeColumn && colDef.field === treeColumn) {
        const treeContent = colDef.cellRenderer
          ? colDef.cellRenderer(displayValue, row.originalRow)
          : formatCellDisplay(displayValue, colDef);

        return (
          <div className="flex items-center" style={{ paddingLeft: `${row.level * 1.5}rem` }}>
            {row.hasChildren ? (
              <button
                onClick={(e) => { e.stopPropagation(); handleToggleExpandRow(row.id); }}
                className="mr-1 p-0.5 rounded hover:bg-accent focus:outline-none"
                aria-label={row.isExpanded ? "Collapse row" : "Expand row"}
                tabIndex={-1}
              >
                {row.isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            ) : (
              <span style={{ width: '1.25rem' }} className="mr-1 inline-block"></span>
            )}
            {treeContent}
          </div>
        );
      }

      if (colDef.cellRenderer) {
        return colDef.cellRenderer(displayValue, row.originalRow);
      }

      if (colDef.valueFormatter) {
        return colDef.valueFormatter(displayValue, row.originalRow as TData);
      }

      if (colDef.sparkline) {
        const opts = colDef.sparkline;
        const series = opts.values ? opts.values(row.originalRow) : displayValue;
        const labels = typeof opts.labels === 'function' ? opts.labels(row.originalRow) : opts.labels;
        return (
          <Sparkline
            values={series}
            type={opts.type}
            width={opts.width}
            height={opts.height}
            color={opts.color}
            negativeColor={opts.negativeColor}
            labels={labels}
            format={opts.format}
          />
        );
      }

      // Dates would otherwise print raw (an ISO string with its `T`, or a Date's
      // toString) — everything else is String(value), exactly as before.
      return formatCellDisplay(displayValue, colDef);
    };

    if (!editStatus) return staticContent();

    return (
      <div className="relative flex max-w-full items-center gap-1">
        {staticContent()}
        {editStatus.status === 'pending' && (
          <span
            className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-muted-foreground"
            role="status"
            aria-label="Saving"
          />
        )}
        {editStatus.status === 'error' && !editStatus.message && (
          // A batch rollback (handleSessionSaveAll) sets no per-cell `message` — the toolbar's
          // sessionError banner already reports the failure once for the whole save. Without
          // this dot the cell would render identically to an untouched one for the 3s rollback
          // window: same value, zero signal anything failed.
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-destructive"
            role="status"
            title="Save failed — will retry"
            aria-label="Save failed — will retry"
          />
        )}
        {editStatus.message && <FieldError className="whitespace-nowrap">{editStatus.message}</FieldError>}
      </div>
    );
  };

  return (
    <TableCell
      id={`cell-${row.id}-${colDef.field}`}
      data-field={colDef.field}
      className={cn(
        densityCellPadding(effectiveDensity),
        // `truncate` sets overflow:hidden, which clips the editor's validation
        // tooltip and the rollback message (and clips absolutely-positioned
        // descendants too). tailwind-merge keeps both `truncate` and a later
        // `overflow-*` — they're different groups — so the only reliable fix is not
        // emitting it here.
        !isEditing && !editStatus && "truncate",
        isNumericCell && "tabular-nums text-right",
        isColumnEditable(colDef, row.originalRow) && "cursor-pointer",
        (isLeftPinned || isRightPinned) && "sticky-body-cell",
        // sticky cells are already positioning contexts for the fill handle
        isFillCorner && !isLeftPinned && !isRightPinned && "relative",
        isLeftPinned && pinnedColumns.left.length > 0 && "pinned-left-shadow",
        isRightPinned && pinnedColumns.right.length > 0 && "pinned-right-shadow",
        isFocused && !isEditing && "cell-focused",
        inRange && "cell-range-selected",
        inFillZone && "cell-fill-preview",
        isFindMatch && "cell-find-match",
        isActiveFindMatch && "cell-find-current",
        !row.isGroupHeader && getSafeCellClassName(getCellClassName, row.originalRow, colDef)
      )}
      style={{
        width: columnWidths[colDef.field] || colDef.defaultWidth || `${DEFAULT_COL_WIDTH}px`,
        maxWidth: columnWidths[colDef.field] || colDef.defaultWidth || `${DEFAULT_COL_WIDTH}px`,
        ...conditionalStyle,
        ...stickyStyle,
      }}
      title={colDef.sparkline || colDef.suppressTitle ? undefined : String(getCellValue(row, colDef.field, colDef))}
      onClick={() => handleCellClick(row.id, colDef.field)}
      onDoubleClick={() => startEditingCell(row.id, colDef.field)}
      onMouseDown={(e) => handleCellMouseDown(e, dataIndex, colIndex)}
      onMouseEnter={() => handleCellMouseEnter(dataIndex, colIndex)}
      onContextMenu={(e) => handleCellContextMenu(e, dataIndex, colIndex, row.id, colDef.field)}
    >
      {renderCellContent()}
      {isFillCorner && (
        <div className="fill-handle" onMouseDown={onFillMouseDown} aria-label="Fill handle" />
      )}
    </TableCell>
  );
}

// A cell rarely has an editStatus/bufferedValue change without a keystroke change
// elsewhere too, but `editSession`/`bufferedValue` are read fresh each render — keep
// the default shallow-prop comparator (React.memo with no comparator) rather than a
// custom one here: unlike GridRow's `cellFlags` array, every prop below is a scalar
// or a stable-identity object already, so the default comparator is both correct and
// cheap.
export const GridCell = React.memo(GridCellInner) as typeof GridCellInner;
