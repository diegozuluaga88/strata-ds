import { Listbox as HeadlessListbox, ListboxButton as HeadlessListboxButton, ListboxOption as HeadlessListboxOption, ListboxOptions as HeadlessListboxOptions, ListboxSelectedOption as HeadlessListboxSelectedOption } from '@headlessui/react'
import clsx from 'clsx'
import { Check, ChevronDown } from 'lucide-react'
import { Fragment } from 'react'
import type { ComponentPropsWithoutRef } from 'react'

export function Listbox({
    className,
    placeholder,
    autoFocus,
    'aria-label': ariaLabel,
    children: options,
    ...props
}: {
    className?: string
    placeholder?: React.ReactNode
    autoFocus?: boolean
    'aria-label'?: string
    children?: React.ReactNode
} & Omit<ComponentPropsWithoutRef<typeof HeadlessListbox>, 'as' | 'multiple'>) {
    return (
        <HeadlessListbox {...props} multiple={false}>
            <HeadlessListboxButton
                autoFocus={autoFocus}
                data-slot="control"
                aria-label={ariaLabel}
                className={clsx(
                    className,
                    'group relative block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-1.5 pr-8 pl-3 text-left text-sm/6 text-zinc-950 dark:text-white',
                    'focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-blue-500/25',
                    'data-[disabled]:opacity-50',
                    'hover:border-zinc-300 dark:hover:border-zinc-700'
                )}
            >
                <HeadlessListboxSelectedOption
                    as={Fragment}
                    options={options}
                    placeholder={
                        placeholder && (
                            <span className="block truncate text-zinc-500 dark:text-zinc-400">{placeholder}</span>
                        )
                    }
                >
                    {({
                        selectedOption,
                    }: {
                        selectedOption?: React.ReactElement<{ children?: React.ReactNode }>
                    }) => {
                        if (selectedOption) {
                            return <span className="block truncate">{selectedOption.props.children}</span>
                        }
                        if (placeholder) {
                            return (
                                <span className="block truncate text-zinc-500 dark:text-zinc-400">{placeholder}</span>
                            )
                        }
                        return <Fragment />
                    }}
                </HeadlessListboxSelectedOption>
                <span className="pointer-events-none absolute top-2.5 right-2.5 size-4">
                    <ChevronDown className="size-4 text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300" />
                </span>
            </HeadlessListboxButton>
            <HeadlessListboxOptions
                transition
                anchor="bottom start"
                className={clsx(
                    'w-[var(--button-width)] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1 [--anchor-gap:var(--spacing-1)] focus:outline-none',
                    'transition duration-100 ease-in data-[leave]:data-[closed]:opacity-0',
                    'z-50 shadow-lg'
                )}
            >
                {options}
            </HeadlessListboxOptions>
        </HeadlessListbox>
    )
}

export function ListboxOption({
    children,
    className,
    ...props
}: {
    children?: React.ReactNode
    className?: string
} & Omit<ComponentPropsWithoutRef<typeof HeadlessListboxOption>, 'as' | 'children'>) {
    return (
        <HeadlessListboxOption
            as={Fragment}
            {...props}
        >
            {({ selected, focus, disabled }) => (
                <div
                    className={clsx(
                        className,
                        'group flex cursor-default items-center gap-2 rounded-lg py-1.5 pr-3 pl-3 select-none',
                        focus && 'bg-zinc-100 dark:bg-zinc-800',
                        disabled && 'opacity-50 cursor-not-allowed',
                        'text-zinc-900 dark:text-white'
                    )}
                >
                    <Check className={clsx("invisible size-4 text-zinc-900 dark:text-white", selected && "visible")} />
                    <div className="grid gap-0.5">
                        {children}
                    </div>
                </div>
            )}
        </HeadlessListboxOption>
    )
}

export function ListboxLabel({ className, ...props }: ComponentPropsWithoutRef<'span'>) {
    return <span className={clsx(className, 'block truncate font-medium')} {...props} />
}

export function ListboxDescription({ className, ...props }: ComponentPropsWithoutRef<'span'>) {
    return (
        <span
            className={clsx(
                className,
                'block truncate text-xs/5 text-zinc-500 group-data-[focus]:text-zinc-600 dark:text-zinc-400 dark:group-data-[focus]:text-zinc-300'
            )}
            {...props}
        />
    )
}
