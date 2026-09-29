import * as React from 'react';
import { MapPin, EllipsisVertical } from 'lucide-react';
import { Checkbox } from '../forms/checkbox';
import { cn } from '@/utils';
export interface SharedInventoryCardProps {
  /** Optional main image URL */
  imageUrl?: string;
  /** Icon for no-image state */
  imageFallbackIcon?: React.ComponentType<{ className?: string }>;
  /** Text for no-image state */
  imageFallbackLabel?: string;
  /** Primary heading */
  title: string;
  /** Second line, usually category/type */
  subtitle: string;
  /** Location text with MapPin icon */
  location: string;
  /** Label for bottom-left value */
  valueLabel: string;
  /** Value text */
  value: string;
  /** Bottom-right image overlay status */
  statusBadge?: {
    label: string;
    variant?: 'blue' | 'green' | 'orange' | 'zinc';
  };
  /** Bottom-right content footer priority */
  priorityBadge?: {
    label: string;
    variant?: 'green' | 'yellow' | 'muted';
    emoji?: string;
  };
  /** Toggle top-left checkbox visibility */
  showCheckbox?: boolean;
  /** Checkbox change handler */
  onCheckboxChange?: (checked: boolean) => void;
  /** Checkbox checked state */
  checked?: boolean;
  /** Toggle top-right three-dots button visibility */
  showActionButton?: boolean;
  /** Action button click handler */
  onActionClick?: (e: React.MouseEvent) => void;
  /** Card level click handler */
  onClick?: () => void;
}

function StatusBadge({ label, variant = 'zinc' }: { label: string; variant?: string }) {
  const base = 'px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-sm backdrop-blur-md border border-white/10';
  const variants = {
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    zinc: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400',
  };

  return (
    <span className={cn(base, variants[variant as keyof typeof variants] || variants.zinc)}>
      {label}
    </span>
  );
}

function PriorityBadge({ label, variant = 'muted', emoji }: { label: string; variant?: string; emoji?: string }) {
  const variants = {
    green: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10',
    yellow: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/10',
    muted: 'text-muted-foreground bg-muted/30',
  };

  return (
    <span className={cn('px-2 py-1 rounded text-[10px] font-medium border border-transparent', variants[variant as keyof typeof variants] || variants.muted)}>
      {emoji && (
        <span role="img" aria-label={label} className="mr-1">
          {emoji}
        </span>
      )}
      {label}
    </span>
  );
}

/**
 * Shared inventory-style card component.
 * Replicates the ui-dealer inventory card design for use across the monorepo.
 */
export function SharedInventoryCard({
  imageUrl,
  imageFallbackIcon: FallbackIcon,
  imageFallbackLabel,
  title,
  subtitle,
  location,
  valueLabel,
  value,
  statusBadge,
  priorityBadge,
  showCheckbox = false,
  onCheckboxChange,
  checked = false,
  showActionButton = false,
  onActionClick,
  onClick,
}: SharedInventoryCardProps) {
  return (
    <div
      className="group bg-card rounded-2xl border shadow-sm hover:shadow-lg transition-all cursor-pointer relative overflow-hidden flex flex-col h-[340px] border-zinc-200 dark:border-zinc-800 hover:border-primary/50"
      onClick={onClick}
    >
      <div className="h-44 w-full relative bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-300 dark:text-zinc-600">
            {FallbackIcon && <FallbackIcon className="w-12 h-12 mb-2" />}
            {imageFallbackLabel && <span className="text-xs font-medium">{imageFallbackLabel}</span>}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

        {showCheckbox && (
          <div className="absolute top-3 left-3 z-10" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={checked}
              onCheckedChange={(val) => onCheckboxChange?.(!!val)}
              className="rounded border-zinc-300 text-primary focus:ring-primary shadow-sm w-5 h-5 cursor-pointer"
              aria-label={`Select ${title}`}
            />
          </div>
        )}

        {showActionButton && (
          <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              className="p-1.5 bg-white/90 dark:bg-black/80 backdrop-blur rounded-lg text-foreground hover:bg-white dark:hover:bg-zinc-800 shadow-sm cursor-pointer"
              aria-label="More actions"
              onClick={(e) => {
                e.stopPropagation();
                onActionClick?.(e);
              }}
            >
              <EllipsisVertical className="w-5 h-5" aria-hidden />
            </button>
          </div>
        )}

        {statusBadge && (
          <div className="absolute bottom-3 right-3 z-10">
            <StatusBadge label={statusBadge.label} variant={statusBadge.variant} />
          </div>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-foreground truncate text-base" title={title}>
            {title}
          </h3>
          <p className="text-xs text-muted-foreground mb-3 truncate">
            {subtitle}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mb-2">
            <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden />
            <span className="truncate">{location}</span>
          </div>
        </div>
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-end">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-0.5">{valueLabel}</p>
            <p className="text-sm font-bold text-foreground">{value}</p>
          </div>
          {priorityBadge && (
            <PriorityBadge
              label={priorityBadge.label}
              variant={priorityBadge.variant}
              emoji={priorityBadge.emoji}
            />
          )}
        </div>
      </div>
    </div>
  );
}
