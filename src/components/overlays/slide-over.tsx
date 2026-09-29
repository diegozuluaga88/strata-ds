import { Dialog as HeadlessDialog, DialogPanel as HeadlessDialogPanel, DialogTitle as HeadlessDialogTitle, Transition as HeadlessTransition, TransitionChild as HeadlessTransitionChild } from '@headlessui/react'
import { X } from 'lucide-react'
import clsx from 'clsx'
import { Fragment } from 'react'
import type { ComponentPropsWithoutRef } from 'react'

export function SlideOver({
    className,
    children,
    open,
    onClose,
    ...props
}: {
    className?: string
    children?: React.ReactNode
    open: boolean
    onClose: (value: boolean) => void
} & Omit<ComponentPropsWithoutRef<typeof HeadlessDialog>, 'as' | 'open' | 'onClose'>) {
    return (
        <HeadlessTransition show={open} as={Fragment}>
            <HeadlessDialog className="relative z-50" onClose={onClose} {...props}>
                <HeadlessTransitionChild
                    as={Fragment}
                    enter="ease-in-out duration-500"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-500"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-zinc-950/25 dark:bg-zinc-950/50 backdrop-blur-sm transition-opacity" />
                </HeadlessTransitionChild>

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                            <HeadlessTransitionChild
                                as={Fragment}
                                enter="transform transition ease-in-out duration-500 sm:duration-700"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in-out duration-500 sm:duration-700"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <HeadlessDialogPanel
                                    className={clsx(
                                        className,
                                        "pointer-events-auto w-screen max-w-md transform transition duration-500 ease-in-out data-[closed]:translate-x-full sm:duration-700",
                                        "flex flex-col bg-white dark:bg-zinc-900 shadow-xl"
                                    )}
                                >
                                    {children}
                                </HeadlessDialogPanel>
                            </HeadlessTransitionChild>
                        </div>
                    </div>
                </div>
            </HeadlessDialog>
        </HeadlessTransition>
    )
}

export function SlideOverTitle({ className, ...props }: ComponentPropsWithoutRef<typeof HeadlessDialogTitle>) {
    return (
        <HeadlessDialogTitle
            {...props}
            className={clsx(className, 'text-base/6 font-semibold text-zinc-900 dark:text-white')}
        />
    )
}

export function SlideOverDescription({ className, ...props }: ComponentPropsWithoutRef<'p'>) {
    return (
        <p
            {...props}
            className={clsx(className, 'text-sm text-zinc-500 dark:text-zinc-400')}
        />
    )
}

export function SlideOverBody({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
    return <div className={clsx(className, 'flex-1 overflow-y-auto px-4 py-6 sm:px-6')} {...props} />
}

export function SlideOverHeader({ className, children, onClose, ...props }: ComponentPropsWithoutRef<'div'> & { onClose?: () => void }) {
    return (
        <div className={clsx(className, 'flex items-start justify-between px-4 py-6 sm:px-6 border-b border-zinc-200 dark:border-zinc-800')} {...props}>
            <div className="flex flex-col gap-1">
                {children}
            </div>
            <div className="ml-3 flex h-7 items-center">
                <button
                    type="button"
                    className="relative rounded-md bg-white dark:bg-zinc-900 text-zinc-400 hover:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={onClose}
                >
                    <span className="absolute -inset-2.5" />
                    <span className="sr-only">Close panel</span>
                    <X className="h-6 w-6" aria-hidden="true" />
                </button>
            </div>
        </div>
    )
}
