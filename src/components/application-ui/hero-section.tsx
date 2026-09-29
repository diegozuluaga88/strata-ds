import clsx from 'clsx'
import type { ComponentPropsWithoutRef } from 'react'

export function Hero({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
    return (
        <div
            {...props}
            className={clsx(className, 'relative overflow-hidden bg-white dark:bg-zinc-900 py-16 sm:py-24 lg:py-32')}
        />
    )
}

export function HeroTitle({ className, ...props }: ComponentPropsWithoutRef<'h1'>) {
    return (
        <h1
            {...props}
            className={clsx(
                className,
                "text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl lg:text-6xl"
            )}
        />
    )
}

export function HeroSubtitle({ className, ...props }: ComponentPropsWithoutRef<'p'>) {
    return (
        <p
            {...props}
            className={clsx(
                className,
                "mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-300"
            )}
        />
    )
}

export function HeroButtons({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
    return (
        <div
            {...props}
            className={clsx(className, "mt-10 flex items-center gap-x-6")}
        />
    )
}

export function HeroImage({ className, src, alt, ...props }: ComponentPropsWithoutRef<'img'>) {
    return (
        <div className="mt-16 sm:mt-24 lg:mt-0 lg:flex-shrink-0 lg:flex-grow">
            <img
                {...props}
                src={src}
                alt={alt}
                className={clsx(className, "mx-auto w-[22.875rem] max-w-full drop-shadow-xl")}
            />
        </div>
    )
}
