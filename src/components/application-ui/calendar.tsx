"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from '@/utils';
import { buttonVariants } from "./button";

function Calendar({
  className,
  classNames,
  components,
  showOutsideDays = true,
  navLayout,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const aroundNavigation = navLayout === "around";

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      navLayout={navLayout}
      className={cn(
        "p-2",
        "[&_.rdp-weekdays]:grid [&_.rdp-weekdays]:grid-cols-7",
        "[&_.rdp-week]:grid [&_.rdp-week]:grid-cols-7",
        "[&_.rdp-weekday]:w-7 [&_.rdp-weekday]:text-center",
        className,
      )}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        // Fixed width so the popover never resizes as the user navigates months/years —
        // see months_dropdown/years_dropdown below for how the exact number was measured
        // live (Storybook + getBoundingClientRect), not guessed from CSS alone.
        month: cn("flex flex-col gap-2 w-[272px]", "relative"),
        month_caption: cn(
          "flex justify-center pt-1 relative items-center w-full",
          aroundNavigation && "h-7 px-8 pt-0",
        ),
        caption_label: "text-xs font-medium",
        nav: "flex items-center gap-1",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "absolute left-1 top-0 z-10 bg-transparent p-0 text-foreground opacity-50 hover:opacity-100",
          aroundNavigation ? "size-7" : "size-6",
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "absolute right-1 top-0 z-10 bg-transparent p-0 text-foreground opacity-50 hover:opacity-100",
          aroundNavigation ? "size-7" : "size-6",
        ),
        chevron: "size-3.5 text-foreground fill-foreground",
        // Fixed to the day grid's own intrinsic width (7 cols x size-7 = 196px) and
        // centered in the `month` box, so the day grid itself never reflows.
        month_grid: "w-[196px] mx-auto border-collapse space-x-1",
        weekdays: "grid grid-cols-7",
        weekday:
          "text-foreground rounded-md w-7 text-center font-normal text-[0.7rem]",
        week: "grid w-full grid-cols-7 mt-1",
        day: cn(
          "relative p-0 text-center text-xs focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-range-end)]:rounded-r-md",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md",
        ),
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-7 p-0 text-xs font-normal aria-selected:opacity-100",
        ),
        range_start:
          "day-range-start aria-selected:bg-primary aria-selected:text-primary-foreground",
        range_end:
          "day-range-end aria-selected:bg-primary aria-selected:text-primary-foreground",
        selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        today: "bg-accent text-accent-foreground",
        outside:
          "day-outside text-muted-foreground aria-selected:text-muted-foreground",
        disabled: "text-muted-foreground opacity-50",
        range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        hidden: "invisible",
        dropdowns: "flex items-center gap-1",
        dropdown_root: "relative inline-flex",
        // Fixed widths (measured live against "September", the longest month name, and
        // a 4-digit year) so neither trigger — and therefore neither the caption row nor
        // the popover — changes size as the user navigates. See MonthYearDropdown in
        // date-picker.tsx, which forwards this className onto SelectTrigger, overriding
        // its own default w-full/px-4/text-sm.
        months_dropdown: "w-[110px] px-2 text-xs",
        years_dropdown: "w-[74px] px-2 text-xs",
        ...classNames,
      }}
      components={{
        Chevron: ({
          className,
          orientation,
          ...props
        }: React.ComponentProps<"svg"> & { orientation?: string }) => {
          if (orientation === "left") {
            return <ChevronLeft className={cn("size-4", className)} {...props} />;
          }
          return <ChevronRight className={cn("size-4", className)} {...props} />;
        },
        ...components,
      }}
      {...props}
    />
  );
}

export { Calendar };
