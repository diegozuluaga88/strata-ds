import * as React from 'react';
import { findMissingRange } from '../lib/lazy-window';

export interface UseLazyRangeRequestArgs<TData> {
  enabled: boolean;
  startIndex: number;
  /** Exclusive, matching `LazyWindow.endIndex`. */
  endIndex: number;
  getRow?: (index: number) => TData | undefined;
  onLoadRange?: (range: { startIndex: number; lastIndex: number }) => void;
  debounceMs: number;
}

/**
 * Asks the consumer for the rows the visible window is missing, once scrolling settles.
 *
 * Debounced rather than fired per window change: dragging the scrollbar across a large
 * dataset changes the window every frame, and requesting each intermediate position would
 * issue dozens of requests for windows the user never stops at. During the drag the user
 * sees skeletons, which is honest -- at that speed nothing is readable anyway.
 */
export function useLazyRangeRequest<TData>(args: UseLazyRangeRequestArgs<TData>) {
  const { enabled, startIndex, endIndex, getRow, onLoadRange, debounceMs } = args;

  // Kept in refs so an unstable callback identity cannot restart the timer on every
  // render, which would prevent it ever elapsing. Their PRESENCE is still a dependency
  // below -- a consumer that wires `onLoadRange` in later (after an auth check, say) must
  // get the effect re-run, or the first range request is silently dropped forever.
  const onLoadRangeRef = React.useRef(onLoadRange);
  onLoadRangeRef.current = onLoadRange;
  const getRowRef = React.useRef(getRow);
  getRowRef.current = getRow;
  // Named rather than inlined in the dependency array: a computed expression there reads
  // as a mistake and `exhaustive-deps` cannot verify it.
  const hasOnLoadRange = !!onLoadRange;
  const hasGetRow = !!getRow;

  React.useEffect(() => {
    if (!enabled || !getRowRef.current || !onLoadRangeRef.current) return;

    const timer = setTimeout(() => {
      const read = getRowRef.current;
      if (!read) return;
      const missing = findMissingRange(startIndex, endIndex, read);
      // `findMissingRange` already returns `{ startIndex, lastIndex }`, which is exactly
      // the public contract's shape -- both inclusive, and named so neither can be
      // confused with `LazyWindow.endIndex` (exclusive).
      if (missing) onLoadRangeRef.current?.(missing);
    }, debounceMs);

    return () => clearTimeout(timer);
    // `!!onLoadRange`/`!!getRow`, not the callbacks themselves: the effect must re-run when
    // one appears or disappears, but must NOT restart the debounce every time a consumer
    // hands over a new closure with the same meaning.
  }, [enabled, startIndex, endIndex, debounceMs, hasOnLoadRange, hasGetRow]);
}
