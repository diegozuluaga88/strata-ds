"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from '@/utils';

const switchVariants = cva(
  "peer inline-flex shrink-0 items-center rounded-full border border-transparent transition-all outline-none data-[state=unchecked]:bg-input data-[state=checked]:bg-primary focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-80",
  {
    variants: {
      size: {
        default: "h-6 w-11",
        sm: "h-5 w-9",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

const switchThumbVariants = cva("pointer-events-none block rounded-full ring-0 bg-white transition-transform", {
  variants: {
    size: {
      default: "size-5 data-[state=unchecked]:translate-x-0 data-[state=checked]:translate-x-5",
      sm: "size-4 data-[state=unchecked]:translate-x-0 data-[state=checked]:translate-x-4",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

export type SwitchProps = React.ComponentProps<typeof SwitchPrimitive.Root> & VariantProps<typeof switchVariants>;

function Switch({
  className,
  size,
  ...props
}: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(switchVariants({ size }), className)}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(switchThumbVariants({ size }))}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
