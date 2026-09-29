import * as React from 'react';

export interface UseVisibleRangeChangeArgs {
  enabled: boolean;
  startIndex: number;
  /** Exclusive, matching `LazyWindow.endIndex`. */
  endIndex: number;
  onVisibleRangeChange?: (range: { startIndex: number; lastIndex: number }) => void;
  debounceMs: number;
}

/**
 * Reports which rows are currently on screen, once scrolling settles.
 *
 * This is the plain windowing signal, with no policy attached. The grid already computes
 * the visible range for every virtualized grid; until now it only escaped in lazy mode,
 * bundled with `getRow` row-indirection. A consumer paginating a cursor API cannot use
 * lazy mode -- lazy mode bypasses the row pipeline, so client-side filtering would
 * silently stop working -- but still needs to know when the viewport has reached the end
 * of what it has fetched.
 *
 * Deliberately NOT an `onScrollEnd`: "the end" is the consumer's definition, not the
 * grid's. How close to the end counts as close enough, whether there is more to fetch,
 * and what to do about it are all decisions that belong with whoever owns the cursor.
 * The grid reports the range; the consumer decides what it means.
 *
 * Debounced on the same reasoning as `useLazyRangeRequest`: dragging the scrollbar
 * changes the window every frame, and a consumer acting on each intermediate position
 * would fire a request per frame for windows the user never stops at.
 */
export function useVisibleRangeChange(args: UseVisibleRangeChangeArgs) {
  const { enabled, startIndex, endIndex, onVisibleRangeChange, debounceMs } = args;

  // In a ref so an unstable callback identity cannot restart the timer on every render,
  // which would stop it ever elapsing. Its PRESENCE is still a dependency below, so a
  // consumer that wires the callback in later still gets its first report.
  const callbackRef = React.useRef(onVisibleRangeChange);
  callbackRef.current = onVisibleRangeChange;
  // Named rather than inlined as `!!onVisibleRangeChange` in the dependency array below:
  // a computed expression there reads as a mistake and `exhaustive-deps` cannot verify it.
  const hasCallback = !!onVisibleRangeChange;

  React.useEffect(() => {
    if (!enabled || !callbackRef.current) return;
    // An empty window has no range to report -- firing `lastIndex: -1` would hand the
    // consumer a bound it has to special-case.
    if (endIndex <= startIndex) return;

    const timer = setTimeout(() => {
      // `lastIndex` is inclusive, matching `onLoadRange` rather than the exclusive
      // `endIndex` the window is expressed in. Both callbacks describe a row range to a
      // consumer, so they must not disagree about what the last number means.
      callbackRef.current?.({ startIndex, lastIndex: endIndex - 1 });
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [enabled, startIndex, endIndex, debounceMs, hasCallback]);
}
