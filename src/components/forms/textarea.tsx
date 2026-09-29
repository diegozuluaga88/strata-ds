import * as React from "react";
import { cn } from '@/utils';
export type TextareaProps = React.ComponentProps<"textarea">

function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "resize-none border border-input px-4 py-2 text-sm text-foreground shadow-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary bg-input-background/30",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        "flex field-sizing-content min-h-[80px] w-full rounded-lg disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
