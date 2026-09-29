"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from '@/utils';
export type SwitchProps = React.ComponentProps<typeof SwitchPrimitive.Root>

function Switch({
  className,
  ...props
}: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent transition-all outline-none",
        "data-[state=unchecked]:bg-input data-[state=checked]:bg-primary",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "disabled:cursor-not-allowed disabled:opacity-80",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-5 rounded-full ring-0 bg-white transition-transform data-[state=unchecked]:translate-x-0 data-[state=checked]:translate-x-5",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
