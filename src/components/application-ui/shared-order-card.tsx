import * as React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  FileText,
  MapPin,
  MoreVertical,
  Pencil,
  User,
} from 'lucide-react';
import { cn } from '@/utils';
import { StatusBadge, type StatusBadgeValue } from './status-badge';

export interface SharedOrderCardProps {
  /** Visual variant of the card */
  variant?: 'default' | 'pipeline';
  /** Initials for the avatar circle */
  initials: string;
  /** Client or Customer name */
  client: string;
  /** Order ID or reference number */
  orderId: string;
  /** Formatted amount */
  amount: string;
  /** Formatted date */
  date: string;
  /** Status text */
  status: string;
  /** CSS class for the status badge background/text */
  statusBadgeClass?: string;
  /** Canonical status for StatusBadge component (alternative to statusBadgeClass) */
  statusBadge?: StatusBadgeValue;
  /** Project details (used in pipeline variant) */
  project?: string;
  /** Location details (used in pipeline variant) */
  location?: string;
  /** Number of items (used in pipeline variant) */
  itemsCount?: string;
  /** Project manager details for expanded view (default variant) */
  projectManager?: {
    name: string;
    role?: string;
  };
  /** Progress stages for the timeline (default variant) */
  stages?: {
    key: string;
    label: string;
    status: 'completed' | 'current' | 'pending';
  }[];
  /** Optional alert message for action required */
  actionRequiredMessage?: string;
  /** Whether the card is currently expanded */
  isExpanded?: boolean;
  /** Whether the card has an active ring (used in grid view) */
  isActive?: boolean;
  /** Callback for when the expansion should toggle */
  onExpandToggle?: () => void;
  /** Callback for primary action (Close in pipeline, Document in default) */
  onPrimaryAction?: (e: React.MouseEvent) => void;
  /** Callback for secondary action (Arrow in pipeline, Edit in default) */
  onSecondaryAction?: (e: React.MouseEvent) => void;
  /** Callback for document action (default variant) */
  onDocumentClick?: (e: React.MouseEvent) => void;
  /** Callback for edit action (default variant) */
  onEditClick?: (e: React.MouseEvent) => void;
  /** Callback for more options action (default variant) */
  onMoreClick?: (e: React.MouseEvent) => void;
  /** General click handler for the card */
  onClick?: () => void;
  /** Custom class for the root container */
  className?: string;
}

/**
 * Shared order-style card component.
 * Replicates the ui-dealer pricing/transaction card designs for use across the monorepo.
 */
