import * as React from "react"
import { cn } from '@/utils';
export function Table({ className, striped, dense, ...props }: React.ComponentPropsWithoutRef<"table"> & { striped?: boolean; dense?: boolean }) {
  return (
    <div className="relative w-full overflow-x-auto scrollbar-minimal">
      <table
        {...props}
        className={cn(
          "w-full text-left text-sm",
          striped && "[&_tbody_tr:nth-child(even)]:bg-foreground/[2.5%]",
          dense ? "[&_td]:py-2 [&_th]:py-2" : "[&_td]:py-4 [&_th]:py-4",
          className
        )}
      />
    </div>
  )
}

export function TableHeader({ className, ...props }: React.ComponentPropsWithoutRef<"thead">) {
  return <thead {...props} className={cn("border-b border-border", className)} />
}

export function TableBody({ className, ...props }: React.ComponentPropsWithoutRef<"tbody">) {
  return <tbody {...props} className={cn(className)} />
}

export function TableRow({ className, ...props }: React.ComponentPropsWithoutRef<"tr">) {
  return (
    <tr
      {...props}
      className={cn(
        "border-b border-border last:border-none hover:bg-muted/50 transition-colors",
        className
      )}
    />
  )
}

export function TableHead({ className, ...props }: React.ComponentPropsWithoutRef<"th">) {
  return (
    <th
      {...props}
      className={cn(
        "px-4 font-medium",
        className
      )}
    />
  )
}

export function TableCell({ className, ...props }: React.ComponentPropsWithoutRef<"td">) {
  return (
    <td
      {...props}
      className={cn(
        "px-4 text-foreground",
        className
      )}
    />
  )
}
