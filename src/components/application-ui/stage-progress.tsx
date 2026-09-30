import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/utils';

export type StageProgressColor = 'brand' | 'success' | 'warning' | 'error';

/** Vertical stack order: `desc` = stage 0 at top (top → bottom); `asc` = stage 0 at bottom (bottom → top). */
export type StageProgressVerticalDirection = 'asc' | 'desc';

/** One stage with optional per-step color and completed-state icon. */
export interface StageProgressStage {
  label: string | React.ReactNode;
  icon?: React.ReactNode;
  color?: StageProgressColor;
}

export interface StageProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Stage labels only, or objects with optional `color` and `icon` per step. */
  stages: string[] | StageProgressStage[];
  /**
   * Zero-based index of the current (active) stage. Steps before this show as completed.
   * When **currentIndex** is greater than the last index (e.g. `stages.length` after the final step), every step
   * including the last shows the completed (check/icon) state.
   */
  currentIndex: number;
  /** Default color when a stage does not set its own `color` (string stages always use this). */
  color?: StageProgressColor;
  /** When true, stages stack vertically with labels to the right of each point. */
  vertical?: boolean;
  /**
   * Vertical order only. `desc` (default): first stage at the **top**, indices increase downward.
   * `asc`: first stage at the **bottom**, indices increase upward.
   */
  verticalDirection?: StageProgressVerticalDirection;
}

/** Full class names so Tailwind can generate them (dynamic bg-${x} is not purged). */
const completedBgMap = {
  brand: 'bg-brand-500',
  success: 'bg-status-success',
  warning: 'bg-status-warning',
  error: 'bg-destructive',
} as const;

const borderMap = {
  brand: 'border-brand-500',
  success: 'border-status-success',
  warning: 'border-status-warning',
  error: 'border-destructive',
} as const;

const lineBgMap = {
  brand: 'bg-brand-500',
  success: 'bg-status-success',
  warning: 'bg-status-warning',
  error: 'bg-destructive',
} as const;

type NormalizedStage = { label: string | React.ReactNode; icon?: React.ReactNode; color?: StageProgressColor };

function normalizeStages(stages: string[] | StageProgressStage[]): NormalizedStage[] {
  return stages.map((stage) => (typeof stage === 'string' ? { label: stage } : stage));
}

function resolveStageColor(stage: NormalizedStage, fallback: StageProgressColor): StageProgressColor {
  return stage.color ?? fallback;
}

function connectorAfterComplete(
  segmentIndex: number,
  isPastLast: boolean,
  lastIndex: number,
  clampedIndex: number,
): boolean {
  return isPastLast ? segmentIndex < lastIndex : segmentIndex < clampedIndex;
}

function connectorAfterColor(
  segmentIndex: number,
  normalized: NormalizedStage[],
  fallbackColor: StageProgressColor,
): StageProgressColor {
  return resolveStageColor(normalized[segmentIndex]!, fallbackColor);
}

/**
 * Horizontal or vertical stage progress: completed (check/icon), current (ring), and upcoming states.
 * Vertical mode uses **verticalDirection**: `desc` (default) top → bottom, `asc` bottom → top. Labels sit to the **right** of each point.
 * Pass `currentIndex > lastIndex` to show all steps completed. Uses theme tokens for light/dark consistency.
 */
