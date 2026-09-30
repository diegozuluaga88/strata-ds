import * as React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/utils';

/**
 * FunnelStepper — compact horizontal pipeline stepper with chevron separators.
 *
 * Captures the BFI / Officeworks header stepper pattern: a small, dense row
 * of stage labels (Intake → Quote → PO & Labor → CPR → Fee Verify) where the
 * active stage is highlighted, past stages render with a success checkmark,
 * and future stages are muted.
 *
 * Promoted from inbound-outbound/src/components/bfi/BFIDocumentReviewModal.tsx
 * (FunnelStepper, lines 2596-2649) where it ships duplicated across BFI +
 * Officeworks workflow modals.
 */

export interface FunnelStep<TKey extends string = string> {
  key: TKey;
  label: string;
}

export interface FunnelStepperProps<TKey extends string = string>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  steps: FunnelStep<TKey>[];
  activeKey: TKey;
  size?: 'sm' | 'md';
}

const SIZE = {
  sm: {
    pill: 'px-2 py-1 text-[9px]',
    bullet: 'h-3.5 w-3.5',
    bulletText: 'text-[8px]',
    check: 'h-2.5 w-2.5',
    separator: 'w-3',
  },
  md: {
    pill: 'px-2.5 py-1.5 text-[11px]',
    bullet: 'h-4 w-4',
    bulletText: 'text-[9px]',
    check: 'h-3 w-3',
    separator: 'w-4',
  },
} as const;

export function FunnelStepper<TKey extends string = string>({
  steps,
  activeKey,
  size = 'sm',
  className,
  ...rest
}: FunnelStepperProps<TKey>) {
  const activeIdx = steps.findIndex((s) => s.key === activeKey);
  const sz = SIZE[size];

  return (
    <div
      className={cn('flex items-center gap-1 shrink-0', className)}
      role="navigation"
      aria-label="Workflow stages"
      {...rest}
    >
      {steps.map((s, i) => {
        const active = i === activeIdx;
        const past = i < activeIdx;
        return (
          <React.Fragment key={s.key}>
            <div
              aria-current={active ? 'step' : undefined}
              className={cn(
                'flex items-center gap-1 rounded-md font-bold transition-all shrink-0',
                sz.pill,
                active
                  ? 'bg-primary text-primary-foreground'
                  : past
                    ? 'bg-muted/60 text-foreground/70'
                    : 'bg-muted/30 text-muted-foreground',
              )}
            >
              <span
                className={cn(
                  'rounded-full flex items-center justify-center shrink-0',
                  sz.bullet,
                  active
                    ? 'bg-primary-foreground/20'
                    : past
                      ? 'bg-status-success/20'
                      : 'bg-muted-foreground/20',
                )}
              >
                {past ? (
                  <CheckCircle2 className={cn('text-status-success', sz.check)} />
                ) : (
                  <span className={cn('font-bold', sz.bulletText)}>{i + 1}</span>
                )}
              </span>
              {s.label}
            </div>
            {i < steps.length - 1 && (
              <div className={cn('h-px bg-border shrink-0', sz.separator)} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
