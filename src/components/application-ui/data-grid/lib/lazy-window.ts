/**
 * Window math for lazy (server-windowed) mode.
 *
 * Unlike the general virtualization path in `use-grid-layout`, lazy mode has no group
 * headers and no detail panels -- both are out of scope there -- so every row is exactly
 * `rowHeight` tall. That turns the visible window into arithmetic instead of a binary
 * search over a prefix-sum array, which is what makes an arbitrary scrollbar jump O(1)
 * rather than a walk through intermediate rows.
 */

export interface LazyWindowArgs {
  scrollTop: number;
  viewportHeight: number;
  rowHeight: number;
  totalRowCount: number;
  /** Rows to render beyond the viewport in each direction. */
  overscan: number;
}

export interface LazyWindow {
  /** First rendered index, inclusive. */
  startIndex: number;
  /** Last rendered index, EXCLUSIVE. */
  endIndex: number;
  topSpacer: number;
  bottomSpacer: number;
}

const EMPTY_WINDOW: LazyWindow = { startIndex: 0, endIndex: 0, topSpacer: 0, bottomSpacer: 0 };

export function computeLazyWindow(args: LazyWindowArgs): LazyWindow {
  const { scrollTop, viewportHeight, rowHeight, totalRowCount, overscan } = args;

  // A zero/negative row height would divide by zero and produce Infinity indices.
  if (rowHeight <= 0 || totalRowCount <= 0) return EMPTY_WINDOW;

  // `overscan` is caller-supplied; a negative value would invert the window.
  const safeOverscan = Math.max(0, overscan);

  const firstVisible = Math.floor(Math.max(0, scrollTop) / rowHeight);
  const visibleCount = Math.ceil(viewportHeight / rowHeight);

  // Both bounds clamp to [0, totalRowCount], and endIndex can never precede startIndex:
  // a scrollTop past the end of the dataset would otherwise produce startIndex > endIndex
  // and a topSpacer reserving space that does not exist.
  const startIndex = Math.min(totalRowCount, Math.max(0, firstVisible - safeOverscan));
  const endIndex = Math.max(startIndex, Math.min(totalRowCount, firstVisible + visibleCount + safeOverscan));

  return {
    startIndex,
    endIndex,
    topSpacer: startIndex * rowHeight,
    bottomSpacer: (totalRowCount - endIndex) * rowHeight,
  };
}

/**
 * The contiguous span of indices in [startIndex, endIndex) that `getRow` cannot answer.
 * Returns the first through last missing index (both inclusive -- deliberately distinct
 * from LazyWindow's exclusive endIndex, so the two never collide under the same name),
 * so one request covers a gap even if a few rows inside it happen to be loaded --
 * refetching a handful of known rows is cheaper than issuing several requests.
 *
 * Returns null when nothing is missing, which is the common case once a window settles.
 */
export function findMissingRange(
  startIndex: number,
  endIndex: number,
  getRow: (index: number) => unknown,
): { startIndex: number; lastIndex: number } | null {
  let first = -1;
  let last = -1;
  for (let i = startIndex; i < endIndex; i++) {
    if (getRow(i) === undefined) {
      if (first === -1) first = i;
      last = i;
    }
  }
  return first === -1 ? null : { startIndex: first, lastIndex: last };
}
