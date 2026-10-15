"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from '@/utils';
type TabsSize = "default" | "sm";
type TabsVariant = "default" | "muted" | "link";

const TabsSizeContext = React.createContext<TabsSize>("default");
const TabsVariantContext = React.createContext<TabsVariant>("default");

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

interface TabsListProps extends React.ComponentProps<typeof TabsPrimitive.List> {
  size?: TabsSize;
  variant?: TabsVariant;
}

function TabsList({
  className,
  size = "default",
  variant = "default",
  ...props
}: TabsListProps) {
  return (
    <TabsSizeContext.Provider value={size}>
      <TabsVariantContext.Provider value={variant}>
        <TabsPrimitive.List
          data-slot="tabs-list"
          className={cn(
            variant === "link"
              ? "flex gap-6"
              : "flex items-center w-fit gap-1 rounded-xl p-1",
            variant === "muted"
              ? "bg-zinc-100 dark:bg-zinc-800"
              : variant === "default"
                ? "border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800/50"
                : "",
            className,
          )}
          {...props}
        />
      </TabsVariantContext.Provider>
    </TabsSizeContext.Provider>
  );
}

function TabsTrigger({
  className,
  counter,
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> & {
  counter?: React.ReactNode;
}) {
  const size = React.useContext(TabsSizeContext);
  const variant = React.useContext(TabsVariantContext);

  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        variant === "link"
          ? [
            "py-4 text-sm font-medium border-b-2 outline-none transition-colors cursor-pointer",
            "data-[state=active]:border-brand-700 data-[state=active]:text-brand-700 dark:data-[state=active]:border-brand-500 dark:data-[state=active]:text-brand-500",
            "data-[state=inactive]:border-transparent data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground",
            "disabled:pointer-events-none disabled:opacity-50",
          ]
          : [
            "group transition-all cursor-pointer rounded-lg font-medium",
            "focus-visible:border-brand-500 focus-visible:outline-brand-500 focus-visible:ring-[3px] focus-visible:ring-brand-500/50",
            "disabled:pointer-events-none disabled:opacity-50",
            "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
            "whitespace-nowrap",
            variant === "muted"
              ? [
                "text-zinc-500 data-[state=inactive]:hover:text-zinc-700 dark:data-[state=inactive]:hover:text-zinc-300",
                "data-[state=inactive]:hover:bg-zinc-200/50 dark:data-[state=inactive]:hover:bg-zinc-700/50",
                "data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:text-foreground data-[state=active]:shadow-sm",
              ]
              : [
                "text-muted-foreground data-[state=inactive]:hover:bg-white/50 data-[state=inactive]:hover:text-foreground dark:data-[state=inactive]:hover:bg-zinc-700/50",
                "data-[state=active]:bg-brand-300 data-[state=active]:text-zinc-900 dark:data-[state=active]:bg-brand-500 dark:data-[state=active]:text-zinc-900 dark:data-[state=active]:hover:bg-brand-600 data-[state=active]:shadow-sm data-[state=active]:font-semibold data-[state=active]:outline-1 data-[state=active]:[outline-style:solid] data-[state=active]:outline-primary-foreground",
              ],
            size === "sm"
              ? "inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs"
              : "flex items-center gap-2 px-4 py-2 text-sm",
          ],
        className,
      )}
      {...props}
    >
      {children}
      {counter != null && (
        <span
          data-slot="tabs-counter"
          className={cn(
            "text-xs px-1.5 py-0.5 rounded-full transition-colors font-medium",
            variant === "muted"
              ? [
                "bg-zinc-300 dark:bg-black text-zinc-700 dark:text-zinc-300",
                "group-hover:bg-zinc-400/90 dark:group-hover:bg-zinc-900",
                "group-data-[state=active]:bg-zinc-900/20 group-data-[state=active]:text-zinc-900 dark:group-data-[state=active]:bg-zinc-900/20 dark:group-data-[state=active]:text-zinc-900",
              ]
              : [
                "bg-background text-muted-foreground",
                "group-hover:bg-muted",
                "group-data-[state=active]:bg-zinc-900/20 group-data-[state=active]:text-zinc-900",
              ],
          )}
        >
          {counter}
        </span>
      )}
    </TabsPrimitive.Trigger>
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
