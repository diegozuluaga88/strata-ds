import * as React from "react"
import { cn } from '@/utils';
export interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
    children?: React.ReactNode
}

export function Text({ className, ...props }: TextProps) {
    return (
        <p
            data-slot="text"
            className={cn("text-base/6 text-zinc-500 sm:text-sm/6 dark:text-zinc-400", className)}
            {...props}
        />
    )
}

export function Strong({ className, ...props }: React.ComponentPropsWithoutRef<"strong">) {
    return <strong className={cn("font-semibold text-zinc-950 dark:text-white", className)} {...props} />
}
