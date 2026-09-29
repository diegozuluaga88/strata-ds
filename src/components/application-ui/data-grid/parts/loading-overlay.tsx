import { Skeleton } from '@/components/application-ui/skeleton';
import { cn } from '../lib/utils';

/** Skeleton rows that stand in for the body while keeping the grid's chrome. */
export function LoadingBody({
  columnCount,
  rowCount = 8,
  rowHeight,
  cellPadding,
}: {
  columnCount: number;
  rowCount?: number;
  rowHeight: number;
  cellPadding: string;
}) {
  return (
    <tbody data-testid="data-grid-loading">
      {Array.from({ length: rowCount }).map((_, rowIndex) => (
        <tr key={rowIndex} style={{ height: rowHeight }} className="border-b border-border last:border-none">
          {Array.from({ length: Math.max(1, columnCount) }).map((__, colIndex) => (
            <td key={colIndex} className={cn(cellPadding)}>
              <Skeleton className="h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}
