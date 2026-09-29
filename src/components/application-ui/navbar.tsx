import * as React from "react"
import { cn } from '@/utils';
export function Navbar({ className, ...props }: React.ComponentPropsWithoutRef<"nav">) {
    return (
        <nav
            {...props}
            className={cn("flex items-center gap-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3", className)}
        />
    )
}

export function NavbarSection({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
    return <div {...props} className={cn("flex items-center gap-2", className)} />
}

export function NavbarSpacer({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
    return <div {...props} className={cn("flex-1", className)} />
}

interface NavbarItemProps extends React.ComponentPropsWithoutRef<"button"> {
    current?: boolean
}

export function NavbarItem({ current, className, children, ...props }: NavbarItemProps) {
    return (
        <button
            {...props}
            className={cn(
                "relative flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors",
                current
                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-50",
                className
            )}
        >
            {children}
        </button>
    )
}
