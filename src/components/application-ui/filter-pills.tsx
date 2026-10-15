import * as React from 'react';
import { cn } from '@/utils';

/**
 * FilterPills — horizontal row of pill-shaped filters with inline count badges.
 *
 * Used at the top of data lists for status-based filtering (e.g. "All 21 ·
 * Ready to Review 12 · Completed 5 · Not Processed 4"). Each pill toggles
 * which subset is shown.
 *
 * Promoted from inbound-outbound (QuoteConverter.tsx FUNNEL pattern) and
 * smart-comparator (Transactions filter tabs). Replaces ~30 LOC of duplicated
 * Tailwind in each consumer.
 *
 * Visual: active pill = bg-primary + text-primary-foreground, con semibold y
 * contorno de 1px en `foreground` **porque el lima solo no se ve**: en claro
 * contrasta 1,03:1 con el fondo de pagina, o sea por tono y no por luminancia.
 * Es la misma senal que llevan `Toggle` y `Tabs` desde ST-2341; count badge
 * inside picks accent based on active state.
 */

export interface FilterPillOption<TKey extends string = string> {
  /** Unique key for the pill (used by `activeKey` and `onChange`). */
  key: TKey;
  /** Visible label. */
  label: string;
  /** Optional count badge value. Pass `undefined` to omit. */
  count?: number;
}

export interface FilterPillsProps<TKey extends string = string>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  options: FilterPillOption<TKey>[];
  activeKey: TKey;
  onChange: (key: TKey) => void;
  /** Optional ARIA label for the group. */
  ariaLabel?: string;
}

export function FilterPills<TKey extends string = string>({
  options,
  activeKey,
  onChange,
  ariaLabel,
  className,
  ...rest
}: FilterPillsProps<TKey>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn('flex items-center gap-1 flex-wrap', className)}
      {...rest}
    >
      {options.map((opt) => {
        const active = opt.key === activeKey;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            aria-pressed={active}
            className={cn(
              'inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground font-semibold outline-1 outline-solid outline-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
            )}
          >
            {opt.label}
            {typeof opt.count === 'number' && (
              <FilterPillCount value={opt.count} active={active} />
            )}
          </button>
        );
      })}
    </div>
  );
}

interface FilterPillCountProps {
  value: number;
  active: boolean;
}

export function FilterPillCount({ value, active }: FilterPillCountProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full text-[10px] font-bold',
        active
          ? 'bg-primary-foreground/20 text-primary-foreground'
          : 'bg-muted text-muted-foreground',
      )}
    >
      {value}
    </span>
  );
}
