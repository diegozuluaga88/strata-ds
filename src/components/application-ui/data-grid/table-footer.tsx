import * as React from "react"
import { cn } from '@/utils';

// Local shim: `@/components/application-ui/table` does not export `TableFooter`
// (only Table, TableHeader, TableBody, TableRow, TableHead, TableCell). Upstream
// (doktorigi/Fancy-UI-Grid) imports TableFooter from its shadcn-style table module,
// so it's added here, styled consistently with the neighbouring table.tsx primitives.
export function TableFooter({ className, ...props }: React.ComponentPropsWithoutRef<"tfoot">) {
  return (
    <tfoot
      {...props}
      className={cn(
        "border-t border-border bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
    />
  )
}
