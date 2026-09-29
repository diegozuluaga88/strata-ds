import { Disclosure as HeadlessDisclosure, DisclosureButton as HeadlessDisclosureButton, DisclosurePanel as HeadlessDisclosurePanel } from '@headlessui/react'
import clsx from 'clsx'
import { ChevronRight } from 'lucide-react'
import type { ComponentPropsWithoutRef } from 'react'

export function Disclosure({
    className,
    ...props
}: { className?: string } & Omit<ComponentPropsWithoutRef<typeof HeadlessDisclosure>, 'as'>) {
    return <HeadlessDisclosure as="div" className={clsx(className, 'w-full')} {...props} />
}

export function DisclosureButton({
    className,
    children,
    ...props
}: { className?: string; children: React.ReactNode } & Omit<ComponentPropsWithoutRef<typeof HeadlessDisclosureButton>, 'as' | 'children'>) {
    return (
        <HeadlessDisclosureButton
            data-slot="button"
            className={clsx(
                className,
                'group flex w-full items-center justify-between py-2 text-left text-sm/6 font-medium text-zinc-900 dark:text-white',
                'focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-blue-500',
                'hover:text-zinc-700 dark:hover:text-zinc-300'
            )}
            {...props}
        >
            <span className="flex items-center gap-3">
                <ChevronRight className="size-4 text-zinc-500 group-data-[open]:rotate-90 group-data-[hover]:text-zinc-700 dark:text-zinc-400 dark:group-data-[hover]:text-zinc-300 transition-transform duration-200" />
                {children}
            </span>
        </HeadlessDisclosureButton>
    )
}

export function DisclosurePanel({
    className,
    ...props
}: { className?: string } & Omit<ComponentPropsWithoutRef<typeof HeadlessDisclosurePanel>, 'as'>) {
    return (
        <HeadlessDisclosurePanel
            data-slot="panel"
            className={clsx(className, 'ml-7 text-sm text-zinc-600 dark:text-zinc-400 pb-3')}
            {...props}
        />
    )
}
