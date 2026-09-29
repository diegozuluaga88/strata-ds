import * as React from "react"
import { cn } from '@/utils';
import { CheckIcon } from "lucide-react"

export interface TrackingStep {
    id: string
    name: string
    description?: string
    status: 'complete' | 'current' | 'upcoming'
    date?: string
    /** Optional custom content to render below the step name/description */
    content?: React.ReactNode
}

/** Color variant for connector and complete step. */
export type OrderTrackingColor = 'default' | 'brand' | 'success';

const connectorColorMap: Record<OrderTrackingColor, string> = {
    default: 'bg-zinc-200 dark:bg-zinc-800',
    brand: 'bg-brand-500/30 dark:bg-brand-500/30',
    success: 'bg-success/30 dark:bg-success/30',
};

const completeCircleMap: Record<OrderTrackingColor, string> = {
    default: 'bg-zinc-900 dark:bg-zinc-100',
    brand: 'bg-brand-500 dark:bg-brand-500',
    success: 'bg-success dark:bg-success',
};

/** Ring (border) around step circles; color matches variant when showRing is true. */
const ringMap: Record<OrderTrackingColor, string> = {
    default: 'ring-8 ring-white dark:ring-zinc-900',
    brand: 'ring-8 ring-brand-500/20 dark:ring-brand-500/30',
    success: 'ring-8 ring-success/20 dark:ring-success/30',
};

const completeIconMap: Record<OrderTrackingColor, string> = {
    default: 'text-white dark:text-zinc-900',
    brand: 'text-zinc-900 dark:text-zinc-900',
    success: 'text-white dark:text-white',
};

const currentBorderMap: Record<OrderTrackingColor, string> = {
    default: 'border-zinc-900 dark:border-zinc-100',
    brand: 'border-brand-500 dark:border-brand-500',
    success: 'border-success dark:border-success',
};

const currentDotMap: Record<OrderTrackingColor, string> = {
    default: 'bg-zinc-900 dark:bg-zinc-100',
    brand: 'bg-brand-500 dark:bg-brand-500',
    success: 'bg-success dark:bg-success',
};

const upcomingRing = 'ring-8 ring-white dark:ring-zinc-900';

/** How name and description are shown: inline (one line) or stacked (two lines). */
export type OrderTrackingLayout = 'inline' | 'stacked';

export interface OrderTrackingProps extends React.HTMLAttributes<HTMLDivElement> {
    steps: TrackingStep[]
    /** Color for connector line and complete/current steps. Default 'default' (zinc). */
    color?: OrderTrackingColor
    /** When false, step circles have no ring/border. Default true (original look). */
    showRing?: boolean
    /** Text layout: inline (name and description on one line) or stacked (two lines). Default 'inline'. */
    layout?: OrderTrackingLayout
}

export function OrderTracking({ steps, color = 'default', showRing = true, layout = 'inline', className, ...props }: OrderTrackingProps) {
    const connector = connectorColorMap[color];
    const completeCircle = completeCircleMap[color];
    const completeIcon = completeIconMap[color];
    const currentBorder = currentBorderMap[color];
    const currentDot = currentDotMap[color];
    const ring = showRing ? ringMap[color] : '';

    return (
        <div className={cn("flow-root", className)} {...props}>
            <ul role="list" className="-mb-8">
                {steps.map((step, stepIdx) => (
                    <li key={step.id}>
                        <div className="relative pb-8">
                            {stepIdx !== steps.length - 1 ? (
                                <span
                                    className={cn("absolute left-4 top-4 -ml-px h-full w-0.5", connector)}
                                    aria-hidden="true"
                                />
                            ) : null}
                            <div className="relative flex space-x-3">
                                <div>
                                    {step.status === 'complete' ? (
                                        <span className={cn("flex h-8 w-8 items-center justify-center rounded-full", completeCircle, ring)} aria-hidden>
                                            <CheckIcon className={cn("h-5 w-5", completeIcon)} aria-hidden="true" />
                                        </span>
                                    ) : step.status === 'current' ? (
                                        <span className={cn("flex h-8 w-8 items-center justify-center rounded-full border-2 bg-card", currentBorder, ring)} aria-current="step">
                                            <span className={cn("h-2.5 w-2.5 rounded-full", currentDot)} />
                                        </span>
                                    ) : (
                                        <span className={cn("flex h-8 w-8 items-center justify-center rounded-full border-2 border-zinc-200 bg-card dark:border-zinc-800", showRing && upcomingRing)} aria-hidden>
                                            <span className="h-2.5 w-2.5 rounded-full bg-transparent" />
                                        </span>
                                    )}
                                </div>
                                <div className="flex min-w-0 flex-1 flex-col pt-1.5">
                                    <div className="flex justify-between space-x-4">
                                        <div className="min-w-0">
                                            {layout === 'inline' ? (
                                                <p className="text-sm font-medium text-foreground">
                                                    {step.name} {step.description != null && step.description !== '' && (
                                                        <span className="font-normal text-muted-foreground">— {step.description}</span>
                                                    )}
                                                </p>
                                            ) : (
                                                <div className="flex flex-col gap-0.5">
                                                    <p className="text-sm font-medium text-foreground">{step.name}</p>
                                                    {step.description != null && step.description !== '' && (
                                                        <p className="text-sm font-normal text-muted-foreground">{step.description}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {step.date && (
                                            <div className="whitespace-nowrap text-right text-sm text-muted-foreground shrink-0">
                                                <time dateTime={step.date}>{step.date}</time>
                                            </div>
                                        )}
                                    </div>
                                    {step.content && (
                                        <div className="mt-2">
                                            {step.content}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export interface ProgressTrackerProps extends React.HTMLAttributes<HTMLDivElement> {
    currentStep: number
    totalSteps: number
}

export function ProgressTracker({ currentStep, totalSteps, className, ...props }: ProgressTrackerProps) {
    const progress = (currentStep / (totalSteps - 1)) * 100

    return (
        <div className={cn("w-full", className)} {...props}>
            <div className="relative h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                    className="absolute h-2 rounded-full bg-zinc-900 transition-all duration-500 ease-in-out dark:bg-zinc-100"
                    style={{ width: `${progress}%` }}
                />
                <div className="mt-4 flex justify-between">
                    {Array.from({ length: totalSteps }).map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                "h-2.5 w-2.5 rounded-full ring-4 ring-white dark:ring-zinc-900",
                                i <= currentStep ? "bg-zinc-900 dark:bg-zinc-100" : "bg-zinc-200 dark:bg-zinc-800"
                            )}
                            style={{ position: 'absolute', left: `${(i / (totalSteps - 1)) * 100}%`, transform: 'translateX(-50%)', top: '-1px' }}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}
