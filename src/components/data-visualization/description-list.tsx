import clsx from 'clsx'
import type { ComponentPropsWithoutRef } from 'react'

export function DescriptionList({ className, ...props }: ComponentPropsWithoutRef<'dl'>) {
    return (
        <dl
            {...props}
            className={clsx(className, "divide-y divide-zinc-100 dark:divide-zinc-800")}
        />
    )
}

export function DescriptionTerm({ className, ...props }: ComponentPropsWithoutRef<'dt'>) {
    return (
        <dt
            {...props}
            className={clsx(className, 'text-sm font-medium leading-6 text-zinc-900 dark:text-white')}
        />
    )
}

export function DescriptionDetails({ className, ...props }: ComponentPropsWithoutRef<'dd'>) {
    return (
        <dd
            {...props}
            className={clsx(className, 'mt-1 text-sm leading-6 text-zinc-700 dark:text-zinc-400 sm:col-span-2 sm:mt-0')}
        />
    )
}
