import type { ColumnDefinition, HierarchicalData, ProcessedRow } from '../../types';

export interface NavArgs<TData extends HierarchicalData<TData>> {
  key: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight';
  rows: ProcessedRow<TData>[];
  columns: ColumnDefinition<TData>[];
  currentRowIndex: number;
  currentColIndex: number;
}

/**
 * The next focus position for an arrow key, or null when the edge blocks it.
 * Group-header rows are skipped in the direction of travel, matching the original
 * while-loops — a run of headers is stepped over, and if only headers remain the
 * position does not move.
 */
export function nextFocusPosition<TData extends HierarchicalData<TData>>(
  args: NavArgs<TData>,
): { rowIndex: number; colIndex: number } | null {
  const { key, rows, columns, currentRowIndex, currentColIndex } = args;
  if (key === 'ArrowUp') {
    if (currentRowIndex <= 0) return null;
    let prev = currentRowIndex - 1;
    while (prev >= 0 && rows[prev].isGroupHeader) prev--;
    return prev >= 0 ? { rowIndex: prev, colIndex: currentColIndex } : null;
  }
  if (key === 'ArrowDown') {
    if (currentRowIndex >= rows.length - 1) return null;
    let next = currentRowIndex + 1;
    while (next < rows.length && rows[next].isGroupHeader) next++;
    return next < rows.length ? { rowIndex: next, colIndex: currentColIndex } : null;
  }
  if (key === 'ArrowLeft') {
    return currentColIndex > 0 ? { rowIndex: currentRowIndex, colIndex: currentColIndex - 1 } : null;
  }
  return currentColIndex < columns.length - 1
    ? { rowIndex: currentRowIndex, colIndex: currentColIndex + 1 }
    : null;
}

export interface RangeExtendArgs {
  key: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight';
  end: { rowIndex: number; colIndex: number };
  rowCount: number;
  colCount: number;
}

/** Shift+arrow moves the range's free corner one cell, clamped to the grid. */
export function extendRangeEnd({ key, end, rowCount, colCount }: RangeExtendArgs) {
  let { rowIndex, colIndex } = end;
  if (key === 'ArrowUp') rowIndex = Math.max(0, rowIndex - 1);
  if (key === 'ArrowDown') rowIndex = Math.min(rowCount - 1, rowIndex + 1);
  if (key === 'ArrowLeft') colIndex = Math.max(0, colIndex - 1);
  if (key === 'ArrowRight') colIndex = Math.min(colCount - 1, colIndex + 1);
  return { rowIndex, colIndex };
}

export const ARROW_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'] as const;
export type ArrowKey = (typeof ARROW_KEYS)[number];
export const isArrowKey = (key: string): key is ArrowKey =>
  (ARROW_KEYS as readonly string[]).includes(key);

/** True when the keystroke belongs to an input the grid must not intercept. */
export function isTextEntryTarget(el: HTMLElement): boolean {
  return (
    el.tagName === 'INPUT' ||
    el.tagName === 'TEXTAREA' ||
    el.tagName === 'SELECT' ||
    el.isContentEditable
  );
}

export interface ScrollFocusedCellArgs {
  tableWrapperEl: HTMLDivElement;
  cellId: string;
  colField: string;
  pinnedLeft: (string)[];
  pinnedRight: (string)[];
  totalLeftWidth: number;
  totalRightWidth: number;
}

/**
 * Keeps DOM focus on the grid (so key events keep landing here) and scrolls the
 * focused cell into view — accounting for sticky-pinned columns, whose "visible"
 * region is narrower than the scroll container's own edges.
 */
export function scrollFocusedCellIntoView({
  tableWrapperEl,
  cellId,
  colField,
  pinnedLeft,
  pinnedRight,
  totalLeftWidth,
  totalRightWidth,
}: ScrollFocusedCellArgs): void {
  const active = document.activeElement as HTMLElement | null;
  const activeIsTextEntry = !!active && isTextEntryTarget(active);
  if (!activeIsTextEntry) tableWrapperEl.focus({ preventScroll: true });
  const cellElement = document.getElementById(cellId);
  if (!cellElement) return;

  const cellRect = cellElement.getBoundingClientRect();
  const tableContainer = tableWrapperEl.querySelector('.overflow-x-auto') as HTMLElement | null;

  if (tableContainer) {
    const containerRect = tableContainer.getBoundingClientRect();
    const isLeftPinned = pinnedLeft.includes(colField);
    const isRightPinned = pinnedRight.includes(colField);

    if (isLeftPinned) {
      if (tableContainer.scrollLeft > 0) {
        tableContainer.scrollLeft = 0;
      }
    } else if (isRightPinned) {
      const maxScroll = tableContainer.scrollWidth - tableContainer.clientWidth;
      if (tableContainer.scrollLeft < maxScroll) {
        tableContainer.scrollLeft = maxScroll;
      }
    } else {
      const visibleLeft = containerRect.left + totalLeftWidth;
      const visibleRight = containerRect.right - totalRightWidth;
      const isVisibleX = cellRect.left >= visibleLeft && cellRect.right <= visibleRight;

      if (!isVisibleX) {
        if (cellRect.left < visibleLeft) {
          tableContainer.scrollLeft -= (visibleLeft - cellRect.left);
        } else if (cellRect.right > visibleRight) {
          tableContainer.scrollLeft += (cellRect.right - visibleRight);
        }
      }
    }

    const isVisibleY = cellRect.top >= containerRect.top && cellRect.bottom <= containerRect.bottom;
    if (!isVisibleY) {
      cellElement.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  } else {
    cellElement.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
}
