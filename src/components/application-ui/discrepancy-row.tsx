import * as React from 'react';
import {
  ChevronDown,
  ChevronRight,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/utils';

/**
 * DiscrepancyRow + DiscrepancyComparisonBlock — OCR / document-comparison
 * primitives promoted from smart-comparator's DiscrepancyList.
 *
 * DiscrepancyRow renders a collapsible row carrying a severity badge, the
 * field label, and a compact "before → after" preview in the header. When
 * expanded, it shows DiscrepancyComparisonBlock (the 3-column layout) and
 * a row of decision pills (Accept / Reject / Flag).
 *
 * DiscrepancyComparisonBlock is also exported standalone so consumers can
 * render the 3-column comparison outside the row context (e.g. inside a
 * SplitPaneReviewModal).
 *
 * Source: strata-projects/smart-comparator/app/src/components/comparison/
 *   DiscrepancyList.tsx (lines 79-156 for the row, 132-200 for the block).
 */

// ── Types ────────────────────────────────────────────────────────────────

export type DiscrepancySeverity = 'low' | 'medium' | 'high';
export type DiscrepancyDecision = 'accept' | 'reject' | 'flag';

// ── DiscrepancyComparisonBlock ───────────────────────────────────────────

export interface DiscrepancyComparisonBlockProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Left column header (e.g. "Purchase Order"). */
  beforeLabel?: React.ReactNode;
  /** Left column value. */
  beforeValue: React.ReactNode;

  /** Right column header (e.g. "Acknowledgment"). */
  afterLabel?: React.ReactNode;
  /** Right column value. */
  afterValue: React.ReactNode;

  /** Field-type tag rendered in both column headers. */
  fieldType?: React.ReactNode;

  /** AI analysis content rendered in the third column. */
  aiAnalysis?: React.ReactNode;
  /** Confidence percentage (0-100) shown in the AI column header. */
  aiConfidence?: number;
  /** Supporting evidence row (e.g. a link to a sourced document). */
  supportingEvidence?: React.ReactNode;
}

export function DiscrepancyComparisonBlock({
  beforeLabel,
  beforeValue,
  afterLabel,
  afterValue,
  fieldType,
  aiAnalysis,
  aiConfidence,
  supportingEvidence,
  className,
  ...rest
}: DiscrepancyComparisonBlockProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 lg:grid-cols-[1fr_1fr_1.6fr] gap-2',
        className,
      )}
      {...rest}
    >
      {/* Col 1 — Before */}
      <div className="rounded-lg border border-border bg-muted/20 p-3 flex flex-col">
        <div className="flex items-center justify-between gap-2 mb-2">
          {beforeLabel && (
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              {beforeLabel}
            </span>
          )}
          {fieldType && (
            <span className="text-[11px] font-semibold text-muted-foreground">
              {fieldType}
            </span>
          )}
        </div>
        <div className="text-sm font-mono font-semibold text-muted-foreground line-through decoration-muted-foreground/40 break-all">
          {beforeValue}
        </div>
      </div>

      {/* Col 2 — After */}
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex flex-col relative">
        <ArrowRight className="hidden lg:block absolute -left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive bg-card rounded-full p-0.5 z-10" />
        <div className="flex items-center justify-between gap-2 mb-2">
          {afterLabel && (
            <span className="text-[10px] font-bold text-destructive uppercase tracking-wider">
              {afterLabel}
            </span>
          )}
          {fieldType && (
            <span className="text-[11px] font-semibold text-destructive/80">
              {fieldType}
            </span>
          )}
        </div>
        <div className="text-sm font-mono font-bold text-destructive break-all">
          {afterValue}
        </div>
      </div>

      {/* Col 3 — AI Analysis */}
      <div className="rounded-lg bg-muted/40 p-3 flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-foreground" aria-hidden="true" />
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            AI Analysis
            {typeof aiConfidence === 'number' && ` · ${aiConfidence}% confidence`}
          </span>
        </div>
        {supportingEvidence && (
          <div className="text-[11px] text-muted-foreground">
            {supportingEvidence}
          </div>
        )}
        {aiAnalysis && (
          <div className="text-xs text-foreground leading-relaxed">{aiAnalysis}</div>
        )}
      </div>
    </div>
  );
}

// ── DiscrepancyRow ───────────────────────────────────────────────────────

