"use client";

import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from '@/utils';
/*
 * El estado elegido, en el idioma del sistema: `primary` con el texto en
 * `primary-foreground`, y **lo no elegido en `muted-foreground`**.
 *
 * Antes era `bg-accent`, que en la tabla de tokens esta documentado como
 * «Hover state backgrounds»: el componente decia «elegido» con el token de
 * hover. Medido en UW Health, el elegido contra el de al lado daba 1,02:1 en
 * claro, con el mismo texto y el mismo peso, asi que no habia forma de saber en
 * que pestana estabas.
 *
 * Esto es lo que ya hacen sus hermanos —`FilterPills` y `Tabs`—, y la mitad que
 * de verdad faltaba es la segunda: los tres textos iban iguales. Con el no
 * elegido en muted hay dos senales, no una.
 *
 * **Queda un limite conocido, y es del sistema, no de este componente.** El
 * lima de marca en claro (brand-300, #E6F993) contrasta 1,03:1 con el fondo de
 * pagina: se distingue por tono, no por luminancia, asi que como UNICA senal no
 * cumpliria 1.4.11. Por eso importa el texto muted, y por eso `shadow-sm`. El
 * primero de la rampa que cruzaria 3:1 en claro es brand-700 (3,29:1), que es
 * verde oliva y ya no se parece al lima de los botones. `FilterPills` y `Tabs`
 * tienen exactamente el mismo limite: es una decision de paleta pendiente, no
 * un descuido de aqui.
 */
const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm data-[state=on]:hover:bg-primary data-[state=on]:hover:text-primary-foreground [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none transition-all aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
        pill: "bg-transparent text-muted-foreground hover:bg-transparent hover:text-foreground rounded-md data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-sm data-[state=on]:hover:bg-card",
      },
      size: {
        default: "h-9 px-2 min-w-9",
        sm: "h-8 px-1.5 min-w-8",
        lg: "h-10 px-2.5 min-w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Toggle, toggleVariants };
