import * as React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/utils';

/**
 * KanbanFunnel — board-style pipeline view with N columns + cards per stage.
 *
 * Captures the OfficeworksFunnel pattern: a header, an N-column kanban with
 * stage labels + counts + per-column card list + empty state, plus an
 * optional footer (typically a capacity panel or summary block).
 *
 * Promoted from inbound-outbound/src/components/officeworks/OfficeworksFunnel.tsx
 * (lines 106-270). The DS primitive provides the structural shell — consumers
 * still own the card render (cardRenderer per column) so domain content stays
 * in the consumer.
 */

export interface KanbanFunnelColumn<TCard = unknown> {
  id: string;
  label: React.ReactNode;
  cards: TCard[];
  /** Tailwind class controlling the active highlight (e.g. 'text-primary'). */
  accentClass?: string;
  /** Optional context render for the column header right-side (defaults to MoreHorizontal). */
  headerRight?: React.ReactNode;
}

export interface KanbanFunnelProps<TCard>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerActions?: React.ReactNode;

  columns: KanbanFunnelColumn<TCard>[];
  /** Which column is "active" — receives the accent treatment in its header. */
  activeColumnId?: string;
  /** How to render each card. */
  renderCard: (card: TCard, columnId: string, indexInColumn: number) => React.ReactNode;
  /** Stable key per card (defaults to indexInColumn). */
  getCardKey?: (card: TCard, columnId: string, indexInColumn: number) => string;

  /** Optional content rendered below the kanban grid (e.g. capacity panel). */
  footer?: React.ReactNode;

  /** Tailwind grid template (e.g. 'grid-cols-5'). Defaults match the column count. */
  gridClassName?: string;
  /** Per-column min height. Defaults to 'min-h-[200px]'. */
  columnMinHeight?: string;

  emptyState?: React.ReactNode;
}

export function KanbanFunnel<TCard>({
  title,
  subtitle,
  headerActions,
  columns,
  activeColumnId,
  renderCard,
  getCardKey,
  footer,
  gridClassName,
  columnMinHeight = 'min-h-[200px]',
  emptyState,
  className,
  ...rest
}: KanbanFunnelProps<TCard>) {
  const gridCols =
    gridClassName ?? `grid-cols-${Math.min(Math.max(columns.length, 1), 12)}`;

  return (
    <div
      className={cn(
        'bg-card border border-border rounded-2xl',
        className,
      )}
      {...rest}
    >
      {(title || subtitle || headerActions) && (
        <div className="border-b border-border px-5 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            {title && (
              <h2 className="text-base font-semibold text-foreground truncate">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
          {headerActions && <div className="flex items-center gap-2 shrink-0">{headerActions}</div>}
        </div>
      )}

      <div className="p-5">
        <div className={cn('grid gap-3', gridCols)}>
          {columns.map((col) => {
            const isActive = col.id === activeColumnId;
            return (
              <div key={col.id} className={cn('space-y-3', columnMinHeight)}>
                <div className="flex items-center justify-between mb-1 px-1">
                  <h4
                    className={cn(
                      'font-medium text-sm flex items-center gap-2',
                      isActive ? col.accentClass ?? 'text-primary' : 'text-foreground',
                    )}
                  >
                    {col.label}
                    <span className="bg-muted text-muted-foreground text-[10px] px-1.5 py-0.5 rounded-full font-mono tabular-nums">
                      {col.cards.length}
                    </span>
                  </h4>
                  {col.headerRight ?? (
                    <button
                      type="button"
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                      title="Column options"
                      aria-label="Column options"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {col.cards.length === 0
                  ? emptyState ?? (
                      <div className="border-2 border-dashed border-border rounded-xl p-5 text-center">
                        <p className="text-xs text-muted-foreground">No items</p>
                      </div>
                    )
                  : col.cards.map((card, i) => (
                      <React.Fragment
                        key={getCardKey ? getCardKey(card, col.id, i) : `${col.id}-${i}`}
                      >
                        {renderCard(card, col.id, i)}
                      </React.Fragment>
                    ))}
              </div>
            );
          })}
        </div>

        {footer && <div className="mt-6 pt-5 border-t border-border">{footer}</div>}
      </div>
    </div>
  );
}
