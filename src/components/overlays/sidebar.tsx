import * as React from "react"
import { cn } from '@/utils';
export function Sidebar({ className, ...props }: React.ComponentPropsWithoutRef<"aside">) {
  return (
    <aside
      {...props}
      className={cn("flex h-full min-h-0 flex-col bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800", className)}
    />
  )
}

export function SidebarHeader({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return <div {...props} className={cn("flex flex-col border-b border-zinc-200 dark:border-zinc-800", className)} />
}

export function SidebarBody({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return <div {...props} className={cn("flex flex-1 flex-col overflow-y-auto p-4", className)} />
}

export function SidebarFooter({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return <div {...props} className={cn("flex flex-col border-t border-zinc-200 dark:border-zinc-800", className)} />
}

export function SidebarSection({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return <div {...props} className={cn("flex flex-col gap-0.5", className)} />
}

export function SidebarLabel({ className, ...props }: React.ComponentPropsWithoutRef<"span">) {
  return (
    <span
      {...props}
      className={cn("px-2 mb-2 text-xs uppercase tracking-wider font-bold text-zinc-500 dark:text-zinc-400", className)}
    />
  )
}

interface SidebarItemProps extends React.ComponentPropsWithoutRef<"button"> {
  current?: boolean
}

export function SidebarItem({ current, className, children, ...props }: SidebarItemProps) {
  return (
    <button
      {...props}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm font-medium transition-colors relative",
        current
          ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-1 before:bg-zinc-800 dark:before:bg-zinc-50 before:rounded-r"
          : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-50",
        className
      )}
    >
      {children}
    </button>
  )
}