export function SharedOrderCard({
  variant = 'default',
  initials,
  client,
  orderId,
  amount,
  date,
  status,
  statusBadgeClass,
  statusBadge,
  project,
  location,
  itemsCount,
  projectManager,
  stages,
  actionRequiredMessage,
  isExpanded = false,
  isActive = false,
  onExpandToggle,
  onPrimaryAction,
  onSecondaryAction,
  onDocumentClick,
  onEditClick,
  onMoreClick,
  onClick,
  className,
}: SharedOrderCardProps) {
  if (variant === 'pipeline') {
    return (
      <div
        role="button"
        tabIndex={0}
        data-testid="shared-pipeline-card"
        className={cn(
          "group relative bg-card/40 rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col",
          (isActive || isExpanded)
            ? "border-brand-500/50 ring-1 ring-brand-500/20 shadow-lg"
            : "border-zinc-200 dark:border-white/10 shadow-sm hover:shadow-md",
          className
        )}
        onClick={onClick}
        onKeyDown={(ev) => {
          if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault();
            onClick?.();
          }
        }}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center text-xs font-bold shadow-sm ring-2 ring-white dark:ring-zinc-900">
                {initials}
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-semibold text-foreground transition-colors">{client}</h4>
                <p className="text-[10px] text-muted-foreground font-mono">{orderId}</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-semibold text-foreground">{amount}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Date</span>
              <span className="text-foreground">{date}</span>
            </div>
            <div className="h-px bg-border w-full my-2" />
            <div className="flex items-center justify-between">
              {statusBadge ? (
                <StatusBadge status={statusBadge}>{status}</StatusBadge>
              ) : (
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border shadow-sm ring-1 ring-inset",
                    statusBadgeClass || "bg-zinc-100 text-zinc-700 ring-zinc-600/20"
                  )}
                >
                  {status}
                </span>
              )}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="text-xs font-bold text-zinc-800 bg-primary hover:bg-primary/90 px-3 py-1.5 rounded-md transition-shadow shadow-sm cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPrimaryAction?.(e);
                  }}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
                  title="View Full Details"
                  onClick={(e) => {
                    e.stopPropagation();
                    onExpandToggle?.();
                  }}
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-white/5 animate-in slide-in-from-top-2 duration-200">
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Project</p>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-200 truncate">{project}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Location</p>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-200">
                    <MapPin className="h-4 w-4 text-zinc-400" />
                    <span className="truncate">{location}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Date Placed</p>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-200 font-mono">{date}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Items</p>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">{itemsCount || 'N/A'}</p>
                </div>
              </div>
              <div className="flex flex-col gap-3 pt-2">
                <button
                  type="button"
                  className="w-full py-2.5 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-sm cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSecondaryAction?.(e);
                  }}
                >
                  View Full Order Details
                </button>
                <button
                  type="button"
                  className="w-full py-3 text-sm font-bold text-zinc-950 bg-brand-500 hover:bg-brand-300 rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPrimaryAction?.(e);
                  }}
                >
                  <MapPin className="h-4 w-4" />
                  Track Shipment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div
      role="button"
      tabIndex={0}
      data-testid="shared-order-card"
      className={cn(
        "group relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-300 dark:border-zinc-600 ring-1 ring-zinc-300 dark:ring-zinc-600 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col",
        (isActive || isExpanded) && "ring-brand-500/50 border-brand-500/50 shadow-lg",
        className
      )}
      onClick={onClick}
      onKeyDown={(ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow-md">
              {initials}
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">{client}</h4>
              <p className="text-xs text-gray-500">{orderId}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="p-1 rounded-full hover:bg-primary hover:text-zinc-900 dark:hover:bg-primary text-gray-400 hover:text-zinc-900 dark:hover:text-zinc-900 transition-colors cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onDocumentClick?.(e);
              }}
              aria-label="View document"
            >
              <FileText className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              className="p-1 rounded-full hover:bg-primary hover:text-zinc-900 dark:hover:bg-primary text-gray-400 hover:text-zinc-900 dark:hover:text-zinc-900 transition-colors cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onEditClick?.(e);
              }}
              aria-label="Edit"
            >
              <Pencil className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              className="p-1 rounded-full hover:bg-primary hover:text-zinc-900 dark:hover:bg-primary text-gray-400 dark:hover:text-zinc-900 transition-colors cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onMoreClick?.(e);
              }}
              aria-label="More options"
            >
              <MoreVertical className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-white/5">
            <span className="text-xs text-gray-500">Amount</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{amount}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-white/5">
            <span className="text-xs text-gray-500">Date</span>
            <span className="text-sm text-gray-700 dark:text-gray-300">{date}</span>
          </div>
          <div className="flex justify-between items-center pt-2">
            {statusBadge ? (
              <StatusBadge status={statusBadge}>{status}</StatusBadge>
            ) : (
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset',
                  statusBadgeClass || 'bg-zinc-100 text-zinc-700'
                )}
              >
                {status}
              </span>
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 px-5 border-t border-gray-100 dark:border-white/5">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-6">
              {projectManager && (
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500">
                    <User className="h-4 w-4" aria-hidden />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {projectManager.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {projectManager.role || 'Project Manager'}
                    </p>
                  </div>
                </div>
              )}

              {stages && (
                <div className="relative py-2">
                  <div className="absolute top-3 left-0 w-full h-0.5 bg-gray-200 dark:bg-zinc-700" />
                  <div className="relative z-10 flex justify-between">
                    {stages.map((stage) => (
                      <div
                        key={stage.key}
                        className="flex flex-col items-center bg-white dark:bg-zinc-900 px-1"
                      >
                        <div
                          className={cn(
                            'h-6 w-6 rounded-full flex items-center justify-center',
                            stage.status === 'completed' && 'bg-primary text-primary-foreground',
                            stage.status === 'current' && 'bg-primary text-primary-foreground',
                            stage.status === 'pending' && 'bg-gray-200 dark:bg-zinc-700 text-gray-400',
                          )}
                        >
                          {stage.status === 'completed' ? (
                            <Check className="h-4 w-4" aria-hidden />
                          ) : stage.status === 'current' ? (
                            <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                          ) : (
                            <div className="h-2 w-2 rounded-full bg-white/50" />
                          )}
                        </div>
                        <span
                          className={cn(
                            'mt-2 text-xs font-medium',
                            stage.status === 'pending'
                              ? 'text-gray-500'
                              : 'text-zinc-900 dark:text-zinc-100',
                          )}
                        >
                          {stage.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {actionRequiredMessage && (
              <div className="w-full md:w-[280px]">
                <div className="rounded-xl border border-orange-200 dark:border-orange-500/20 bg-orange-50 dark:bg-orange-500/10 p-4">
                  <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0" aria-hidden />
                    <div>
                      <p className="text-sm font-bold text-orange-900 dark:text-orange-100">
                        Action Required
                      </p>
                      <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                        {actionRequiredMessage}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end pb-4">
            <button
              type="button"
              className="text-sm font-medium text-primary hover:underline cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onExpandToggle?.();
              }}
            >
              View Full Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
