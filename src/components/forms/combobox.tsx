import { Combobox as HeadlessCombobox, ComboboxInput as HeadlessComboboxInput, ComboboxOption as HeadlessComboboxOption, ComboboxOptions as HeadlessComboboxOptions, ComboboxButton as HeadlessComboboxButton } from '@headlessui/react'
import clsx from 'clsx'
import { Check, ChevronDown } from 'lucide-react'
import { Fragment } from 'react'
import type { ComponentPropsWithoutRef } from 'react'

export function Combobox<T>({
    className,
    placeholder,
    autoFocus,
    'aria-label': ariaLabel,
    children: options,
    value,
    onChange,
    onClose,
    multiple = false,
    displayValue,
    ...props
}: {
    className?: string
    placeholder?: string
    autoFocus?: boolean
    'aria-label'?: string
    children?: React.ReactNode
    value?: T | T[]
    onChange?: (value: T | T[] | null) => void
    onClose?: () => void
    multiple?: boolean
    displayValue?: (item: T) => string
} & Omit<ComponentPropsWithoutRef<typeof HeadlessCombobox>, 'as' | 'multiple' | 'value' | 'onChange'>) {
    type HeadlessComboboxProps = ComponentPropsWithoutRef<typeof HeadlessCombobox>
    type HeadlessComboboxInputProps = ComponentPropsWithoutRef<typeof HeadlessComboboxInput>

    return (
        <HeadlessCombobox
            {...props}
            value={value as HeadlessComboboxProps['value']}
            onChange={onChange as HeadlessComboboxProps['onChange']}
            onClose={onClose}
            multiple={multiple}
        >
            <div className="relative">
                <div className={clsx(
                    className,
                    "group relative block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-left text-sm/6 text-zinc-950 dark:text-white",
                    "focus-within:outline-none focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-blue-500/25",
                    "hover:border-zinc-300 dark:hover:border-zinc-700"
                )}>
                    <HeadlessComboboxInput
                        className="w-full border-none bg-transparent py-1.5 pl-3 pr-8 text-sm/6 text-zinc-950 dark:text-white placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:ring-0"
                        displayValue={displayValue as HeadlessComboboxInputProps['displayValue']}
                        placeholder={placeholder}
                        autoFocus={autoFocus}
                        aria-label={ariaLabel}
                    />
                    <HeadlessComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronDown className="size-4 text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300" />
                    </HeadlessComboboxButton>
                </div>
                <HeadlessComboboxOptions
                    transition
                    anchor="bottom start"
                    className={clsx(
                        'w-[var(--input-width)] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1 [--anchor-gap:var(--spacing-1)] focus:outline-none',
                        'transition duration-100 ease-in data-[leave]:data-[closed]:opacity-0',
                        'z-50 shadow-lg empty:hidden'
                    )}
                >
                    {options}
                </HeadlessComboboxOptions>
            </div>
        </HeadlessCombobox>
    )
}

export function ComboboxOption<T>({
    children,
    className,
    value,
    ...props
}: {
    children?: React.ReactNode
    className?: string
    value: T
} & Omit<ComponentPropsWithoutRef<typeof HeadlessComboboxOption>, 'as' | 'value'>) {
    return (
        <HeadlessComboboxOption
            as={Fragment}
            value={value}
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
        </HeadlessComboboxOption>
    )
}
