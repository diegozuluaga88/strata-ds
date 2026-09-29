import { cn } from '@/utils';
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      // bg-muted-foreground/20: derived from a foreground token, so it inverts
      // correctly in dark mode. bg-accent/muted/secondary all resolve to #FAFAFA,
      // which is invisible on a white surface.
      className={cn("bg-muted-foreground/20 animate-pulse rounded-md", className)}
      {...props}
    />
  );
}

export { Skeleton };
