import clsx from 'clsx'
import { Check } from 'lucide-react'
import type { ComponentPropsWithoutRef } from 'react'

export function PricingSection({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
    return (
        <div
            {...props}
            className={clsx(className, "bg-white dark:bg-zinc-900 py-24 sm:py-32")}
        />
    )
}

export function PricingCard({ className, featured, ...props }: ComponentPropsWithoutRef<'div'> & { featured?: boolean }) {
    return (
        <div
            {...props}
            className={clsx(
                className,
                'rounded-3xl p-8 ring-1 ring-zinc-200 dark:ring-zinc-800 xl:p-10',
                featured ? 'bg-zinc-900 dark:bg-zinc-800 ring-zinc-900 dark:ring-zinc-700' : 'bg-white dark:bg-zinc-900/50'
            )}
        />
    )
}

export function PricingTitle({ className, featured, ...props }: ComponentPropsWithoutRef<'h3'> & { featured?: boolean }) {
    return (
        <h3
            {...props}
            className={clsx(
                className,
                'text-lg font-semibold leading-8',
                featured ? 'text-white' : 'text-zinc-900 dark:text-white'
            )}
        />
    )
}

export function PricingPrice({ className, featured, ...props }: ComponentPropsWithoutRef<'p'> & { featured?: boolean }) {
    return (
        <p
            {...props}
            className={clsx(
                className,
                'mt-4 text-sm leading-6',
                featured ? 'text-zinc-300' : 'text-zinc-500 dark:text-zinc-400'
            )}
        />
    )
}

export function PricingCost({ children, featured }: { children: React.ReactNode, featured?: boolean }) {
    return (
        <p className="mt-6 flex items-baseline gap-x-1">
            <span className={clsx("text-4xl font-bold tracking-tight", featured ? 'text-white' : 'text-zinc-900 dark:text-white')}>{children}</span>
            <span className={clsx("text-sm font-semibold leading-6", featured ? 'text-zinc-300' : 'text-zinc-600 dark:text-zinc-400')}>/month</span>
        </p>
    )

}

export function PricingFeatures({ className, ...props }: ComponentPropsWithoutRef<'ul'>) {
    return (
        <ul
            {...props}
            role="list"
            className={clsx(className, "mt-8 space-y-3 text-sm leading-6 xl:mt-10")}
        />
    )
}

export function PricingFeature({ children, featured }: { children: React.ReactNode, featured?: boolean }) {
    return (
        <li className={clsx("flex gap-x-3", featured ? 'text-zinc-300' : 'text-zinc-600 dark:text-zinc-300')}>
            <Check className={clsx("h-6 w-5 flex-none", featured ? 'text-white' : 'text-blue-600')} aria-hidden="true" />
            {children}
        </li>
    )
}
