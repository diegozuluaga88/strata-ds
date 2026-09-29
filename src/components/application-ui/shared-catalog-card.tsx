import * as React from 'react';
import {
  Calendar,
  UserCircle,
  RefreshCw,
  Clock,
  Trash2,
} from 'lucide-react';
import { cn } from '@/utils';
export interface SharedCatalogCardProps {
  /** Optional background image URL for the header */
  backgroundImageUrl?: string;
  /** Fallback background color class for the header (e.g., 'bg-orange-500') */
  fallbackBackgroundColor?: string;
  /** Primary heading */
  title: string;
  /** Number of items in the catalog */
  itemsCount: number | string;
  /** Text for the catalog type (e.g., 'Collections') */
  catalogType: string;
  /** Custom icon for the catalog type (defaults to Calendar) */
  catalogTypeIcon?: React.ComponentType<{ className?: string }>;
  /** Status badge definition */
  statusBadge?: {
    label: string;
    variant?: 'Active' | 'Inactive' | 'Archived' | string;
  };
  /** Owner name or text */
  owner: string;
  /** Last synced relative time text */
  lastSyncedText: string;
  /** Optional slot to replace last synced row (e.g. post-refresh success summary) */
  lastSyncedSlot?: React.ReactNode;
  /** Handler for the sync button */
  onSync?: (e: React.MouseEvent) => void;
  /** When true, the sync icon rotates to indicate in-progress */
  syncInProgress?: boolean;
  /** Handler for the history button */
  onViewHistory?: (e: React.MouseEvent) => void;
  /** Handler for the delete button */
  onDelete?: (e: React.MouseEvent) => void;
  /** Label for the primary action button */
  primaryActionLabel?: string;
  /** Handler for the primary action button */
  onPrimaryAction?: (e: React.MouseEvent) => void;
  /** Card level click handler */
  onClick?: () => void;
  /** Optional alternate body; when set, only this node is rendered in the content area (no catalog info rows, no footer) */
  alternateBody?: React.ReactNode;
}

function StatusBadge({ label, variant }: { label: string; variant?: string }) {
  const base = 'px-2 py-0.5 rounded-full text-xs font-medium';
  const variants: Record<string, string> = {
    Active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    Inactive: 'bg-gray-100 text-gray-700',
    Archived: 'bg-yellow-100 text-yellow-700',
  };

  return (
    <span className={cn(base, variants[variant as keyof typeof variants] || variants.Inactive)}>
      {label}
    </span>
  );
}

/**
 * Shared catalog-style card component.
 * Replicates the ui-dealer catalog card design for use across the monorepo.
 */
export function SharedCatalogCard({
  backgroundImageUrl,
  fallbackBackgroundColor = 'bg-orange-500',
  title,
  itemsCount,
  catalogType,
  catalogTypeIcon: TypeIcon = Calendar,
  statusBadge,
  owner,
  lastSyncedText,
  lastSyncedSlot,
  onSync,
  syncInProgress = false,
  onViewHistory,
  onDelete,
  primaryActionLabel = 'Create Quote',
  onPrimaryAction,
  onClick,
  alternateBody,
}: SharedCatalogCardProps) {
  return (
    <div
      className="group bg-card border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md transition-all hover:border-primary/50 cursor-pointer flex flex-col relative z-0 h-[380px]"
      onClick={onClick}
    >
      {/* Header Section */}
      <div
        className={cn(
          'h-32 p-6 flex items-end relative rounded-t-2xl shrink-0',
          !backgroundImageUrl && fallbackBackgroundColor
        )}
        style={
          backgroundImageUrl
            ? {
              backgroundImage: `url(${backgroundImageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
            : undefined
        }
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent rounded-t-2xl" />
        <h3 className="text-white font-bold text-xl relative z-10 truncate" title={title}>
          {title}
        </h3>
        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white text-xs px-2 py-1 rounded-full font-medium border border-white/10 z-10">
          {typeof itemsCount === 'number' ? `${itemsCount} Items` : itemsCount}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-4 rounded-b-2xl overflow-hidden bg-card">
        {alternateBody !== undefined ? (
          alternateBody
        ) : (
          <>
            <div className="space-y-4">
              {/* Catalog Info Row */}
              <div className="flex items-center justify-between text-sm">
                <div className="text-muted-foreground flex items-center gap-1.5 min-w-0">
                  <TypeIcon className="w-4 h-4 shrink-0" aria-hidden />
                  <span className="truncate">{catalogType}</span>
                </div>
                {statusBadge && (
                  <StatusBadge label={statusBadge.label} variant={statusBadge.variant} />
                )}
              </div>

              {/* Owner Row */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <UserCircle className="w-4 h-4 shrink-0" aria-hidden />
                <span className="truncate">{owner}</span>
              </div>

              {/* Last Synced Row + optional slot below */}
              <div className="space-y-1">
                <div className="text-[10px] text-zinc-400 h-4">{lastSyncedText}</div>
                {lastSyncedSlot != null ? lastSyncedSlot : null}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 mt-auto">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="p-2 rounded-lg transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Sync Catalog"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSync?.(e);
                  }}
                >
                  <RefreshCw
                    className={cn('w-4 h-4', syncInProgress && 'animate-spin')}
                    aria-hidden
                  />
                </button>
                <button
                  type="button"
                  className="p-2 rounded-lg transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 text-muted-foreground hover:text-foreground cursor-pointer"
                  title="View History"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewHistory?.(e);
                  }}
                >
                  <Clock className="w-4 h-4" aria-hidden />
                </button>
                <button
                  type="button"
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-600 transition-colors cursor-pointer"
                  title="Delete Catalog"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(e);
                  }}
                >
                  <Trash2 className="w-4 h-4" aria-hidden />
                </button>
              </div>
              <button
                type="button"
                className="text-zinc-900 bg-card hover:text-zinc-700 dark:text-zinc-300 dark:hover:text-white text-xs font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 px-3 py-1.5 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-700 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onPrimaryAction?.(e);
                }}
              >
                {primaryActionLabel}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