const SEVERITY_CLASS: Record<DiscrepancySeverity, string> = {
  low: 'bg-status-success/10 text-status-success border-status-success/30',
  medium: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  high: 'bg-destructive/15 text-destructive border-destructive/30',
};

const SEVERITY_BORDER: Record<DiscrepancySeverity, string> = {
  low: 'border-status-success/30',
  medium: 'border-status-warning/30',
  high: 'border-destructive/30',
};

const DECISION_CLASS: Record<DiscrepancyDecision, string> = {
  accept: 'bg-status-success/10 text-status-success',
  reject: 'bg-destructive/15 text-destructive',
  flag: 'bg-status-info/15 text-status-info',
};

const DECISION_LABEL: Record<DiscrepancyDecision, string> = {
  accept: 'Accepted',
  reject: 'Rejected',
  flag: 'Flagged',
};

const DECISION_ACTION_LABEL: Record<DiscrepancyDecision, string> = {
  accept: 'Accept',
  reject: 'Reject',
  flag: 'Flag',
};

export interface DiscrepancyRowProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'onChange' | 'title'> {
  /** Title displayed in the row header. */
  fieldLabel: React.ReactNode;
  severity: DiscrepancySeverity;

  /** Compact before/after preview shown in the row header. */
  beforeValue: React.ReactNode;
  afterValue: React.ReactNode;

  /** Optional decision state. When non-null, the row renders as resolved. */
  decision?: DiscrepancyDecision | null;
  /** Decision action handler. When omitted, the decision pill row is hidden. */
  onDecide?: (decision: DiscrepancyDecision) => void;
  /** Restrict which decisions are offered (default: all three). */
  availableDecisions?: DiscrepancyDecision[];

  /** Comparison block content. Defaults to a DiscrepancyComparisonBlock. */
  comparison?: React.ReactNode;
  /** If `comparison` is omitted, these props go to the default block. */
  comparisonBlockProps?: Omit<
    DiscrepancyComparisonBlockProps,
    'beforeValue' | 'afterValue'
  >;

  /** Controlled open state. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DiscrepancyRow({
  fieldLabel,
  severity,
  beforeValue,
  afterValue,
  decision = null,
  onDecide,
  availableDecisions = ['accept', 'reject', 'flag'],
  comparison,
  comparisonBlockProps,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  className,
  ...rest
}: DiscrepancyRowProps) {
  const isControlled = openProp !== undefined;
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const open = isControlled ? openProp : internalOpen;
  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const resolved = decision !== null;
  const borderClass = resolved
    ? 'border-status-success/40'
    : SEVERITY_BORDER[severity];

  return (
    <div
      className={cn(
        'rounded-xl border bg-card overflow-hidden',
        borderClass,
        resolved && 'opacity-80',
        className,
      )}
      {...rest}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors text-left"
      >
        <span className="shrink-0">
          {open ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </span>
        {resolved ? (
          <span
            className={cn(
              'inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider',
              DECISION_CLASS[decision!],
            )}
          >
            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
            {DECISION_LABEL[decision!]}
          </span>
        ) : (
          <span
            className={cn(
              'inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border',
              SEVERITY_CLASS[severity],
            )}
          >
            {severity}
          </span>
        )}
        <span
          className={cn(
            'text-sm font-semibold flex-1 min-w-0 truncate',
            resolved
              ? 'text-muted-foreground line-through decoration-muted-foreground/40'
              : 'text-foreground',
          )}
        >
          {fieldLabel}
        </span>
        <span className="hidden sm:inline-flex items-center gap-1 text-xs text-muted-foreground">
          <span className="font-mono">{beforeValue}</span>
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
          <span className="font-mono font-bold text-foreground">{afterValue}</span>
        </span>
      </button>

      {open && (
        <div className="px-3 pb-4 pt-3 space-y-3 border-t border-border">
          {comparison ?? (
            <DiscrepancyComparisonBlock
              beforeValue={beforeValue}
              afterValue={afterValue}
              {...comparisonBlockProps}
            />
          )}
          {onDecide && !resolved && (
            <div className="flex items-center justify-end gap-2 pt-1">
              {availableDecisions.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onDecide(d)}
                  className={cn(
                    'inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md transition-colors',
                    DECISION_CLASS[d],
                    'hover:opacity-80',
                  )}
                >
                  {DECISION_ACTION_LABEL[d]}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
