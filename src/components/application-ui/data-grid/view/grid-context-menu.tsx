"use client";
import * as React from 'react';
import type { HierarchicalData } from '../types';
import { extractRangeChartData, type RangeChartData } from '../lib/rangeChart';
import { getCellValue } from '../lib/utils';
import { cn } from '@/utils';
import type { ContextMenuTarget } from '../internal-types';
import { useGridConfig, useGridDataContext } from '../context';

export type { ContextMenuTarget } from '../internal-types';

/** `target` and `rangeBounds` are volatile (only meaningful while a right-click menu
 * is open / a range is selected) and stay props; everything else comes from
 * useGridConfig() / useGridDataContext(). */
export interface GridContextMenuProps<TData extends HierarchicalData<TData>> {
  target: ContextMenuTarget<TData>;
  rangeBounds: { top: number; bottom: number; left: number; right: number } | null;
}

export function GridContextMenu<TData extends HierarchicalData<TData>>({
  target,
  rangeBounds,
}: GridContextMenuProps<TData>) {
  const {
    colDefsMap,
    pinnedColumns,
    orderedVisibleColumnDefs,
    enableRangeChart,
    enableRangeSelection,
    closeContextMenu: onClose,
    copySelectionToClipboard: onCopySelection,
    setRangeChartData: onChartSelection,
    handlePinColumn: onPinColumn,
    handleColumnVisibilityChange: onHideColumn,
    handleExportCsv: onExportCsv,
    handleExportXlsx: onExportXlsx,
  } = useGridConfig<TData>();
  const { paginatedData } = useGridDataContext<TData>();
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // Note: stopPropagation from inside the menu can't be trusted here — with React
    // roots hydrated at `document` (Next.js App Router), React's delegated handler and
    // this listener share the same node, and stopPropagation doesn't silence same-node
    // listeners. Check containment instead.
    const closeUnlessInside = (e: Event) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      onClose();
    };
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', closeUnlessInside);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('scroll', closeUnlessInside, true);
    window.addEventListener('resize', onClose);
    return () => {
      document.removeEventListener('mousedown', closeUnlessInside);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('scroll', closeUnlessInside, true);
      window.removeEventListener('resize', onClose);
    };
  }, [onClose]);

  const ctxColDef = colDefsMap.get(target.colField);
  const isPinnedLeft = pinnedColumns.left.includes(target.colField);
  const isPinnedRight = pinnedColumns.right.includes(target.colField);
  const menuLeft = Math.max(4, Math.min(target.x, window.innerWidth - 208));
  const menuTop = Math.max(4, Math.min(target.y, window.innerHeight - 320));
  const itemClass = "flex w-full items-center rounded-sm px-2 py-1.5 text-sm text-left cursor-default hover:bg-accent hover:text-accent-foreground focus:outline-none focus:bg-accent";
  const runAndClose = (action: () => void) => () => { action(); onClose(); };
  const copyContextRow = () => {
    const row = paginatedData.find(r => r.id === target.rowId);
    if (!row || row.isGroupHeader) return;
    const text = orderedVisibleColumnDefs.map(c => String(getCellValue(row, c.field, c) ?? '')).join('\t');
    navigator.clipboard?.writeText(text);
  };
  const chartData = enableRangeChart && enableRangeSelection && rangeBounds
    ? extractRangeChartData(paginatedData, orderedVisibleColumnDefs, rangeBounds)
    : null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[200px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
      style={{ left: menuLeft, top: menuTop }}
      onContextMenu={(e) => e.preventDefault()}
      role="menu"
    >
      <button role="menuitem" className={itemClass} onClick={runAndClose(() => onCopySelection(false))}>Copy</button>
      <button role="menuitem" className={itemClass} onClick={runAndClose(() => onCopySelection(true))}>Copy with Headers</button>
      <button role="menuitem" className={itemClass} onClick={runAndClose(copyContextRow)}>Copy Row</button>
      {enableRangeChart && enableRangeSelection && (
        <button
          role="menuitem"
          className={cn(itemClass, !chartData && "opacity-50 cursor-not-allowed")}
          disabled={!chartData}
          title={chartData ? undefined : 'Select a range with at least one numeric column'}
          onClick={chartData ? runAndClose(() => onChartSelection(chartData)) : undefined}
        >
          Chart Selection…
        </button>
      )}
      <div className="my-1 h-px bg-border" role="separator" />
      {!isPinnedLeft && (
        <button role="menuitem" className={itemClass} onClick={runAndClose(() => onPinColumn(target.colField, 'left'))}>Pin Column Left</button>
      )}
      {!isPinnedRight && (
        <button role="menuitem" className={itemClass} onClick={runAndClose(() => onPinColumn(target.colField, 'right'))}>Pin Column Right</button>
      )}
      {(isPinnedLeft || isPinnedRight) && (
        <button role="menuitem" className={itemClass} onClick={runAndClose(() => onPinColumn(target.colField, null))}>Unpin Column</button>
      )}
      {ctxColDef?.hideable !== false && (
        <button role="menuitem" className={itemClass} onClick={runAndClose(() => onHideColumn(target.colField, false))}>Hide Column</button>
      )}
      <div className="my-1 h-px bg-border" role="separator" />
      <button role="menuitem" className={itemClass} onClick={runAndClose(onExportCsv)}>Export as CSV</button>
      <button role="menuitem" className={itemClass} onClick={runAndClose(onExportXlsx)}>Export as XLSX</button>
    </div>
  );
}