export function StageProgress({
  stages,
  currentIndex,
  className,
  color = 'brand',
  vertical = false,
  verticalDirection = 'desc',
  ...props
}: StageProgressProps) {
  const normalized = normalizeStages(stages);
  const lastIndex = normalized.length - 1;
  const isPastLast = lastIndex >= 0 && currentIndex > lastIndex;
  const clampedIndex =
    lastIndex < 0 ? -1 : isPastLast ? lastIndex : Math.max(-1, Math.min(currentIndex, lastIndex));

  const showsCompleted = (index: number) =>
    lastIndex < 0 ? false : isPastLast ? index <= lastIndex : index < clampedIndex;

  const renderCircle = (index: number, stage: NormalizedStage) => {
    const stageColor = resolveStageColor(stage, color);
    const isCompleted = showsCompleted(index);

    if (isCompleted) {
      return (
        <div
          className={cn('flex h-8 w-8 items-center justify-center rounded-full', completedBgMap[stageColor])}
          aria-hidden
        >
          {stage.icon != null ? (
            <span className="flex size-4 items-center justify-center text-white [&_svg]:size-4">{stage.icon}</span>
          ) : (
            <Check className="size-4 text-white" aria-hidden />
          )}
        </div>
      );
    }
    if (index === clampedIndex) {
      return (
        <div
          className={cn(
            'relative flex h-8 w-8 items-center justify-center rounded-full border-2 bg-card',
            borderMap[stageColor],
          )}
          aria-current="step"
        />
      );
    }
    return (
      <div
        className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-border bg-card"
        aria-hidden
      />
    );
  };

  if (vertical) {
    const isAsc = verticalDirection === 'asc';

    return (
      <div
        className={cn(
          'inline-flex w-full max-w-md min-w-0',
          isAsc ? 'flex-col-reverse' : 'flex-col',
          className,
        )}
        role="progressbar"
        aria-orientation="vertical"
        aria-valuenow={isPastLast ? normalized.length : clampedIndex + 1}
        aria-valuemin={1}
        aria-valuemax={normalized.length}
        {...props}
      >
        {normalized.map((stage, index) => {
          const key = `stage-${index}`;
          const lineAfter = (segmentIndex: number) =>
            cn(
              'h-8 w-0.5 shrink-0 rounded-full',
              connectorAfterComplete(segmentIndex, isPastLast, lastIndex, clampedIndex)
                ? lineBgMap[connectorAfterColor(segmentIndex, normalized, color)]
                : 'bg-muted',
            );

          return (
            <div key={key} className="flex w-full flex-row items-center gap-3">
              <div className="z-[50] flex w-8 shrink-0 flex-col items-center">
                {isAsc ? (
                  <>
                    {index < lastIndex ? (
                      <div className={lineAfter(index)} aria-hidden />
                    ) : (
                      <div className="h-4 w-0.5 shrink-0" aria-hidden />
                    )}
                    <div className="flex h-8 shrink-0 items-center justify-center">{renderCircle(index, stage)}</div>
                    {index > 0 ? (
                      <div className={lineAfter(index - 1)} aria-hidden />
                    ) : (
                      <div className="h-4 w-0.5 shrink-0" aria-hidden />
                    )}
                  </>
                ) : (
                  <>
                    {index > 0 ? (
                      <div className={lineAfter(index - 1)} aria-hidden />
                    ) : (
                      <div className="h-4 w-0.5 shrink-0" aria-hidden />
                    )}
                    <div className="flex h-8 shrink-0 items-center justify-center">{renderCircle(index, stage)}</div>
                    {index < lastIndex ? (
                      <div className={lineAfter(index)} aria-hidden />
                    ) : (
                      <div className="h-4 w-0.5 shrink-0" aria-hidden />
                    )}
                  </>
                )}
              </div>
              <div
                className={cn(
                  'min-w-0 flex-1 text-left text-xs',
                  typeof stage.label === 'string' && 'whitespace-nowrap',
                  index <= clampedIndex ? 'font-medium text-foreground' : 'text-muted-foreground',
                )}
              >
                {stage.label}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={cn('w-full', className)}
      role="progressbar"
      aria-valuenow={isPastLast ? normalized.length : clampedIndex + 1}
      aria-valuemin={1}
      aria-valuemax={normalized.length}
      {...props}
    >
      <div className="flex w-full items-start">
        {normalized.map((stage, index) => {
          const segmentComplete = isPastLast ? index < lastIndex : index < clampedIndex;
          const key = `stage-${index}`;

          return (
            <div key={key} className="flex flex-1 items-start last:flex-none">
              <div className="z-[50] flex min-w-0 flex-col items-center">
                <div className="flex h-8 items-center justify-center">{renderCircle(index, stage)}</div>
                <div
                  className={cn(
                    'mt-1.5 max-w-full text-center text-xs',
                    typeof stage.label === 'string' && 'whitespace-nowrap',
                    index <= clampedIndex ? 'font-medium text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {stage.label}
                </div>
              </div>
              {index < normalized.length - 1 && (
                <div className="-mx-4 flex h-8 min-w-2 flex-1 items-center" aria-hidden>
                  <div
                    className={cn(
                      'h-0.5 w-full rounded-full',
                      segmentComplete ? lineBgMap[resolveStageColor(normalized[index]!, color)] : 'bg-muted',
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
