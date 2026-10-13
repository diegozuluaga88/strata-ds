"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from '@/utils';
import { cva, type VariantProps } from "class-variance-authority";

const avatarVariants = cva(
  "relative flex shrink-0 overflow-hidden rounded-full",
  {
    variants: {
      size: {
        xs: "size-6 text-xs",
        sm: "size-8 text-xs",
        md: "size-10 text-sm",
        lg: "size-12 text-base",
        xl: "size-16 text-lg",
        "2xl": "size-24 text-xl",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

function Avatar({
  className,
  size,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> & VariantProps<typeof avatarVariants>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(avatarVariants({ size }), className)}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      {...props}
    />
  );
}

const avatarFallbackVariants = cva(
  "font-semibold flex size-full items-center justify-center rounded-full",
  {
    variants: {
      variant: {
        // `brand-800` y no `brand-700`: las iniciales son texto, y el texto pide
        // 4.5:1 (WCAG 1.4.3). Sobre `brand-50` (#fdfee7), `brand-700` (#718B03)
        // se queda en 3.80:1 — lo midio con axe el frontend de UW Health en
        // octubre de 2026. `brand-800` (#507206) da 5.47:1. Aclarar el fondo no
        // era alternativa: `brand-700` sobre blanco puro solo llega a 3.89:1.
        default: "bg-brand-50 dark:bg-brand-500/10 text-brand-800 dark:text-brand-500",
        muted: "bg-muted text-foreground",
        gradient: "bg-gradient-to-br from-blue-500 to-purple-600 text-white",
        indigo:
          "bg-indigo-500/20 text-indigo-400 dark:bg-indigo-500/20 dark:text-indigo-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function AvatarFallback({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback> & VariantProps<typeof avatarFallbackVariants>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(avatarFallbackVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback };
