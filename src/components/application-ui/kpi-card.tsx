import * as React from 'react';
import { ChevronDown, ChevronRight, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/utils';

function parseTrend(trend: string): { percentage: string; suffix: string } {
  const match = trend.match(/^([\d.]+%)(.*)$/);
  if (match) return { percentage: match[1], suffix: match[2].trim() };
  return { percentage: trend, suffix: '' };
}

function TrendUpDownText({
  trend,
  direction,
}: {
  trend: string;
  direction: 'up' | 'down';
}) {
  const { percentage, suffix } = parseTrend(trend);
  if (direction === 'up') {
    return (
      <p className="flex items-center gap-1 text-xs">
        <TrendingUp
          className={cn('h-3.5 w-3.5 shrink-0 font-semibold text-green-600 dark:text-brand-500')}
          aria-hidden
        />
        <span className="font-semibold text-green-600 dark:text-brand-500">{percentage}</span>
        {suffix ? <span className="text-muted-foreground">{suffix}</span> : null}
      </p>
    );
  }
  return (
    <p className="flex items-center gap-1 text-xs">
      <TrendingDown className="h-3.5 w-3.5 shrink-0 font-semibold text-red-400" aria-hidden />
      <span className="font-semibold text-red-400">{percentage}</span>
      {suffix ? <span className="text-muted-foreground">{suffix}</span> : null}
    </p>
  );
}

export type KPICardTrendDirection = 'up' | 'down' | 'neutral';
export type KPICardValueFormat = 'number' | 'currency' | 'percent' | ((v: number) => string);
export type KPICardTone = 'neutral' | 'success' | 'warning' | 'danger' | 'brand' | 'blue' | 'green' | 'amber' | 'purple' | 'red';
export type KPICardDensity = 'compact' | 'default' | 'comfortable' | 'summary';

/** Summary density: line items under the value (dot + label). */
export interface KPICardSubMetric {
  label: string;
  value?: string;
}

/** Summary density: primary action button (tone-colored). */
export interface KPICardPrimaryAction {
  onClick: () => void;
  title?: string;
  icon?: React.ReactNode;
}

/** Summary density: row shown in the details panel (e.g. "Trend (30d)" / "+12%"). */
export interface KPICardDetailRow {
  label: string;
  value: string;
}

/** Summary density: full-width action in the details panel (e.g. "View Report"). */
export interface KPICardDetailsAction {
  label: string;
  onClick: () => void;
}

export interface KPICardProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  label: string;
  value: number;
  subValue?: string;
  /** Compact density only: tone for subValue (success=green, danger=red, neutral=muted). */
  subValueTone?: 'success' | 'danger' | 'neutral';
  icon?: React.ReactNode;
  iconPosition?: 'start' | 'top';
  trend?:
  | {
    direction: KPICardTrendDirection;
    value: string;
  }
  | string
  | React.ReactNode;
  /** Legacy prop kept for backwards compatibility with older KPI usages. */
  trendDirection?: KPICardTrendDirection | null;
  valueFormat?: KPICardValueFormat;
  currency?: string;
  locale?: string;
  tone?: KPICardTone;
  /**
   * When set, overrides the icon wrapper background with this color (e.g. hex/CSS value).
   * Icon text and SVG default to black for contrast.
   */
  iconBgColor?: string;
  density?: KPICardDensity;
  action?: React.ReactNode;
  /** Compact mode only: show vertical divider after the card (responsive visibility). */
  showDivider?: boolean;
  /** Summary density: list of sub-metrics (dot + label, optional value). */
  subMetrics?: KPICardSubMetric[];
  /** Summary density: called when "Details" is clicked (optional, for side effects). */
  onDetailsClick?: () => void;
  /** Summary density: primary action button (e.g. "Go to …"). */
  primaryAction?: KPICardPrimaryAction;
  /** Summary density: controlled details open state. */
  detailsOpen?: boolean;
  /** Summary density: called when details open state changes (toggle Details/Less). */
  onDetailsOpenChange?: (open: boolean) => void;
  /** Summary density: rows shown when details are open (e.g. Trend (30d), Projection). */
  detailRows?: KPICardDetailRow[];
  /** Summary density: full-width button when details are open (e.g. "View Report"). */
  detailsAction?: KPICardDetailsAction;
  /** Summary density: position of the trend (top or bottom). */
  trendPosition?: 'top' | 'bottom' | 'left' | 'right';
}

const densityClassMap: Record<KPICardDensity, string> = {
  compact: '',
  default: 'p-4',
  comfortable: 'p-6',
  summary: 'p-3',
};

const iconWrapClassMap: Record<KPICardTone, string> = {
  neutral: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 ring-zinc-600/20 dark:ring-zinc-400/30',
  success: 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400 ring-green-600/20 dark:ring-green-400/30',
  warning: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 ring-amber-600/20 dark:ring-amber-400/30',
  danger: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 ring-red-600/20 dark:ring-red-400/30',
  brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-500 ring-brand-600/20 dark:ring-brand-500/30',
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 ring-blue-600/20 dark:ring-blue-400/30',
  green: 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400 ring-green-600/20 dark:ring-green-400/30',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 ring-amber-600/20 dark:ring-amber-400/30',
  purple: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 ring-indigo-600/20 dark:ring-indigo-400/30',
  red: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 ring-red-600/20 dark:ring-red-400/30',
};

/** Summary density: small icon wrap (p-1 rounded-md, ring-inset). */
const iconWrapSummaryClassMap: Record<KPICardTone, string> = {
  neutral: 'ring-1 ring-inset bg-zinc-100 text-zinc-700 ring-zinc-600/20 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-400/30',
  success: 'ring-1 ring-inset bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/15 dark:text-green-300 dark:ring-green-400/30',
  warning: 'ring-1 ring-inset bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/30',
  danger: 'ring-1 ring-inset bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/30',
  brand: 'ring-1 ring-inset bg-brand-50 text-brand-700 ring-brand-600/20 dark:bg-brand-500/15 dark:text-brand-300 dark:ring-brand-500/30',
  blue: 'ring-1 ring-inset bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/30',
  green: 'ring-1 ring-inset bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/15 dark:text-green-300 dark:ring-green-400/30',
  amber: 'ring-1 ring-inset bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/30',
  purple: 'ring-1 ring-inset bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-500/15 dark:text-indigo-300 dark:ring-indigo-400/30',
  red: 'ring-1 ring-inset bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/30',
};

const trendBadgeClassMap: Record<KPICardTrendDirection, string> = {
  up: 'bg-green-50 text-green-700 dark:bg-green-500/20 dark:text-green-400',
  down: 'bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-400',
  neutral: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-500/20 dark:text-zinc-300',
};

const primaryActionClassMap: Record<KPICardTone, string> = {
  neutral:
    'border border-zinc-500 bg-zinc-600 text-white shadow-sm shadow-zinc-500/20 hover:bg-zinc-700',
  success:
    'border border-green-500 bg-green-600 text-white shadow-sm shadow-green-500/20 hover:bg-green-700',
  warning:
    'border border-amber-500 bg-amber-600 text-white shadow-sm shadow-amber-500/20 hover:bg-amber-700',
  danger:
    'border border-red-500 bg-red-600 text-white shadow-sm shadow-red-500/20 hover:bg-red-700',
  brand:
    'border border-brand-500 bg-brand-600 text-white shadow-sm shadow-brand-500/20 hover:bg-brand-700',
  blue:
    'border border-brand-500 bg-brand-600 text-white shadow-sm shadow-brand-500/20 hover:bg-brand-700',
  green:
    'border border-brand-500 bg-brand-600 text-white shadow-sm shadow-brand-500/20 hover:bg-brand-700',
  amber:
    'border border-brand-500 bg-brand-600 text-white shadow-sm shadow-brand-500/20 hover:bg-brand-700',
  purple:
    'border border-brand-500 bg-brand-600 text-white shadow-sm shadow-brand-500/20 hover:bg-brand-700',
  red:
    'border border-brand-500 bg-brand-600 text-white shadow-sm shadow-brand-500/20 hover:bg-brand-700',
};

const dotClassMap: Record<KPICardTone, string> = {
  neutral: 'bg-zinc-500',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  brand: 'bg-brand-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  amber: 'bg-amber-500',
  purple: 'bg-indigo-500',
  red: 'bg-red-500',
};

function formatMetricValue(
  value: number,
  valueFormat: KPICardValueFormat,
  locale: string,
  currency: string
): string {
  if (typeof valueFormat === 'function') {
    return valueFormat(value);
  }

  if (valueFormat === 'currency') {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(value);
  }

  if (valueFormat === 'percent') {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
    }).format(value);
  }

  return new Intl.NumberFormat(locale).format(value);
}

const KPI_CARD_ONLY_KEYS = new Set([
  'label',
  'value',
  'subValue',
  'subValueTone',
  'icon',
  'iconPosition',
  'trend',
  'trendDirection',
  'valueFormat',
  'currency',
  'locale',
  'tone',
  'iconBgColor',
  'density',
  'action',
  'showDivider',
  'subMetrics',
  'onDetailsClick',
  'primaryAction',
  'detailsOpen',
  'onDetailsOpenChange',
  'detailRows',
  'detailsAction',
  'trendPosition',
  'className',
]);

export function KPICard(allProps: KPICardProps) {
  const {
    label,
    value,
    subValue,
    subValueTone,
    icon,
    iconPosition = 'start',
    trend,
    trendDirection: _trendDirection,
    valueFormat = 'number',
    currency = 'USD',
    locale = 'en-US',
    tone = 'neutral',
    iconBgColor,
    density = 'default',
    action,
    showDivider = false,
    subMetrics,
    onDetailsClick,
    primaryAction,
    detailsOpen: detailsOpenProp,
    onDetailsOpenChange,
    detailRows,
    detailsAction,
    className,
    trendPosition = 'right',
  } = allProps;
  void _trendDirection;
  const domProps = Object.fromEntries(
    Object.entries(allProps).filter(([key]) => !KPI_CARD_ONLY_KEYS.has(key))
  );
  const [internalDetailsOpen, setInternalDetailsOpen] = React.useState(false);
  const isControlled = detailsOpenProp !== undefined;
  const detailsOpen = isControlled ? detailsOpenProp : internalDetailsOpen;
  const setDetailsOpen = React.useCallback(
    (open: boolean) => {
      if (!isControlled) setInternalDetailsOpen(open);
      onDetailsOpenChange?.(open);
    },
    [isControlled, onDetailsOpenChange]
  );

  const normalizedTrend =
    trend && typeof trend === 'object' && 'direction' in trend && 'value' in trend
      ? trend
      : null;
  const isTrendReactNode =
    trend != null &&
    typeof trend !== 'string' &&
    !(
      typeof trend === 'object' &&
      trend !== null &&
      'direction' in trend &&
      'value' in trend
    );
  const formattedValue = formatMetricValue(value, valueFormat, locale, currency);
  const iconWrapClassName = iconWrapClassMap[tone];
  const iconWrapSummaryClassName = iconWrapSummaryClassMap[tone];
  const primaryActionClassName = primaryActionClassMap[tone];
  const dotClassName = dotClassMap[tone];

  if (density === 'compact') {
    return (
      <>
        <div
          data-slot="kpi-card"
          className={cn(
            'flex min-w-fit items-center gap-3 group cursor-default',
            className
          )}
          {...domProps}
        >
          {icon ? (
            <div
              className={cn(
                'relative flex h-10 w-10 items-center justify-center rounded-full transition-colors ring-1 ring-inset [&>svg]:h-5 [&>svg]:w-5',
                iconBgColor ? 'text-black [&>svg]:text-black' : iconWrapClassName
              )}
              style={iconBgColor ? { backgroundColor: iconBgColor } : undefined}
            >
              {/* Tooltip on hover - shows label */}
              <div
                className="absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-zinc-900 px-2 py-1 text-xs font-semibold text-white shadow-lg animate-in fade-in zoom-in-95 duration-200 group-hover:block dark:bg-zinc-800"
                aria-hidden
              >
                {label}
                <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-zinc-900 dark:border-t-zinc-800" />
              </div>
              {icon}
            </div>
          ) : null}

          <div className="flex flex-col">
            <span className="whitespace-nowrap text-lg font-bold leading-none text-foreground">{formattedValue}</span>
            <span
              className={cn(
                'mt-1 whitespace-nowrap text-[10px] font-medium',
                subValue != null && subValue !== ''
                  ? subValueTone === 'success'
                    ? 'text-green-600 dark:text-green-400'
                    : subValueTone === 'danger'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-muted-foreground'
                  : 'text-muted-foreground'
              )}
            >
              {subValue != null && subValue !== '' ? subValue : label}
            </span>
          </div>

          {action ? <div className="ml-2">{action}</div> : null}
        </div>
        {showDivider ? (
          <div
            className="ml-4 hidden h-8 w-px flex-shrink-0 bg-border/50 opacity-50 md:block lg:hidden xl:block"
            aria-hidden
          />
        ) : null}
      </>
    );
  }

  if (density === 'summary') {
    const hasDetails = Boolean(
      (detailRows && detailRows.length > 0) || detailsAction
    );

    const handleDetailsToggle = () => {
      const next = !detailsOpen;
      setDetailsOpen(next);
      if (next) onDetailsClick?.();
    };

    // Summary without details: layout depends on trendPosition (summary only)
    if (!hasDetails && primaryAction == null) {
      const trendValue = normalizedTrend?.value ?? null;
      const trendDirection =
        normalizedTrend?.direction === 'up' || normalizedTrend?.direction === 'down'
          ? normalizedTrend.direction
          : null;
      const trendContent =
        isTrendReactNode ? (
          <div>{trend}</div>
        ) : trendValue != null && trendValue !== '' ? (
          trendDirection === 'up' ? (
            <TrendUpDownText trend={trendValue} direction="up" />
          ) : trendDirection === 'down' ? (
            <TrendUpDownText trend={trendValue} direction="down" />
          ) : (
            <p className="text-xs text-muted-foreground">{trendValue}</p>
          )
        ) : (
          <div className="h-5 w-12 shrink-0" aria-hidden />
        );

      const valueIconRow = (
        <div className="flex items-center justify-between" data-slot="kpi-card-main-content">
          <p className="text-2xl font-semibold text-foreground" data-slot="kpi-card-value">{formattedValue}</p>
          <div
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-full [&>svg]:h-5 [&>svg]:w-5',
              iconBgColor ? 'text-black [&>svg]:text-black' : 'bg-brand-300 dark:bg-brand-500 text-black [&>svg]:text-black'
            )}
            style={iconBgColor ? { backgroundColor: iconBgColor } : undefined}
            aria-hidden
            data-slot="kpi-card-icon-wrap"
          >
            {icon}
          </div>
        </div>
      );

      const trendAlignLeft = trendPosition === 'top' || trendPosition === 'bottom' || trendPosition === 'left';
      const trendWrapped = trendAlignLeft ? (
        <div className="text-left">{trendContent}</div>
      ) : (
        trendContent
      );

      const labelTrendRow = (trendOnLeft: boolean) => (
        <div className="flex items-center justify-between">
          {trendOnLeft ? trendWrapped : <p className="text-xs tracking-wider text-foreground">{label}</p>}
          {trendOnLeft ? <p className="text-xs tracking-wider text-foreground">{label}</p> : trendWrapped}
        </div>
      );

      return (
        <div
          data-slot="kpi-card"
          className={cn(
            'rounded-2xl border border-border p-6 shadow-sm transition-all',
            'flex flex-col gap-4 bg-card',
            className
          )}
          {...domProps}
        >
          {trendPosition === 'top' ? (
            <>
              <div className="flex flex-col gap-1">
                {valueIconRow}
                <div data-slot="kpi-card-label-trend-row">
                  <p className="text-base tracking-wider text-foreground">{label}</p>
                  <div className="flex items-center justify-start text-left">{trendWrapped}</div>
                </div>
              </div>
            </>
          ) : trendPosition === 'bottom' ? (
            <>
              <div className="flex flex-col gap-1">
                {valueIconRow}
                <div data-slot="kpi-card-label-trend-row">
                  <p className="text-base tracking-wider text-foreground">{label}</p>
                  <div className="flex items-center justify-start text-left">{trendWrapped}</div>
                </div>
              </div>
            </>
          ) : trendPosition === 'left' ? (
            <>
              {valueIconRow}
              {labelTrendRow(true)}
            </>
          ) : (
            /* right (default) */
            <>
              {valueIconRow}
              {labelTrendRow(false)}
            </>
          )}
        </div>
      );
    }

    // Summary with details: fixed-height card with Details/Less and details panel
    return (
      <div
        data-slot="kpi-card"
        className={cn(
          'flex h-[200px] min-w-[230px] max-w-[230px] flex-col justify-between rounded-xl border p-3 shadow-sm transition-all duration-300 group/card backdrop-blur-sm bg-card',
          detailsOpen
            ? 'border-primary ring-1 ring-primary/20 shadow-md'
            : 'border-border hover:shadow-md',
          className
        )}
        {...domProps}
      >
        <div className="flex flex-1 flex-col">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {label}
            </span>
            {icon ? (
              <div
                className={cn(
                  'flex items-center justify-center rounded-md p-1 [&>svg]:h-3.5 [&>svg]:w-3.5',
                  iconBgColor ? 'text-black [&>svg]:text-black' : iconWrapSummaryClassName
                )}
                style={iconBgColor ? { backgroundColor: iconBgColor } : undefined}
              >
                {icon}
              </div>
            ) : null}
          </div>
          <div className="mb-2 flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight text-foreground">
              {formattedValue}
            </span>
            {isTrendReactNode ? (
              trend
            ) : normalizedTrend ? (
              <span
                className={cn(
                  'rounded px-1.5 py-0.5 text-[10px] font-medium',
                  trendBadgeClassMap[normalizedTrend.direction]
                )}
              >
                {normalizedTrend.value}
              </span>
            ) : null}
          </div>
          {subMetrics && subMetrics.length > 0 ? (
            <div
              className={cn(
                'mb-2 block space-y-0.5',
                detailsOpen && 'hidden'
              )}
            >
              {subMetrics.map((sm, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-[10px] text-muted-foreground"
                >
                  <div className={cn('h-1 w-1 shrink-0 rounded-full', dotClassName)} />
                  <span className="truncate">
                    {sm.value != null ? `${sm.label}: ${sm.value}` : sm.label}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
          {detailsOpen ? (
            <div className="mt-auto flex flex-1 flex-col justify-end animate-in fade-in slide-in-from-top-1">
              {detailRows && detailRows.length > 0 ? (
                <div className="mb-2 space-y-1.5">
                  {detailRows.map((row, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between text-[10px]"
                    >
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="font-medium text-foreground">{row.value}</span>
                    </div>
                  ))}
                </div>
              ) : null}
              {detailsAction ? (
                <button
                  type="button"
                  onClick={detailsAction.onClick}
                  className={cn(
                    'w-full rounded-lg border py-1.5 text-center text-[10px] font-semibold text-white shadow-sm transition-all',
                    primaryActionClassName
                  )}
                >
                  {detailsAction.label}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
        {(hasDetails || primaryAction != null) ? (
          <div className="mt-1 flex items-center justify-between border-t border-transparent pt-2 transition-colors group-hover/card:border-border/50">
            {hasDetails ? (
              <button
                type="button"
                onClick={handleDetailsToggle}
                className="-ml-1 flex items-center gap-1 rounded-lg p-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <ChevronDown
                  className={cn('h-3.5 w-3.5 transition-transform', detailsOpen && 'rotate-180')}
                  aria-hidden
                />
                {detailsOpen ? 'Less' : 'Details'}
              </button>
            ) : (
              <span />
            )}
            {primaryAction != null ? (
              <button
                type="button"
                onClick={primaryAction.onClick}
                title={primaryAction.title}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full border p-1.5 shadow-sm transition-all hover:scale-105',
                  primaryActionClassName
                )}
                aria-label={primaryAction.title ?? 'Action'}
              >
                {primaryAction.icon ?? <ChevronRight className="h-3.5 w-3.5" aria-hidden />}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  const isComfortable = density === 'comfortable';

  return (
    <div
      data-slot="kpi-card"
      className={cn(
        'rounded-2xl border border-border shadow-sm transition-all group',
        isComfortable &&
        'min-w-[200px] border-zinc-200 bg-white shadow-sm hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900',
        density === 'default' && 'bg-card text-card-foreground',
        densityClassMap[density],
        className
      )}
      {...domProps}
    >
      {iconPosition === 'top' && icon ? (
        <div
          className={cn(
            'mb-4 flex h-12 w-12 items-center justify-center rounded-xl p-3 [&>svg]:h-6 [&>svg]:w-6',
            iconBgColor ? 'text-black [&>svg]:text-black' : iconWrapClassName
          )}
          style={iconBgColor ? { backgroundColor: iconBgColor } : undefined}
        >
          {icon}
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <div>
          <p
            className={cn(
              'text-sm font-medium uppercase tracking-wider text-muted-foreground',
              density === 'default' && 'normal-case tracking-normal'
            )}
          >
            {label}
          </p>
          <p
            className={cn(
              'mt-1 font-semibold text-foreground',
              isComfortable
                ? 'origin-left text-2xl transition-transform group-hover:scale-105'
                : 'text-2xl'
            )}
          >
            {formattedValue}
          </p>
        </div>

        {iconPosition === 'start' && icon ? (
          <div
            className={cn(
              'flex items-center justify-center rounded-xl p-3 [&>svg]:h-6 [&>svg]:w-6',
              iconBgColor ? 'text-black [&>svg]:text-black' : iconWrapClassName
            )}
            style={iconBgColor ? { backgroundColor: iconBgColor } : undefined}
          >
            {icon}
          </div>
        ) : null}

        {action ? <div className="ml-3">{action}</div> : null}
      </div>

      {(subValue || normalizedTrend || isTrendReactNode) ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          {subValue ? <span className="font-medium">{subValue}</span> : null}
          {isTrendReactNode ? (
            trend
          ) : normalizedTrend ? (
            <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium">
              {normalizedTrend.value}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
