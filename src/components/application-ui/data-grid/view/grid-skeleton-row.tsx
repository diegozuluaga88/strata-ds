"use client";
import * as React from 'react';
import { TableCell, TableRow } from '@/components/application-ui/table';
import { Skeleton } from '@/components/application-ui/skeleton';

export interface GridSkeletonRowProps {
  /** Number of cells to render, including any leading selection/detail/reorder columns. */
  columnCount: number;
  /** Fixed row height, so the row occupies exactly the space the window math reserved. */
  rowHeight: number;
}

/**
 * A single placeholder row for a lazy-mode index whose data has not arrived.
 *
 * Deliberately NOT a reuse of `LoadingBody` (parts/loading-overlay.tsx): that renders a
 * whole `<tbody>` replacing the entire grid body, so it cannot be interleaved with real
 * rows and does not honour the virtualization row height. This one is row-shaped and sized
 * so the scrollbar math stays exact whether an index is loaded or not.
 */
export function GridSkeletonRow({ columnCount, rowHeight }: GridSkeletonRowProps) {
  return (
    <TableRow aria-busy="true" className="hover:bg-transparent" style={{ height: `${rowHeight}px` }}>
      {Array.from({ length: columnCount }, (_, i) => (
        <TableCell key={i} className="px-3 py-2">
          <Skeleton className="h-4 w-full" />
        </TableCell>
      ))}
    </TableRow>
  );
}
