import clsx from 'clsx'
import type { ComponentPropsWithoutRef } from 'react'

export function FeatureSection({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
    return (
        <div
            {...props}
            className={clsx(className, "py-24 sm:py-32 bg-white dark:bg-zinc-900")}
        />
    )
}

export function FeatureGrid({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
    return (
        <div
            {...props}
            className={clsx(
                className,
                'mx-auto max-w-7xl px-6 lg:px-8 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-3'
            )}
        />
    )
}

export function Feature({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
    return <div className={clsx(className, "flex flex-col")} {...props} />
}

export function FeatureIcon({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
    return (
        <div className={clsx(className, "mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600")}>
            {props.children}
        </div>
    )
}

export function FeatureTitle({ className, ...props }: ComponentPropsWithoutRef<'h3'>) {
    return (
        <div
            {...props}
            className={clsx(className, 'text-base font-semibold leading-7 text-zinc-900 dark:text-white')}
        />
    )
}

export function FeatureDescription({ className, ...props }: ComponentPropsWithoutRef<'dd'>) {
    return (
        <div
            {...props}
            className={clsx(className, 'mt-1 flex flex-auto flex-col text-base leading-7 text-zinc-600 dark:text-zinc-400')}
        />
    )
}
