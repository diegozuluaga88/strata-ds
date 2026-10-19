#!/usr/bin/env node
/**
 * Strata DS — MCP Server
 * Exposes Design System governance, components, tokens, and foundations
 * to AI tools (Claude Code, Cursor, GitHub Copilot) via stdio transport.
 *
 * Tools: get_overview, get_component, get_component_code, get_tokens,
 *        get_foundations, get_rules, get_anti_patterns, search_governance, report_error
 *
 * Also runs an HTTP health server on port 3001 for browser-based status checks.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DS_ROOT = join(__dirname, "../..");

// ─── OVERVIEW ─────────────────────────────────────────────────────────────────

const OVERVIEW = `
# Strata Design System — P1 (strata-ds)

**Stack:** React 19 · TypeScript 5 · Tailwind CSS v4 · CVA · Radix UI · Vite

## Architecture
- **P1** (strata-ds) = unified source of truth — components, tokens, dev app, MCP server
- **P2** (front-react-strata-storybook) = Storybook documentation (uses P1 as library)
- **MCP Server** = this server, the authoritative DS knowledge hub for AI tools
- MCP replaces all Figma integration for AI-assisted development

## Token System (3 levels)
1. **Primitives** — raw palette values (zinc, brand, status palettes)
2. **Semantic** — role-based aliases (background, foreground, primary, border, status-*)
3. **Component** — component-specific tokens (card-bg, button-ring, etc.)

## Status Tokens (CRITICAL — 60% of ecosystem violations)
| Token | Tailwind | Light | Dark |
|-------|---------|-------|------|
| --color-status-success | bg-status-success | #16a34a | #4ade80 |
| --color-status-warning | bg-status-warning | #b45309 | #fbbf24 |
| --color-status-error | bg-status-error | #C11736 | #ED5F74 |
| --color-status-info | bg-status-info | #2563eb | #60a5fa |
| --color-status-ai | bg-status-ai | #8b5cf6 | #a78bfa |

## Governance Tiers
- **Tier 1** (production): hex blocked, only official variants, pre-commit enforced
- **Tier 2** (demos): hex blocked, Tailwind tokens OK, custom variants with warning
- **Tier 3** (simulations): hex with @ds-ignore allowed

## Component Catalogue (111 components)
**Application UI:** Button, Badge, Card, Avatar, Table, Navbar, NavbarFloating, PageLayout,
Layout, Heading, Text, Tabs, Pagination, BreadCrumb, Separator, Divider, Progress,
StatusBadge, PriorityBadge, KpiCard, SectionCard, Tracking, ActivityTimeline, Banner,
InfoBanner, HeroSection, FeatureSection, Pricing, ActionCenter, FilterPanel, ListToolbar,
SectionToolbar, Toggle, ToggleGroup, HoverCard, SharedOrderCard, SharedCatalogCard,
SharedInventoryCard, StageProgress, ShoppingCart, ProductList, ProductOverview,
CompanyGreeting, CreateOrderDialog, ExperiencesNavbar, PageHeader, Link, Label, Skeleton,
Carousel, Chart, Calendar, Command, Menubar, NavigationMenu, TableEmptyState, CopyButton,
Collapsible, AspectRatio, ActionPanel, Dashboard

**Forms:** Input, Textarea, Select, Combobox, Checkbox, RadioGroup, Switch, Slider,
DatePicker, Form, Field, Fieldset, InputOTP, Listbox, SearchableMultiSelect

**Overlays:** Dialog, AlertDialog, Alert, Sheet, Drawer, Popover, Tooltip, DropdownMenu,
ContextMenu, ConfirmDialog, FeedbackToast, Sonner, Sidebar, SlideOver, ScrollArea, Resizable

**Data Viz:** Accordion, Disclosure, DescriptionList, StackedList, EmptyState
`;

// ─── FOUNDATIONS ──────────────────────────────────────────────────────────────

// Source of truth: design system/strata-ds/src/styles/tokens/variables.css
//                  + variables-dark.css + theme.css (glass + glow extensions)
// All hex/value pairs must match those files exactly. If you change a token
// here, update variables.css first; if you change variables.css, update here.
const FOUNDATIONS = {
  colors: {
    description:
      "Full color system: surface tokens (background/card/popover/etc.), status, sidebar, charts, brand + 6 extended palettes, plus base white/black. Light/dark pairs come from variables.css and variables-dark.css.",

    // ── Surface + intent tokens (used everywhere via Tailwind: bg-*, text-*, border-*)
    surfaces: {
      background:           { light: "#EBECEE", dark: "#02060C", use: "Page background" },
      foreground:           { light: "#02060C", dark: "#EBECEE", use: "Default text color" },
      card:                 { light: "#fafafa", dark: "#0B0F1A", use: "Card / container surface" },
      "card-foreground":    { light: "#02060C", dark: "#EBECEE", use: "Text inside Card" },
      popover:              { light: "#f4f4f0", dark: "#0F1320", use: "Floating overlays (Dialog, Popover, DropdownMenu)" },
      "popover-foreground": { light: "#02060C", dark: "#EBECEE", use: "Text inside popovers" },
      primary:              { light: "#E6F993", dark: "#C3E433", use: "Primary CTA fill (Volt Lime)" },
      "primary-foreground": { light: "#02060C", dark: "#02060C", use: "Text on primary fill" },
      secondary:            { light: "#F4F4F5", dark: "#141E2C", use: "Secondary surface" },
      "secondary-foreground":{ light: "#02060C", dark: "#EBECEE", use: "Text on secondary" },
      muted:                { light: "#F4F4F5", dark: "#141E2C", use: "Subtle backgrounds (badges, hover)" },
      "muted-foreground":   { light: "#616A76", dark: "#B4BBC2", use: "Secondary text, captions, placeholders" },
      accent:               { light: "#E8EAEC", dark: "#1E2A3A", use: "Hover/active accent surfaces" },
      "accent-foreground":  { light: "#02060C", dark: "#EBECEE", use: "Text on accent" },
      destructive:          { light: "#C11736", dark: "#ED5F74", use: "Destructive action fill (delete, error)" },
      "destructive-foreground":{ light: "#ffffff", dark: "#000000", use: "Text on destructive fill" },
      border:               { light: "#D0D4D8", dark: "#141E2C", use: "Standard border / divider" },
      input:                { light: "#546070", dark: "#959DA7", use: "Form input border" },
      "input-background":   { light: "#F4F4F5", dark: "#141E2C", use: "Form input fill" },
      ring:                 { light: "#141E2C", dark: "#B4BBC2", use: "Focus ring color" },
    },

    // ── Status (semantic intent — preferred over raw color names)
    status: {
      success:                  { light: "#16a34a", dark: "#4ade80", use: "Success indicators" },
      "success-foreground":     { light: "#ffffff", dark: "#000000", use: "Text on success fill" },
      warning:                  { light: "#b45309", dark: "#fbbf24", use: "Warning indicators" },
      "warning-foreground":     { light: "#ffffff", dark: "#000000", use: "Text on warning fill" },
      error:                    { light: "#C11736", dark: "#ED5F74", use: "Error indicators (subtle red)" },
      "error-foreground":       { light: "#ffffff", dark: "#000000", use: "Text on error fill" },
      info:                     { light: "#2563eb", dark: "#60a5fa", use: "Info indicators (links, hints)" },
      "info-foreground":        { light: "#ffffff", dark: "#000000", use: "Text on info fill" },
      ai:                       { light: "#8b5cf6", dark: "#a78bfa", use: "AI-generated content marker" },
      "ai-foreground":          { light: "#ffffff", dark: "#000000", use: "Text on AI fill" },
    },

    // ── Sidebar (independent so app shells can style sidebars without touching surfaces)
    sidebar: {
      sidebar:                  { light: "#fafafa", dark: "#02060C", use: "Sidebar background" },
      "sidebar-foreground":     { light: "#02060C", dark: "#EBECEE", use: "Sidebar text" },
      "sidebar-primary":        { light: "#E6F993", dark: "#C3E433", use: "Sidebar active item / CTA" },
      "sidebar-primary-foreground":{ light: "#02060C", dark: "#02060C", use: "Text on active sidebar item" },
      "sidebar-accent":         { light: "#F4F4F5", dark: "#141E2C", use: "Sidebar hover / accent" },
      "sidebar-accent-foreground":{ light: "#02060C", dark: "#EBECEE", use: "Text on accent" },
      "sidebar-border":         { light: "#D0D4D8", dark: "#141E2C", use: "Sidebar divider" },
      "sidebar-ring":           { light: "#959DA7", dark: "#B4BBC2", use: "Sidebar focus ring" },
    },

    // ── Charts (data viz palette — same in light & dark)
    charts: {
      "chart-1": { value: "#6366f1", use: "Primary series — indigo" },
      "chart-2": { value: "#22c55e", use: "Secondary series — green" },
      "chart-3": { value: "#E52D49", use: "Tertiary series — red" },
      "chart-4": { value: "#f59e0b", use: "Quaternary series — amber" },
      "chart-5": { value: "#818cf8", use: "Quinary series — indigo-light" },
    },

    // ── Brand palette (Volt Lime — 11 shades + lime accent)
    brand: {
      "50":  "#fdfee7",
      "100": "#F4F8E1",
      "200": "#F4FFC9",
      "300": "#E6F993",
      "400": "#DAF75F",
      "500": "#C3E433",
      "600": "#A0C114",
      "700": "#718B03",
      "800": "#507206",
      "900": "#2A3400",
      "950": "#233502",
      lime:  "#d6ff3c",
    },

    // ── Neutral primitive (Strata zinc — 11 shades, replaces Tailwind default)
    zinc: {
      "50": "#fafafa", "100": "#EBECEE", "200": "#E0E2E5", "300": "#D0D4D8",
      "400": "#B4BBC2", "500": "#959DA7", "600": "#546070", "700": "#333F4E",
      "800": "#141E2C", "900": "#02060C", "950": "#09090b",
    },

    // ── Extended palettes (Tailwind-aligned 11-step scales)
    red: {
      "50": "#fff5f6", "100": "#FFECEE", "200": "#FFD6DC", "300": "#F99DAA",
      "400": "#ED5F74", "500": "#E52D49", "600": "#C11736", "700": "#8B091D",
      "800": "#580410", "900": "#340209", "950": "#1a0104",
    },
    green: {
      "50": "#f0fdf4", "100": "#dcfce7", "200": "#bbf7d0", "300": "#86efac",
      "400": "#4ade80", "500": "#22c55e", "600": "#16a34a", "700": "#15803d",
      "800": "#166534", "900": "#14532d", "950": "#052e16",
    },
    blue: {
      "50": "#eff6ff", "100": "#dbeafe", "200": "#bfdbfe", "300": "#93c5fd",
      "400": "#60a5fa", "500": "#3b82f6", "600": "#2563eb", "700": "#1d4ed8",
      "800": "#1e40af", "900": "#1e3a8a", "950": "#172554",
    },
    amber: {
      "50": "#fffbeb", "100": "#fef3c7", "200": "#fde68a", "300": "#fcd34d",
      "400": "#fbbf24", "500": "#f59e0b", "600": "#d97706", "700": "#b45309",
      "800": "#92400e", "900": "#78350f", "950": "#451a03",
    },
    indigo: {
      "50": "#eef2ff", "100": "#e0e7ff", "200": "#c7d2fe", "300": "#a5b4fc",
      "400": "#818cf8", "500": "#6366f1", "600": "#4f46e5", "700": "#4338ca",
      "800": "#3730a3", "900": "#312e81", "950": "#1e1b4b",
    },
    violet: {
      "300": "#c4b5fd", "400": "#a78bfa", "500": "#8b5cf6",
      "600": "#7c3aed", "700": "#6d28d9",
    },

    // ── Base
    base: {
      white: "#ffffff",
      black: "#000000",
    },
  },

  typography: {
    description:
      "Strata type system — PP Monument Extended for brand display, Inter for UI, Georgia for serif, system mono. All sizes/weights/line-heights/letter-spacings come from variables.css.",

    families: {
      brand: { value: "'PP Monument Extended', sans-serif", use: "Brand display headings, hero titles, tenant names" },
      sans:  { value: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", use: "All UI body and headings (default)" },
      serif: { value: "Georgia, Cambria, 'Times New Roman', Times, serif", use: "Editorial / long-form content" },
      mono:  { value: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace", use: "Code blocks, IDs, keyboard shortcuts" },
    },

    sizes: {
      xs:   { rem: "0.75rem",  px: "12px",  use: "Captions, helper text" },
      sm:   { rem: "0.875rem", px: "14px",  use: "Body small, labels" },
      base: { rem: "1rem",     px: "16px",  use: "Body default" },
      lg:   { rem: "1.125rem", px: "18px",  use: "Lead paragraphs, sub-heading" },
      xl:   { rem: "1.25rem",  px: "20px",  use: "Heading-3, card titles" },
      "2xl":{ rem: "1.5rem",   px: "24px",  use: "Heading-2, section titles" },
      "3xl":{ rem: "1.875rem", px: "30px",  use: "Heading-1, page titles" },
      "4xl":{ rem: "2.25rem",  px: "36px",  use: "Display small" },
      "5xl":{ rem: "3rem",     px: "48px",  use: "Display medium" },
      "6xl":{ rem: "3.75rem",  px: "60px",  use: "Display large" },
      "7xl":{ rem: "4.5rem",   px: "72px",  use: "Hero" },
      "8xl":{ rem: "6rem",     px: "96px",  use: "Marketing hero" },
      "9xl":{ rem: "8rem",     px: "128px", use: "Editorial mega" },
    },

    weights: {
      thin:       100,
      extralight: 200,
      light:      300,
      normal:     400,
      medium:     500,
      semibold:   600,
      bold:       700,
      extrabold:  800,
      black:      900,
    },

    lineHeights: {
      none:    "1",
      tight:   "1.25",
      snug:    "1.375",
      normal:  "1.5",
      relaxed: "1.625",
      loose:   "2",
    },

    letterSpacings: {
      tighter: "-0.05em",
      tight:   "-0.025em",
      normal:  "0",
      wide:    "0.025em",
      wider:   "0.05em",
      widest:  "0.1em",
    },

    // Curated semantic scale (for opinionated apps that want one-word tokens)
    scale: {
      "display-lg": { size: "36px", lineHeight: "40px", weight: 700, use: "Hero titles" },
      "heading-1":  { size: "30px", lineHeight: "36px", weight: 700, use: "Page titles" },
      "heading-2":  { size: "24px", lineHeight: "32px", weight: 600, use: "Section headings" },
      "heading-3":  { size: "20px", lineHeight: "28px", weight: 600, use: "Card headings" },
      "heading-4":  { size: "18px", lineHeight: "28px", weight: 600, use: "Sub-headings" },
      "body-lg":    { size: "18px", lineHeight: "28px", weight: 400, use: "Lead paragraphs" },
      "body-base":  { size: "16px", lineHeight: "24px", weight: 400, use: "Default body text" },
      "body-sm":    { size: "14px", lineHeight: "20px", weight: 400, use: "Secondary, captions" },
      label:        { size: "14px", lineHeight: "20px", weight: 500, use: "Form labels, metadata" },
      caption:      { size: "12px", lineHeight: "16px", weight: 400, use: "Timestamps, helper text" },
      code:         { size: "14px", lineHeight: "20px", weight: 400, family: "mono", use: "Code blocks, IDs" },
    },
  },

  spacing: {
    description:
      "8px base grid. Spacing scale matches Tailwind's spacing-* utilities directly. All 19 stops from variables.css are exposed (with rem + px for clarity).",

    scale: {
      "0":  { rem: "0",       px: "0px"   },
      "1":  { rem: "0.25rem", px: "4px"   },
      "2":  { rem: "0.5rem",  px: "8px"   },
      "3":  { rem: "0.75rem", px: "12px"  },
      "4":  { rem: "1rem",    px: "16px"  },
      "5":  { rem: "1.25rem", px: "20px"  },
      "6":  { rem: "1.5rem",  px: "24px"  },
      "8":  { rem: "2rem",    px: "32px"  },
      "10": { rem: "2.5rem",  px: "40px"  },
      "11": { rem: "2.75rem", px: "44px"  },
      "12": { rem: "3rem",    px: "48px"  },
      "16": { rem: "4rem",    px: "64px"  },
      "20": { rem: "5rem",    px: "80px"  },
      "24": { rem: "6rem",    px: "96px"  },
      "32": { rem: "8rem",    px: "128px" },
      "40": { rem: "10rem",   px: "160px" },
      "48": { rem: "12rem",   px: "192px" },
      "56": { rem: "14rem",   px: "224px" },
      "64": { rem: "16rem",   px: "256px" },
    },

    grid: {
      base: 8,
      note: "All layout values should be divisible by 8. Use the spacing scale (p-2, m-4, gap-6) instead of arbitrary [px] values.",
    },
  },

  borders: {
    description:
      "Border radius (9 values) and width (5 values) tokens. Names match Tailwind utilities directly (rounded-*, border-*).",

    radius: {
      none:  { rem: "0",        px: "0px",     class: "rounded-none" },
      sm:    { rem: "0.125rem", px: "2px",     class: "rounded-sm"   },
      base:  { rem: "0.25rem",  px: "4px",     class: "rounded"      },
      md:    { rem: "0.375rem", px: "6px",     class: "rounded-md"   },
      lg:    { rem: "0.5rem",   px: "8px",     class: "rounded-lg"   },
      xl:    { rem: "0.75rem",  px: "12px",    class: "rounded-xl"   },
      "2xl": { rem: "1rem",     px: "16px",    class: "rounded-2xl"  },
      "3xl": { rem: "1.5rem",   px: "24px",    class: "rounded-3xl"  },
      full:  { rem: "9999px",   px: "9999px",  class: "rounded-full" },
    },

    widths: {
      "0": { value: "0",   class: "border-0" },
      "1": { value: "1px", class: "border"   },
      "2": { value: "2px", class: "border-2" },
      "4": { value: "4px", class: "border-4" },
      "8": { value: "8px", class: "border-8" },
    },
  },

  shadows: {
    description:
      "Two shadow systems: `elevations` (z-depth, used by Card / Dialog / Popover) and `glow` (subtle ambient lift, used by hero CTAs and floating panels). Z-index ladder covers the overlay stack.",

    elevations: {
      none: "none",
      sm:   "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      base: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
      md:   "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      lg:   "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
      xl:   "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
      "2xl":"0 25px 50px -12px rgb(0 0 0 / 0.25)",
      inner:"inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
    },

    glow: {
      sm: { light: "0 2px 12px rgba(0, 0, 0, 0.08)",  dark: "0 2px 12px rgba(0, 0, 0, 0.25)", use: "Subtle hover lift" },
      md: { light: "0 4px 24px rgba(0, 0, 0, 0.12)",  dark: "0 4px 24px rgba(0, 0, 0, 0.40)", use: "Floating cards / panels" },
      lg: { light: "0 8px 40px rgba(0, 0, 0, 0.18)",  dark: "0 8px 40px rgba(0, 0, 0, 0.50)", use: "Hero CTAs / focus states" },
    },

    zIndex: {
      "10": "Sticky elements, navbar",
      "20": "Dropdowns, tooltips",
      "30": "Modal overlays",
      "50": "Toasts, command palette",
    },
  },

  branding: {
    description:
      "Strata brand identity — flat geometric monogram + Volt Lime as primary signal. The mark is technical, functional, precise. Volt Lime says \"act now\" and should be used sparingly (one signal per screen section).",

    logos: [
      { name: "Logo Black",  file: "src/assets/branding/logo-black.png",  use: "Light backgrounds — official documents, light mode" },
      { name: "Logo White",  file: "src/assets/branding/logo-white.png",  use: "Dark backgrounds — dark mode primary nav" },
      { name: "Logo Lime",   file: "src/assets/branding/logo-lime.png",   use: "Accent / signal usage (dark mode only)" },
      { name: "Logo Gray",   file: "src/assets/branding/logo-gray.png",   use: "Secondary contexts, footers" },
    ],

    voltLimeRule: {
      pattern: "bg-brand-300 dark:bg-brand-500",
      tokens: { light: "#E6F993", dark: "#C3E433" },
      meaning: "The lime accent that says 'act now' — primary CTAs, active state indicators, focus rings.",
      principle: "One signal per screen section.",
    },

    palette: {
      "50":  "#fdfee7",
      "100": "#F4F8E1",
      "200": "#F4FFC9",
      "300": "#E6F993",
      "400": "#DAF75F",
      "500": "#C3E433",
      "600": "#A0C114",
      "700": "#718B03",
      "800": "#507206",
      "900": "#2A3400",
      "950": "#233502",
      lime:  "#d6ff3c",
    },

    whenToUse: [
      "Primary CTA buttons (default / brand variant)",
      "Active nav indicators / selected state underlines",
      "Card accent strips / icon container backgrounds",
      "Hero brand mark in app shells (light or dark)",
    ],

    antiPatterns: [
      "❌ Body text or headings (Volt Lime fails WCAG AA contrast)",
      "❌ Full section / page backgrounds (too heavy, eye-fatigue)",
      "❌ Status indicators (use status-success / warning / error / info / ai)",
      "❌ Multiple lime signals in a single section (loses semantic value)",
      "❌ Custom hex variants of lime (#84cc16, #d4f06a, etc.) — use brand-* tokens only",
    ],

    typography: {
      brandFont: "'PP Monument Extended', sans-serif",
      use: "Brand mark, hero displays, tenant names. Pair with Inter for body text.",
    },
  },

  transparency: {
    description:
      "Glassmorphism tokens for navbar/popover surfaces. Two variants (navbar, popover) each with a translucent background + tinted border + backdrop blur. Always pair with `bg-glass-*` + `border-glass-*-border` + `backdrop-blur-glass-xl`.",

    glass: {
      navbar: {
        "bg-class":     "bg-glass-navbar",
        "border-class": "border border-glass-navbar-border",
        use:            "Top nav bars over hero/photo backgrounds",
      },
      popover: {
        "bg-class":     "bg-glass-popover",
        "border-class": "border border-glass-popover-border",
        use:            "Floating popovers, dropdowns, tooltips when over busy backgrounds",
      },
    },

    blur: {
      "blur-glass-xl": { class: "backdrop-blur-glass-xl", value: "24px", use: "Standard glass blur for navbar + popover" },
    },

    shadow: {
      "shadow-glass-lg": { class: "shadow-glass-lg", use: "Lifts the glass surface off the background" },
    },

    pattern: {
      example: "<div class=\"bg-glass-navbar border border-glass-navbar-border backdrop-blur-glass-xl shadow-glass-lg\">...</div>",
      principle: "Always combine 3 utilities: bg + border + blur. Optionally add shadow-glass-lg.",
    },

    whenToUse: [
      "Top navbar over a hero image / colored section",
      "Sticky search bar over scrolling content",
      "Popover/dropdown over rich UI (catalog grids, dashboards)",
      "Floating action panels in storytelling demos",
    ],

    antiPatterns: [
      "❌ Using bg-card/80 or bg-popover/95 to fake glass — those are slash-opacity tokens, not glass tokens (different intent)",
      "❌ Forgetting backdrop-blur — without blur, glass becomes a tinted overlay, loses the depth signal",
      "❌ Stacking 3+ glass layers — performance degrades and visual hierarchy collapses",
      "❌ Glass on solid white/black backgrounds — defeats the purpose; use bg-card or bg-popover instead",
    ],
  },

  "grid-containers": {
    description:
      "12-column grid system (Tailwind grid-cols-*) + 5 container max-widths matching standard breakpoints. Containers are for centered page content; grids are for layouts inside containers.",

    grids: {
      "2-col":  { class: "grid grid-cols-2 gap-4",  use: "Two-column splits (sidebar + content, side-by-side cards)" },
      "3-col":  { class: "grid grid-cols-3 gap-4",  use: "Three-column layouts (feature grids, KPI rows)" },
      "4-col":  { class: "grid grid-cols-4 gap-4",  use: "Four-column dashboards, tile grids" },
      "6-col":  { class: "grid grid-cols-6 gap-4",  use: "Six-column flexibility for symmetric splits" },
      "12-col": { class: "grid grid-cols-12 gap-4", use: "Full 12-column composition (use col-span-* for asymmetric layouts)" },
    },

    containers: {
      sm:   { maxWidth: "640px",  class: "max-w-screen-sm",  use: "Mobile-first, single-column reading" },
      md:   { maxWidth: "768px",  class: "max-w-screen-md",  use: "Tablet, narrow article layouts" },
      lg:   { maxWidth: "1024px", class: "max-w-screen-lg",  use: "Standard desktop content (most pages)" },
      xl:   { maxWidth: "1280px", class: "max-w-screen-xl",  use: "Wide desktop, dashboard layouts" },
      "2xl":{ maxWidth: "1536px", class: "max-w-screen-2xl", use: "Extra-wide marketing / hero sections" },
    },

    compositions: [
      { name: "Centered article",   pattern: '<div class="container mx-auto max-w-screen-lg px-4">...</div>' },
      { name: "App shell",          pattern: '<div class="grid grid-cols-12 gap-6 max-w-screen-2xl mx-auto"><aside class="col-span-3">...</aside><main class="col-span-9">...</main></div>' },
      { name: "Symmetric split",    pattern: '<div class="grid grid-cols-2 gap-6">...</div>' },
      { name: "KPI row",            pattern: '<div class="grid grid-cols-4 gap-4">...</div>' },
      { name: "Sidebar + content",  pattern: '<div class="grid grid-cols-12 gap-6"><aside class="col-span-3">...</aside><section class="col-span-9">...</section></div>' },
    ],

    antiPatterns: [
      "❌ Hardcoded widths (w-[1200px]) — use max-w-screen-* containers",
      "❌ Margin tricks (mx-12) for centering — use container mx-auto + max-w",
      "❌ Mixing grid + flex for the same layout — pick one and stay consistent",
      "❌ Skipping px-4 padding on container — content touches viewport edge on mobile",
      "❌ Unbalanced spans (col-span-7 + col-span-5) without semantic reason",
    ],
  },
};

// ─── COMPONENT CODE EXAMPLES ──────────────────────────────────────────────────

const COMPONENT_CODE = {
  button: {
    react: `import { Button } from 'strata-design-system';

// Primary CTA (one per section)
<Button variant="default">Save Changes</Button>

// With icon
<Button variant="outline" size="sm">
  <PlusIcon className="size-4" />
  Add Item
</Button>

// Destructive action
<Button variant="destructive" onClick={handleDelete}>Delete Account</Button>

// Brand pill CTA (hero/landing pages)
<Button variant="brand" shape="pill" size="lg">Get Started</Button>

// Router navigation (asChild pattern)
<Button asChild variant="ghost">
  <Link to="/settings">Settings</Link>
</Button>`,
    html: `<!-- Primary button -->
<button class="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-brand-300 dark:bg-brand-500 text-foreground transition-colors hover:bg-brand-400 focus-visible:ring-2 focus-visible:ring-ring/50">
  Save Changes
</button>

<!-- Ghost icon button -->
<button aria-label="Settings" class="inline-flex items-center justify-center w-9 h-9 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
  <!-- heroicon -->
</button>`,
    css: `.btn-primary {
  background: var(--color-brand-300);
  color: var(--color-foreground);
  border-radius: var(--radius-md);
  padding: 0.5rem 1rem;
  font-weight: 500;
  transition: background 150ms;
}
.dark .btn-primary { background: var(--color-brand-500); }
.btn-primary:hover { background: var(--color-brand-400); }`,
    aiPrompt: `Use Button from strata-design-system. Variants: default (brand CTA), secondary, outline, ghost, destructive, link, brand, accent. Sizes: sm/default/lg/icon. Shape: default|pill. Rules: one default variant per section, use destructive for irreversible actions, use asChild + <Link> for navigation, never use raw <button>.`,
  },

  badge: {
    react: `import { Badge } from 'strata-design-system';

// Status tokens (governance-compliant)
<Badge className="bg-status-success/10 text-status-success border-status-success/20">Active</Badge>
<Badge className="bg-status-warning/10 text-status-warning border-status-warning/20">Pending</Badge>
<Badge className="bg-status-error/10 text-status-error border-status-error/20">Failed</Badge>
<Badge className="bg-status-ai/10 text-status-ai border-status-ai/20">AI</Badge>

// CVA built-in
<Badge variant="soft" color="brand">Premium</Badge>
<Badge variant="outline" color="zinc">Draft</Badge>`,
    html: `<!-- Status badge -->
<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-status-success/10 text-status-success border border-status-success/20">
  Active
</span>`,
    css: `.badge-success {
  background: color-mix(in srgb, var(--color-status-success) 10%, transparent);
  color: var(--color-status-success);
  border: 1px solid color-mix(in srgb, var(--color-status-success) 20%, transparent);
}`,
    aiPrompt: `Use Badge from strata-design-system. For status states always use bg-status-{success|warning|error|info|ai} tokens. Soft pattern: bg-status-*/10 + text-status-* + border-status-*/20. Never hardcode hex colors. Use variant="soft"|"outline"|"solid" + color prop for non-status badges.`,
  },

  card: {
    react: `import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter } from 'strata-design-system';

<Card variant="default">
  <CardHeader>
    <CardTitle>Order Summary</CardTitle>
    <CardDescription>Review before submitting</CardDescription>
    <CardAction>
      <Button size="icon" variant="ghost"><MoreHorizontalIcon className="size-4" /></Button>
    </CardAction>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-muted-foreground">3 items · $299.00</p>
  </CardContent>
  <CardFooter className="justify-end gap-2">
    <Button variant="outline">Cancel</Button>
    <Button>Confirm Order</Button>
  </CardFooter>
</Card>`,
    html: `<div class="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6">
  <div class="flex flex-col gap-1.5 mb-4">
    <h3 class="text-base font-semibold text-foreground">Order Summary</h3>
    <p class="text-sm text-muted-foreground">Review before submitting</p>
  </div>
  <!-- content -->
</div>`,
    css: `.card {
  background: var(--color-card);
  color: var(--color-card-foreground);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  padding: 1.5rem;
}`,
    aiPrompt: `Use Card from strata-design-system with CardHeader/CardTitle/CardDescription/CardAction/CardContent/CardFooter subcomponents. Variants: default, flat, glass, brand. Never use raw div with bg-white/border/rounded. Card auto-handles dark mode via bg-card token.`,
  },

  input: {
    react: `import { Input } from 'strata-design-system';

// Search input
<Input
  placeholder="Search..."
  prefix={<MagnifyingGlassIcon className="size-4" />}
  type="search"
/>

// With validation error
<Input
  label="Email"
  type="email"
  aria-invalid={!!errors.email}
  placeholder="you@example.com"
/>

// Password (auto-adds toggle)
<Input label="Password" type="password" />`,
    html: `<div class="relative">
  <input
    type="text"
    placeholder="Search..."
    class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50"
  />
</div>`,
    css: `.input {
  border: 1px solid var(--color-input);
  background: var(--color-background);
  color: var(--color-foreground);
  border-radius: var(--radius-md);
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
}
.input[aria-invalid="true"] {
  border-color: var(--color-destructive);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-destructive) 20%, transparent);
}`,
    aiPrompt: `Use Input from strata-design-system. Props: label, prefix, suffix, type, placeholder, disabled, aria-invalid. Always wrap with Field in real forms for a11y. Set aria-invalid={true} when validation fails. Never use raw <input>.`,
  },

  alert: {
    react: `import { Alert, AlertTitle, AlertDescription } from 'strata-design-system';

// Success
<Alert variant="success">
  <CheckCircleIcon className="size-4" />
  <AlertTitle>Saved</AlertTitle>
  <AlertDescription>Your changes were saved successfully.</AlertDescription>
</Alert>

// Warning
<Alert variant="warning">
  <AlertTitle>Storage almost full</AlertTitle>
  <AlertDescription>You are using 90% of your 5GB storage.</AlertDescription>
</Alert>

// Error with action
<Alert variant="destructive">
  <ExclamationCircleIcon className="size-4" />
  <AlertTitle>Upload failed</AlertTitle>
  <AlertDescription>The file exceeded the 10MB limit.</AlertDescription>
</Alert>`,
    html: `<div role="alert" class="flex gap-3 rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20 p-4">
  <svg class="size-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0"><!-- check icon --></svg>
  <div>
    <p class="text-sm font-medium text-emerald-800 dark:text-emerald-300">Saved</p>
    <p class="text-sm text-emerald-700 dark:text-emerald-400">Your changes were saved successfully.</p>
  </div>
</div>`,
    css: `.alert-success {
  border-color: color-mix(in srgb, var(--color-status-success) 30%, transparent);
  background: color-mix(in srgb, var(--color-status-success) 8%, transparent);
  color: var(--color-status-success);
}`,
    aiPrompt: `Use Alert from strata-design-system with variant: default, destructive, success, warning, info, brand. Subcomponents: AlertTitle, AlertDescription. Use Sonner for transient toasts, AlertDialog for confirmations. Never color via className hex.`,
  },

  dialog: {
    react: `import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from 'strata-design-system';

<Dialog>
  <DialogTrigger asChild>
    <Button>Create Order</Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-lg">
    <DialogHeader>
      <DialogTitle>New Order</DialogTitle>
      <DialogDescription>Fill in the order details below.</DialogDescription>
    </DialogHeader>
    <div className="space-y-4 py-4">
      <Input label="Customer name" placeholder="Acme Corp" />
      <Select label="Product" />
    </div>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button type="submit">Create Order</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`,
    html: `<!-- Dialog trigger -->
<button>Create Order</button>
<!-- Portal renders dialog overlay + panel with bg-background border-border shadow-lg -->`,
    css: `.dialog-overlay { background: rgb(0 0 0 / 0.5); }
.dialog-panel {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  max-width: 32rem;
  padding: 1.5rem;
}`,
    aiPrompt: `Use Dialog from strata-design-system (Radix-based). Subcomponents: DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter. Use asChild on DialogTrigger. For destructive confirmations use AlertDialog. For long forms use Sheet.`,
  },

  avatar: {
    react: `import { Avatar, AvatarImage, AvatarFallback } from 'strata-design-system';

// With image + fallback
<Avatar size="md">
  <AvatarImage src={user.avatarUrl} alt={user.name} />
  <AvatarFallback>{user.initials}</AvatarFallback>
</Avatar>

// Stacked group
<div className="flex -space-x-2">
  {users.slice(0, 3).map(u => (
    <Avatar key={u.id} size="sm" className="ring-2 ring-background">
      <AvatarImage src={u.avatar} alt={u.name} />
      <AvatarFallback variant="gradient">{u.initials}</AvatarFallback>
    </Avatar>
  ))}
  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-xs font-medium text-muted-foreground ring-2 ring-background">+5</span>
</div>`,
    html: `<span class="relative flex shrink-0 overflow-hidden rounded-full w-10 h-10">
  <img class="aspect-square h-full w-full object-cover" src="..." alt="User" />
  <!-- fallback: -->
  <span class="flex h-full w-full items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">AB</span>
</span>`,
    css: `.avatar { border-radius: 9999px; overflow: hidden; }
.avatar-fallback { background: var(--color-primary); color: var(--color-primary-foreground); }`,
    aiPrompt: `Use Avatar from strata-design-system with AvatarImage and AvatarFallback. Size prop: xs(24px)/sm(32px)/md(40px)/lg(48px)/xl(64px)/2xl(96px). FallbackVariant: default/muted/gradient. For stacked groups use -space-x-2 with ring-2 ring-background.`,
  },

  table: {
    react: `import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from 'strata-design-system';

<Table striped>
  <TableHeader>
    <TableRow>
      <TableHead>Invoice</TableHead>
      <TableHead>Customer</TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="text-right">Amount</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {invoices.map(row => (
      <TableRow key={row.id}>
        <TableCell className="font-medium">{row.id}</TableCell>
        <TableCell>{row.customer}</TableCell>
        <TableCell>
          <Badge className="bg-status-success/10 text-status-success border-status-success/20">{row.status}</Badge>
        </TableCell>
        <TableCell className="text-right font-mono">{row.amount}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>`,
    html: `<div class="w-full overflow-auto">
  <table class="w-full caption-bottom text-sm border-collapse">
    <thead class="border-b border-border">
      <tr><th class="h-12 px-4 text-left text-muted-foreground font-medium">Invoice</th></tr>
    </thead>
    <tbody class="[&_tr:last-child]:border-0">
      <tr class="border-b border-border hover:bg-muted/50 transition-colors">
        <td class="p-4 text-foreground">INV-001</td>
      </tr>
    </tbody>
  </table>
</div>`,
    css: `.table-row:hover { background: color-mix(in srgb, var(--color-muted) 50%, transparent); }
.table-head { color: var(--color-muted-foreground); font-weight: 500; }`,
    aiPrompt: `Use Table/TableHeader/TableBody/TableRow/TableHead/TableCell from strata-design-system. Props on Table: striped (alternating rows), dense (compact rows). Use status tokens for status badges inside cells. Never use raw <table>.`,
  },
};

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

const COMPONENTS = {
  button: {
    name: "Button",
    import: `import { Button } from 'strata-design-system';`,
    description: "Primary interactive control built with CVA and Radix Slot.",
    variants: {
      variant: ["default", "destructive", "outline", "secondary", "ghost", "link", "brand", "accent"],
      size: ["default (h-9)", "sm (h-8)", "lg (h-10)", "icon (9×9)"],
      shape: ["default (rounded-md)", "pill (rounded-full)"],
    },
    props: ["variant", "size", "shape", "asChild", "disabled", "children"],
    tokens: {
      "bg-brand-300": "default/brand fill (light)",
      "bg-brand-500": "default/brand fill (dark)",
      "border-border": "outline variant border",
      "text-foreground": "outline/ghost text",
      "bg-accent": "ghost hover",
      "ring-ring/50": "focus ring",
      "border-destructive": "aria-invalid border",
    },
    whenToUse: [
      "default/brand — primary CTA, one per screen section",
      "outline — secondary action alongside primary",
      "ghost — icon triggers in toolbars, table rows",
      "destructive — irreversible actions (delete, revoke)",
      "link — inline navigational action in text",
      "accent — indigo highlight for feature promotion",
    ],
    antiPatterns: [
      "❌ <button className='px-4 py-2 bg-[#E6F993]'> — raw button without DS styles",
      "❌ Using default variant for destructive actions",
      "❌ Adding onClick to navigation — use asChild with <Link>",
    ],
    example: `<Button variant="default">Save Changes</Button>
<Button variant="destructive" onClick={handleDelete}>Delete</Button>
<Button asChild variant="ghost"><Link to="/settings">Settings</Link></Button>
<Button variant="brand" shape="pill" size="lg">Get Started</Button>`,
  },

  badge: {
    name: "Badge",
    import: `import { Badge } from 'strata-design-system';`,
    description: "Small status or label chip built with CVA.",
    variants: {
      variant: ["solid", "soft", "outline"],
      color: ["zinc", "red", "orange", "amber", "yellow", "lime", "green", "emerald", "teal", "cyan", "sky", "blue", "indigo", "violet", "purple", "fuchsia", "pink", "rose", "brand"],
    },
    tokens: {
      "bg-status-success": "PREFERRED for success states",
      "bg-status-warning": "PREFERRED for warning states",
      "bg-status-error": "PREFERRED for error states",
      "bg-status-info": "PREFERRED for info states",
      "bg-status-ai": "PREFERRED for AI-generated content",
    },
    whenToUse: [
      "Label states on records: Active, Pending, Expired",
      "Category tags in lists or tables",
      "Count indicators (unread, errors)",
      "Status chips next to headings",
    ],
    antiPatterns: [
      "❌ <Badge className='bg-[#098400]'> — hex hardcoded (Tier 1+2 blocker)",
      "❌ <Badge className='bg-green-600'> — raw Tailwind instead of DS status token",
      "✅ <Badge className='bg-status-success/10 text-status-success'> — correct",
    ],
    example: `<Badge className="bg-status-success/10 text-status-success border-status-success/20">Active</Badge>
<Badge className="bg-status-warning/10 text-status-warning border-status-warning/20">Pending</Badge>
<Badge variant="soft" color="brand">Premium</Badge>`,
  },

  card: {
    name: "Card",
    import: `import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter } from 'strata-design-system';`,
    description: "Container for grouped content with composable sub-components.",
    variants: { variant: ["default", "flat", "glass", "brand"] },
    tokens: {
      "bg-card": "default variant background",
      "border-border": "card border",
      "shadow-sm": "default elevation",
      "bg-muted": "flat variant background",
      "bg-card/80 + backdrop-blur": "glass variant",
      "text-card-foreground": "card text",
    },
    whenToUse: [
      "Grouping related fields, stats, or content blocks",
      "Dashboard KPI panels (flat or default)",
      "Floating sidebars over images (glass)",
      "Onboarding / promotional blocks (brand)",
    ],
    antiPatterns: [
      "❌ <div className='bg-white border rounded-lg p-4 shadow'> — raw div, no dark mode",
      "❌ Nesting Card inside Card more than 1 level deep",
    ],
    example: `<Card variant="default">
  <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
  <CardContent><p className="text-sm text-muted-foreground">Content here</p></CardContent>
  <CardFooter className="justify-end gap-2">
    <Button variant="outline">Cancel</Button>
    <Button>Save</Button>
  </CardFooter>
</Card>`,
  },

  input: {
    name: "Input",
    import: `import { Input } from 'strata-design-system';`,
    description: "Styled text input with label, prefix/suffix slots, and auto password toggle.",
    props: ["label", "prefix", "suffix", "type", "placeholder", "disabled", "aria-invalid"],
    tokens: {
      "border-input": "default border",
      "bg-background": "input background",
      "text-foreground": "input text",
      "text-muted-foreground": "placeholder",
      "ring-ring/50": "focus ring",
      "border-destructive + ring-destructive/20": "aria-invalid state",
    },
    whenToUse: [
      "Single-line text: names, emails, URLs, numbers",
      "Search boxes with prefix icon",
      "Password fields (auto-adds toggle)",
      "Always wrap with <Field> in real forms for a11y",
    ],
    antiPatterns: [
      "❌ <input className='border rounded px-3 py-2'> — raw input",
      "❌ Not setting aria-invalid when validation fails",
    ],
    example: `<Input placeholder="Search..." prefix={<MagnifyingGlassIcon className="size-4" />} type="search" />
<Input label="Email" type="email" aria-invalid={!!errors.email} />
<Input label="Password" type="password" />`,
  },

  alert: {
    name: "Alert",
    import: `import { Alert, AlertTitle, AlertDescription } from 'strata-design-system';`,
    description: "Inline feedback message for success, error, warning, info, or brand.",
    variants: { variant: ["default", "destructive", "success", "warning", "info", "brand"] },
    tokens: {
      "border-border + bg-white/bg-zinc-900": "default variant",
      "bg-emerald-50/emerald-900/10 + border-emerald-500": "success",
      "bg-amber-50/amber-900/10 + border-amber-500": "warning",
      "bg-red-50/red-900/10 + border-red-500": "destructive",
    },
    whenToUse: [
      "success — operation completed",
      "destructive — error or permission denied",
      "warning — pending action or quota warning",
      "info — neutral context or feature tip",
    ],
    antiPatterns: [
      "❌ Using Alert for transient toasts — use Sonner",
      "❌ Using Alert inside a modal — use AlertDialog",
      "❌ Stacking more than 2 alerts vertically",
    ],
    example: `<Alert variant="success">
  <CheckCircleIcon className="size-4" />
  <AlertTitle>Saved</AlertTitle>
  <AlertDescription>Changes saved successfully.</AlertDescription>
</Alert>`,
  },

  dialog: {
    name: "Dialog",
    import: `import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from 'strata-design-system';`,
    description: "Modal overlay built on Radix UI Dialog.",
    tokens: {
      "bg-background": "dialog panel bg",
      "border-border": "dialog border",
      "bg-black/50": "backdrop overlay",
      "shadow-lg": "dialog elevation",
    },
    whenToUse: [
      "Multi-field forms (create order, invite user)",
      "Detailed view of a record",
      "Simple confirmations with 2 actions",
    ],
    antiPatterns: [
      "❌ Destructive confirmations — use AlertDialog",
      "❌ Long forms > 10 fields — use Sheet",
      "❌ Notifications — use Sonner",
    ],
    example: `<Dialog>
  <DialogTrigger asChild><Button>Create Order</Button></DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>New Order</DialogTitle>
      <DialogDescription>Fill in order details below.</DialogDescription>
    </DialogHeader>
    {/* form fields */}
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Create</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`,
  },

  avatar: {
    name: "Avatar",
    import: `import { Avatar, AvatarImage, AvatarFallback } from 'strata-design-system';`,
    category: "application-ui",
    description: "User profile image with auto fallback to initials.",
    variants: {
      size: ["xs (24px)", "sm (32px)", "md (40px)", "lg (48px)", "xl (64px)", "2xl (96px)"],
      fallbackVariant: ["default", "muted", "gradient"],
    },
    props: [
      "size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' — controls outer dimensions",
      "className?: string — extends styles (e.g. ring-2 ring-background for stacks)",
      "AvatarImage: src, alt — image source",
      "AvatarFallback: variant?: 'default' | 'muted' | 'gradient', children — text shown when image fails or is missing",
    ],
    tokens: {
      "bg-primary": "default fallback bg",
      "text-primary-foreground": "default fallback text",
      "bg-muted": "muted fallback bg",
      "rounded-full": "circular crop",
      "ring-background": "border ring used in stacked avatar groups",
    },
    whenToUse: [
      "Identifying users in navbars, comments, list rows, mention chips",
      "Stacked groups for collaborator/team displays (use -space-x-2 + ring-2 ring-background)",
      "Initials fallback when image is missing, broken, or still loading",
      "Pair with name + role text in compact rows (don't rely on avatar alone for identification)",
    ],
    antiPatterns: [
      "❌ Plain <img> with rounded-full — loses fallback, sizing tokens, and ring composition",
      "❌ Mixing inconsistent sizes in the same row (avatars in a list should share one size)",
      "❌ Avatar without alt text on AvatarImage — fails screen readers",
      "❌ Decorative-only usage with no name/label nearby — adds noise without identity",
    ],
    example: `<Avatar size="md">
  <AvatarImage src={user.avatarUrl} alt={user.name} />
  <AvatarFallback>{user.initials}</AvatarFallback>
</Avatar>

// Stacked group
<div className="flex -space-x-2">
  {users.slice(0, 3).map(u => (
    <Avatar key={u.id} size="sm" className="ring-2 ring-background">
      <AvatarImage src={u.avatar} alt={u.name} />
      <AvatarFallback variant="gradient">{u.initials}</AvatarFallback>
    </Avatar>
  ))}
</div>`,
  },

  table: {
    name: "Table",
    import: `import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from 'strata-design-system';`,
    description: "Composable data table with striped and dense variants.",
    props: ["striped", "dense"],
    tokens: {
      "border-border": "table/cell borders",
      "bg-muted/50": "striped alternate rows",
      "hover:bg-muted/50": "row hover",
      "text-muted-foreground": "header text",
    },
    whenToUse: [
      "Structured records with 3+ columns",
      "striped — dense numeric data",
      "dense — sidebar panels with limited space",
    ],
    antiPatterns: [
      "❌ For 1-2 column data — use DescriptionList",
      "❌ Raw <table> without DS components — no dark mode",
    ],
    example: `<Table striped>
  <TableHeader>
    <TableRow>
      <TableHead>Invoice</TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="text-right">Amount</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {rows.map(row => (
      <TableRow key={row.id}>
        <TableCell className="font-medium">{row.id}</TableCell>
        <TableCell><Badge className="bg-status-success/10 text-status-success">{row.status}</Badge></TableCell>
        <TableCell className="text-right">{row.amount}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>`,
  },

  "navbar-floating": {
    name: "NavbarFloating",
    import: `import { NavbarFloating } from 'strata-design-system';`,
    description: "Floating pill navbar fixed at top of viewport.",
    tokens: {
      "bg-card/80": "translucent glass bg",
      "backdrop-blur-xl": "blur effect",
      "border-border": "pill border",
      "rounded-full": "pill shape",
      "shadow-lg": "floating elevation",
      "z-50": "stacking order",
    },
    whenToUse: [
      "Landing pages and demo screens",
      "Floating navigation over hero images",
    ],
    antiPatterns: [
      "❌ Production app shells — use Layout (Navbar + PageHeader)",
      "❌ When you need full nav with tabs/dropdowns — use Navbar",
    ],
    example: `<NavbarFloating>
  <Button variant="ghost" size="icon" asChild>
    <Link to="/"><HomeIcon className="size-4" /></Link>
  </Button>
  <span className="font-semibold text-foreground px-2">Strata DS</span>
  <div className="flex-1" />
  <Button variant="default" shape="pill" size="sm">Get Started</Button>
</NavbarFloating>`,
  },

  // ── APPLICATION UI ───────────────────────────────────────────────────────────

  "action-center": {
    name: "ActionCenter",
    import: `import ActionCenter from 'strata-design-system/action-center';`,
    category: "application-ui",
    description: "Notification hub displayed as a Popover anchored to a bell icon. Categorized tabs (Alerts, Discrepancies, Payments, Approvals, Live chat) with search and an integrated chat view.",
    props: [
      "actionConfigMap?: Record<string, ActionConfig> — map of notification action IDs to action config",
      "onActionExecute?: (action, notification) => void — handler invoked when a notification action is clicked",
      "dataState?: { status: 'loading' | 'success' | 'error' | 'empty', notifications?, error? } — external data state for loading/empty/error rendering",
      "className?: string",
    ],
    tokens: {
      "bg-popover": "panel background",
      "border-border": "panel border",
      "text-status-error": "alert/error notifications",
      "text-status-warning": "discrepancy notifications",
      "text-status-success": "approval notifications",
      "bg-muted": "search input + chat view neutral surface",
    },
    whenToUse: [
      "Top-right bell in app shells where users see system-generated notifications",
      "Multi-category alerts mixing alerts, payments, approvals — let the user filter via tabs",
      "Apps with a chat fallback when an action requires human follow-up (Live chat tab)",
      "When you need controlled empty/loading/error states from upstream data",
    ],
    antiPatterns: [
      "❌ As a primary navigation menu — use Navbar/NavigationMenu instead",
      "❌ For toast-style transient feedback — use Sonner toasts",
      "❌ Embedding directly in page content (it's a Popover; needs a trigger)",
      "❌ Skipping dataState when wiring real data — internal mocks are dev-only",
    ],
    example: `// Default with internal mocks
<ActionCenter />

// Wired to real data with action handlers
<ActionCenter
  dataState={{ status: 'success', notifications }}
  actionConfigMap={{
    approve: { label: 'Approve', type: 'primary', requiresConfirmation: true },
    dismiss: { label: 'Dismiss', type: 'ghost' },
  }}
  onActionExecute={(action, notif) => handleAction(action.id, notif.id)}
/>`,
  },

  "create-order-dialog": {
    name: "CreateOrderDialog",
    import: `import { CreateOrderDialog, type CreateOrderStep } from 'strata-design-system';`,
    category: "application-ui",
    description: "Multi-step dialog for guided order creation. Composes initial selection, manual creation, template selection, quote selection, file import, analysis, draft, and processing views into a single flow.",
    props: [
      "open: boolean — controlled open state",
      "onOpenChange: (open: boolean) => void — toggle handler",
      "step?: CreateOrderStep — current step ('initial' | 'manual' | 'template' | 'quote' | 'import-file' | 'import-analysis' | 'draft' | 'processing')",
      "onStepChange?: (step: CreateOrderStep) => void",
      "initialData?: Partial<OrderDraft>",
      "onSubmit?: (order: OrderDraft) => Promise<void> | void",
    ],
    tokens: {
      "bg-card": "surface for sub-views",
      "border-border": "step separator + container borders",
      "bg-muted": "dropzone idle background",
      "ring-brand-500": "active step indicator",
      "text-status-error": "validation errors",
    },
    whenToUse: [
      "Sales/operations apps where a draft → review → submit order flow is needed",
      "When users must choose between manual entry, file import, template, or existing quote as the order source",
      "When the order creation cannot fit a single screen and needs a wizard",
    ],
    antiPatterns: [
      "❌ Inline order forms — use this dialog so the rest of the page stays scrollable",
      "❌ Bypassing the steps to render a single sub-view directly — compose CreateOrder*View pieces yourself if you need that",
      "❌ Calling onSubmit without the processing step — users lose feedback during async work",
    ],
    example: `<CreateOrderDialog
  open={open}
  onOpenChange={setOpen}
  step={step}
  onStepChange={setStep}
  onSubmit={async (order) => {
    await api.orders.create(order);
    setOpen(false);
  }}
/>`,
    governance: { tier: 1, notes: "Composite component — all sub-views are also exported for advanced composition." },
  },

  "activity-timeline": {
    name: "ActivityTimeline",
    import: `import { ActivityTimeline, ActivityTimelineStageRow, type ActivityTimelineItem } from 'strata-design-system';`,
    category: "application-ui",
    description: "Vertical chronological timeline with icons, separator lines, and content rows. Pass items array or compose with ActivityTimelineStageRow for fine control.",
    props: [
      "items: ActivityTimelineItem[] — array of timeline entries",
      "className?: string",
      "ActivityTimelineStageRow.icon: ReactNode — icon shown in the circle",
      "ActivityTimelineStageRow.circleBackgroundClassName?: string — override circle bg per item",
      "ActivityTimelineStageRow.separatorClassName?: string — override the vertical line",
      "ActivityTimelineStageRow.isLast?: boolean — hide the trailing separator",
    ],
    tokens: {
      "rounded-full": "circle around each row's icon",
      "shrink-0": "icon column never shrinks",
      "items-stretch": "row stretches so the separator runs the full height",
      "pb-4": "default vertical spacing between rows",
    },
    whenToUse: [
      "Order tracking with status changes over time",
      "Audit logs of admin or system actions",
      "Onboarding progress (steps completed → current → upcoming)",
      "Activity feeds for entities (user, project, ticket)",
    ],
    antiPatterns: [
      "❌ Raw <ul> with custom dividers — no DS tokens, no dark mode",
      "❌ For shipping flows with discrete named stages — use Tracking",
      "❌ For paginated activity lists — wrap in StackedList instead",
    ],
    example: `<ActivityTimeline
  items={[
    { id: "1", icon: <CheckCircleIcon className="size-4 text-status-success" />, content: <p className="text-sm">Order confirmed · <span className="text-muted-foreground">2m ago</span></p> },
    { id: "2", icon: <TruckIcon className="size-4 text-status-info" />, content: <p className="text-sm">Shipped via UPS</p> },
    { id: "3", icon: <PackageIcon className="size-4 text-muted-foreground" />, content: <p className="text-sm">Delivered</p>, isLast: true },
  ]}
/>`,
  },

  "aspect-ratio": {
    name: "AspectRatio",
    import: `import { AspectRatio } from 'strata-design-system';`,
    category: "application-ui",
    description: "Wrapper that maintains a fixed aspect ratio for media (images, videos, embeds). Built on Radix AspectRatio.",
    props: [
      "ratio: number — width/height ratio (e.g., 16/9, 1, 4/3)",
      "asChild?: boolean — render the child element instead of a wrapper div",
      "children: ReactNode",
      "className?: string",
    ],
    tokens: {
      "rounded-lg": "common companion class for rounded media corners",
      "border-border": "thin frame around iframe/img embeds",
      "object-cover": "applied on the inner img/video so it fills the box without distortion",
    },
    whenToUse: [
      "Image cards in grids — keeps consistent shape across thumbnails",
      "Video and Loom embeds (ratio={16/9})",
      "Square avatars or product tiles (ratio={1})",
      "Photo cards (ratio={4/3} or 3/2)",
    ],
    antiPatterns: [
      "❌ padding-top: 56.25% hack — use AspectRatio for cleaner intent",
      "❌ Fixed height + object-cover without aspect ratio — breaks responsive widths",
      "❌ Wrapping multiple children — AspectRatio expects a single child filling the box",
    ],
    example: `// Video embed
<AspectRatio ratio={16 / 9}>
  <iframe src="https://www.loom.com/embed/..." className="w-full h-full rounded-lg border border-border" />
</AspectRatio>

// Square thumbnail
<AspectRatio ratio={1}>
  <img src={thumbnail} alt={alt} className="object-cover w-full h-full" />
</AspectRatio>`,
  },

  "banner": {
    name: "Banner",
    import: `import { Banner } from 'strata-design-system';`,
    category: "application-ui",
    description: "Full-width announcement bar for site-level alerts, promotions, or notices. Dismissible.",
    variants: {
      variant: ["info (default)", "success", "warning", "error"],
    },
    props: [
      "variant?: 'info' | 'success' | 'warning' | 'error' (default: 'info')",
      "dismissible?: boolean",
      "onDismiss?: () => void",
      "children: ReactNode",
      "className?: string",
    ],
    tokens: {
      "bg-zinc-900 / bg-zinc-100 (dark)": "info — inverted high-contrast bg",
      "bg-amber-50 / bg-amber-950/30": "warning bg",
      "bg-red-50 / bg-red-950/30": "error bg",
      "border-amber-200 / border-amber-900/50": "warning border",
      "border-red-200 / border-red-900/50": "error border",
    },
    whenToUse: [
      "Maintenance notices at the top of the site",
      "Cookie consent or terms acceptance banners",
      "New feature or release announcements",
      "Breaking change warnings or migration deadlines",
    ],
    antiPatterns: [
      "❌ Inline Alert for site-wide messages — use Banner at the top of Layout",
      "❌ Modal Dialog for non-blocking notices — Banner is non-intrusive",
      "❌ Stacking 2+ active Banners — pick one priority message",
      "❌ Banner inside Cards — the full-width treatment doesn't fit nested contexts",
    ],
    example: `<Banner variant="info" dismissible onDismiss={() => setShown(false)}>
  New features available — <a href="/changelog" className="underline font-semibold">see what's new</a>
</Banner>

<Banner variant="warning">
  Scheduled maintenance: Saturday 10pm–12am UTC
</Banner>

<Banner variant="error" dismissible>
  Payment failed. <a href="/billing" className="underline">Update billing</a>
</Banner>`,
    governance: {
      tier: 2,
      notes: "Currently uses zinc/amber/red palette directly instead of bg-status-* tokens. Flagged for refactor in Tier 1 audit.",
    },
  },

  "breadcrumb": {
    name: "Breadcrumb",
    import: `import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis } from 'strata-design-system';`,
    category: "application-ui",
    description: "Navigation trail showing the hierarchical path to the current page. Use BreadcrumbPage for the active leaf and BreadcrumbEllipsis to collapse long paths.",
    props: [
      "Breadcrumb — semantic <nav aria-label='breadcrumb'> wrapper",
      "BreadcrumbList — ordered list of items",
      "BreadcrumbItem — single segment wrapper",
      "BreadcrumbLink.asChild?: boolean — slot for router Link",
      "BreadcrumbPage — current page (no link, semantic <span aria-current='page'>)",
      "BreadcrumbSeparator — chevron by default; pass children to override",
      "BreadcrumbEllipsis — collapsed indicator for long paths",
    ],
    tokens: {
      "text-muted-foreground": "parent links color (default)",
      "text-foreground": "current page (BreadcrumbPage) color",
      "hover:text-foreground": "link hover state",
      "gap-1.5": "spacing between segments",
      "size-3.5": "default chevron icon size",
    },
    whenToUse: [
      "3+ levels of navigation (Settings > Team > Members)",
      "Inside PageHeader to show the current location",
      "File explorer paths or content hierarchy",
      "Collapse middle items with BreadcrumbEllipsis when path > 4 levels deep",
    ],
    antiPatterns: [
      "❌ Hardcoded text colors — use text-muted-foreground for parents, text-foreground for the page",
      "❌ Plain <a> inside BreadcrumbLink for client routing — use asChild + <Link>",
      "❌ Showing breadcrumb on root (1-level) pages — provides no value",
      "❌ Using a <span> for the active page — use BreadcrumbPage for correct aria-current",
    ],
    example: `<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink asChild><Link to="/">Home</Link></BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink asChild><Link to="/settings">Settings</Link></BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Team Members</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>

// Long path with ellipsis
<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem><BreadcrumbLink asChild><Link to="/">Home</Link></BreadcrumbLink></BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem><BreadcrumbEllipsis /></BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem><BreadcrumbPage>Current</BreadcrumbPage></BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`,
  },

  "calendar": {
    name: "Calendar",
    import: `import { Calendar } from 'strata-design-system';`,
    category: "application-ui",
    description: "Date picker calendar grid built on react-day-picker. The raw inline calendar; for form fields use DatePicker which wraps it in a Popover.",
    variants: {
      mode: ["single (default)", "multiple", "range"],
    },
    props: [
      "mode?: 'single' | 'multiple' | 'range'",
      "selected: Date | Date[] | DateRange | undefined",
      "onSelect: (date) => void",
      "disabled?: Matcher | Matcher[] — disable specific days",
      "fromDate?: Date / toDate?: Date — min/max bounds",
      "showOutsideDays?: boolean (default: true)",
      "numberOfMonths?: number — show multiple months side-by-side",
      "...all DayPicker props from react-day-picker",
    ],
    tokens: {
      "bg-primary": "selected day background",
      "text-primary-foreground": "selected day text",
      "bg-accent": "today / hover state on day cell",
      "text-foreground": "default day text",
      "text-muted-foreground": "outside days, weekday header row",
      "rounded-md": "day cell border radius",
      "p-3": "calendar outer padding",
    },
    whenToUse: [
      "Inline date selection (booking forms, scheduling pages)",
      "Inside a Popover for compact field UI — but prefer DatePicker which already does this",
      "mode='range' for booking date ranges (check-in / check-out)",
      "mode='multiple' for selecting non-contiguous dates",
      "numberOfMonths={2} for longer range pickers",
    ],
    antiPatterns: [
      "❌ <input type='date'> — no DS styling, inconsistent across browsers",
      "❌ Building a custom calendar grid — use Calendar (Radix + react-day-picker)",
      "❌ Calendar inline in a tight form when space is limited — wrap with DatePicker",
    ],
    example: `// Single date
const [date, setDate] = useState<Date | undefined>(new Date());
<Calendar mode="single" selected={date} onSelect={setDate} />

// Date range
const [range, setRange] = useState<DateRange | undefined>();
<Calendar mode="range" selected={range} onSelect={setRange} numberOfMonths={2} />

// Bounded
<Calendar
  mode="single"
  selected={date}
  onSelect={setDate}
  fromDate={new Date()}
  toDate={addDays(new Date(), 30)}
/>`,
  },

  "carousel": {
    name: "Carousel",
    import: `import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, type CarouselApi } from 'strata-design-system';`,
    category: "application-ui",
    description: "Horizontal or vertical scrolling content carousel built on Embla Carousel. Supports plugins (autoplay, classNames) via the plugins prop.",
    variants: {
      orientation: ["horizontal (default)", "vertical"],
    },
    props: [
      "opts?: CarouselOptions — Embla config (align, loop, slidesToScroll, etc.)",
      "plugins?: CarouselPlugin[] — Embla plugins (autoplay, classNames)",
      "orientation?: 'horizontal' | 'vertical'",
      "setApi?: (api: CarouselApi) => void — get the Embla API for programmatic control",
      "className?: string",
    ],
    tokens: {
      "overflow-hidden": "carousel viewport clipping",
      "-ml-4 / pl-4": "horizontal item gap (negative margin pattern)",
      "-mt-4 / pt-4": "vertical item gap",
      "size-8 + rounded-full": "previous/next button size and shape",
      "shrink-0 grow-0 basis-full": "default item sizing — override basis for multi-item view",
    },
    whenToUse: [
      "Image galleries / product showcases",
      "Testimonial sliders on landing pages",
      "Onboarding step carousels",
      "Override basis on CarouselItem for multi-item layouts: `md:basis-1/2 lg:basis-1/3`",
      "Use opts={{ loop: true }} for endless scroll",
    ],
    antiPatterns: [
      "❌ For navigation tabs — use Tabs",
      "❌ For paginated tables/lists — use Pagination",
      "❌ Auto-rotating banners that hide content — single Banner is more accessible",
      "❌ Without CarouselPrevious/Next on touch-only contexts when swipe is not obvious",
    ],
    example: `<Carousel opts={{ align: "start", loop: true }} className="w-full max-w-xl">
  <CarouselContent>
    {items.map((item) => (
      <CarouselItem key={item.id} className="md:basis-1/2 lg:basis-1/3">
        <Card>
          <CardContent className="p-6">{item.content}</CardContent>
        </Card>
      </CarouselItem>
    ))}
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>

// Programmatic control
const [api, setApi] = useState<CarouselApi>();
<Carousel setApi={setApi}>{/* ... */}</Carousel>
<Button onClick={() => api?.scrollNext()}>Next</Button>`,
  },

  "chart": {
    name: "Chart",
    import: `import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartStyle, type ChartConfig } from 'strata-design-system';`,
    category: "application-ui",
    description: "Data visualization wrapper for Recharts with DS token integration. Always pair with a ChartConfig that defines series colors via DS chart tokens.",
    props: [
      "ChartContainer.config: ChartConfig — required, defines series labels and colors",
      "ChartContainer.id?: string — uniquely identifies the chart for ChartStyle",
      "ChartContainer.children: ReactElement — single Recharts chart",
      "ChartTooltipContent.indicator?: 'line' | 'dot' | 'dashed'",
      "ChartTooltipContent.hideLabel?: boolean / hideIndicator?: boolean",
      "ChartTooltipContent.nameKey?: string / labelKey?: string",
      "ChartLegendContent.verticalAlign?: 'top' | 'middle' | 'bottom'",
      "ChartLegendContent.hideIcon?: boolean",
    ],
    tokens: {
      "--color-chart-1 to --color-chart-5": "DS chart color tokens — reference these in ChartConfig",
      "border-border/50": "tooltip border",
      "bg-background": "tooltip background",
      "text-muted-foreground": "axis labels and secondary text",
      "fill-muted-foreground / stroke-border": "axis ticks and grid lines",
      "shadow-xl": "tooltip elevation",
      "font-mono tabular-nums": "tooltip values (consistent number alignment)",
    },
    whenToUse: [
      "Bar / line / area / pie charts in dashboards",
      "Always define ChartConfig with var(--color-chart-N) tokens",
      "Use ChartTooltip + ChartTooltipContent for consistent tooltip styling",
      "Use ChartLegend + ChartLegendContent for charts with multiple series",
    ],
    antiPatterns: [
      "❌ Custom hex colors in chart data — use var(--color-chart-1) through chart-5",
      "❌ Manual <Tooltip> from Recharts — wrap with ChartTooltipContent for DS styling",
      "❌ Chart without ChartContainer — loses dark mode and config integration",
      "❌ More than 5 series with chart tokens — only 5 chart colors are defined",
    ],
    example: `const chartConfig = {
  revenue: { label: "Revenue", color: "var(--color-chart-1)" },
  expenses: { label: "Expenses", color: "var(--color-chart-2)" },
} satisfies ChartConfig;

<ChartContainer config={chartConfig} className="h-64 w-full">
  <BarChart data={data}>
    <CartesianGrid vertical={false} />
    <XAxis dataKey="month" />
    <YAxis />
    <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
    <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
    <ChartTooltip content={<ChartTooltipContent />} />
    <ChartLegend content={<ChartLegendContent />} />
  </BarChart>
</ChartContainer>`,
  },

  "collapsible": {
    name: "Collapsible",
    import: `import { Collapsible, CollapsibleTrigger, CollapsibleContent } from 'strata-design-system';`,
    category: "application-ui",
    description: "Single expandable/collapsible section with smooth height animation, built on Radix Collapsible. For multi-section accordions use Accordion.",
    props: [
      "Collapsible.open?: boolean — controlled open state",
      "Collapsible.onOpenChange?: (open: boolean) => void",
      "Collapsible.defaultOpen?: boolean — uncontrolled initial state",
      "Collapsible.disabled?: boolean",
      "CollapsibleTrigger — button trigger; wrap with asChild for custom Button",
      "CollapsibleContent — animated content panel",
    ],
    tokens: {
      "overflow-hidden": "clips content during height animation",
      "data-[state=open]:animate-collapsible-down": "expand animation (defined in tailwind config)",
      "data-[state=closed]:animate-collapsible-up": "collapse animation",
    },
    whenToUse: [
      "Show more / show less for long content",
      "Optional advanced settings inside a form",
      "Expandable list items with detail view",
      "Collapsible sidebar groups (single, not multi)",
    ],
    antiPatterns: [
      "❌ For multiple FAQ items where one expands at a time — use Accordion (type='single')",
      "❌ For modal-like content — use Dialog or Sheet",
      "❌ Wrapping CollapsibleContent in additional overflow containers — breaks the height animation",
      "❌ CollapsibleTrigger without asChild + Button — loses DS button states (focus ring, hover)",
    ],
    example: `<Collapsible>
  <CollapsibleTrigger asChild>
    <Button variant="ghost" size="sm">
      Show more <ChevronDownIcon className="size-4 ml-1 transition-transform data-[state=open]:rotate-180" />
    </Button>
  </CollapsibleTrigger>
  <CollapsibleContent className="space-y-2 mt-2">
    <p className="text-sm text-muted-foreground">Additional details...</p>
    <p className="text-sm text-muted-foreground">More content here.</p>
  </CollapsibleContent>
</Collapsible>

// Controlled
const [open, setOpen] = useState(false);
<Collapsible open={open} onOpenChange={setOpen}>{/* ... */}</Collapsible>`,
  },

  "command": {
    name: "Command",
    import: `import { Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandShortcut, CommandSeparator } from 'strata-design-system';`,
    category: "application-ui",
    description: "Command palette with fuzzy search built on cmdk. Use Command inline or CommandDialog for the standard ⌘K modal pattern.",
    props: [
      "Command — extends CommandPrimitive props (value, onValueChange, filter, shouldFilter, loop)",
      "CommandDialog — wraps Command in a Dialog (title?, description?, children + Dialog props)",
      "CommandInput — search input with built-in icon",
      "CommandList — scrollable list container (max-h-[300px] by default)",
      "CommandEmpty — shown when no results match (children render as fallback)",
      "CommandGroup — group of items with optional `heading`",
      "CommandItem — selectable row (value, onSelect, disabled)",
      "CommandShortcut — right-aligned keyboard hint (⌘K, Enter)",
      "CommandSeparator — divider between groups",
    ],
    tokens: {
      "bg-popover": "command panel background",
      "text-popover-foreground": "command panel text",
      "rounded-md": "panel and item border radius",
      "bg-accent": "selected/highlighted item background",
      "text-accent-foreground": "selected item text",
      "text-muted-foreground": "group headings, empty state",
      "bg-border": "separator color",
      "outline-hidden": "removes browser focus outline (custom focus uses bg-accent)",
    },
    whenToUse: [
      "App-wide search / action launcher (⌘K, Ctrl+K)",
      "Quick navigation across the app (route jumper)",
      "Filterable list inside a Popover (use Command inline, not CommandDialog)",
      "Multi-step command pickers (combine with state to swap children)",
    ],
    antiPatterns: [
      "❌ For simple value selection from < 10 options — use Select",
      "❌ For multi-select with chips — use SearchableMultiSelect",
      "❌ Skipping CommandEmpty — empty state without feedback breaks UX",
      "❌ CommandDialog without a global keyboard shortcut listener — users won't discover it",
    ],
    example: `// Standalone (inline or in Popover)
<Command>
  <CommandInput placeholder="Type a command..." />
  <CommandList>
    <CommandEmpty>No results found.</CommandEmpty>
    <CommandGroup heading="Navigation">
      <CommandItem onSelect={() => navigate('/dashboard')}>
        Dashboard <CommandShortcut>⌘D</CommandShortcut>
      </CommandItem>
      <CommandItem onSelect={() => navigate('/settings')}>
        Settings <CommandShortcut>⌘,</CommandShortcut>
      </CommandItem>
    </CommandGroup>
    <CommandSeparator />
    <CommandGroup heading="Actions">
      <CommandItem>Create Order</CommandItem>
    </CommandGroup>
  </CommandList>
</Command>

// Modal palette (⌘K pattern)
const [open, setOpen] = useState(false);
useEffect(() => {
  const onKey = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') setOpen(o => !o); };
  document.addEventListener('keydown', onKey);
  return () => document.removeEventListener('keydown', onKey);
}, []);

<CommandDialog open={open} onOpenChange={setOpen} title="Command palette">
  <CommandInput placeholder="Search…" />
  <CommandList>{/* groups */}</CommandList>
</CommandDialog>`,
  },

  "company-greeting": {
    name: "CompanyGreeting",
    import: `import { CompanyGreeting } from 'strata-design-system';`,
    category: "application-ui",
    description: "Simple greeting block with a heading + subheading pair. Lightweight wrapper over Heading/Subheading for dashboard tops.",
    props: [
      "heading: string — primary greeting line (e.g., 'Good morning, Diego')",
      "subheading: string — context line (e.g., 'Acme Corp · 12 active orders')",
    ],
    tokens: {
      "text-foreground": "heading color (via Heading)",
      "text-muted-foreground": "subheading color (via Subheading)",
    },
    whenToUse: [
      "Dashboard home page top section",
      "Post-login welcome screens",
      "When you need a consistent greeting pattern across pages",
    ],
    antiPatterns: [
      "❌ Custom h1+p with manual sizing — use CompanyGreeting for typography consistency",
      "❌ Using CompanyGreeting as the only content — it's a header pattern, pair with KpiCards or content below",
    ],
    example: `<CompanyGreeting
  heading="Good morning, Diego"
  subheading="Acme Corp · 12 active orders · 3 alerts"
/>`,
  },

  "copy-button": {
    name: "CopyButton",
    import: `import { CopyButton, type CopyFormat } from 'strata-design-system';`,
    category: "application-ui",
    description: "Clipboard button with optional format dropdown. Pass multiple formats to give the user a choice (e.g., copy as JSON / Markdown / cURL).",
    props: [
      "formats: CopyFormat[] — array of { label, value, description? }",
      "defaultFormat?: number — initial selected format index (default: 0)",
      "size?: 'sm' | 'md' (default: 'md')",
    ],
    tokens: {
      "bg-zinc-100 / dark:bg-zinc-800": "button background (Tier 2 — uses zinc directly)",
      "border-zinc-300 / dark:border-zinc-700": "button border",
      "text-zinc-700 / dark:text-zinc-300": "button text color",
      "text-success": "checkmark and 'Copied' label color",
      "hover:bg-zinc-200 / dark:hover:bg-zinc-700": "hover state",
    },
    whenToUse: [
      "Code blocks and snippets (single format)",
      "API keys and tokens — combine with masking",
      "Share URLs (simple `formats={[{label, value}]}` single format)",
      "Multi-format export (JSON / cURL / Markdown / shell command)",
    ],
    antiPatterns: [
      "❌ Custom navigator.clipboard wrappers — use CopyButton for consistent feedback animation",
      "❌ Single Button + onClick={() => navigator.clipboard.writeText(...)} — re-implements existing UX",
      "❌ Passing more than 4 formats — use a Select or Combobox instead",
    ],
    example: `// Single format
<CopyButton formats={[{ label: 'Copy', value: 'npm install strata-design-system' }]} />

// Multiple formats with descriptions
<CopyButton
  formats={[
    { label: 'JSON', value: JSON.stringify(data), description: 'Structured data' },
    { label: 'cURL', value: \`curl -X POST ...\`, description: 'Shell command' },
    { label: 'Markdown', value: '| col | col |\\n|---|---|', description: 'Documentation' },
  ]}
  size="sm"
/>`,
    governance: {
      tier: 2,
      notes: "Currently uses zinc-* palette directly instead of bg-muted/text-foreground. Flagged for Tier 1 refactor.",
    },
  },

  "divider": {
    name: "Divider",
    import: `import { Divider } from 'strata-design-system';`,
    category: "application-ui",
    description: "Horizontal hr divider with two opacity strengths via the `soft` prop. For Radix-based separator with vertical support use Separator.",
    variants: {
      soft: ["false (default — stronger 10% opacity)", "true (lighter 5% opacity)"],
    },
    props: [
      "soft?: boolean — when true uses lighter border opacity (default: false)",
      "...all native <hr> props (className, etc.)",
    ],
    tokens: {
      "border-zinc-950/10 / dark:border-white/10": "default divider color (10% opacity)",
      "border-zinc-950/5 / dark:border-white/5": "soft divider color (5% opacity)",
      "border-t": "top-border style",
    },
    whenToUse: [
      "Section breaks inside Cards or forms",
      "Lists where rows need a visible separator",
      "Form section transitions (use soft for lighter feel)",
    ],
    antiPatterns: [
      "❌ <hr className='border-gray-200'> — no dark mode",
      "❌ For vertical dividers — use Separator with orientation='vertical'",
      "❌ For labeled dividers ('OR') — wrap manually with text + Divider above and below",
      "❌ Multiple Dividers stacked without spacing — defeats the purpose",
    ],
    example: `<Divider />              {/* default 10% opacity */}
<Divider soft />         {/* lighter 5% opacity for subtle splits */}

// Inside a Card section
<Card>
  <CardHeader><CardTitle>Settings</CardTitle></CardHeader>
  <CardContent>{section1}</CardContent>
  <Divider soft className="my-6" />
  <CardContent>{section2}</CardContent>
</Card>`,
  },

  "experiences-navbar": {
    name: "ExperiencesNavbar",
    import: `import { ExperiencesNavbar, type ExperiencesNavbarProps, type ExperiencesNavTab, type ExperiencesNavItemProps } from 'strata-design-system';`,
    category: "application-ui",
    description: "Application navigation bar tailored for the Experiences product. Includes brand logo (light/dark variants), nav items with icons, action center, quick actions, and logout.",
    props: [
      "navItems: ExperiencesNavItemProps[] — { label, icon, path }[]",
      "onNavigate: (page: string) => void — fires when a nav item is clicked",
      "onNavigateToWorkspace: () => void — workspace switcher action",
      "onLogout: () => void",
      "activeTab?: string — id of the active nav item",
      "logoLight?: ReactNode / logoDark?: ReactNode — theme-specific brand logos",
      "hideActionCenter?: boolean (default: false)",
      "hideQuickActions?: boolean (default: false)",
      "actionCenterActionConfigMap? / onActionCenterActionExecute? / actionCenterDataState? — wire ActionCenter behavior",
    ],
    tokens: {
      "bg-navbar/80 + backdrop-blur-xl": "translucent navbar background",
      "border-border": "navbar border",
      "shadow-lg / dark:shadow-glow-md": "elevation",
      "bg-brand-300 / dark:bg-brand-500": "active nav item / brand CTA",
      "bg-accent + text-foreground": "hovered nav item",
      "text-muted-foreground": "inactive nav item text",
      "focus-visible:ring-2 + ring-ring + ring-offset-2": "focus state",
    },
    whenToUse: [
      "Inside the Experiences product shell — not for general apps",
      "When you need integrated ActionCenter and QuickActions in the navbar",
      "Replace with Navbar for generic application shells",
    ],
    antiPatterns: [
      "❌ For generic app shells — use Navbar (this is product-specific)",
      "❌ For landing/marketing pages — use NavbarFloating",
      "❌ Without onLogout / onNavigate handlers — the navbar will silently fail",
    ],
    example: `<ExperiencesNavbar
  navItems={[
    { label: 'Dashboard', icon: <HomeIcon />, path: '/dashboard' },
    { label: 'Orders', icon: <PackageIcon />, path: '/orders' },
    { label: 'Inventory', icon: <BoxIcon />, path: '/inventory' },
  ]}
  activeTab="/dashboard"
  onNavigate={(path) => router.push(path)}
  onNavigateToWorkspace={() => router.push('/workspace')}
  onLogout={() => signOut()}
  logoLight={<LogoLight />}
  logoDark={<LogoDark />}
/>`,
  },

  "feature-section": {
    name: "FeatureSection",
    import: `import { FeatureSection, FeatureGrid, Feature, FeatureIcon, FeatureTitle, FeatureDescription } from 'strata-design-system';`,
    category: "application-ui",
    description: "Composable landing page feature highlights. Compose with FeatureGrid + Feature + FeatureIcon/Title/Description for layout flexibility.",
    props: [
      "FeatureSection — outer <section> wrapper (py-24 sm:py-32)",
      "FeatureGrid — responsive grid container (gap-x-8, gap-y-16)",
      "Feature — single feature column wrapper",
      "FeatureIcon — icon container (h-10 w-10, rounded-lg, bg-blue-600 default)",
      "FeatureTitle — feature heading (h3, semibold)",
      "FeatureDescription — feature body text (dd element)",
      "All accept className for overrides",
    ],
    tokens: {
      "py-24 / sm:py-32": "outer vertical padding",
      "max-w-7xl / px-6 / lg:px-8": "container width and horizontal padding",
      "h-10 w-10 + rounded-lg + bg-blue-600": "default icon container (Tier 2 — uses raw blue)",
      "text-zinc-900 / dark:text-white": "feature title color",
      "text-zinc-600 / dark:text-zinc-400": "feature description color",
    },
    whenToUse: [
      "Marketing landing pages — feature/capability grids",
      "Product comparison sections",
      "Onboarding step explanations",
      "Use FeatureGrid with grid-cols-1 md:grid-cols-2 lg:grid-cols-3 for typical 3-up layouts",
    ],
    antiPatterns: [
      "❌ For dashboard widgets — use KpiCard or Card",
      "❌ For pricing comparisons — use Pricing component",
      "❌ Manual <section><div className='grid'>...</div></section> — use FeatureSection + FeatureGrid",
    ],
    example: `<FeatureSection>
  <div className="mx-auto max-w-2xl text-center">
    <h2 className="text-3xl font-bold text-foreground">Everything you need</h2>
    <p className="mt-4 text-muted-foreground">Production-ready components from day one.</p>
  </div>
  <FeatureGrid className="mx-auto mt-16 max-w-7xl grid-cols-1 md:grid-cols-3">
    <Feature>
      <FeatureIcon><ZapIcon className="size-5 text-white" /></FeatureIcon>
      <FeatureTitle>Fast</FeatureTitle>
      <FeatureDescription>Sub-100ms response from any endpoint.</FeatureDescription>
    </Feature>
    <Feature>
      <FeatureIcon><LockIcon className="size-5 text-white" /></FeatureIcon>
      <FeatureTitle>Secure</FeatureTitle>
      <FeatureDescription>SOC 2 Type II certified out of the box.</FeatureDescription>
    </Feature>
    <Feature>
      <FeatureIcon><GlobeIcon className="size-5 text-white" /></FeatureIcon>
      <FeatureTitle>Global</FeatureTitle>
      <FeatureDescription>Edge presence in 200+ cities worldwide.</FeatureDescription>
    </Feature>
  </FeatureGrid>
</FeatureSection>`,
    governance: {
      tier: 2,
      notes: "FeatureIcon defaults to bg-blue-600 instead of bg-primary. Override via className when needed.",
    },
  },

  "filter-panel": {
    name: "FilterPanel",
    import: `import { FilterPanel, FilterPanelHeader, FilterPanelHeaderTitle, FilterPanelSection, FilterPanelSectionTrigger, FilterPanelSectionContent, FilterPanelOption } from 'strata-design-system';`,
    category: "application-ui",
    description: "Composable sidebar/sheet panel for faceted filtering. Sections collapse/expand via Radix Collapsible underneath.",
    variants: {
      mode: ["sidebar (default — w-60 shrink-0)", "sheet (full width)"],
    },
    props: [
      "FilterPanel.mode?: 'sidebar' | 'sheet' (default: 'sidebar')",
      "FilterPanelHeader — title + reset action row",
      "FilterPanelHeaderTitle — section heading (text-lg font-semibold)",
      "FilterPanelSection — collapsible filter group (data-state controls open/close)",
      "FilterPanelSectionTrigger — clickable group header with rotating chevron",
      "FilterPanelSectionContent — group body (checkboxes, range, search inside)",
      "FilterPanelOption — single option row inside a section",
    ],
    tokens: {
      "flex flex-col": "panel layout",
      "gap-6": "spacing between sections",
      "gap-2": "spacing inside a section",
      "text-lg font-semibold text-foreground": "panel title",
      "text-sm font-medium": "section trigger text",
      "[&[data-state=open]>svg]:rotate-180": "chevron rotation on expand",
    },
    whenToUse: [
      "Faceted search on product listings (categories + price + tags)",
      "Data table filtering with multiple dimensions",
      "Catalog views — sidebar for desktop, sheet for mobile (use mode prop responsively)",
      "Use FilterPanelHeader with a Reset button next to FilterPanelHeaderTitle",
    ],
    antiPatterns: [
      "❌ Inline filter chips above a list when > 4 dimensions — use FilterPanel",
      "❌ Custom collapsible sections — FilterPanelSection already handles state",
      "❌ Skipping reset action — users get stuck with stale filters",
    ],
    example: `<FilterPanel mode="sidebar">
  <FilterPanelHeader>
    <FilterPanelHeaderTitle>Filters</FilterPanelHeaderTitle>
    <Button variant="ghost" size="sm" onClick={resetAll}>Reset</Button>
  </FilterPanelHeader>

  <FilterPanelSection defaultOpen>
    <FilterPanelSectionTrigger>Status</FilterPanelSectionTrigger>
    <FilterPanelSectionContent>
      <FilterPanelOption><Checkbox label="Active" /></FilterPanelOption>
      <FilterPanelOption><Checkbox label="Pending" /></FilterPanelOption>
      <FilterPanelOption><Checkbox label="Cancelled" /></FilterPanelOption>
    </FilterPanelSectionContent>
  </FilterPanelSection>

  <FilterPanelSection>
    <FilterPanelSectionTrigger>Price range</FilterPanelSectionTrigger>
    <FilterPanelSectionContent>
      <Slider value={[min, max]} onValueChange={setRange} min={0} max={1000} />
    </FilterPanelSectionContent>
  </FilterPanelSection>
</FilterPanel>`,
  },

  "heading": {
    name: "Heading",
    import: `import { Heading, Subheading } from 'strata-design-system';`,
    category: "application-ui",
    description: "Semantic heading + subheading components with DS typography scale. Heading renders h1–h6 via the level prop; Subheading is a smaller muted heading typically paired below a Heading.",
    variants: {
      level: ["1 (default — text-2xl/8 sm:text-xl/8)", "2", "3", "4", "5", "6"],
    },
    props: [
      "Heading.level?: 1 | 2 | 3 | 4 | 5 | 6 (default: 1)",
      "Heading — extends standard h1–h6 element props (children, className, id, etc.)",
      "Subheading — extends h2 element props with muted styling",
    ],
    tokens: {
      "text-foreground": "Heading text color",
      "text-muted-foreground": "Subheading text color",
      "text-2xl/8 (level 1)": "primary heading size",
      "text-base/7 (levels 2-3)": "secondary heading size",
      "sm:text-xl/8": "responsive size",
      "font-semibold": "weight for both",
    },
    whenToUse: [
      "All page titles and section headings — never use raw <h1>",
      "level={1} for page titles (one per page for SEO)",
      "level={2} for major sections, level={3} for sub-sections",
      "Subheading for caption-style text under a Heading",
      "Pair with PageHeader for consistent page tops",
    ],
    antiPatterns: [
      "❌ Raw <h2 className='text-[22px] font-bold'> — bypasses typography scale",
      "❌ Multiple <h1> per page — breaks SEO and screen reader hierarchy",
      "❌ Skipping levels (h1 → h4) — accessibility issue",
      "❌ Using Heading purely for visual styling without semantic meaning — use plain <p> with classes instead",
    ],
    example: `<Heading level={1}>Orders Dashboard</Heading>
<Subheading>12 active orders, 3 pending review</Subheading>

<section>
  <Heading level={2}>Recent Activity</Heading>
  {/* section content */}
</section>

<section>
  <Heading level={3}>Today</Heading>
  {/* sub-section */}
</section>`,
  },

  "hero-section": {
    name: "Hero",
    import: `import { Hero, HeroTitle, HeroSubtitle, HeroButtons, HeroImage } from 'strata-design-system';`,
    category: "application-ui",
    description: "Composable landing page hero. Build the hero with Hero + HeroTitle + HeroSubtitle + HeroButtons + (optional) HeroImage.",
    props: [
      "Hero — outer <section> wrapper (py-16 sm:py-24 lg:py-32)",
      "HeroTitle — large heading (text-4xl sm:text-5xl lg:text-6xl, font-bold)",
      "HeroSubtitle — subtitle text (text-lg, muted)",
      "HeroButtons — CTA row container",
      "HeroImage — supports src, alt, className + all <img> props (drop-shadow-xl by default)",
    ],
    tokens: {
      "bg-white / dark:bg-zinc-900": "hero background (Tier 2 — uses zinc directly)",
      "py-16 sm:py-24 lg:py-32": "responsive vertical padding",
      "text-zinc-900 / dark:text-white": "title color",
      "text-zinc-600 / dark:text-zinc-300": "subtitle color",
      "drop-shadow-xl": "default hero image elevation",
    },
    whenToUse: [
      "Marketing landing pages — top hero block",
      "Product homepages",
      "Demo intro screens",
      "When you need a composable structure (not a single mega-prop)",
    ],
    antiPatterns: [
      "❌ Using HeroSection as a single config object — use the compound subcomponents",
      "❌ For inside-app dashboards — use PageHeader instead",
      "❌ Multiple Hero blocks per page — defeats the purpose of a hero",
    ],
    example: `<Hero>
  <HeroTitle>Build faster with Strata</HeroTitle>
  <HeroSubtitle>The design system that scales with your team. 93 components, MCP-native.</HeroSubtitle>
  <HeroButtons>
    <Button variant="default" size="lg" shape="pill">Get Started</Button>
    <Button variant="outline" size="lg">View Docs</Button>
  </HeroButtons>
  <HeroImage src="/hero.png" alt="Strata UI screenshot" className="mt-12 mx-auto max-w-4xl" />
</Hero>`,
    governance: {
      tier: 2,
      notes: "Hero outer bg uses bg-white/dark:bg-zinc-900 directly. Override with className for bg-background if needed.",
    },
  },

  "hover-card": {
    name: "HoverCard",
    import: `import { HoverCard, HoverCardTrigger, HoverCardContent } from 'strata-design-system';`,
    category: "application-ui",
    description: "Floating card shown on hover (or focus) for previewing linked content, built on Radix HoverCard.",
    props: [
      "HoverCard — Root: openDelay?: number (default 700), closeDelay?: number (default 300), open?: boolean, onOpenChange?: (open: boolean) => void",
      "HoverCardTrigger — wraps the trigger element; use asChild to merge with a Link or Button",
      "HoverCardContent — content panel: align?: 'start' | 'center' (default) | 'end', sideOffset?: number (default 4), side?: 'top' | 'right' | 'bottom' | 'left'",
    ],
    tokens: {
      "bg-popover": "card background",
      "text-popover-foreground": "card text color",
      "border + rounded-md + shadow-md": "card chrome",
      "w-64": "default width (override with className)",
      "z-50": "stacking order",
      "data-[state=open]:animate-in / data-[state=closed]:animate-out": "open/close transitions",
      "fade-in-0 + zoom-in-95 + slide-in-from-{side}": "directional entrance animations",
    },
    whenToUse: [
      "User profile previews on @mentions",
      "Link previews (URL → page summary)",
      "Term definitions and glossary tooltips with rich content",
      "Keyboard shortcuts cheatsheet on hover",
    ],
    antiPatterns: [
      "❌ For interactive content that requires click — use Popover",
      "❌ For plain-text labels on icon buttons — use Tooltip",
      "❌ As primary navigation — hover is not discoverable on touch devices",
      "❌ With openDelay=0 — flickers on accidental mouseover",
    ],
    example: `<HoverCard>
  <HoverCardTrigger asChild>
    <a href="/users/diego" className="text-primary hover:underline">@diego</a>
  </HoverCardTrigger>
  <HoverCardContent className="w-80">
    <div className="flex gap-3">
      <Avatar size="lg"><AvatarFallback>DZ</AvatarFallback></Avatar>
      <div>
        <p className="text-sm font-semibold">Diego Zuluaga</p>
        <p className="text-sm text-muted-foreground">Design Systems @ Strata</p>
        <p className="text-xs text-muted-foreground mt-2">Joined March 2024</p>
      </div>
    </div>
  </HoverCardContent>
</HoverCard>`,
  },

  "info-banner": {
    name: "InfoBanner",
    import: `import { InfoBanner, type InfoBannerTone, type InfoBannerProps, infoBannerToneClassMap } from 'strata-design-system';`,
    category: "application-ui",
    description: "Inline contextual banner with tone-based coloring, optional icon, title, description, and dismiss button.",
    variants: {
      tone: ["neutral (default)", "info", "success", "warning", "danger"],
    },
    props: [
      "tone?: 'info' | 'success' | 'warning' | 'danger' | 'neutral' (default: 'neutral')",
      "icon?: ReactNode — leading icon",
      "title?: ReactNode",
      "description?: ReactNode",
      "dismissible?: boolean (default: false)",
      "onDismiss?: () => void",
      "Exports `infoBannerToneClassMap` for accessing tone classes externally",
    ],
    tokens: {
      "border-green-200 / dark:border-green-800": "success border (Tier 2 — uses raw green)",
      "bg-green-50 / dark:bg-green-900/20": "success bg",
      "text-green-700 / dark:text-green-400": "success text",
      "border-amber-200 / bg-amber-50 / text-amber-700": "warning palette",
      "border-red-200 / bg-red-50 / text-red-700": "danger palette",
      "border-zinc-200 / bg-zinc-50 / text-zinc-700": "neutral palette",
      "rounded-lg + border + p-4 + text-sm/6": "container chrome",
    },
    whenToUse: [
      "Contextual tips inside pages ('Pro tip: use ⌘K to search')",
      "Data freshness notices ('Last updated 5 min ago')",
      "Non-blocking warnings inside forms",
      "Quota and limit warnings",
    ],
    antiPatterns: [
      "❌ Site-wide / page-top messages — use Banner",
      "❌ Form validation errors — use Alert variant='destructive' or Field error prop",
      "❌ Transient confirmations ('Saved!') — use Sonner toast",
      "❌ Inside Cards as primary content — InfoBanner is auxiliary",
    ],
    example: `<InfoBanner
  tone="info"
  icon={<InformationCircleIcon className="size-5" />}
  title="Pro tip"
  description="Use ⌘K to open the command palette from any page."
  dismissible
  onDismiss={() => setShown(false)}
/>

<InfoBanner
  tone="warning"
  icon={<ExclamationTriangleIcon className="size-5" />}
  title="Quota approaching"
  description="You are using 90% of your 5GB storage. Upgrade for more."
/>

<InfoBanner tone="success" title="Synced 2 minutes ago" />`,
    governance: {
      tier: 2,
      notes: "Uses raw green/amber/red/zinc palettes instead of bg-status-* tokens. Flagged for Tier 1 refactor.",
    },
  },

  "kpi-card": {
    name: "KPICard",
    import: `import { KPICard, type KPICardProps, type KPICardTone, type KPICardDensity, type KPICardTrendDirection, type KPICardValueFormat } from 'strata-design-system';`,
    category: "application-ui",
    description: "Rich KPI/metric card with trend indicators, value formatting, density modes, and 10 tones. Built for dashboards and analytics views.",
    variants: {
      density: ["compact", "default (recommended)", "comfortable", "summary"],
      tone: ["neutral (default)", "success", "warning", "danger", "brand", "blue", "green", "amber", "purple", "red"],
      trendDirection: ["up", "down", "neutral"],
      valueFormat: ["number (default)", "currency", "percent", "compact"],
    },
    props: [
      "label: string — metric name",
      "value: number — the metric value",
      "subValue?: string — secondary line (e.g., '$1,250 of $5,000')",
      "icon?: ReactNode",
      "tone?: KPICardTone (default: 'neutral')",
      "density?: KPICardDensity (default: 'default')",
      "trend?: { direction, value } | string | ReactNode — trend indicator",
      "trendPosition?: 'top' | 'bottom' | 'left' | 'right' (default: 'right')",
      "valueFormat?: 'number' | 'currency' | 'percent' | 'compact' (default: 'number')",
      "currency?: string (default: 'USD')",
      "iconPosition?: 'start' | 'top' (default: 'start')",
      "iconBgColor?: string — override icon container bg",
      "primaryAction?: { onClick, title?, icon? }",
      "onDetailsOpenChange?: (open: boolean) => void",
    ],
    tokens: {
      "bg-card + text-card-foreground": "card surface",
      "text-foreground / text-muted-foreground": "value and label colors",
      "bg-green-50/500 / bg-red-50/500 / bg-amber-50/500": "tone-based icon container backgrounds (Tier 2)",
      "ring-1 ring-inset": "tone borders",
      "rounded-2xl / rounded-xl": "outer / inner radii",
      "shadow-sm + p-4/6": "elevation and padding",
      "animate-in + fade-in + slide-in-from-top-1": "trend value entrance animation",
    },
    whenToUse: [
      "Dashboard summary stats — primary use",
      "Analytics overview pages",
      "Report highlights and KPI tracking",
      "density='compact' for sidebar widgets, 'comfortable' for detail views, 'summary' for hero KPIs",
      "tone matches the metric's semantic meaning (success for revenue, danger for errors)",
    ],
    antiPatterns: [
      "❌ Card + custom h2 + p + arrow — use KPICard for consistent metric display",
      "❌ Mixing tones randomly — pick tones that map to metric semantics",
      "❌ trendDirection='up' with red tone — confuses positive/negative connotation",
      "❌ valueFormat='currency' with non-numeric value — only works on `value: number`",
    ],
    example: `<KPICard
  label="Monthly Revenue"
  value={124500}
  valueFormat="currency"
  currency="USD"
  trend={{ direction: 'up', value: 12.5 }}
  tone="success"
  icon={<CurrencyDollarIcon className="size-5" />}
/>

<KPICard
  label="Failed Orders"
  value={23}
  trend={{ direction: 'down', value: 4.2 }}
  tone="danger"
  density="compact"
/>

<KPICard
  label="Active Users"
  value={8492}
  valueFormat="compact"
  density="summary"
  trend="+1,200 this week"
  primaryAction={{ onClick: viewDetails, title: 'View user breakdown' }}
/>`,
    governance: {
      tier: 2,
      notes: "Tone variants use raw color palettes (bg-green-50, bg-red-50, etc.) rather than DS status tokens. Flagged for Tier 1 refactor.",
    },
  },

  "label": {
    name: "Label",
    import: `import { Label } from 'strata-design-system';`,
    category: "application-ui",
    description: "Accessible form label built on Radix Label. Lightweight wrapper that handles htmlFor association and click-to-focus behavior.",
    props: [
      "htmlFor?: string — associates label with input by id",
      "...all Radix LabelPrimitive.Root props (children, className, asChild, etc.)",
    ],
    tokens: {
      "text-zinc-700 / dark:text-muted-foreground": "label text color (Tier 2 — light mode uses zinc directly)",
      "text-xs": "default size",
      "font-normal": "default weight (override with className for emphasis)",
    },
    whenToUse: [
      "Above any form input that doesn't have a built-in label prop",
      "Inside Field — use Field's `label` prop instead of nesting Label manually",
      "Above standalone controls (Switch, Checkbox) when not inside a Field",
    ],
    antiPatterns: [
      "❌ <label className='text-sm font-medium'> — bypasses Radix a11y and click-to-focus",
      "❌ Nesting Label inside Field — Field already renders a Label",
      "❌ Without htmlFor — breaks click-to-focus and screen reader association",
      "❌ Using Label as decorative text — it's a semantic <label> element",
    ],
    example: `<div>
  <Label htmlFor="email">Email address</Label>
  <Input id="email" type="email" placeholder="you@example.com" />
</div>

// With Switch (no native label)
<div className="flex items-center gap-2">
  <Switch id="dark-mode" />
  <Label htmlFor="dark-mode">Dark mode</Label>
</div>`,
    governance: {
      tier: 2,
      notes: "Light mode uses text-zinc-700 directly. Should use text-foreground for token consistency.",
    },
  },

  "layout": {
    name: "Layout",
    import: `import { Layout, type LayoutProps } from 'strata-design-system';`,
    category: "application-ui",
    description: "Full application shell with built-in ExperiencesNavbar, page heading, and content area. Tightly coupled with the Experiences product navbar — for generic apps, compose Navbar + PageHeader + main manually.",
    props: [
      "heading: ReactNode — required page title",
      "subheading?: ReactNode — optional page subtitle",
      "headerActions?: ReactNode — buttons/controls aligned right of the heading",
      "navItems: ExperiencesNavItemProps[] — required, passed through to ExperiencesNavbar",
      "children: ReactNode — required page content",
      "onLogout: () => void — required",
      "onNavigateToWorkspace: () => void — required",
      "onNavigate: (page: string) => void — required",
      "logoLight?: string / logoDark?: string — theme-specific logos",
      "headingClassName?: string — override heading element classes",
      "hideActionCenter?: boolean (default: false)",
      "hideQuickActions?: boolean (default: false)",
    ],
    tokens: {
      "min-h-screen": "full viewport height",
      "bg-background": "page background",
      "pb-6": "bottom padding",
      "container + mx-auto": "centered content container",
      "pt-20 lg:pt-24": "top padding (accounts for floating navbar)",
      "px-4 sm:px-6 lg:px-8": "responsive horizontal padding",
      "mb-6 + flex flex-col gap-4 sm:flex-row": "heading section layout",
    },
    whenToUse: [
      "Inside the Experiences product — primary application shell",
      "When you need integrated ExperiencesNavbar, ActionCenter, and QuickActions",
      "For generic apps without ExperiencesNavbar features — compose Navbar + PageHeader + main yourself",
    ],
    antiPatterns: [
      "❌ Building layout with raw div flex/grid + manual navbar — use Layout for consistency",
      "❌ For marketing/landing pages — use Hero + custom shell instead",
      "❌ Layout without onLogout/onNavigate — required handlers, will silently fail",
      "❌ Wrapping multiple pages in nested Layouts — use one Layout at the root",
    ],
    example: `<Layout
  heading="Orders"
  subheading="Manage and track all customer orders"
  headerActions={<Button>Create Order</Button>}
  navItems={[
    { label: 'Dashboard', icon: <HomeIcon />, path: '/dashboard' },
    { label: 'Orders', icon: <PackageIcon />, path: '/orders' },
  ]}
  onNavigate={(path) => router.push(path)}
  onNavigateToWorkspace={() => router.push('/workspace')}
  onLogout={() => signOut()}
>
  <Table>{/* page content */}</Table>
</Layout>`,
  },

  "link": {
    name: "Link",
    import: `import { Link, type LinkProps } from 'strata-design-system';`,
    category: "application-ui",
    description: "Passthrough <a> element wrapper used as the asChild target for Button, Breadcrumb, and other components that need a router link. Adds no internal styling — apply className manually or rely on the parent component's styles.",
    props: [
      "children?: ReactNode",
      "...all React.AnchorHTMLAttributes<HTMLAnchorElement> (href, target, rel, className, etc.)",
    ],
    tokens: {
      "text-primary": "PREFERRED inline link color — pairs with focus ring",
      "text-foreground": "neutral link color when sitting next to body text",
      "hover:underline": "standard hover affordance",
      "underline-offset-4": "comfortable spacing between text and underline",
      "focus-visible:ring-ring": "focus ring inherited from parent components like Button",
    },
    whenToUse: [
      "As asChild target inside Button (`<Button asChild><Link to='/x'>...</Link></Button>`)",
      "Inside BreadcrumbLink, NavbarItem, or any DS component that uses Slot",
      "When you need a plain <a> with router integration — replace with your router's Link via asChild composition",
      "For inline styled links — apply text-primary + hover:underline manually",
    ],
    antiPatterns: [
      "❌ Expecting Link to add styling — it's a passthrough element",
      "❌ Using Link as the primary interactive element when you need a Button — use Button asChild + Link",
      "❌ <a className='text-blue-600'> for inline links — apply DS tokens (text-primary)",
    ],
    example: `// As Button child for navigation
<Button asChild variant="ghost">
  <Link href="/settings"><CogIcon className="size-4" /> Settings</Link>
</Button>

// Inside Breadcrumb
<BreadcrumbLink asChild>
  <Link href="/orders">Orders</Link>
</BreadcrumbLink>

// Inline styled link (apply DS tokens)
<Link href="/docs" className="text-primary hover:underline underline-offset-4">
  Read the docs
</Link>

// External link
<Link href="https://example.com" target="_blank" rel="noopener noreferrer">
  External site
</Link>`,
  },

  "list-toolbar": {
    name: "ListToolbar",
    import: `import { ListToolbar, type ListToolbarProps, type ListToolbarPrimaryAction, type ListToolbarSelectOption } from 'strata-design-system';`,
    category: "application-ui",
    description: "Composable toolbar for lists/tables with optional search, filter, sort, primary action, and custom children slots. Each feature is opt-in via prop config.",
    props: [
      "search?: { value, onSearchChange, placeholder?, ariaLabel? } — adds search input",
      "filter?: { options: ListToolbarSelectOption[], value, onValueChange, ariaLabel? } — adds filter Select",
      "sort?: { options: ListToolbarSelectOption[], value, onValueChange, ariaLabel? } — adds sort Select",
      "primaryAction?: { label, onClick, icon? } — primary CTA button on the right",
      "children?: ReactNode — additional toolbar items (custom buttons, bulk actions)",
      "dataTestId?, searchTestId?, filterTestId?, sortTestId?, primaryActionTestId?: string — test ids",
    ],
    tokens: {
      "flex flex-wrap items-center gap-3": "responsive toolbar layout",
      "lg:flex-nowrap lg:flex-none": "desktop layout adjustments",
      "lg:max-w-[400px] lg:flex-1": "search input width on desktop",
      "bg-muted": "select background",
      "transition-colors duration-200": "hover/focus transitions",
      "w-[120px] / w-[140px]": "default filter/sort select widths",
    },
    whenToUse: [
      "Above any Table or data list as a unified controls bar",
      "When you need search + filter + sort in one row",
      "Use only the props you need — search-only, search+sort, full controls",
      "Combine with PageHeader: PageHeader for the page title, ListToolbar for the data controls",
    ],
    antiPatterns: [
      "❌ Custom flex row with manual Input + Select — use ListToolbar for consistency",
      "❌ Multiple ListToolbars stacked — combine into one or use children slot for extras",
      "❌ Skipping ariaLabel — required for accessibility on Select dropdowns",
    ],
    example: `<ListToolbar
  search={{
    value: query,
    onSearchChange: setQuery,
    placeholder: 'Search orders...',
    ariaLabel: 'Search orders',
  }}
  filter={{
    options: [
      { label: 'All', value: 'all' },
      { label: 'Active', value: 'active' },
      { label: 'Pending', value: 'pending' },
    ],
    value: statusFilter,
    onValueChange: setStatusFilter,
    ariaLabel: 'Filter by status',
  }}
  sort={{
    options: [
      { label: 'Newest', value: 'created_desc' },
      { label: 'Oldest', value: 'created_asc' },
      { label: 'Amount', value: 'amount_desc' },
    ],
    value: sort,
    onValueChange: setSort,
    ariaLabel: 'Sort orders',
  }}
  primaryAction={{
    label: 'Create Order',
    onClick: openCreateDialog,
    icon: <PlusIcon className="size-4" />,
  }}
>
  {selectedCount > 0 && (
    <Button variant="outline" size="sm">Bulk delete ({selectedCount})</Button>
  )}
</ListToolbar>`,
  },

  "menubar": {
    name: "Menubar",
    import: `import { Menubar, MenubarPortal, MenubarMenu, MenubarTrigger, MenubarContent, MenubarGroup, MenubarSeparator, MenubarLabel, MenubarItem, MenubarShortcut, MenubarCheckboxItem, MenubarRadioGroup, MenubarRadioItem, MenubarSub, MenubarSubTrigger, MenubarSubContent } from 'strata-design-system';`,
    category: "application-ui",
    description: "Desktop application-style horizontal menu bar (File / Edit / View) with dropdowns, submenus, checkboxes, and radios. Built on Radix Menubar.",
    variants: {
      "MenubarItem.variant": ["default", "destructive"],
    },
    props: [
      "Menubar — root <div role='menubar'>",
      "MenubarMenu — single top-level menu (File, Edit, View)",
      "MenubarTrigger — clickable label that opens MenubarContent",
      "MenubarContent — dropdown panel: align?, alignOffset?, sideOffset?",
      "MenubarItem — selectable row: inset?: boolean, variant?: 'default' | 'destructive'",
      "MenubarLabel — non-selectable section heading: inset?: boolean",
      "MenubarSeparator — divider between groups",
      "MenubarShortcut — right-aligned keyboard hint (⌘N, Enter)",
      "MenubarCheckboxItem — toggleable item",
      "MenubarRadioGroup + MenubarRadioItem — single-select group",
      "MenubarSub + MenubarSubTrigger + MenubarSubContent — nested submenu",
    ],
    tokens: {
      "bg-background": "menubar root background",
      "bg-popover + text-popover-foreground": "MenubarContent panel",
      "bg-accent + text-accent-foreground": "highlighted/focused item",
      "bg-border": "separator color",
      "text-muted-foreground": "labels and shortcuts",
      "text-destructive": "destructive variant items",
      "dark:data-[variant=destructive]:focus:bg-destructive/20": "destructive focus state",
    },
    whenToUse: [
      "Desktop app-style menu bars (File / Edit / View / Help)",
      "Code editors, design tools, complex authoring environments",
      "When users expect keyboard shortcuts on menu items",
      "Multi-state options (CheckboxItem / RadioItem)",
    ],
    antiPatterns: [
      "❌ For site navigation — use Navbar or NavigationMenu",
      "❌ For row action menus (⋮) — use DropdownMenu",
      "❌ Without keyboard shortcuts — Menubar's UX assumes power users",
      "❌ On mobile-only apps — touch UX favors bottom sheets, not menubars",
    ],
    example: `<Menubar>
  <MenubarMenu>
    <MenubarTrigger>File</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>New Tab <MenubarShortcut>⌘T</MenubarShortcut></MenubarItem>
      <MenubarItem>Open... <MenubarShortcut>⌘O</MenubarShortcut></MenubarItem>
      <MenubarSeparator />
      <MenubarSub>
        <MenubarSubTrigger>Share</MenubarSubTrigger>
        <MenubarSubContent>
          <MenubarItem>Email link</MenubarItem>
          <MenubarItem>Copy link</MenubarItem>
        </MenubarSubContent>
      </MenubarSub>
      <MenubarSeparator />
      <MenubarItem variant="destructive">Delete</MenubarItem>
    </MenubarContent>
  </MenubarMenu>

  <MenubarMenu>
    <MenubarTrigger>View</MenubarTrigger>
    <MenubarContent>
      <MenubarCheckboxItem checked>Show Sidebar</MenubarCheckboxItem>
      <MenubarRadioGroup value={zoom}>
        <MenubarRadioItem value="100">100%</MenubarRadioItem>
        <MenubarRadioItem value="125">125%</MenubarRadioItem>
      </MenubarRadioGroup>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`,
  },

  "navbar": {
    name: "Navbar",
    import: `import { Navbar, NavbarSection, NavbarSpacer, NavbarItem } from 'strata-design-system';`,
    category: "application-ui",
    description: "Generic horizontal application navigation bar. Compose with NavbarSection for groups, NavbarSpacer for flex spacing, NavbarItem for nav links.",
    props: [
      "Navbar — outer <nav> wrapper with bottom border",
      "NavbarSection — grouping of related nav items (left brand, center nav, right actions)",
      "NavbarSpacer — flex-1 spacer to push sections apart",
      "NavbarItem.current?: boolean — marks the active nav link",
    ],
    tokens: {
      "bg-white / dark:bg-zinc-900": "navbar background (Tier 2 — uses zinc directly)",
      "border-zinc-200 / dark:border-zinc-800": "bottom border",
      "bg-zinc-100 / dark:bg-zinc-800": "current item background",
      "text-zinc-900 / dark:text-zinc-50": "active item text",
      "text-zinc-600 / dark:text-zinc-400": "inactive item text",
      "dark:hover:bg-zinc-800/50": "hover state",
    },
    whenToUse: [
      "Top-level app navigation when ExperiencesNavbar features aren't needed",
      "Marketing site navigation",
      "Any page that needs a horizontal nav with brand + links + actions",
      "Compose inside a Layout-like wrapper (you build the shell)",
    ],
    antiPatterns: [
      "❌ NavbarFloating for app shells — that's for landing pages with hero",
      "❌ Custom <header> with manual flex — use Navbar for consistent spacing",
      "❌ Skipping NavbarSpacer — sections won't justify correctly",
      "❌ Multiple NavbarItem with current={true} — only one active item per navbar",
    ],
    example: `<Navbar>
  <NavbarSection>
    <Link to="/"><Logo /></Link>
  </NavbarSection>
  <NavbarSpacer />
  <NavbarSection>
    <NavbarItem current={path === '/dashboard'}>
      <Link to="/dashboard">Dashboard</Link>
    </NavbarItem>
    <NavbarItem current={path === '/orders'}>
      <Link to="/orders">Orders</Link>
    </NavbarItem>
  </NavbarSection>
  <NavbarSpacer />
  <NavbarSection>
    <Button variant="ghost" size="icon"><BellIcon className="size-5" /></Button>
    <Avatar size="sm"><AvatarFallback>DZ</AvatarFallback></Avatar>
  </NavbarSection>
</Navbar>`,
    governance: {
      tier: 2,
      notes: "Uses bg-white/dark:bg-zinc-900 directly instead of bg-card/bg-background. Flagged for Tier 1 refactor.",
    },
  },

  "navigation-menu": {
    name: "NavigationMenu",
    import: `import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuContent, NavigationMenuTrigger, NavigationMenuLink, NavigationMenuIndicator, NavigationMenuViewport, navigationMenuTriggerStyle } from 'strata-design-system';`,
    category: "application-ui",
    description: "Accessible mega-menu navigation with animated popovers and viewport-based content panel, built on Radix NavigationMenu. Use `navigationMenuTriggerStyle()` to apply trigger styles to custom Links.",
    props: [
      "NavigationMenu.viewport?: boolean (default: true) — render content in a shared viewport panel below all triggers",
      "NavigationMenu — root + viewport container",
      "NavigationMenuList — horizontal list of trigger items",
      "NavigationMenuItem — single menu item (trigger + content)",
      "NavigationMenuTrigger — clickable label that opens NavigationMenuContent",
      "NavigationMenuContent — content panel (rendered in viewport when viewport=true)",
      "NavigationMenuLink — link inside content; use asChild for router Link",
      "NavigationMenuIndicator — animated arrow/underline pointing to active trigger",
      "NavigationMenuViewport — shared content panel (auto-rendered by NavigationMenu)",
      "navigationMenuTriggerStyle() — utility returning the trigger className for custom links",
    ],
    tokens: {
      "bg-background": "trigger / link default bg",
      "bg-accent + text-accent-foreground": "hover / focus state",
      "bg-popover + text-popover-foreground": "content panel",
      "ring-ring/50 + focus-visible:ring-[3px]": "focus ring",
      "text-muted-foreground": "secondary text inside content",
      "bg-border": "separator color",
    },
    whenToUse: [
      "Marketing site navigation with rich dropdown content (mega menus)",
      "Multi-column dropdowns with images, descriptions, featured items",
      "When you want viewport-based content (single panel below all triggers)",
      "Apply navigationMenuTriggerStyle() to direct Links (no dropdown) for consistent styling",
    ],
    antiPatterns: [
      "❌ For application shells — use Navbar (NavigationMenu is for marketing/content sites)",
      "❌ For action menus — use DropdownMenu",
      "❌ Without NavigationMenuList — root won't render correctly",
      "❌ Mixing dropdown triggers and direct links without applying navigationMenuTriggerStyle()",
    ],
    example: `<NavigationMenu>
  <NavigationMenuList>
    <NavigationMenuItem>
      <NavigationMenuTrigger>Products</NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
          <li>
            <NavigationMenuLink asChild>
              <Link to="/tours">
                <div className="font-semibold">Tours</div>
                <p className="text-sm text-muted-foreground">Curated experiences</p>
              </Link>
            </NavigationMenuLink>
          </li>
          <li>
            <NavigationMenuLink asChild>
              <Link to="/hotels">
                <div className="font-semibold">Hotels</div>
                <p className="text-sm text-muted-foreground">Trusted partners</p>
              </Link>
            </NavigationMenuLink>
          </li>
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>

    <NavigationMenuItem>
      <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
        <Link to="/pricing">Pricing</Link>
      </NavigationMenuLink>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>`,
  },

  "page-header": {
    name: "PageHeader",
    import: `import { PageHeader } from 'strata-design-system';`,
    category: "application-ui",
    description: "Lightweight page heading block. Renders a Heading + optional Subheading. For richer page headers with breadcrumbs and actions, compose Breadcrumb + PageHeader + actions row manually.",
    props: [
      "heading: ReactNode — required, the page title",
      "subheading?: ReactNode — optional secondary line",
    ],
    tokens: {
      "text-muted-foreground": "subheading color (heading uses Heading defaults)",
    },
    whenToUse: [
      "Simple page tops where you just need title + optional subtitle",
      "Below a Breadcrumb component when navigating through hierarchies",
      "Inside Layout — set Layout's heading/subheading instead of nesting PageHeader",
      "For richer headers (breadcrumb + heading + actions row) compose them manually",
    ],
    antiPatterns: [
      "❌ Raw <h1>...</h1> at the top of pages — use PageHeader for typography consistency",
      "❌ PageHeader inside Layout — Layout already renders one (use Layout's heading prop)",
      "❌ Expecting actions/tabs/breadcrumb props — they don't exist; compose manually",
    ],
    example: `<div className="space-y-6">
  <Breadcrumb>{/* ... */}</Breadcrumb>

  <div className="flex items-start justify-between gap-4">
    <PageHeader
      heading="Orders"
      subheading="Manage and track all customer orders"
    />
    <Button>Create Order</Button>
  </div>

  <Tabs defaultValue="all">{/* ... */}</Tabs>
</div>`,
  },

  "page-layout": {
    name: "PageLayout",
    import: `import { PageLayout } from 'strata-design-system';`,
    category: "application-ui",
    description: "Convenience wrapper around Layout that makes most navigation props optional. Use when you want Layout's shell but with nullable handlers (e.g., demos, isolated screens).",
    props: [
      "heading: ReactNode — required",
      "subheading?: ReactNode",
      "headerActions?: ReactNode",
      "navItems?: NavItem[] — optional (Layout requires this)",
      "activeTab?: string",
      "logoLight?: string / logoDark?: string",
      "headingClassName?: string",
      "onLogout?: () => void — optional (Layout requires)",
      "onNavigateToWorkspace?: () => void — optional",
      "actionCenterActionConfigMap? / onActionCenterActionExecute? / actionCenterDataState?",
      "hideActionCenter?: boolean / hideQuickActions?: boolean",
    ],
    tokens: {
      "(delegates to Layout)": "all styling comes from Layout — bg-background, container, etc.",
    },
    whenToUse: [
      "Demo screens where you don't have a real auth flow (no onLogout)",
      "Isolated page previews",
      "When you want to opt out of nav items but keep the shell chrome",
      "For production apps with full auth — use Layout instead (forces required handlers)",
    ],
    antiPatterns: [
      "❌ For production apps with full auth context — use Layout (stricter requirements catch missing handlers)",
      "❌ As an alternative to PageHeader — PageLayout is the full shell, PageHeader is just the title block",
      "❌ Nesting PageLayout inside Layout — pick one shell",
    ],
    example: `<PageLayout
  heading="Demo Dashboard"
  subheading="Component playground"
  headerActions={<Button>Action</Button>}
>
  <div className="space-y-6">{/* page content */}</div>
</PageLayout>`,
  },

  "pagination": {
    name: "Pagination",
    import: `import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from 'strata-design-system';`,
    category: "application-ui",
    description: "Composable pagination controls. PaginationLink uses buttonVariants internally so styling matches DS Buttons. Build your own pagination logic and render the components.",
    props: [
      "Pagination — root <nav role='navigation'>",
      "PaginationContent — flex container for pagination items (<ul>)",
      "PaginationItem — single <li> wrapper",
      "PaginationLink.isActive?: boolean — applies the 'outline' variant when active",
      "PaginationLink.size?: 'icon' | 'default' (default: 'icon')",
      "PaginationPrevious — pre-built previous link (icon + label)",
      "PaginationNext — pre-built next link",
      "PaginationEllipsis — visual ... indicator for collapsed page ranges",
    ],
    tokens: {
      "(via buttonVariants)": "PaginationLink reuses the Button styles (bg-accent, hover, focus ring)",
    },
    whenToUse: [
      "Below Tables and lists with > ~25 items per page",
      "Numbered pagination — render PaginationLink for each visible page",
      "Use PaginationEllipsis to collapse middle pages on long ranges (1, 2, 3, ..., 24, 25)",
      "Combine with URL query params for deep-linkable pages",
    ],
    antiPatterns: [
      "❌ Custom <button> pagination without DS tokens — loses focus rings and dark mode",
      "❌ Pagination as the only navigation for unbounded data — consider infinite scroll",
      "❌ Showing all 100 page numbers — use PaginationEllipsis to collapse",
      "❌ Forgetting isActive on the current page — users lose context",
    ],
    example: `<Pagination>
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setPage(page - 1); }} />
    </PaginationItem>

    {pageNumbers.map((p, idx) => (
      <PaginationItem key={idx}>
        {p === '...' ? (
          <PaginationEllipsis />
        ) : (
          <PaginationLink
            href="#"
            isActive={p === page}
            onClick={(e) => { e.preventDefault(); setPage(p); }}
          >
            {p}
          </PaginationLink>
        )}
      </PaginationItem>
    ))}

    <PaginationItem>
      <PaginationNext href="#" onClick={(e) => { e.preventDefault(); setPage(page + 1); }} />
    </PaginationItem>
  </PaginationContent>
</Pagination>`,
  },

  "pricing": {
    name: "Pricing",
    import: `import { PricingSection, PricingCard, PricingTitle, PricingPrice, PricingCost, PricingFeatures, PricingFeature } from 'strata-design-system';`,
    category: "application-ui",
    description: "Composable pricing card system. Build pricing pages with PricingSection wrapping multiple PricingCards, each with a featured prop to highlight a plan.",
    variants: {
      "PricingCard.featured / PricingTitle.featured / PricingPrice.featured / PricingFeature.featured": ["false (default)", "true"],
    },
    props: [
      "PricingSection — outer section wrapper",
      "PricingCard.featured?: boolean — when true, dark/inverted card styling",
      "PricingTitle.featured?: boolean — adjusts title color for featured variant",
      "PricingPrice.featured?: boolean",
      "PricingCost — large price display",
      "PricingFeatures — <ul> wrapper for features list",
      "PricingFeature.featured?: boolean — checkmark and text adapt for featured cards",
    ],
    tokens: {
      "bg-white / dark:bg-zinc-900": "default card bg (Tier 2 — uses zinc directly)",
      "bg-zinc-900 / dark:bg-zinc-800": "featured card bg",
      "ring-zinc-200 / dark:ring-zinc-800": "default card ring",
      "ring-zinc-900 / dark:ring-zinc-700": "featured card ring",
      "text-white": "featured title/feature color",
      "text-zinc-300 / text-zinc-500": "featured / default secondary text",
      "text-blue-600": "default checkmark / accent (Tier 2 — raw blue)",
    },
    whenToUse: [
      "Pricing pages — 2-4 cards side by side",
      "Plan upgrade flows / billing pages",
      "Mark the recommended plan with featured={true} (typically the middle option)",
    ],
    antiPatterns: [
      "❌ Custom pricing cards with hardcoded colors — use Pricing components",
      "❌ Using Card + manual price layout — Pricing handles spacing/typography",
      "❌ Multiple featured cards — only one plan should be highlighted",
      "❌ Mismatched featured props between siblings — set featured consistently across PricingCard, PricingTitle, etc.",
    ],
    example: `<PricingSection className="grid md:grid-cols-3 gap-6">
  <PricingCard>
    <PricingTitle>Starter</PricingTitle>
    <PricingPrice><PricingCost>$29</PricingCost> / month</PricingPrice>
    <PricingFeatures>
      <PricingFeature>Up to 5 users</PricingFeature>
      <PricingFeature>10GB storage</PricingFeature>
      <PricingFeature>Email support</PricingFeature>
    </PricingFeatures>
    <Button className="mt-6 w-full">Get started</Button>
  </PricingCard>

  <PricingCard featured>
    <PricingTitle featured>Pro (Recommended)</PricingTitle>
    <PricingPrice featured><PricingCost>$99</PricingCost> / month</PricingPrice>
    <PricingFeatures>
      <PricingFeature featured>Unlimited users</PricingFeature>
      <PricingFeature featured>100GB storage</PricingFeature>
      <PricingFeature featured>Priority support</PricingFeature>
    </PricingFeatures>
    <Button variant="default" className="mt-6 w-full">Upgrade to Pro</Button>
  </PricingCard>

  <PricingCard>
    <PricingTitle>Enterprise</PricingTitle>
    <PricingPrice>Custom</PricingPrice>
    <PricingFeatures>
      <PricingFeature>Custom contracts</PricingFeature>
      <PricingFeature>Dedicated CSM</PricingFeature>
    </PricingFeatures>
    <Button variant="outline" className="mt-6 w-full">Contact sales</Button>
  </PricingCard>
</PricingSection>`,
    governance: {
      tier: 2,
      notes: "Cards use zinc + blue-600 directly instead of bg-card/text-primary. Flagged for Tier 1 refactor.",
    },
  },

  "priority-badge": {
    name: "PriorityBadge",
    import: `import { PriorityBadge, priorityBadgeClassMap } from 'strata-design-system';`,
    category: "application-ui",
    description: "Colored badge for task/ticket priority levels. Maps low/medium/high/critical to consistent color palettes across the app.",
    variants: {
      priority: ["low (green)", "medium (yellow)", "high (amber, bordered)", "critical (red, bordered)"],
      size: ["default", "nano (smaller, inline-friendly)"],
      shape: ["default", "pill (rounded-full)"],
    },
    props: [
      "priority: 'low' | 'medium' | 'high' | 'critical' — required",
      "size?: 'default' | 'nano' (default: 'default')",
      "shape?: 'default' | 'pill' (default: 'default')",
      "prefix?: ReactNode — leading icon or label",
      "Exports `priorityBadgeClassMap` for accessing tone classes externally",
    ],
    tokens: {
      "text-green-600 / dark:text-green-400 / bg-green-50 / dark:bg-green-900/10": "low priority (Tier 2 — raw green)",
      "text-yellow-600 / dark:text-yellow-400 / bg-yellow-50 / dark:bg-yellow-900/10": "medium priority (raw yellow)",
      "text-amber-600 / bg-amber-600/20 / border-amber-600": "high priority (raw amber, bordered)",
      "text-red-600 / bg-red-600/20 / border-red-600": "critical priority (raw red, bordered)",
    },
    whenToUse: [
      "Task lists, ticket queues, issue trackers — always use PriorityBadge",
      "Inside Tables in a 'Priority' column",
      "Dashboard widgets summarizing high/critical counts",
      "size='nano' when used inline in dense lists",
      "Pair with prefix={<icon />} for visual scan-ability",
    ],
    antiPatterns: [
      "❌ Custom Badge with hand-picked colors for priorities — defeats consistency",
      "❌ Using StatusBadge for priorities — they semantically differ (status: Active/Pending; priority: Low/High)",
      "❌ Inverting tones (red for low priority) — breaks user expectations",
    ],
    example: `<PriorityBadge priority="critical" />
<PriorityBadge priority="high" size="nano" />
<PriorityBadge priority="medium" shape="pill" />
<PriorityBadge priority="low" prefix={<ArrowDownIcon className="size-3" />} />

// Inside a Table cell
<TableCell>
  <PriorityBadge priority={ticket.priority} size="nano" />
</TableCell>`,
    governance: {
      tier: 2,
      notes: "Uses raw green/yellow/amber/red palettes. Should map to bg-status-success/warning/error tokens. Flagged for Tier 1 refactor.",
    },
  },

  "product-list": {
    name: "ProductGrid",
    import: `import { ProductGrid, ProductCard } from 'strata-design-system';`,
    category: "application-ui",
    description: "Composable product catalog grid. ProductGrid is a responsive grid container; ProductCard renders an individual product with image, price, rating, stock indicator.",
    props: [
      "ProductGrid — responsive grid container, accepts className + div props",
      "ProductCard.product: { id, name, href, price, imageSrc, imageAlt, category?, rating?, reviewCount?, inStock? }",
    ],
    tokens: {
      "bg-zinc-200 / dark:bg-zinc-800": "image placeholder bg (Tier 2 — uses zinc directly)",
      "text-zinc-900 / dark:text-white": "product name color",
      "text-zinc-500 / dark:text-zinc-200": "secondary text",
      "text-amber-400": "rating star color (Tier 2 — raw amber)",
      "rounded-md / rounded-lg": "image and card radii",
    },
    whenToUse: [
      "Product catalog pages (e-commerce)",
      "Inventory listings with images",
      "Search results with thumbnail + price",
      "Map your product data to the expected shape (id, name, href, price, imageSrc, imageAlt, etc.)",
    ],
    antiPatterns: [
      "❌ For non-commercial lists — use StackedList or DescriptionList",
      "❌ Custom Card + manual image/price layout — ProductCard handles consistency",
      "❌ Without href on ProductCard.product — cards aren't clickable",
    ],
    example: `<ProductGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
  {products.map((p) => (
    <ProductCard
      key={p.id}
      product={{
        id: p.id,
        name: p.name,
        href: \`/products/\${p.id}\`,
        price: \`$\${p.price.toFixed(2)}\`,
        imageSrc: p.image,
        imageAlt: p.name,
        category: p.category,
        rating: p.rating,
        reviewCount: p.reviewCount,
        inStock: p.stock > 0,
      }}
    />
  ))}
</ProductGrid>`,
    governance: {
      tier: 2,
      notes: "Uses zinc + amber-400 directly. Should use bg-card/text-foreground/text-status-warning. Flagged for Tier 1 refactor.",
    },
  },

  "product-overview": {
    name: "ProductLayout",
    import: `import { ProductLayout, ProductGallery, ProductDetails, ProductTitle, ProductPrice } from 'strata-design-system';`,
    category: "application-ui",
    description: "Composable product detail page layout. ProductLayout splits gallery (left) and details (right); compose your own description, options, and CTA inside ProductDetails.",
    props: [
      "ProductLayout — outer grid (gallery + details)",
      "ProductGallery.images: { id, name, src, alt }[] — image array with thumbnails",
      "ProductDetails — wrapper for the right-side detail column",
      "ProductTitle — product name (h1)",
      "ProductPrice — formatted price block (p)",
    ],
    tokens: {
      "bg-white / dark:*": "default backgrounds (Tier 2 — uses zinc directly)",
      "text-zinc-900 / dark:text-white": "title color",
      "ring-indigo-500 / ring-transparent": "selected gallery thumbnail ring (Tier 2 — raw indigo)",
      "rounded-md / rounded-lg": "image radii",
    },
    whenToUse: [
      "Product detail pages on e-commerce sites",
      "Catalog item drawers/sheets when expanding from ProductGrid",
      "Gallery + side details pattern (image-heavy + structured details)",
    ],
    antiPatterns: [
      "❌ Single-column layouts for product detail — use ProductLayout for gallery + details split",
      "❌ Custom image gallery — use ProductGallery with image array",
      "❌ Skipping ProductDetails wrapper — alignment breaks without it",
    ],
    example: `<ProductLayout>
  <ProductGallery
    images={[
      { id: '1', name: 'Front', src: '/products/shoe-front.jpg', alt: 'Front view' },
      { id: '2', name: 'Side', src: '/products/shoe-side.jpg', alt: 'Side view' },
      { id: '3', name: 'Back', src: '/products/shoe-back.jpg', alt: 'Back view' },
    ]}
  />
  <ProductDetails>
    <ProductTitle>Strata Runner</ProductTitle>
    <ProductPrice>$129.00</ProductPrice>

    <div className="mt-6 space-y-4">
      <Field label="Size">
        <RadioGroup>{/* size options */}</RadioGroup>
      </Field>
      <Button size="lg" className="w-full">Add to Cart</Button>
    </div>

    <p className="mt-6 text-sm text-muted-foreground">
      Free shipping on orders over $75.
    </p>
  </ProductDetails>
</ProductLayout>`,
    governance: {
      tier: 2,
      notes: "Uses zinc + indigo-500 directly. Should use bg-card/text-foreground/ring-ring. Flagged for Tier 1 refactor.",
    },
  },

  "progress": {
    name: "Progress",
    import: `import { Progress } from 'strata-design-system';`,
    category: "application-ui",
    description: "Horizontal progress bar built on Radix Progress. Single style (no variants) — wrap or pass className for color overrides.",
    props: [
      "value?: number — current progress 0–100",
      "max?: number — defaults to 100",
      "className?: string",
      "...all Radix ProgressPrimitive.Root props",
    ],
    tokens: {
      "bg-primary/20": "track (incomplete portion)",
      "bg-primary": "indicator (completed portion)",
    },
    whenToUse: [
      "Upload progress (with realtime updates)",
      "Onboarding completion meters",
      "Storage usage (paired with bytes label)",
      "Form step indicators (within a single screen)",
      "Indeterminate state — set value={null} for marquee animation (Radix-native)",
    ],
    antiPatterns: [
      "❌ For multi-step named flows — use StageProgress",
      "❌ Custom <div> width-percentage trick — Progress handles a11y (role + aria-valuenow)",
      "❌ Without value when known — degrades to indeterminate state",
      "❌ Using Progress for percentage display alone — pair it with a numeric label",
    ],
    example: `// Determinate
<Progress value={68} className="w-full" />

// With label
<div className="space-y-2">
  <div className="flex justify-between text-sm">
    <span className="text-foreground">Storage</span>
    <span className="text-muted-foreground">3.2 GB / 5 GB</span>
  </div>
  <Progress value={64} />
</div>

// Color override (variant pattern)
<Progress value={90} className="[&>[data-state]]:bg-status-warning" />`,
  },

  "section-card": {
    name: "SectionCard",
    import: `import { SectionCard, SectionCardHeader, SectionCardBody, SectionCardFooter } from 'strata-design-system';`,
    category: "application-ui",
    description: "Composable secondary container with surface/density/interactive variants via CVA. Use SectionCardHeader/Body/Footer for structure with optional dividers.",
    variants: {
      surface: ["default (bg-card)", "muted (bg-muted/30)", "elevated (shadow-md)", "glass (bg-white/70 + backdrop-blur)"],
      density: ["compact", "default", "comfortable"],
      interactive: ["none (default)", "hover (hover state)", "clickable (cursor-pointer + hover)"],
    },
    props: [
      "SectionCard.surface?: 'default' | 'muted' | 'elevated' | 'glass' (default: 'default')",
      "SectionCard.density?: 'compact' | 'default' | 'comfortable' (default: 'default')",
      "SectionCard.interactive?: 'none' | 'hover' | 'clickable' (default: 'none')",
      "SectionCardHeader.divider?: 'bottom' — adds bottom border below header",
      "SectionCardBody.scrollable?: boolean — enables overflow-y-auto",
      "SectionCardFooter.divider?: 'top' — adds top border above footer",
    ],
    tokens: {
      "bg-card": "default surface",
      "bg-muted/30": "muted surface",
      "shadow-sm / shadow-md": "default / elevated elevation",
      "bg-white/70 / dark:bg-zinc-900/70": "glass surface (backdrop-blur)",
      "border-border / border-white/20 / dark:border-white/10": "borders by surface",
      "text-card-foreground": "default text color",
      "rounded-2xl": "outer radius",
      "animate-in + fade-in": "mount animation",
    },
    whenToUse: [
      "Settings page sections (title + form groups)",
      "Dashboard widgets where Card feels too heavy",
      "Glass surface for hero overlays",
      "Elevated surface for hovering panels (modals, popovers)",
      "interactive='clickable' for entire card as a navigation target",
    ],
    antiPatterns: [
      "❌ Using Card for everything — SectionCard for secondary content groupings",
      "❌ Mixing surface variants on adjacent cards — pick one for the page section",
      "❌ Without SectionCardHeader on titled sections — accessibility loss",
      "❌ density='compact' with comfortable padding overrides — defeats the variant",
    ],
    example: `<SectionCard surface="default" density="comfortable">
  <SectionCardHeader divider="bottom">
    <SectionToolbar
      search={{ value: q, onSearchChange: setQ }}
      primaryAction={{ label: 'Add', onClick: open }}
    />
  </SectionCardHeader>
  <SectionCardBody scrollable className="max-h-[400px]">
    <Table>{/* rows */}</Table>
  </SectionCardBody>
  <SectionCardFooter divider="top">
    <Pagination>{/* ... */}</Pagination>
  </SectionCardFooter>
</SectionCard>

// Glass surface for floating widgets
<SectionCard surface="glass" interactive="hover" className="absolute top-4 right-4">
  {/* widget content */}
</SectionCard>`,
  },

  "section-toolbar": {
    name: "SectionToolbar",
    import: `import { SectionToolbar, type SectionToolbarProps, type SectionToolbarSelectControl, type SectionToolbarSearchControl, type SectionToolbarPrimaryAction, type SectionToolbarAction, type SectionToolbarViewModeControl } from 'strata-design-system';`,
    category: "application-ui",
    description: "Richer cousin of ListToolbar designed for sections with view-mode toggles (grid/list/table) and multiple secondary actions. Each control is opt-in via prop config.",
    props: [
      "search?: SectionToolbarSearchControl — { value, onSearchChange, placeholder?, ariaLabel? }",
      "filters?: SectionToolbarSelectControl — { options, value, onValueChange, ariaLabel? }",
      "sort?: SectionToolbarSelectControl",
      "viewMode?: SectionToolbarViewModeControl — { value, onValueChange, options: SectionToolbarViewModeOption[] } for grid/list/table toggles",
      "primaryAction?: SectionToolbarPrimaryAction — { label, onClick, icon? }",
      "actions?: SectionToolbarAction[] — secondary buttons array",
      "filterClassName?, actionClassName?, primaryActionClassName?, dataTestId?, searchTestId?: string",
    ],
    tokens: {
      "bg-card / dark:bg-card": "toolbar background when surfaced",
      "bg-muted/50": "select control background",
      "rounded-lg": "toolbar radius",
      "transition-colors duration-200": "hover/focus transitions",
    },
    whenToUse: [
      "Inside SectionCardHeader on data-heavy sections",
      "When you need a view-mode toggle (grid/list/table)",
      "Sections with multiple secondary actions (Export + Import + Refresh)",
      "Combine with ListToolbar for table-only contexts; use SectionToolbar for richer section chrome",
    ],
    antiPatterns: [
      "❌ For simple table toolbars — use ListToolbar (lighter)",
      "❌ Using actions[] as a replacement for primaryAction — semantically distinct",
      "❌ Skipping ariaLabel on filters/sort/search — accessibility regression",
    ],
    example: `<SectionToolbar
  search={{ value: q, onSearchChange: setQ, placeholder: 'Search team...', ariaLabel: 'Search team members' }}
  filters={{
    options: [{ label: 'All', value: 'all' }, { label: 'Active', value: 'active' }],
    value: filter,
    onValueChange: setFilter,
    ariaLabel: 'Filter members',
  }}
  viewMode={{
    value: view,
    onValueChange: setView,
    options: [
      { value: 'grid', icon: <GridIcon className="size-4" />, label: 'Grid' },
      { value: 'list', icon: <ListIcon className="size-4" />, label: 'List' },
    ],
  }}
  primaryAction={{ label: 'Invite Member', onClick: openInvite, icon: <UserPlusIcon /> }}
  actions={[
    { label: 'Export', onClick: exportCsv, icon: <DownloadIcon /> },
    { label: 'Refresh', onClick: refresh, icon: <RefreshCwIcon /> },
  ]}
/>`,
  },

  "separator": {
    name: "Separator",
    import: `import { Separator } from 'strata-design-system';`,
    category: "application-ui",
    description: "Accessible separator line built on Radix Separator. Supports horizontal and vertical orientation. Use Separator for visual breaks; use Divider for the simpler hr-based component.",
    props: [
      "orientation?: 'horizontal' | 'vertical' (default: 'horizontal')",
      "decorative?: boolean (default: true) — when false, exposes role='separator' for screen readers",
      "className?: string",
    ],
    tokens: {
      "bg-border": "separator color",
      "data-[orientation=horizontal]:h-px": "1px height for horizontal",
      "data-[orientation=vertical]:w-px": "1px width for vertical",
    },
    whenToUse: [
      "Simple horizontal or vertical visual breaks",
      "Inside menus and dropdowns (semantic separation)",
      "Vertical separators in toolbars (Separator orientation='vertical')",
      "decorative={false} when the separator conveys meaning to screen readers (e.g., between content sections)",
    ],
    antiPatterns: [
      "❌ <hr className='border-gray-200 my-4'> — use Separator (DS token, dark mode)",
      "❌ For labeled section breaks ('OR') — use Divider with manual label markup",
      "❌ Vertical separator without explicit height (h-4, h-6) — won't render",
      "❌ Multiple stacked Separators — defeats the purpose; add space instead",
    ],
    example: `// Horizontal (default)
<Separator className="my-6" />

// Vertical between toolbar items
<div className="flex items-center gap-2 h-6">
  <Button variant="ghost" size="icon"><BoldIcon /></Button>
  <Button variant="ghost" size="icon"><ItalicIcon /></Button>
  <Separator orientation="vertical" />
  <Button variant="ghost" size="icon"><LinkIcon /></Button>
</div>

// Semantic (announces section break to AT)
<Separator decorative={false} className="my-8" />`,
  },

  "shared-catalog-card": {
    name: "SharedCatalogCard",
    import: `import { SharedCatalogCard } from 'strata-design-system';`,
    category: "application-ui",
    description: "Catalog/product card with full-bleed background image, gradient overlay, glass-effect badge, sync status, owner metadata, and action handlers. Designed for partner/marketplace integrations.",
    props: [
      "title: string — catalog name",
      "itemsCount: number | string — visible count metadata",
      "catalogType: string — type label (e.g., 'API', 'CSV')",
      "catalogTypeIcon?: React.ComponentType — icon for the catalog type",
      "owner: string — owner name shown in metadata row",
      "lastSyncedText: string — formatted last-sync time",
      "lastSyncedSlot?: ReactNode — custom slot replacing the lastSyncedText",
      "backgroundImageUrl?: string — header background image",
      "fallbackBackgroundColor?: string (default: 'bg-orange-500')",
      "statusBadge?: { label, variant? } — glass-style status pill",
      "onSync?: () => void / syncInProgress?: boolean",
      "onViewHistory? / onDelete? / onPrimaryAction?: () => void",
      "primaryActionLabel?: string (default: 'Create Quote')",
      "onClick?: () => void — entire card clickable",
      "alternateBody?: ReactNode — escape hatch replacing the default body content",
    ],
    tokens: {
      "bg-card": "card surface (DS token)",
      "border-zinc-200 / dark:border-zinc-800": "card border (Tier 2 — uses zinc directly)",
      "rounded-2xl + shadow-sm + hover:shadow-md": "card chrome and elevation",
      "h-32": "background image header height",
      "bg-gradient-to-t + from-black/80 + to-transparent": "image gradient overlay",
      "bg-white/20 + backdrop-blur-md + text-white + border-white/10": "glass status badge over image",
      "bg-orange-500": "fallback background when no image (Tier 2 — raw orange)",
      "hover:bg-zinc-100 / dark:hover:bg-zinc-800": "interactive hover state",
    },
    whenToUse: [
      "Partner/marketplace catalog dashboards",
      "Integration listings (CSV / API / Webhook sources)",
      "When the catalog has a representative image + sync status + ownership",
      "alternateBody when the default body layout doesn't fit your data",
    ],
    antiPatterns: [
      "❌ Generic Card with manual image + badges — SharedCatalogCard handles the chrome",
      "❌ For SKU-level products — use SharedInventoryCard or ProductCard",
      "❌ Without onClick AND no other handlers — card has no interactive intent",
      "❌ Long titles without truncation — design favors short catalog names",
    ],
    example: `<SharedCatalogCard
  title="Partner Inventory Q2"
  itemsCount={1284}
  catalogType="API"
  catalogTypeIcon={ApiIcon}
  owner="Diego Zuluaga"
  lastSyncedText="Synced 5 min ago"
  backgroundImageUrl="/catalogs/partner-bg.jpg"
  statusBadge={{ label: 'Live' }}
  syncInProgress={false}
  onSync={() => triggerSync(catalogId)}
  onViewHistory={() => router.push(\`/catalogs/\${catalogId}/history\`)}
  onPrimaryAction={() => createQuote(catalogId)}
  primaryActionLabel="Create Quote"
  onClick={() => router.push(\`/catalogs/\${catalogId}\`)}
/>`,
    governance: {
      tier: 2,
      notes: "Uses bg-zinc-* and bg-orange-500 directly. Glass badge correctly uses bg-white/20 + backdrop-blur. Mixed compliance.",
    },
  },

  "shared-inventory-card": {
    name: "SharedInventoryCard",
    import: `import { SharedInventoryCard } from 'strata-design-system';`,
    category: "application-ui",
    description: "Inventory item card with header image, status/priority badges, location/value metadata, and optional checkbox + action button. Used in shared/multi-tenant inventory dashboards.",
    props: [
      "title: string — item name",
      "subtitle: string — secondary line (SKU, supplier, etc.)",
      "location: string — physical or logical location",
      "valueLabel: string + value: string — labeled metric (e.g., 'Stock' / '12 units')",
      "imageUrl?: string / imageFallbackIcon?: React.ComponentType / imageFallbackLabel?: string",
      "statusBadge?: { label, variant?: 'blue' | 'green' | 'orange' | 'zinc' }",
      "priorityBadge?: { label, variant?: 'green' | 'yellow' | 'muted', emoji? }",
      "showCheckbox?: boolean / checked?: boolean / onCheckboxChange?: (checked) => void",
      "showActionButton?: boolean / onActionClick?: () => void",
      "onClick?: () => void",
    ],
    tokens: {
      "bg-card": "card surface (DS token)",
      "border-zinc-200 / dark:border-zinc-800": "card border (Tier 2)",
      "rounded-2xl + shadow-sm + hover:shadow-lg": "card chrome",
      "h-44": "image header height",
      "bg-gradient-to-t + from-black/60 + via-transparent + to-transparent": "image gradient",
      "bg-white/90 / dark:bg-black/80 + backdrop-blur": "floating badge over image",
      "bg-blue-100 / bg-green-100 / bg-orange-100 / bg-zinc-100 (+ dark variants)": "statusBadge variant backgrounds (Tier 2)",
      "border-t + border-zinc-100 / dark:border-zinc-800": "footer divider",
    },
    whenToUse: [
      "Inventory management dashboards (shared/multi-tenant)",
      "Stock overview pages with thumbnails",
      "Bulk-select inventory views (use showCheckbox)",
      "When you need both a status (state) and a priority (urgency) badge",
    ],
    antiPatterns: [
      "❌ Generic Card with manual image + badges — SharedInventoryCard handles the chrome",
      "❌ For order summaries — use SharedOrderCard",
      "❌ For partner/marketplace catalogs — use SharedCatalogCard",
      "❌ Multiple priorityBadges on the same card — design supports one of each",
    ],
    example: `<SharedInventoryCard
  title="Steel Beam — Type A"
  subtitle="SKU 12345 · Acme Supplier"
  location="Warehouse 2, Aisle 4"
  valueLabel="Stock"
  value="284 units"
  imageUrl="/inventory/steel-beam.jpg"
  statusBadge={{ label: 'In stock', variant: 'green' }}
  priorityBadge={{ label: 'High demand', variant: 'yellow', emoji: '🔥' }}
  showCheckbox
  checked={selected}
  onCheckboxChange={setSelected}
  showActionButton
  onActionClick={() => openReorderModal(item)}
  onClick={() => router.push(\`/inventory/\${item.id}\`)}
/>`,
    governance: {
      tier: 2,
      notes: "statusBadge/priorityBadge variants use raw blue/green/orange/yellow palettes. Should map to bg-status-* tokens. Flagged for Tier 1 refactor.",
    },
  },

  "shared-order-card": {
    name: "SharedOrderCard",
    import: `import { SharedOrderCard } from 'strata-design-system';`,
    category: "application-ui",
    description: "Order card with two layouts: 'default' (compact summary) and 'pipeline' (expanded with stages, project info, project manager, and required action banner). Built for cross-app order experiences.",
    variants: {
      variant: ["default (compact summary)", "pipeline (expanded with stages + actions)"],
      isExpanded: ["false (default)", "true (pipeline expanded body)"],
      isActive: ["false", "true (highlighted with brand ring + shadow-lg)"],
    },
    props: [
      "variant?: 'default' | 'pipeline' (default: 'default')",
      "initials: string — avatar initials for client",
      "client: string — client/customer name",
      "orderId: string — order identifier",
      "amount: string — formatted total ('$1,200')",
      "date: string — order date label",
      "status: string — display status text",
      "statusBadge?: StatusBadgeValue — canonical status (drives StatusBadge variant)",
      "statusBadgeClass?: string — manual class override for status badge",
      "project?: string / location?: string / itemsCount?: number — pipeline variant fields",
      "projectManager?: { name, role? }",
      "stages?: { key, label, status: 'completed' | 'current' | 'pending' }[]",
      "actionRequiredMessage?: string — orange-tinted notice banner",
      "isExpanded?: boolean / isActive?: boolean",
      "onExpandToggle? / onPrimaryAction? / onSecondaryAction? / onDocumentClick? / onEditClick? / onMoreClick?: () => void",
      "onClick?: () => void / className?: string",
    ],
    tokens: {
      "bg-card/40 / bg-white / dark:bg-zinc-900": "card surface (Tier 2 — uses zinc directly)",
      "border-brand-500/50 + ring-1 + ring-brand-500/20": "isActive=true highlight (DS token correct)",
      "shadow-lg / shadow-sm + hover:shadow-md": "elevation states",
      "bg-gradient-to-br + from-indigo-500 + to-indigo-700": "avatar gradient (Tier 2 — raw indigo)",
      "border-zinc-200 / dark:border-zinc-600": "card border (Tier 2)",
      "bg-orange-50 / dark:bg-orange-500/10 + border-orange-200": "actionRequiredMessage banner (Tier 2)",
      "rounded-2xl / rounded-xl / rounded-lg / rounded-full": "nested radii hierarchy",
    },
    whenToUse: [
      "Order history lists (variant='default') — compact 1-line summary per order",
      "Order pipeline views (variant='pipeline') — kanban-style with stages + actions",
      "Recent orders widget on dashboards",
      "isActive=true to highlight the currently selected order in a list",
      "actionRequiredMessage when the order needs user input (e.g., 'Approve quote to proceed')",
    ],
    antiPatterns: [
      "❌ Custom Card with manual order layout — SharedOrderCard handles the chrome",
      "❌ For partner catalogs — use SharedCatalogCard",
      "❌ For inventory — use SharedInventoryCard",
      "❌ stages array with default variant — stages only render in pipeline variant",
    ],
    example: `// Compact summary
<SharedOrderCard
  variant="default"
  initials="AC"
  client="Acme Corp"
  orderId="ORD-2024-1284"
  amount="$1,250.00"
  date="May 1, 2024"
  status="Paid"
  statusBadge="completed"
  onClick={() => router.push(\`/orders/\${orderId}\`)}
/>

// Pipeline with stages and required action
<SharedOrderCard
  variant="pipeline"
  isExpanded
  isActive
  initials="AC"
  client="Acme Corp"
  orderId="ORD-2024-1284"
  amount="$8,400.00"
  date="May 1, 2024"
  status="Awaiting approval"
  statusBadge="pending"
  project="Q2 Steel Order"
  location="Warehouse 4"
  itemsCount={42}
  projectManager={{ name: 'Diego Zuluaga', role: 'PM' }}
  stages={[
    { key: 'quote', label: 'Quote', status: 'completed' },
    { key: 'approval', label: 'Approval', status: 'current' },
    { key: 'fulfill', label: 'Fulfill', status: 'pending' },
    { key: 'deliver', label: 'Deliver', status: 'pending' },
  ]}
  actionRequiredMessage="Customer signature required to proceed"
  onPrimaryAction={() => requestSignature()}
  onSecondaryAction={() => sendReminder()}
  onExpandToggle={() => setExpanded(!expanded)}
/>`,
    governance: {
      tier: 2,
      notes: "Mixed: isActive ring uses brand-500 correctly, but card surface and avatar use zinc/indigo directly. actionRequiredMessage uses raw orange.",
    },
  },

  "shopping-cart": {
    name: "ShoppingCart",
    import: `import { ShoppingCart } from 'strata-design-system';`,
    category: "application-ui",
    description: "Slide-over shopping cart panel with item list, prices, totals, and checkout CTA. Pass `open` and `onClose` to control visibility — the component handles the slide-over chrome.",
    props: [
      "open: boolean — required, controls visibility",
      "onClose: (open: boolean) => void — required, called with `false` when user dismisses",
      "items: CartItem[] — array of { id, name, href, color, price, quantity, imageSrc, imageAlt }",
    ],
    tokens: {
      "divide-y + divide-zinc-200 / dark:divide-zinc-800": "item separators (Tier 2 — uses zinc directly)",
      "h-24 + w-24 + flex-shrink-0 + rounded-md": "item thumbnail dimensions",
      "border-t + border-zinc-200 / dark:border-zinc-800": "footer divider",
      "text-zinc-900 / dark:text-white": "item name color (Tier 2)",
      "text-zinc-500": "secondary text (Tier 2)",
      "text-blue-600 / dark:text-blue-400": "remove/edit link color (Tier 2 — raw blue)",
      "py-6 + px-4 / sm:px-6": "panel padding",
    },
    whenToUse: [
      "E-commerce cart sidebar (slide-over from the right)",
      "Order builder panels triggered from a cart icon",
      "Checkout summary preview before navigating to checkout page",
      "Quick view of items added without leaving the current page",
    ],
    antiPatterns: [
      "❌ For full checkout pages — ShoppingCart is the slide-over preview, not the checkout view",
      "❌ ShoppingCart inside a Card — it's a top-level slide-over panel",
      "❌ Without href on CartItem — items can't link to product detail",
      "❌ Mutating items array directly — use onClose + state lifting",
    ],
    example: `const [cartOpen, setCartOpen] = useState(false);
const items: CartItem[] = [
  { id: '1', name: 'Strata Runner', href: '/products/runner', color: 'Black', price: '$129.00', quantity: 1, imageSrc: '/p/runner.jpg', imageAlt: 'Runner shoe' },
  { id: '2', name: 'Cotton Tee', href: '/products/tee', color: 'White', price: '$29.00', quantity: 2, imageSrc: '/p/tee.jpg', imageAlt: 'White tee' },
];

<Button onClick={() => setCartOpen(true)}>
  <ShoppingBagIcon className="size-4" /> Cart ({items.length})
</Button>

<ShoppingCart
  open={cartOpen}
  onClose={setCartOpen}
  items={items}
/>`,
    governance: {
      tier: 2,
      notes: "Uses zinc + blue-600 directly throughout. Should use bg-card/text-foreground/text-primary. Flagged for Tier 1 refactor.",
    },
  },

  "skeleton": {
    name: "Skeleton",
    import: `import { Skeleton } from 'strata-design-system';`,
    category: "application-ui",
    description: "Animated loading placeholder. A simple <div> with bg-accent + animate-pulse. Compose multiple skeletons to mimic the loading content's shape.",
    props: [
      "className?: string — set width/height/shape via Tailwind",
      "...all standard div props",
    ],
    tokens: {
      "bg-accent": "skeleton background",
      "animate-pulse": "loading pulse animation",
      "rounded-md": "default border radius (override with className)",
    },
    whenToUse: [
      "Show while data is loading from network",
      "Match shape and approximate size of the actual content",
      "List rows: render N skeletons matching expected row height",
      "Card skeletons: wrap multiple Skeletons in the Card layout",
      "Image placeholders: <Skeleton className='aspect-square w-full' />",
    ],
    antiPatterns: [
      "❌ Spinner for layout loading — Skeleton conveys structure (better perceived performance)",
      "❌ Skeleton with color overrides (bg-red-100) — defeats the muted purpose",
      "❌ Animating with custom CSS — animate-pulse is built in",
      "❌ Replacing Skeleton with content abruptly — fade in for smoother UX",
    ],
    example: `// Text skeleton
<div className="space-y-3">
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
  <Skeleton className="h-32 w-full rounded-lg" />
</div>

// Card skeleton
<Card>
  <CardHeader>
    <Skeleton className="h-5 w-32" />
    <Skeleton className="h-4 w-48 mt-2" />
  </CardHeader>
  <CardContent>
    <Skeleton className="h-24 w-full" />
  </CardContent>
</Card>

// List of skeletons
{Array.from({ length: 5 }).map((_, i) => (
  <div key={i} className="flex items-center gap-3">
    <Skeleton className="size-10 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  </div>
))}`,
  },

  "stage-progress": {
    name: "StageProgress",
    import: `import { StageProgress, type StageProgressColor, type StageProgressVerticalDirection, type StageProgressStage, type StageProgressProps } from 'strata-design-system';`,
    category: "application-ui",
    description: "Multi-stage workflow indicator with color-coded states (brand/success/warning/error) and horizontal or vertical layouts. Stages can be plain strings or objects with custom icon/color per stage.",
    variants: {
      color: ["brand (default)", "success", "warning", "error"],
      orientation: ["horizontal (default)", "vertical (vertical={true})"],
      verticalDirection: ["asc (top → bottom)", "desc (bottom → top, default for vertical)"],
    },
    props: [
      "stages: string[] | StageProgressStage[] — stage list (string or { label, icon?, color? })",
      "currentIndex: number — zero-based current stage (>= stages.length means all complete)",
      "color?: 'brand' | 'success' | 'warning' | 'error' (default: 'brand')",
      "vertical?: boolean (default: false)",
      "verticalDirection?: 'asc' | 'desc' (vertical only, default: 'desc')",
    ],
    tokens: {
      "bg-brand-500 + border-brand-500": "brand color completed/current stage",
      "bg-success + border-success": "success color stage",
      "bg-warning + border-warning": "warning color stage",
      "bg-destructive + border-destructive": "error color stage",
      "bg-card + border-border": "incomplete stage",
      "text-foreground / text-muted-foreground": "completed / incomplete labels",
      "rounded-full + whitespace-nowrap": "stage dot and label",
    },
    whenToUse: [
      "Checkout flows (Cart → Address → Payment → Confirmation)",
      "Onboarding sequences with named steps",
      "Order tracking status (Order Placed → Processing → Shipped → Delivered)",
      "Approval workflows with discrete states",
      "Use vertical={true} for sidebar progress, horizontal for top-of-page",
    ],
    antiPatterns: [
      "❌ Progress bar for named multi-step flows — StageProgress shows stage labels",
      "❌ Tracking shipping events (with timestamps) — use Tracking component",
      "❌ ActivityTimeline for ordered workflow steps — Timeline is for chronological log, StageProgress for ordered states",
      "❌ Mixing stage colors arbitrarily — pick one color or use per-stage StageProgressStage objects",
    ],
    example: `// Simple
<StageProgress
  stages={['Order Placed', 'Processing', 'Shipped', 'Delivered']}
  currentIndex={2}
/>

// Colored variants
<StageProgress
  stages={['Submitted', 'In Review', 'Approved']}
  currentIndex={1}
  color="warning"
/>

// Vertical with per-stage objects
<StageProgress
  vertical
  verticalDirection="asc"
  stages={[
    { label: 'Application', icon: <FileTextIcon className="size-4" />, color: 'success' },
    { label: 'Interview', icon: <UsersIcon className="size-4" />, color: 'success' },
    { label: 'Decision', icon: <CheckIcon className="size-4" />, color: 'brand' },
  ]}
  currentIndex={2}
/>`,
  },

  "status-badge": {
    name: "StatusBadge",
    import: `import { StatusBadge } from 'strata-design-system';`,
    category: "application-ui",
    description: "Pre-mapped status pill that takes a canonical status value and renders the correct color and label. The status string itself drives the visual; no separate variant prop.",
    variants: {
      status: ["active / available / in_progress / pending / completed / maintenance / warning / error / archived / in-progress / 'in use' / failed"],
    },
    props: [
      "status: StatusBadgeValue — canonical status string (one of the 12 values above)",
      "className?: string — span pass-through props",
    ],
    tokens: {
      "bg-green-50 / text-green-700 / dark:bg-green-900/* / dark:text-green-400": "active, available, completed (Tier 2 — raw green)",
      "bg-blue-50 / text-blue-700": "in_progress, in-progress (Tier 2 — raw blue)",
      "bg-amber-50 / text-amber-700": "pending, warning, maintenance (Tier 2 — raw amber)",
      "bg-red-50 / text-red-700": "error, failed (Tier 2 — raw red)",
      "bg-zinc-100 / text-zinc-700": "archived (Tier 2)",
      "bg-emerald-50 / text-emerald-700": "in use, success variants",
      "bg-indigo-50 / text-indigo-700": "info variants",
      "rounded-full + px-2.5 + py-1 + text-xs + font-medium": "pill chrome",
    },
    whenToUse: [
      "Record states in tables (orders, tickets, contracts)",
      "Entity status in detail views",
      "Filter chips that map to canonical states",
      "When the status mapping should be consistent across the app — no per-call color customization",
    ],
    antiPatterns: [
      "❌ Custom Badge with hand-mapped colors per status — use StatusBadge for canonical mapping",
      "❌ Inventing new status values — extend StatusBadgeValue type instead of bypassing",
      "❌ For priority levels — use PriorityBadge",
      "❌ For free-form labels (not status) — use Badge",
    ],
    example: `<StatusBadge status="active" />
<StatusBadge status="in_progress" />
<StatusBadge status="pending" />
<StatusBadge status="failed" />
<StatusBadge status="archived" />

// Inside a Table cell
<TableCell>
  <StatusBadge status={order.status} />
</TableCell>`,
    governance: {
      tier: 2,
      notes: "Uses raw green/blue/amber/red/zinc/emerald/indigo palettes. Should map to bg-status-success/info/warning/error tokens. Flagged for Tier 1 refactor.",
    },
  },

  "table-empty-state": {
    name: "TableEmptyState",
    import: `import { TableEmptyState } from 'strata-design-system';`,
    category: "application-ui",
    description: "Minimal centered empty state for tables with a message and a 'Clear filters' action. For richer empty states (icon, custom action) use EmptyState.",
    props: [
      "message: string — empty state text shown to the user",
      "onClearFilters: () => void — handler for the clear filters action",
    ],
    tokens: {
      "flex flex-col items-center justify-center": "centered layout",
      "py-16": "vertical breathing room",
      "text-muted-foreground": "message color",
    },
    whenToUse: [
      "Inside Table when filtered rows.length === 0 (filter cleared brings them back)",
      "When the empty state is filter-driven and a single 'Clear filters' action resolves it",
      "For data-empty (no records ever existed) cases — use EmptyState with create action instead",
    ],
    antiPatterns: [
      "❌ Empty <tbody> with no placeholder — always show TableEmptyState",
      "❌ Custom empty state with icons + multiple actions — use EmptyState",
      "❌ For empty database state with 'Create first item' CTA — use EmptyState",
    ],
    example: `<Table>
  <TableHeader>{/* ... */}</TableHeader>
  <TableBody>
    {filteredRows.length === 0 ? (
      <TableRow>
        <TableCell colSpan={columns.length}>
          <TableEmptyState
            message="No orders match the current filters."
            onClearFilters={() => resetFilters()}
          />
        </TableCell>
      </TableRow>
    ) : (
      filteredRows.map((row) => (/* ... */))
    )}
  </TableBody>
</Table>`,
  },

  "tabs": {
    name: "Tabs",
    import: `import { Tabs, TabsList, TabsTrigger, TabsContent } from 'strata-design-system';`,
    category: "application-ui",
    description: "Radix Tabs with three list variants (default boxed, muted pills, link underlines) and two sizes. Variant and size live on TabsList and propagate to triggers via context.",
    variants: {
      "TabsList.size": ["default", "sm"],
      "TabsList.variant": ["default (boxed)", "muted (pill background)", "link (underline)"],
    },
    props: [
      "Tabs — Radix root: defaultValue?, value?, onValueChange?, orientation?",
      "TabsList.size?: 'default' | 'sm'",
      "TabsList.variant?: 'default' | 'muted' | 'link'",
      "TabsTrigger.value: string — required",
      "TabsTrigger.counter?: ReactNode — optional badge/count next to label",
      "TabsContent.value: string — required, matches a TabsTrigger value",
    ],
    tokens: {
      "bg-zinc-100 / dark:bg-zinc-800": "muted variant background (Tier 2 — uses zinc directly)",
      "border-zinc-200 / dark:border-zinc-800": "default variant borders",
      "data-[state=active]:bg-brand-* / data-[state=active]:border-brand-*": "active trigger styling",
      "rounded-xl / rounded-lg": "list / trigger radii",
      "px-3 + py-1.5 + text-xs / text-sm": "trigger padding and size",
      "font-medium": "trigger weight",
    },
    whenToUse: [
      "Switching between related in-page views (Overview / Analytics / Settings)",
      "Filter tabs with counts (use the `counter` prop on TabsTrigger)",
      "variant='muted' for compact inline tabs in cards",
      "variant='link' for content tabs that look like nav links (no boxes)",
      "size='sm' inside compact contexts (cards, sidebars)",
    ],
    antiPatterns: [
      "❌ For page-level navigation — use Navbar; Tabs are for in-page content",
      "❌ Without TabsContent for every TabsTrigger value — content won't render",
      "❌ Mixing variants between sibling Tabs instances on the same page — visual inconsistency",
      "❌ Using Tabs for sequential flows (Step 1 → Step 2) — use StageProgress + linear nav",
    ],
    example: `<Tabs defaultValue="overview">
  <TabsList variant="muted" size="default">
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="analytics" counter={<Badge>3</Badge>}>
      Analytics
    </TabsTrigger>
    <TabsTrigger value="settings">Settings</TabsTrigger>
  </TabsList>

  <TabsContent value="overview">{/* overview pane */}</TabsContent>
  <TabsContent value="analytics">{/* analytics pane */}</TabsContent>
  <TabsContent value="settings">{/* settings pane */}</TabsContent>
</Tabs>

// Link variant for content tabs
<Tabs defaultValue="all">
  <TabsList variant="link">
    <TabsTrigger value="all">All</TabsTrigger>
    <TabsTrigger value="active" counter={<Badge variant="soft">12</Badge>}>Active</TabsTrigger>
    <TabsTrigger value="archived">Archived</TabsTrigger>
  </TabsList>
  {/* contents */}
</Tabs>`,
    governance: {
      tier: 2,
      notes: "TabsList variants use zinc directly for muted/border contexts. Active state correctly uses brand tokens.",
    },
  },

  "text": {
    name: "Text",
    import: `import { Text, Strong } from 'strata-design-system';`,
    category: "application-ui",
    description: "Semantic paragraph + emphasis components with DS typography baseline. No size variants — fixed type scale (text-base/6 default, sm:text-sm/6). Override size via className when needed.",
    props: [
      "Text — extends HTMLAttributes<HTMLParagraphElement>",
      "Strong — extends ComponentPropsWithoutRef<'strong'>",
      "Both accept className for size or color overrides",
    ],
    tokens: {
      "text-base/6 + sm:text-sm/6": "Text default size (responsive)",
      "text-zinc-500 / dark:text-zinc-400": "Text default color (Tier 2 — uses zinc directly)",
      "text-zinc-950 / dark:text-white": "Strong color (Tier 2 — uses zinc directly)",
      "font-semibold": "Strong weight",
    },
    whenToUse: [
      "Body paragraphs with consistent default size and muted color",
      "Strong for inline emphasis within Text or other prose",
      "Override size with className for explicit needs (`text-xs`, `text-lg`)",
      "Pair with Heading for hierarchical typography",
    ],
    antiPatterns: [
      "❌ <p className='text-[15px] text-gray-600'> — bypasses DS typography",
      "❌ Using <strong> for non-emphatic styling — use Strong only for semantic emphasis",
      "❌ Expecting Text to render headings — use Heading",
      "❌ Wrapping single words in Text — use plain <span> or text inside Text",
    ],
    example: `<Heading level={2}>Welcome back</Heading>
<Text>
  Your account is in good standing. <Strong>3 actions</Strong> require your attention.
</Text>

<Text className="text-xs">Smaller helper text.</Text>
<Text className="text-foreground">Override muted to primary text color.</Text>`,
    governance: {
      tier: 2,
      notes: "Default Text color uses text-zinc-500/dark:zinc-400 instead of text-muted-foreground. Strong uses text-zinc-950/dark:white instead of text-foreground. Flagged for Tier 1 refactor.",
    },
  },

  "toggle": {
    name: "Toggle",
    import: `import { Toggle, toggleVariants } from 'strata-design-system';`,
    category: "application-ui",
    description: "Single press-and-hold toggle button (pressed/unpressed) with CVA variants, built on Radix Toggle. Exports `toggleVariants` for use with Slot/asChild patterns.",
    variants: {
      variant: ["default (transparent)", "outline (border + shadow-sm)", "pill (rounded-full)"],
      size: ["default (h-9)", "sm (h-8)", "lg (h-10)"],
    },
    props: [
      "variant?: 'default' | 'outline' | 'pill' (default: 'default')",
      "size?: 'default' | 'sm' | 'lg' (default: 'default')",
      "pressed?: boolean — controlled state",
      "onPressedChange?: (pressed: boolean) => void",
      "defaultPressed?: boolean",
      "disabled?: boolean",
      "...all Radix TogglePrimitive.Root props",
    ],
    tokens: {
      "bg-transparent / bg-white": "default / pill background",
      "bg-accent + text-accent-foreground": "pressed state",
      "bg-muted / hover:bg-muted": "hover state",
      "border-input + shadow-sm": "outline variant chrome",
      "data-[state=on]:*": "pressed-state styling hooks",
      "h-9/8/10 + min-w-9/8/10": "size scale",
    },
    whenToUse: [
      "Text formatting toolbars (Bold, Italic, Underline)",
      "View mode toggles (grid vs list) — but ToggleGroup is better for mutually exclusive sets",
      "Mute / unmute style on/off pairs in media controls",
      "Filter chips that toggle on/off (use ToggleGroup type='multiple' for groups)",
    ],
    antiPatterns: [
      "❌ For binary settings (Dark mode on/off) — use Switch",
      "❌ For mutually exclusive options — use ToggleGroup type='single' or RadioGroup",
      "❌ Toggle without aria-label or visible text — accessibility regression",
      "❌ Stacking 5+ standalone Toggles — use ToggleGroup for related set",
    ],
    example: `// Single toggle
<Toggle aria-label="Toggle bold" pressed={isBold} onPressedChange={setBold}>
  <BoldIcon className="size-4" />
</Toggle>

// Variants
<Toggle variant="outline" size="sm">
  <EyeIcon className="size-3.5" /> Show
</Toggle>

<Toggle variant="pill">
  <BellIcon className="size-4" /> Notifications
</Toggle>`,
  },

  "toggle-group": {
    name: "ToggleGroup",
    import: `import { ToggleGroup, ToggleGroupItem } from 'strata-design-system';`,
    category: "application-ui",
    description: "Group of related toggle buttons with single (radio-like) or multiple (checkbox-like) selection. Variant and size set on ToggleGroup propagate to all ToggleGroupItems via context (children can override).",
    variants: {
      type: ["single (one selected at a time)", "multiple (multi-select)"],
      variant: ["default", "outline", "pill (rounded segmented control)"],
      size: ["default", "sm", "lg"],
    },
    props: [
      "ToggleGroup.type: 'single' | 'multiple' — required",
      "ToggleGroup.value: string | string[] — controlled value(s)",
      "ToggleGroup.onValueChange: (value) => void",
      "ToggleGroup.variant?: inherits Toggle variants (passed to children via context)",
      "ToggleGroup.size?: inherits Toggle sizes",
      "ToggleGroupItem.value: string — required, identifies the item",
      "ToggleGroupItem.variant? / .size? — override the group's context per item",
    ],
    tokens: {
      "bg-zinc-100 / dark:bg-zinc-800": "pill variant container background (Tier 2)",
      "p-1 + gap-1": "pill segmented control padding/spacing",
      "first:border-l + border-l-0": "outline variant - merged borders between items",
      "first:rounded-l-md + last:rounded-r-md + rounded-none": "outline variant - shared corners",
      "shadow-xs / shadow-none": "elevation per variant",
    },
    whenToUse: [
      "View switchers (grid / list / table) — type='single'",
      "Filter chip groups (multiple tags) — type='multiple'",
      "Alignment controls (left / center / right) — type='single'",
      "Toolbar formatting groups (Bold / Italic / Underline) — type='multiple'",
      "Use variant='pill' for segmented control look (iOS-style)",
    ],
    antiPatterns: [
      "❌ Radio buttons for visual mode switching — ToggleGroup is the right primitive",
      "❌ Checkboxes for related toolbar toggles — use ToggleGroup type='multiple'",
      "❌ Mismatched type and value (type='single' with array value) — runtime error",
      "❌ Without value/onValueChange — uncontrolled with no defaultValue is rarely useful",
    ],
    example: `// Single (view switcher)
<ToggleGroup type="single" value={view} onValueChange={setView} variant="outline">
  <ToggleGroupItem value="grid" aria-label="Grid view"><GridIcon className="size-4" /></ToggleGroupItem>
  <ToggleGroupItem value="list" aria-label="List view"><ListIcon className="size-4" /></ToggleGroupItem>
  <ToggleGroupItem value="table" aria-label="Table view"><TableIcon className="size-4" /></ToggleGroupItem>
</ToggleGroup>

// Multiple (formatting toolbar)
<ToggleGroup type="multiple" value={formats} onValueChange={setFormats}>
  <ToggleGroupItem value="bold" aria-label="Bold"><BoldIcon /></ToggleGroupItem>
  <ToggleGroupItem value="italic" aria-label="Italic"><ItalicIcon /></ToggleGroupItem>
  <ToggleGroupItem value="underline" aria-label="Underline"><UnderlineIcon /></ToggleGroupItem>
</ToggleGroup>

// Pill segmented control
<ToggleGroup type="single" value={tab} onValueChange={setTab} variant="pill" size="sm">
  <ToggleGroupItem value="day">Day</ToggleGroupItem>
  <ToggleGroupItem value="week">Week</ToggleGroupItem>
  <ToggleGroupItem value="month">Month</ToggleGroupItem>
</ToggleGroup>`,
  },

  "tracking": {
    name: "OrderTracking",
    import: `import { OrderTracking, ProgressTracker } from 'strata-design-system';`,
    category: "application-ui",
    description: "Two complementary tracking primitives: OrderTracking renders a step-by-step shipment/process timeline with rich content per step; ProgressTracker is a simple 'step N of M' indicator.",
    variants: {
      "OrderTracking.color": ["default (zinc)", "brand", "success"],
      "OrderTracking.layout": ["inline (horizontal)", "stacked (vertical)"],
      "OrderTracking.showRing": ["true (default — animated ring on current step)", "false"],
    },
    props: [
      "OrderTracking.steps: TrackingStep[] — { id, name, description?, status: 'complete' | 'current' | 'upcoming', date?, content? }",
      "OrderTracking.color?: 'default' | 'brand' | 'success' (default: 'default')",
      "OrderTracking.showRing?: boolean (default: true)",
      "OrderTracking.layout?: 'inline' | 'stacked' (default: 'inline')",
      "ProgressTracker.currentStep: number — required",
      "ProgressTracker.totalSteps: number — required",
    ],
    tokens: {
      "bg-zinc-200 / bg-brand-500/30 / bg-success/30": "connector colors by `color` prop (Tier 2 mix)",
      "ring-8 + ring-white + ring-brand-500/20 / ring-success/20": "current step ring",
      "rounded-full + h-8 + w-8": "step dot dimensions",
      "border-2 + border-zinc-200": "upcoming step border",
      "text-white + text-zinc-900": "step indicator text colors",
    },
    whenToUse: [
      "OrderTracking — shipping status pages, order timelines with timestamps",
      "OrderTracking — multi-step processes with rich per-step content (description + date)",
      "OrderTracking layout='stacked' for mobile or sidebar use",
      "ProgressTracker — when you only need 'Step 2 of 4' simple indicator",
      "color='success' once the flow is fully complete (e.g., Delivered)",
    ],
    antiPatterns: [
      "❌ ActivityTimeline for linear shipment flows — use OrderTracking",
      "❌ StageProgress for shipment with timestamps and rich content — use OrderTracking",
      "❌ OrderTracking for 'how many steps left' summary — use ProgressTracker",
      "❌ Mixing TrackingStep statuses arbitrarily — only one step should be 'current'",
    ],
    example: `<OrderTracking
  color="brand"
  layout="stacked"
  steps={[
    { id: '1', name: 'Order Placed', status: 'complete', date: 'May 1, 10:00 AM', description: 'Payment confirmed' },
    { id: '2', name: 'Processing', status: 'complete', date: 'May 1, 11:30 AM' },
    { id: '3', name: 'Shipped', status: 'current', date: 'May 2, 2:30 PM', description: 'UPS · Tracking #1Z999...', content: <Button size="sm" variant="outline">Track package</Button> },
    { id: '4', name: 'Out for Delivery', status: 'upcoming' },
    { id: '5', name: 'Delivered', status: 'upcoming' },
  ]}
/>

// Simple progress indicator
<ProgressTracker currentStep={3} totalSteps={5} />`,
    governance: {
      tier: 2,
      notes: "Default color uses zinc + ring-white directly. Brand and success colors correctly reference DS tokens. Mixed compliance.",
    },
  },

  // ── DATA VISUALIZATION ───────────────────────────────────────────────────────

  "accordion": {
    name: "Accordion",
    import: `import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from 'strata-design-system';`,
    category: "data-visualization",
    description: "Collapsible sections with animated expand/collapse, built on Radix Accordion. Supports single (one open at a time) or multiple (independent) modes via type prop.",
    variants: {
      type: ["single (one section open)", "multiple (independent toggles)"],
    },
    props: [
      "Accordion — Radix Root: type: 'single' | 'multiple' required, collapsible? (only with type='single', allows zero open), defaultValue?, value?, onValueChange?, disabled?, dir?",
      "AccordionItem — single section: value: string required, disabled?, className? (default: border-b last:border-b-0)",
      "AccordionTrigger — clickable header (wraps in Heading button)",
      "AccordionContent — animated content panel (uses animate-accordion-down/up)",
    ],
    tokens: {
      "border-b + last:border-b-0": "AccordionItem separator (DS-token border)",
      "text-sm + font-medium + text-left": "AccordionTrigger styling (DS-correct)",
      "text-muted-foreground": "secondary text (DS-correct)",
      "rounded-md": "focus ring radius",
      "focus-visible:ring-ring/50 + focus-visible:ring-[3px]": "focus state (DS-correct)",
      "focus-visible:border-ring": "focus border",
      "data-[state=open]:animate-accordion-down + data-[state=closed]:animate-accordion-up": "open/close animations (Tailwind-config-defined)",
    },
    whenToUse: [
      "FAQs / Q&A sections (type='single' collapsible)",
      "Settings categories where one section at a time is reviewed",
      "Filterable groups in sidebars (type='multiple' for independent toggling)",
      "Collapsible detail sections in product or order pages",
    ],
    antiPatterns: [
      "❌ Collapsible for multi-section lists — Collapsible is for one section",
      "❌ Tabs for content where stacking is OK — Accordion preserves vertical context",
      "❌ Accordion type='single' without collapsible when first item should start closed",
      "❌ Without value on AccordionItem — Radix needs unique values per item",
    ],
    example: `// FAQs (one open at a time, optional zero open)
<Accordion type="single" collapsible className="w-full">
  <AccordionItem value="faq-1">
    <AccordionTrigger>How do I get started?</AccordionTrigger>
    <AccordionContent>
      Install the package and import components from <code>strata-design-system</code>.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="faq-2">
    <AccordionTrigger>Can I customize the theme?</AccordionTrigger>
    <AccordionContent>
      Yes — override CSS variables in your global stylesheet.
    </AccordionContent>
  </AccordionItem>
</Accordion>

// Multi-open settings groups
<Accordion type="multiple" defaultValue={["account", "notifications"]}>
  <AccordionItem value="account"><AccordionTrigger>Account</AccordionTrigger><AccordionContent>...</AccordionContent></AccordionItem>
  <AccordionItem value="notifications"><AccordionTrigger>Notifications</AccordionTrigger><AccordionContent>...</AccordionContent></AccordionItem>
  <AccordionItem value="security"><AccordionTrigger>Security</AccordionTrigger><AccordionContent>...</AccordionContent></AccordionItem>
</Accordion>`,
  },

  "description-list": {
    name: "DescriptionList",
    import: `import { DescriptionList, DescriptionTerm, DescriptionDetails } from 'strata-design-system';`,
    category: "data-visualization",
    description: "Semantic <dl> wrapper with <dt> (term) + <dd> (details) primitives. Renders as responsive grid: stacked on mobile, two-column on sm+ breakpoints.",
    props: [
      "DescriptionList — extends <dl> element props (className, children)",
      "DescriptionTerm — extends <dt> element props (the label)",
      "DescriptionDetails — extends <dd> element props (the value, can contain ReactNode)",
    ],
    tokens: {
      "divide-y + divide-zinc-100 / dark:divide-zinc-800": "row separators (Tier 2 — uses zinc directly)",
      "text-sm + font-medium + leading-6": "term styling",
      "text-zinc-900 / dark:text-white": "term color (Tier 2)",
      "text-zinc-700 / dark:text-zinc-400": "details color (Tier 2)",
      "mt-1 + sm:col-span-2 + sm:mt-0": "details responsive layout",
    },
    whenToUse: [
      "Order detail pages (Customer, Order ID, Date, Total)",
      "User profile summaries",
      "Invoice headers and metadata",
      "Any 2-column key/value display where stacked-on-mobile + side-by-side-on-desktop is the desired UX",
    ],
    antiPatterns: [
      "❌ Table for 2-column key/value data — DescriptionList is semantic <dl>",
      "❌ Custom <div className='grid'> for label/value pairs — DescriptionList provides correct semantics",
      "❌ DescriptionDetails without an associated DescriptionTerm — breaks semantic structure",
      "❌ Long-form text inside DescriptionDetails — consider StackedList or Card",
    ],
    example: `<DescriptionList>
  <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
    <DescriptionTerm>Customer</DescriptionTerm>
    <DescriptionDetails>Acme Corp</DescriptionDetails>
  </div>
  <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
    <DescriptionTerm>Order ID</DescriptionTerm>
    <DescriptionDetails>#ORD-1234</DescriptionDetails>
  </div>
  <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
    <DescriptionTerm>Status</DescriptionTerm>
    <DescriptionDetails>
      <StatusBadge status="completed" />
    </DescriptionDetails>
  </div>
</DescriptionList>`,
    governance: {
      tier: 2,
      notes: "Uses zinc for divide and text. Should use border-border + text-foreground/text-muted-foreground.",
    },
  },

  "disclosure": {
    name: "Disclosure",
    import: `import { Disclosure, DisclosureButton, DisclosurePanel } from 'strata-design-system';`,
    category: "data-visualization",
    description: "Single show/hide section built on Headless UI Disclosure. Use DisclosureButton as the trigger and DisclosurePanel for the expandable content.",
    props: [
      "Disclosure — Headless UI Root (uses render-prop or compound pattern)",
      "DisclosureButton — clickable trigger, children: required",
      "DisclosurePanel — expandable content panel",
      "All accept className + native Headless UI props",
    ],
    tokens: {
      "text-sm/6 + font-medium": "DisclosureButton text",
      "text-zinc-900 / dark:text-white": "DisclosureButton color (Tier 2 — uses zinc directly)",
      "text-zinc-700 / dark:text-zinc-300": "DisclosurePanel content color (Tier 2)",
      "text-zinc-500 / dark:text-zinc-400": "DisclosurePanel muted text (Tier 2)",
      "outline-2 + outline-blue-500 + -outline-offset-2": "focus outline (Tier 2 — raw blue)",
      "transition-transform + duration-200": "chevron rotation animation",
      "py-2 + gap-3": "spacing",
    },
    whenToUse: [
      "Truncated descriptions with 'Show more' / 'Show less'",
      "Legal text and terms (collapsed by default)",
      "Expandable help content within form fields",
      "Single-section reveal — for multi-section use Accordion",
    ],
    antiPatterns: [
      "❌ Accordion for a single expandable section — Disclosure is purpose-built",
      "❌ Collapsible (Radix) — same use case but Disclosure (Headless UI) integrates with the Listbox/Combobox aesthetic family",
      "❌ DisclosureButton without children — required prop",
      "❌ Custom toggle button with useState — Disclosure handles state and a11y automatically",
    ],
    example: `<Disclosure>
  <DisclosureButton className="flex items-center justify-between w-full py-2 text-foreground">
    <span>Show order history</span>
    <ChevronDownIcon className="size-4 transition-transform ui-open:rotate-180" />
  </DisclosureButton>
  <DisclosurePanel className="pt-2 text-sm text-muted-foreground">
    {orders.map((o) => (
      <div key={o.id} className="py-1">{o.id} · \${o.total}</div>
    ))}
  </DisclosurePanel>
</Disclosure>`,
    governance: {
      tier: 2,
      notes: "Uses zinc + raw blue throughout. Should use text-foreground/text-muted-foreground/outline-ring. Flagged for Tier 1 refactor.",
    },
  },

  "empty-state": {
    name: "EmptyState",
    import: `import { EmptyState, EmptyStateIcon, EmptyStateTitle, EmptyStateDescription, EmptyStateActions } from 'strata-design-system';`,
    category: "data-visualization",
    description: "Composable empty state with subcomponents for icon, title, description, and actions. Use the dashed-border outer container as the visual signal that this slot is intentionally empty.",
    props: [
      "EmptyState — outer wrapper (border-dashed, p-12, text-center)",
      "EmptyStateIcon — circular icon container (h-12 w-12, mx-auto)",
      "EmptyStateTitle — h3 element (text-sm font-semibold)",
      "EmptyStateDescription — p element (text-muted-foreground)",
      "EmptyStateActions — flex container for buttons (mt-6)",
      "All accept className + native element props",
    ],
    tokens: {
      "border + border-dashed": "outer dashed border (visual empty signal)",
      "bg-muted": "icon container background (DS-correct)",
      "rounded-lg + rounded-full": "outer container + icon radii",
      "text-foreground": "title color (DS-correct)",
      "text-muted-foreground": "description color (DS-correct)",
      "text-center + p-12 + max-w-sm + mx-auto": "centered layout",
      "h-12 + w-12 + mt-2 + mt-1 + mt-6": "spacing scale",
    },
    whenToUse: [
      "Empty data lists (no orders yet, no team members)",
      "First-use onboarding screens with a primary CTA",
      "Permission denied or feature unavailable views",
      "Error states with a retry action (use TableEmptyState for inside tables)",
      "Wrap inside a Card or as a standalone panel",
    ],
    antiPatterns: [
      "❌ Blank space when no data — always show EmptyState",
      "❌ TableEmptyState outside tables — use EmptyState for richer chrome",
      "❌ Without EmptyStateActions — empty states without next steps confuse users",
      "❌ EmptyStateIcon with a complex multi-color illustration — designed for simple monoline icons",
    ],
    example: `<EmptyState>
  <EmptyStateIcon>
    <InboxIcon className="size-6 text-muted-foreground" />
  </EmptyStateIcon>
  <EmptyStateTitle>No orders yet</EmptyStateTitle>
  <EmptyStateDescription>
    Get started by creating your first order. Drafts are auto-saved every 30 seconds.
  </EmptyStateDescription>
  <EmptyStateActions>
    <Button onClick={() => createOrder()}>
      <PlusIcon className="size-4 mr-2" /> Create Order
    </Button>
    <Button variant="outline" onClick={() => importCsv()}>
      Import CSV
    </Button>
  </EmptyStateActions>
</EmptyState>

// Search results empty state
<EmptyState>
  <EmptyStateIcon>
    <SearchIcon className="size-6 text-muted-foreground" />
  </EmptyStateIcon>
  <EmptyStateTitle>No results for "{query}"</EmptyStateTitle>
  <EmptyStateDescription>Try adjusting your search or removing filters.</EmptyStateDescription>
  <EmptyStateActions>
    <Button variant="outline" onClick={resetFilters}>Clear filters</Button>
  </EmptyStateActions>
</EmptyState>`,
  },

  "stacked-list": {
    name: "StackedList",
    import: `import { StackedList, StackedListItem } from 'strata-design-system';`,
    category: "data-visualization",
    description: "Semantic <ul role='list'> + <li> primitives with built-in vertical dividers. Compose your own row content inside StackedListItem — no `title`/`subtitle` props.",
    props: [
      "StackedList — extends <ul> element props, role='list' set automatically (className for overrides)",
      "StackedListItem — extends <li> element props (className, children, onClick, etc.)",
    ],
    tokens: {
      "divide-y + divide-zinc-100 / dark:divide-zinc-800": "row separators (Tier 2 — uses zinc directly)",
      "flex + justify-between + gap-x-6": "default item layout (label left, meta right)",
      "py-5": "item vertical padding",
    },
    whenToUse: [
      "Recent activity feeds (one entity per row + timestamp)",
      "Notification lists (icon + title + time)",
      "File / document lists (name + size + modified)",
      "Contact lists (avatar + name + role + actions)",
      "Anywhere a Table would be overkill (1-3 logical columns of mixed content)",
    ],
    antiPatterns: [
      "❌ Table for simple lists with mixed content per row — StackedList is lighter",
      "❌ DescriptionList for repeating list items — DescriptionList is for one entity's metadata",
      "❌ Custom <ul> with manual divide-y — StackedList provides correct semantics + dark mode",
      "❌ Expecting title/subtitle props — compose your own row inside StackedListItem",
    ],
    example: `<StackedList>
  {notifications.map((n) => (
    <StackedListItem key={n.id}>
      <div className="flex items-center gap-x-4">
        <div className="size-10 flex items-center justify-center rounded-full bg-status-info/10">
          <BellIcon className="size-5 text-status-info" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{n.title}</p>
          <p className="text-xs text-muted-foreground">{n.time}</p>
        </div>
      </div>
      <Button variant="ghost" size="sm">View</Button>
    </StackedListItem>
  ))}
</StackedList>

// Activity feed
<StackedList>
  {activities.map((a) => (
    <StackedListItem key={a.id}>
      <div className="flex gap-x-3 items-start">
        <Avatar size="sm"><AvatarFallback>{a.user.initials}</AvatarFallback></Avatar>
        <div>
          <p className="text-sm text-foreground"><strong>{a.user.name}</strong> {a.action}</p>
          <p className="text-xs text-muted-foreground">{a.time}</p>
        </div>
      </div>
    </StackedListItem>
  ))}
</StackedList>`,
    governance: {
      tier: 2,
      notes: "Uses divide-zinc directly. Should use divide-border. Flagged for Tier 1 refactor.",
    },
  },

  // ── FORMS ────────────────────────────────────────────────────────────────────

  "checkbox": {
    name: "Checkbox",
    import: `import { Checkbox } from 'strata-design-system';`,
    category: "forms",
    description: "Square checkbox built on Radix Checkbox. Renders the box only — pair with a separate Label or wrap inside Field for full a11y.",
    props: [
      "className?: string",
      "checked?: boolean | 'indeterminate' — controlled state",
      "onCheckedChange?: (checked: boolean | 'indeterminate') => void",
      "defaultChecked?: boolean — uncontrolled initial state",
      "disabled?: boolean",
      "required?: boolean",
      "name? / value? — for native form submission",
      "...all Radix CheckboxPrimitive.Root props",
    ],
    tokens: {
      "border-zinc-300 / dark:border-zinc-700": "default border (Tier 2 — uses zinc directly)",
      "bg-white / dark:bg-zinc-950/30": "default background (Tier 2)",
      "data-[state=checked]:bg-brand-500 + data-[state=checked]:text-zinc-900": "checked state (uses brand correctly)",
      "data-[state=checked]:border-brand-200 / dark:data-[state=checked]:border-brand-500": "checked border",
      "focus-visible:border-brand-500 + focus-visible:ring-brand-500/20": "focus ring (brand-correct)",
      "aria-invalid:border-red-600 + aria-invalid:ring-red-600/20": "validation error state (Tier 2 — raw red)",
      "size-4 + rounded-[4px] + shrink-0 + shadow-xs": "checkbox dimensions",
    },
    whenToUse: [
      "Multi-select options in forms (multiple Checkboxes for related items)",
      "Terms-of-service acceptance",
      "Boolean settings inside forms (use Switch for toggle-style settings outside forms)",
      "Indeterminate state for partially-selected nested lists (`checked='indeterminate'`)",
      "Wrap with Field for label + description + error",
    ],
    antiPatterns: [
      "❌ <input type='checkbox'> with custom styles — use Checkbox for DS tokens and a11y",
      "❌ For binary toggle settings outside forms — use Switch",
      "❌ Checkbox without an associated Label — accessibility regression",
      "❌ Custom indeterminate icon — Radix Checkbox handles indeterminate via state",
    ],
    example: `// Basic with separate label
<div className="flex items-center gap-2">
  <Checkbox id="terms" />
  <Label htmlFor="terms">Accept terms and conditions</Label>
</div>

// Inside Field
<Field>
  <FieldLabel>Notifications</FieldLabel>
  <div className="space-y-2">
    {channels.map((c) => (
      <div key={c.id} className="flex items-center gap-2">
        <Checkbox
          id={c.id}
          checked={selected.includes(c.id)}
          onCheckedChange={(v) => toggle(c.id, v === true)}
        />
        <Label htmlFor={c.id}>{c.name}</Label>
      </div>
    ))}
  </div>
  <FieldDescription>You can change these any time.</FieldDescription>
</Field>

// Indeterminate (parent over partial children)
<Checkbox checked={partialSelection ? 'indeterminate' : allSelected} />`,
    governance: {
      tier: 2,
      notes: "Default border/bg use zinc directly. Checked + focus correctly use brand-500. Validation error uses raw red-600/500.",
    },
  },

  "combobox": {
    name: "Combobox",
    import: `import { Combobox, ComboboxOption } from 'strata-design-system';`,
    category: "forms",
    description: "Searchable single-or-multi-select built on Headless UI Combobox. Generic over T — pass your domain type, render via children + displayValue.",
    props: [
      "Combobox<T> — main wrapper, accepts ComboboxOption children",
      "Combobox.value?: T | T[] — selected value (array when multiple)",
      "Combobox.onChange?: (value: T | T[] | null) => void",
      "Combobox.onClose?: () => void",
      "Combobox.multiple?: boolean (default: false)",
      "Combobox.placeholder?: string",
      "Combobox.autoFocus?: boolean",
      "Combobox.aria-label?: string",
      "Combobox.displayValue?: (item: T) => string — formats the input text from selected value",
      "ComboboxOption.value: T — required",
      "ComboboxOption.children?: ReactNode — option content (custom rendering allowed)",
    ],
    tokens: {
      "rounded-lg + border-zinc-200 / dark:border-zinc-800": "input button chrome (Tier 2 — uses zinc directly)",
      "bg-white / dark:bg-zinc-900": "input button background (Tier 2)",
      "text-zinc-950 / dark:text-white": "input text (Tier 2)",
      "focus-within:outline-blue-500/25": "focus ring (Tier 2 — raw blue)",
      "rounded-xl + p-1 + shadow-lg": "options panel",
      "bg-zinc-100 / dark:bg-zinc-800": "highlighted option (Tier 2)",
      "hover:border-zinc-300 / dark:hover:border-zinc-700": "hover border",
    },
    whenToUse: [
      "Selecting from large lists (100+ items) — country / currency / user pickers",
      "Filterable dropdowns where users will type to narrow",
      "Multi-select use cases when SearchableMultiSelect is too heavy (set `multiple={true}`)",
      "Custom-rendered options with thumbnails, descriptions, badges (children prop)",
    ],
    antiPatterns: [
      "❌ Select for 50+ options — Combobox handles search natively",
      "❌ Custom <input> + dropdown panel + filter logic — use Combobox",
      "❌ Without displayValue when T is an object — input renders [object Object]",
      "❌ Without aria-label — accessibility regression",
    ],
    example: `// Single-select
const [country, setCountry] = useState<Country | null>(null);

<Combobox
  value={country}
  onChange={setCountry}
  displayValue={(c) => c?.name ?? ''}
  placeholder="Select country..."
  aria-label="Country"
>
  {countries.map((c) => (
    <ComboboxOption key={c.code} value={c}>
      <span>{c.flag}</span> {c.name}
    </ComboboxOption>
  ))}
</Combobox>

// Multi-select
const [tags, setTags] = useState<Tag[]>([]);

<Combobox
  multiple
  value={tags}
  onChange={(v) => setTags(v as Tag[])}
  displayValue={(items) => Array.isArray(items) ? \`\${items.length} selected\` : ''}
  placeholder="Add tags..."
>
  {availableTags.map((t) => (
    <ComboboxOption key={t.id} value={t}>{t.name}</ComboboxOption>
  ))}
</Combobox>`,
    governance: {
      tier: 2,
      notes: "Uses zinc + raw blue throughout. Should map to bg-card/text-foreground/border-input/ring-ring. Flagged for Tier 1 refactor.",
    },
  },

  "date-picker": {
    name: "DatePicker",
    import: `import { DatePicker, type DatePickerProps } from 'strata-design-system';`,
    category: "forms",
    description: "Single-date input with calendar popover. Pass and receive dates as ISO YYYY-MM-DD strings (not Date objects). For richer modes (range, multiple) drop down to Calendar inside a Popover manually.",
    props: [
      "value?: string — ISO YYYY-MM-DD string format",
      "onChange?: (value: string) => void — receives YYYY-MM-DD",
      "placeholder?: string (default: 'Pick a date')",
      "id?: string — input id",
      "disabled?: boolean",
      "className?: string — wrapper class",
      "aria-label?: string",
      "aria-describedby?: string — link to a description element",
    ],
    tokens: {
      "h-9 + rounded-lg + border-zinc-300 / dark:border-zinc-700": "input chrome (Tier 2 — uses zinc directly)",
      "bg-input-background/30": "input background (DS token)",
      "text-foreground / text-muted-foreground": "input text and placeholder (DS tokens)",
      "focus:border-primary + focus:ring-2 + focus:ring-primary": "focus state (DS tokens)",
      "shadow-sm + transition-all": "elevation and motion",
      "pl-10 + pr-4 + py-2": "padding (icon left)",
      "size-4": "calendar icon size",
    },
    whenToUse: [
      "Single-date inputs in forms: birth dates, event dates, deadlines",
      "When you need ISO string output for API submission (no Date conversion)",
      "Wrap with Field for label + description + error",
      "For ranges (check-in / check-out) — use Calendar inside a Popover with mode='range'",
    ],
    antiPatterns: [
      "❌ <input type='date'> — no DS styling, browser inconsistency",
      "❌ Building custom calendar+popover combo — use DatePicker (handles popover)",
      "❌ Passing Date objects as value/onChange — DatePicker uses ISO YYYY-MM-DD strings",
      "❌ For date ranges — DatePicker is single-date only; compose Calendar in Popover for range",
    ],
    example: `<Field>
  <FieldLabel>Event date</FieldLabel>
  <DatePicker value={date} onChange={setDate} placeholder="Select event date" />
  <FieldDescription>Used to schedule reminders.</FieldDescription>
</Field>

// With validation
<Field>
  <FieldLabel optional>Birthday</FieldLabel>
  <DatePicker
    id="birthday"
    value={birthday}
    onChange={setBirthday}
    aria-describedby="birthday-help"
    aria-invalid={!!error}
  />
  {error && <FieldError>{error}</FieldError>}
</Field>`,
    governance: {
      tier: 2,
      notes: "Uses zinc-300/700 for border directly. Focus ring correctly uses primary token. Mixed.",
    },
  },

  "field": {
    name: "Field",
    import: `import { Field, FieldLabel, FieldDescription, FieldError } from 'strata-design-system';`,
    category: "forms",
    description: "Composable form field primitives. Field is the wrapper; FieldLabel/Description/Error are subcomponents you place explicitly. No props magic — you wire your own input inside.",
    props: [
      "Field — div wrapper with flex-col + gap-1.5 spacing (extends HTMLDivElement)",
      "FieldLabel — label element with optional 'Optional' badge",
      "FieldLabel.optional?: boolean — shows 'Optional' chip on the right of the label",
      "FieldDescription — small muted helper text below the input",
      "FieldError — small destructive-colored error text",
    ],
    tokens: {
      "flex flex-col gap-1.5": "field layout",
      "text-muted-foreground": "FieldLabel optional badge + FieldDescription text",
      "text-destructive + font-medium": "FieldError color",
      "text-xs + font-normal": "FieldLabel optional badge size/weight",
      "items-center justify-between": "FieldLabel layout when optional badge present",
    },
    whenToUse: [
      "Always wrap form inputs with Field for consistent label + description + error layout",
      "Use FieldLabel.optional for non-required fields (avoids cluttering required indicators)",
      "FieldDescription for helper text shown by default",
      "FieldError for validation errors — only render when there's an error",
    ],
    antiPatterns: [
      "❌ Manual <label> + <p> for error/description — use Field subcomponents",
      "❌ Field without an input inside — use FieldLabel + FieldDescription standalone for label-only display",
      "❌ Both `required` indicator and `optional` badge — pick one convention per form",
      "❌ FieldError always rendered (empty when no error) — only render conditionally",
    ],
    example: `<Field>
  <FieldLabel>Email</FieldLabel>
  <Input type="email" placeholder="you@example.com" aria-invalid={!!errors.email} />
  {errors.email ? <FieldError>{errors.email.message}</FieldError> : <FieldDescription>We'll never share your email.</FieldDescription>}
</Field>

// With optional badge
<Field>
  <FieldLabel optional>Phone number</FieldLabel>
  <Input type="tel" placeholder="+1 (555) 123-4567" />
  <FieldDescription>Used for SMS notifications.</FieldDescription>
</Field>`,
  },

  "fieldset": {
    name: "Fieldset",
    import: `import { Fieldset, Legend, FieldGroup, Field, Label, Description, ErrorMessage } from 'strata-design-system';`,
    category: "forms",
    description: "Headless UI-based grouped fields with semantic <fieldset>, <legend>, and slot-based spacing system. Different from the Field/FieldLabel pattern in field.tsx — this set uses data-slot attributes for automatic spacing.",
    props: [
      "Fieldset — semantic <fieldset> wrapper",
      "Legend — semantic <legend> heading (text-base/6 font-semibold)",
      "FieldGroup — div wrapper with space-y-8 between fields",
      "Field — single field wrapper using Headless UI Field (data-slot pattern)",
      "Label — Headless UI Label (data-slot='label')",
      "Description — helper text (data-slot='description')",
      "ErrorMessage — error text (data-slot='error', text-red-600)",
    ],
    tokens: {
      "text-base/6 + sm:text-sm/6 + font-semibold + text-zinc-950 / dark:text-white": "Legend (Tier 2 — uses zinc directly)",
      "space-y-8": "FieldGroup vertical spacing between fields",
      "[&>[data-slot=label]+[data-slot=control]]:mt-3": "auto-spacing between label and input",
      "[&>[data-slot=description]+[data-slot=control]]:mt-3": "spacing description → input",
      "[&>[data-slot=control]+[data-slot=error]]:mt-3": "spacing input → error",
      "text-red-600 / dark:text-red-500": "ErrorMessage color (Tier 2 — raw red)",
      "data-[disabled]:opacity-50": "disabled state",
    },
    whenToUse: [
      "Groups of related fields: shipping address, payment info, contact details",
      "When you want semantic <fieldset>+<legend> for screen readers and form parsers",
      "Multi-section forms — wrap each section in a Fieldset with its own Legend",
      "Use FieldGroup inside Fieldset when you have many child Fields",
      "When the data-slot auto-spacing pattern is preferred over manual gap classes",
    ],
    antiPatterns: [
      "❌ <div> to group form sections — use Fieldset for a11y",
      "❌ Mixing this Fieldset with the Field from field.tsx in the same form — pick one convention",
      "❌ Fieldset without Legend — accessibility regression",
      "❌ Manual spacing on labels/descriptions — data-slot pattern handles it",
    ],
    example: `<Fieldset>
  <Legend>Shipping Address</Legend>
  <Description>Where should we deliver?</Description>

  <FieldGroup>
    <Field>
      <Label>Street</Label>
      <Input placeholder="123 Main St" />
    </Field>
    <Field>
      <Label>City</Label>
      <Input placeholder="New York" />
    </Field>
    <Field>
      <Label>ZIP code</Label>
      <Input placeholder="10001" />
      {hasError && <ErrorMessage>ZIP must be 5 digits.</ErrorMessage>}
    </Field>
  </FieldGroup>
</Fieldset>`,
    governance: {
      tier: 2,
      notes: "Uses zinc + raw red palettes. Should use text-foreground + text-destructive. Flagged for Tier 1 refactor.",
    },
  },

  "form": {
    name: "Form",
    import: `import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage, useFormField } from 'strata-design-system';`,
    category: "forms",
    description: "react-hook-form integration. Form is the FormProvider; FormField is the Controller wrapper; FormItem/Label/Control/Description/Message are the rendered structure. Use the useFormField hook inside custom inputs for error context.",
    props: [
      "Form — re-export of react-hook-form's FormProvider (spread your useForm() return value)",
      "FormField — Controller wrapper (control, name, render, rules, defaultValue)",
      "FormItem — div wrapper with grid + gap-2 spacing",
      "FormLabel — auto-shows destructive color when the field has an error",
      "FormControl — Slot wrapper that wires aria-describedby, aria-invalid, id automatically",
      "FormDescription — helper text",
      "FormMessage — renders the validation error message (or children if no error)",
      "useFormField — hook returning { id, name, formItemId, formDescriptionId, formMessageId, error }",
    ],
    tokens: {
      "grid + gap-2": "FormItem spacing (DS-correct, no zinc)",
      "data-[error=true]:text-destructive": "FormLabel error state (DS token)",
      "text-muted-foreground + text-sm": "FormDescription (DS tokens)",
      "text-destructive + text-sm": "FormMessage error styling (DS token)",
    },
    whenToUse: [
      "All forms that need validation and error states",
      "Pair with zod + zodResolver for typed schemas",
      "FormControl wraps your input so aria-* wiring is automatic — don't add aria-invalid manually",
      "useFormField inside custom inputs to get the error/description ids",
    ],
    antiPatterns: [
      "❌ Manual form state management with useState per field — use Form + useForm",
      "❌ Wrapping inputs in FormControl with extra divs — FormControl is a Slot, place the input directly",
      "❌ Setting aria-* manually inside FormControl — wiring is automatic",
      "❌ FormMessage with manual `error` prop — it reads from FormField context",
    ],
    example: `const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters'),
});

const form = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
  defaultValues: { email: '', password: '' },
});

const onSubmit = async (data: z.infer<typeof schema>) => {
  await login(data);
};

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
    <FormField control={form.control} name="email" render={({ field }) => (
      <FormItem>
        <FormLabel>Email</FormLabel>
        <FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl>
        <FormDescription>We'll send a magic link.</FormDescription>
        <FormMessage />
      </FormItem>
    )} />
    <FormField control={form.control} name="password" render={({ field }) => (
      <FormItem>
        <FormLabel>Password</FormLabel>
        <FormControl><Input type="password" {...field} /></FormControl>
        <FormMessage />
      </FormItem>
    )} />
    <Button type="submit" disabled={form.formState.isSubmitting}>Sign in</Button>
  </form>
</Form>`,
  },

  "input-otp": {
    name: "InputOTP",
    import: `import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from 'strata-design-system';`,
    category: "forms",
    description: "One-time password input with individual digit cells (separate visual slots, single underlying field), built on the `input-otp` library. Includes animated caret blink on the active slot.",
    props: [
      "InputOTP — the OTP input wrapper",
      "InputOTP.maxLength: number — required, total digit count",
      "InputOTP.value?: string / onChange?: (value: string) => void",
      "InputOTP.pattern?: string — regex string for allowed chars (default: digits only)",
      "InputOTP.disabled?: boolean",
      "InputOTP.containerClassName?: string — class for the OTP container",
      "InputOTPGroup — visual grouping wrapper for slots",
      "InputOTPSlot.index: number — required, identifies the slot position",
      "InputOTPSeparator — visual separator (typically a dash) between groups",
    ],
    tokens: {
      "h-9 + w-9": "individual slot dimensions",
      "border-y + border-r + first:border-l + first:rounded-l-md + last:rounded-r-md": "merged slot borders",
      "border-input": "default slot border (DS token)",
      "bg-input-background / dark:bg-input/30": "slot background (DS-mixed)",
      "data-[active=true]:border-ring + data-[active=true]:ring-ring/50": "active slot ring (DS-correct)",
      "data-[active=true]:ring-[3px]": "focus ring thickness",
      "aria-invalid:border-destructive": "validation error border (DS-correct)",
      "data-[active=true]:aria-invalid:ring-destructive/20 / dark:.../40": "error focus ring",
      "bg-foreground + h-4 + w-px + animate-caret-blink": "blinking caret animation",
      "has-disabled:opacity-50": "disabled state",
    },
    whenToUse: [
      "2FA / TOTP verification codes (typically 6 digits)",
      "PIN entry on sensitive flows",
      "Email/SMS confirmation codes",
      "Use Separator between groups of 3 for readability on 6-digit codes",
    ],
    antiPatterns: [
      "❌ Single <input maxLength={6}> for OTP — degrades UX, no per-cell paste/edit",
      "❌ Six separate Input components — paste behavior breaks across cells",
      "❌ Without InputOTPGroup wrapping slots — slots won't render correctly",
      "❌ Allowing alphanumeric without setting pattern — default is digits-only",
    ],
    example: `// Standard 6-digit code with separator
<InputOTP maxLength={6} value={otp} onChange={setOtp}>
  <InputOTPGroup>
    <InputOTPSlot index={0} />
    <InputOTPSlot index={1} />
    <InputOTPSlot index={2} />
  </InputOTPGroup>
  <InputOTPSeparator />
  <InputOTPGroup>
    <InputOTPSlot index={3} />
    <InputOTPSlot index={4} />
    <InputOTPSlot index={5} />
  </InputOTPGroup>
</InputOTP>

// 4-digit PIN, contiguous
<InputOTP maxLength={4} value={pin} onChange={setPin}>
  <InputOTPGroup>
    <InputOTPSlot index={0} />
    <InputOTPSlot index={1} />
    <InputOTPSlot index={2} />
    <InputOTPSlot index={3} />
  </InputOTPGroup>
</InputOTP>`,
  },

  "listbox": {
    name: "Listbox",
    import: `import { Listbox, ListboxOption, ListboxLabel, ListboxDescription } from 'strata-design-system';`,
    category: "forms",
    description: "Single-select dropdown built on Headless UI Listbox. Drop-down panel with options — no native search. For multi-select use Combobox or SearchableMultiSelect.",
    props: [
      "Listbox — main wrapper, accepts ListboxOption children",
      "Listbox.placeholder?: ReactNode — content shown when value is null",
      "Listbox.autoFocus?: boolean",
      "Listbox.aria-label?: string",
      "Listbox.children: ReactNode — typically ListboxOption[]",
      "Listbox.disabled?: boolean / value? / onChange? — Headless UI props",
      "ListboxOption.value: required",
      "ListboxLabel — primary option label (truncate, font-medium)",
      "ListboxDescription — secondary option text below label",
    ],
    tokens: {
      "rounded-lg + border-zinc-200 / dark:border-zinc-800": "trigger button chrome (Tier 2 — uses zinc)",
      "bg-white / dark:bg-zinc-900": "trigger background (Tier 2)",
      "text-zinc-950 / dark:text-white": "trigger text (Tier 2)",
      "data-[focus]:outline-blue-500/25": "focus ring (Tier 2 — raw blue)",
      "rounded-xl + p-1 + shadow-lg": "options panel",
      "bg-zinc-100 / dark:bg-zinc-800": "highlighted option (Tier 2)",
      "text-zinc-500 / dark:text-zinc-400 + group-data-[focus]:text-zinc-600": "ListboxDescription muted color",
    },
    whenToUse: [
      "Single-select in forms where the dropdown should be a styled button (vs. Select's Radix-based dropdown)",
      "When you need rich option content (label + description) via ListboxLabel + ListboxDescription",
      "Headless UI ecosystem consistency (matches Combobox / Listbox visual)",
      "When Select feels too utility — Listbox has more visual chrome",
    ],
    antiPatterns: [
      "❌ For multi-select — Listbox is single-select; use Combobox with multiple={true}",
      "❌ For 100+ options — use Combobox (search)",
      "❌ Without aria-label — accessibility regression",
      "❌ ListboxLabel + ListboxDescription with very long text — design favors short option content",
    ],
    example: `<Listbox
  value={role}
  onChange={setRole}
  placeholder="Select a role"
  aria-label="Role"
>
  <ListboxOption value="admin">
    <ListboxLabel>Admin</ListboxLabel>
    <ListboxDescription>Full access to all settings and billing.</ListboxDescription>
  </ListboxOption>
  <ListboxOption value="editor">
    <ListboxLabel>Editor</ListboxLabel>
    <ListboxDescription>Can edit content but not billing.</ListboxDescription>
  </ListboxOption>
  <ListboxOption value="viewer">
    <ListboxLabel>Viewer</ListboxLabel>
    <ListboxDescription>Read-only access.</ListboxDescription>
  </ListboxOption>
</Listbox>`,
    governance: {
      tier: 2,
      notes: "Uses zinc + raw blue throughout. Should map to bg-card/text-foreground/border-input/ring-ring. Flagged for Tier 1 refactor.",
    },
  },

  "radio-group": {
    name: "RadioGroup",
    import: `import { RadioGroup, RadioGroupItem } from 'strata-design-system';`,
    category: "forms",
    description: "Single-select radio button group built on Radix RadioGroup. Renders the radio dots only — pair with separate Labels (or Field/Fieldset) for full UX.",
    props: [
      "RadioGroup — Radix Root (value?, defaultValue?, onValueChange?, disabled?, name?, orientation?)",
      "RadioGroupItem — single radio button (value: string required, disabled?, id?)",
      "Both extend their respective Radix component props",
    ],
    tokens: {
      "border-zinc-200 / dark:border-zinc-800": "default item border (Tier 2 — uses zinc)",
      "bg-white / dark:bg-zinc-950/30": "default background (Tier 2)",
      "data-[state=checked]:border-brand-500 + data-[state=checked]:text-brand-900 / dark:.brand-500": "checked state (DS-correct, brand)",
      "focus-visible:border-brand-500 + focus-visible:ring-brand-500/20": "focus ring (DS-correct)",
      "aria-invalid:border-red-600 + aria-invalid:ring-red-600/20": "validation error (Tier 2 — raw red)",
      "aspect-square + size-4 + rounded-full + shadow-xs": "radio dimensions",
      "transition-[color,box-shadow]": "smooth state transitions",
      "grid + gap-3": "RadioGroup layout (vertical stacking by default)",
    },
    whenToUse: [
      "Mutually exclusive selection from 2-7 options (plan choice, shipping method, gender)",
      "When all options should be visible (no dropdown)",
      "Pair each RadioGroupItem with a Label (`htmlFor` matching item `id`)",
      "Wrap with Fieldset + Legend for grouped semantic structure",
    ],
    antiPatterns: [
      "❌ Custom radio with onClick — use RadioGroup for a11y and keyboard nav",
      "❌ For 8+ options — use Select or Combobox",
      "❌ For multi-select — use Checkbox or ToggleGroup type='multiple'",
      "❌ RadioGroupItem without an associated Label — accessibility regression",
    ],
    example: `<Fieldset>
  <Legend>Shipping method</Legend>
  <RadioGroup value={method} onValueChange={setMethod}>
    <div className="flex items-center gap-2">
      <RadioGroupItem id="standard" value="standard" />
      <Label htmlFor="standard">Standard — Free (5–7 days)</Label>
    </div>
    <div className="flex items-center gap-2">
      <RadioGroupItem id="express" value="express" />
      <Label htmlFor="express">Express — $9.99 (2–3 days)</Label>
    </div>
    <div className="flex items-center gap-2">
      <RadioGroupItem id="overnight" value="overnight" />
      <Label htmlFor="overnight">Overnight — $24.99 (next day)</Label>
    </div>
  </RadioGroup>
</Fieldset>`,
    governance: {
      tier: 2,
      notes: "Default border/bg use zinc. Checked + focus correctly use brand-500. Validation uses raw red.",
    },
  },

  "searchable-multi-select": {
    name: "SearchableMultiSelect",
    import: `import { SearchableMultiSelect, type SearchableMultiSelectOption } from 'strata-design-system';`,
    category: "forms",
    description: "Multi-select with search input, chip-based selection display, and pluggable per-row renderer. Use `optComponent` for custom row rendering (avatars, badges, multi-line content).",
    props: [
      "options: SearchableMultiSelectOption[] — items to display",
      "value: SearchableMultiSelectOption[] — controlled selection (always array)",
      "onChange: (value: SearchableMultiSelectOption[]) => void",
      "placeholder?: string (default: 'Search...')",
      "icon?: ReactNode — leading icon for selected chips",
      "optComponent?: ComponentType<SearchableMultiSelectOptComponentProps> — custom row renderer for the dropdown",
      "optComponentProps?: unknown[] — per-option additional props, aligned by index with `options`",
      "className?: string",
    ],
    tokens: {
      "bg-card + border-border": "trigger and panel chrome (DS-correct)",
      "bg-accent": "highlighted/focused option background (DS-correct)",
      "rounded-md / rounded-sm": "panel and chip radii",
      "text-foreground / text-muted-foreground": "primary and secondary text",
      "dark:bg-white/10": "dark mode chip background",
      "px-2.5 + py-1 + text-xs + font-medium": "selection chip chrome",
    },
    whenToUse: [
      "Selecting multiple tags, categories, users, or skills from a list",
      "When you need rich row content (avatar + name + email) — use optComponent",
      "When chips should preview the current selection inline",
      "Use icon prop to give all chips a consistent leading symbol",
    ],
    antiPatterns: [
      "❌ Combobox multiple={true} for chip-based UX — SearchableMultiSelect renders chips natively",
      "❌ Multiple Checkboxes for large option sets — use SearchableMultiSelect for search + filter",
      "❌ optComponentProps with mismatched length vs options — index alignment breaks",
      "❌ Without value/onChange — must be controlled",
    ],
    example: `<SearchableMultiSelect
  options={skills}
  value={selected}
  onChange={setSelected}
  placeholder="Add skills..."
/>

// With custom row renderer (avatar + name + email)
<SearchableMultiSelect
  options={users}
  value={selectedUsers}
  onChange={setSelectedUsers}
  placeholder="Search team members..."
  optComponent={({ option, props }) => (
    <div className="flex items-center gap-2">
      <Avatar size="xs"><AvatarFallback>{option.label[0]}</AvatarFallback></Avatar>
      <div>
        <div className="text-sm font-medium">{option.label}</div>
        <div className="text-xs text-muted-foreground">{(props as { email: string }).email}</div>
      </div>
    </div>
  )}
  optComponentProps={users.map((u) => ({ email: u.email }))}
/>`,
  },

  "select": {
    name: "Select",
    import: `import { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton } from 'strata-design-system';`,
    category: "forms",
    description: "Single-select dropdown built on Radix Select. SelectTrigger has size variants; long lists get auto scroll buttons.",
    variants: {
      "SelectTrigger.size": ["sm", "default"],
    },
    props: [
      "Select — Radix Root (value?, defaultValue?, onValueChange?, disabled?, name?)",
      "SelectTrigger.size?: 'sm' | 'default'",
      "SelectValue.placeholder?: string — shown when value is unset",
      "SelectContent — dropdown panel (position?, side?, align?)",
      "SelectGroup — grouping wrapper inside SelectContent",
      "SelectLabel — non-selectable group heading",
      "SelectItem.value: string — required",
      "SelectSeparator — divider between groups",
      "SelectScrollUpButton / SelectScrollDownButton — auto-rendered for long lists",
    ],
    tokens: {
      "bg-input-background/30": "trigger background (DS token)",
      "border-zinc-200 / dark:border-zinc-700": "trigger border (Tier 2 — uses zinc directly)",
      "text-foreground": "trigger text (DS token)",
      "rounded-lg + px-4 + py-2": "trigger chrome",
      "focus:border-primary + focus:ring-primary + ring-2": "focus state (DS-correct)",
      "aria-invalid:border-destructive + aria-invalid:ring-destructive/20": "validation error (DS-correct)",
      "bg-popover + text-popover-foreground + border-border + shadow-lg": "dropdown panel (DS-correct)",
      "dark:data-[placeholder]:text-muted-foreground/60": "placeholder color in dark mode",
    },
    whenToUse: [
      "Single selection from < 20 options (country code, role, status)",
      "When you don't need search (use Combobox for searchable)",
      "Use SelectGroup + SelectLabel for organized lists",
      "Use size='sm' inside compact contexts (table cells, inline forms)",
    ],
    antiPatterns: [
      "❌ For 50+ options — use Combobox (search support)",
      "❌ Native <select> — no DS styling, inconsistent across browsers",
      "❌ For multi-select — use Combobox multiple or SearchableMultiSelect",
      "❌ Without SelectValue placeholder — empty trigger when value is null",
    ],
    example: `<Select value={role} onValueChange={setRole}>
  <SelectTrigger>
    <SelectValue placeholder="Select a role" />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>Internal</SelectLabel>
      <SelectItem value="admin">Admin</SelectItem>
      <SelectItem value="editor">Editor</SelectItem>
    </SelectGroup>
    <SelectSeparator />
    <SelectGroup>
      <SelectLabel>External</SelectLabel>
      <SelectItem value="viewer">Viewer</SelectItem>
      <SelectItem value="guest">Guest</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>`,
    governance: {
      tier: 2,
      notes: "Trigger border uses zinc-200/700 directly. Focus and dropdown panel correctly use DS tokens. Mixed compliance.",
    },
  },

  "slider": {
    name: "Slider",
    import: `import { Slider } from 'strata-design-system';`,
    category: "forms",
    description: "Range slider built on Radix Slider. Supports single-thumb (`value={[v]}`) or multi-thumb (`value={[min, max]}`) via array length. Vertical orientation supported.",
    props: [
      "value?: number[] — controlled values (array, even for single thumb)",
      "defaultValue?: number[] — uncontrolled initial value",
      "min?: number (default: 0)",
      "max?: number (default: 100)",
      "step?: number — increment step",
      "onValueChange?: (value: number[]) => void",
      "onValueCommit?: (value: number[]) => void — fires on release",
      "orientation?: 'horizontal' | 'vertical' (default: 'horizontal')",
      "disabled?: boolean",
      "...all Radix SliderPrimitive.Root props",
    ],
    tokens: {
      "bg-muted": "track (background, DS-correct)",
      "bg-primary": "filled range (DS-correct)",
      "border-primary": "thumb border (DS-correct)",
      "rounded-full": "track and thumb shape",
      "ring-brand-500/50": "focus ring (DS-correct)",
      "data-[disabled]:opacity-50": "disabled state",
      "data-[orientation=vertical]:h-full": "vertical layout sizing",
    },
    whenToUse: [
      "Price range filters (multi-thumb: `value={[min, max]}`)",
      "Volume / brightness / opacity controls (single-thumb)",
      "Percentage inputs without exact numeric typing",
      "Use step prop for discrete values (step={5} for 0/5/10/...)",
      "vertical orientation for audio mixers or sidebar density controls",
    ],
    antiPatterns: [
      "❌ <input type='range'> — no DS styling or dark mode",
      "❌ value as a single number — Radix Slider expects an array (`[v]`)",
      "❌ For exact numeric input where typing is faster — use Input type='number'",
      "❌ Without step on a 0–10000 range — single-pixel changes give meaningless precision",
    ],
    example: `// Single thumb (volume)
const [volume, setVolume] = useState([50]);
<Slider value={volume} onValueChange={setVolume} min={0} max={100} step={1} />

// Multi-thumb (price range)
const [range, setRange] = useState<[number, number]>([100, 800]);
<Slider
  value={range}
  onValueChange={(v) => setRange(v as [number, number])}
  min={0}
  max={1000}
  step={10}
/>

// Vertical
<Slider orientation="vertical" value={[brightness]} onValueChange={([b]) => setBrightness(b)} className="h-32" />`,
  },

  "switch": {
    name: "Switch",
    import: `import { Switch } from 'strata-design-system';`,
    category: "forms",
    description: "iOS-style toggle for boolean on/off settings, built on Radix Switch. Renders the toggle only — pair with a separate Label.",
    props: [
      "className?: string",
      "checked?: boolean / defaultChecked?: boolean",
      "onCheckedChange?: (checked: boolean) => void",
      "disabled?: boolean",
      "name? / value? — for native form submission",
      "...all Radix SwitchPrimitive.Root props",
    ],
    tokens: {
      "bg-zinc-200 / dark:bg-zinc-700": "off-state background (Tier 2 — uses zinc directly)",
      "data-[state=checked]:bg-brand-500": "on-state background (DS-correct, brand)",
      "bg-white": "thumb color",
      "rounded-full": "track and thumb shape",
      "translate-x-5": "checked thumb offset",
      "focus-visible:border-brand-500 + focus-visible:ring-brand-500/20 + ring-[3px]": "focus state (DS-correct)",
      "disabled:opacity-80": "disabled state",
    },
    whenToUse: [
      "Feature toggles in settings pages (Dark mode, Notifications, Two-factor auth)",
      "Boolean settings outside forms (immediate effect on change)",
      "When the on/off semantic should be visible at a glance (vs. checkbox)",
      "Pair with Label using htmlFor matching Switch id",
    ],
    antiPatterns: [
      "❌ Checkbox for instant-effect settings — Switch is the right primitive",
      "❌ For toolbar actions (Bold/Italic) — use Toggle",
      "❌ Switch without a Label — accessibility regression",
      "❌ Inside a form that requires submit to take effect — Switch implies immediate change",
    ],
    example: `<div className="flex items-center justify-between">
  <Label htmlFor="dark-mode">Dark mode</Label>
  <Switch id="dark-mode" checked={isDark} onCheckedChange={setIsDark} />
</div>

// Inside a settings list
<SectionCard>
  <SectionCardBody>
    {settings.map((s) => (
      <div key={s.id} className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
        <div>
          <Label htmlFor={s.id} className="font-medium">{s.label}</Label>
          <p className="text-sm text-muted-foreground">{s.description}</p>
        </div>
        <Switch id={s.id} checked={s.enabled} onCheckedChange={(v) => toggle(s.id, v)} />
      </div>
    ))}
  </SectionCardBody>
</SectionCard>`,
    governance: {
      tier: 2,
      notes: "Off-state uses zinc-200/700 directly. On-state and focus correctly use brand-500. Mixed.",
    },
  },

  "textarea": {
    name: "Textarea",
    import: `import { Textarea } from 'strata-design-system';`,
    category: "forms",
    description: "Multi-line text input with auto-resize via CSS field-sizing. Native textarea with DS styling — no extra props beyond standard.",
    props: [
      "className?: string",
      "...all native textarea props (placeholder, value, onChange, rows, maxLength, disabled, aria-invalid, etc.)",
    ],
    tokens: {
      "border-zinc-200 / dark:border-zinc-700": "default border (Tier 2 — uses zinc directly)",
      "bg-input-background/30": "background (DS token)",
      "text-foreground": "text color (DS token)",
      "placeholder:text-zinc-500": "placeholder color (Tier 2 — raw zinc)",
      "rounded-lg + px-4 + py-2 + text-sm": "input chrome",
      "focus:border-primary + focus:ring-primary + ring-2": "focus state (DS-correct)",
      "aria-invalid:border-destructive + aria-invalid:ring-destructive/20": "validation error (DS-correct)",
      "field-sizing-content": "auto-resize via CSS (modern browsers)",
      "min-h-[80px]": "minimum height",
      "resize-none": "disables manual resize handle (auto-resize via field-sizing)",
    },
    whenToUse: [
      "Multi-line text: descriptions, comments, notes, messages, code snippets",
      "When the content length varies — auto-resize via field-sizing-content",
      "Wrap with Field for label + description + error",
      "Use rows prop for explicit minimum height (e.g., rows={4})",
    ],
    antiPatterns: [
      "❌ <textarea className='border rounded p-2'> — bypasses DS tokens",
      "❌ Manual resize logic with refs and useEffect — field-sizing-content handles it",
      "❌ Without aria-invalid when validation fails — visual but no a11y signal",
      "❌ For single-line input — use Input",
    ],
    example: `<Field>
  <FieldLabel>Description</FieldLabel>
  <Textarea
    placeholder="Describe the issue..."
    rows={4}
    value={description}
    onChange={(e) => setDescription(e.target.value)}
    aria-invalid={!!errors.description}
  />
  {errors.description ? (
    <FieldError>{errors.description}</FieldError>
  ) : (
    <FieldDescription>Markdown supported.</FieldDescription>
  )}
</Field>

// Auto-grow with character limit
<Textarea
  placeholder="Leave a comment..."
  maxLength={500}
  value={comment}
  onChange={(e) => setComment(e.target.value)}
/>`,
    governance: {
      tier: 2,
      notes: "Border uses zinc-200/700 directly. Placeholder uses text-zinc-500. Focus and validation correctly use DS tokens.",
    },
  },

  // ── OVERLAYS ─────────────────────────────────────────────────────────────────

  "alert-dialog": {
    name: "AlertDialog",
    import: `import { AlertDialog, AlertDialogPortal, AlertDialogOverlay, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from 'strata-design-system';`,
    category: "overlays",
    description: "Accessible confirmation dialog for irreversible/destructive actions, built on Radix AlertDialog. Uses semantic alertdialog ARIA role (different from Dialog) — screen readers announce it as critical.",
    props: [
      "AlertDialog — Radix Root: open?, onOpenChange?, defaultOpen?",
      "AlertDialogTrigger — opens the dialog (use asChild for custom Button)",
      "AlertDialogContent — modal panel",
      "AlertDialogHeader / AlertDialogFooter — semantic flex containers",
      "AlertDialogTitle / AlertDialogDescription — required for a11y",
      "AlertDialogAction — confirm button (uses buttonVariants default)",
      "AlertDialogCancel — cancel button (uses buttonVariants outline)",
      "AlertDialogPortal / AlertDialogOverlay — auto-rendered by Content",
    ],
    tokens: {
      "bg-black/50": "overlay (Tier 2 — direct color, but conventional)",
      "bg-background": "dialog panel background (DS-correct)",
      "border-border": "dialog border (DS-correct)",
      "rounded-lg + p-6 + shadow-lg + max-w-lg": "panel chrome",
      "fixed + inset-0 + top-[50%] + translate-x-[-50%]": "centering",
      "data-[state=open]:animate-in + fade-in-0 + zoom-in-95": "open animation",
      "text-lg + font-semibold + text-foreground": "title styling",
      "text-muted-foreground + text-sm": "description styling",
      "buttonVariants({ variant: 'default' | 'outline' })": "action/cancel buttons",
    },
    whenToUse: [
      "Delete confirmations (records, files, accounts)",
      "Irreversible actions (revoke access, end subscription)",
      "Dangerous operations requiring explicit user confirmation",
      "When the user must NOT be able to dismiss with Esc/click-outside without choosing",
    ],
    antiPatterns: [
      "❌ Dialog for destructive confirmations — use AlertDialog (correct ARIA role)",
      "❌ Without AlertDialogTitle or AlertDialogDescription — accessibility regression",
      "❌ AlertDialog for non-blocking notifications — use Sonner toast",
      "❌ Multiple AlertDialogs stacked — pick one critical action at a time",
    ],
    example: `<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete Account</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This will permanently delete your account and remove all data from our servers. This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={deleteAccount}>Yes, delete my account</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`,
  },

  "confirm-dialog": {
    name: "ConfirmDialog",
    import: `import { ConfirmDialog } from 'strata-design-system';`,
    category: "overlays",
    description: "Pre-styled destructive confirmation dialog with red icon container, Cancel + destructive Confirm buttons. Single-purpose wrapper — for non-destructive confirmations use AlertDialog directly.",
    props: [
      "isOpen: boolean — required",
      "onClose: () => void — required, fires on dismiss/cancel",
      "onConfirm: () => void — required, fires when user clicks confirm",
      "title: string — required header text",
      "description: string — required body text",
      "confirmLabel: string — required action button label",
    ],
    tokens: {
      "!bg-card": "panel background (DS-correct, with !important)",
      "max-w-md": "compact width",
      "bg-destructive/30 + p-4 + rounded-full": "icon container chrome (DS-correct)",
      "size-5 + text-destructive": "destructive icon (DS-correct)",
      "text-lg + font-semibold + text-foreground": "title (DS-correct)",
      "text-muted-foreground": "description (DS-correct)",
      "gap-3 + justify-end": "footer button alignment",
      "variant='secondary'": "Cancel button",
      "variant='destructive'": "Confirm button",
    },
    whenToUse: [
      "Destructive single-action confirmations (Delete X? Yes/No)",
      "When you want a pre-styled red icon + destructive button without composing AlertDialog manually",
      "Quick row-level delete confirmations from Tables",
      "For non-destructive Yes/No (Save changes? Discard?) — use AlertDialog directly",
    ],
    antiPatterns: [
      "❌ ConfirmDialog for non-destructive confirmations — use AlertDialog (Confirm button non-red)",
      "❌ ConfirmDialog without onConfirm logic — must have a real handler",
      "❌ Forgetting onClose in onConfirm — dialog stays open after action; close it manually",
      "❌ Custom title/description rendered as JSX — props are typed as `string`",
    ],
    example: `const [open, setOpen] = useState(false);

<Button variant="destructive" onClick={() => setOpen(true)}>
  Delete Order
</Button>

<ConfirmDialog
  isOpen={open}
  onClose={() => setOpen(false)}
  onConfirm={() => {
    deleteOrder(orderId);
    setOpen(false);
  }}
  title="Delete order #1234?"
  description="This will permanently remove the order and all associated invoices. This action cannot be undone."
  confirmLabel="Delete order"
/>`,
  },

  "context-menu": {
    name: "ContextMenu",
    import: `import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuCheckboxItem, ContextMenuRadioItem, ContextMenuLabel, ContextMenuSeparator, ContextMenuShortcut, ContextMenuGroup, ContextMenuPortal, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuRadioGroup } from 'strata-design-system';`,
    category: "overlays",
    description: "Right-click context menu built on Radix ContextMenu. 16 exports cover all menu primitives (items, checkboxes, radios, submenus, shortcuts, separators).",
    variants: {
      "ContextMenuItem.variant": ["default", "destructive"],
      "ContextMenuItem.inset": ["false (default)", "true (left padding for icon alignment)"],
    },
    props: [
      "ContextMenu — Radix Root: onOpenChange?, modal?",
      "ContextMenuTrigger — wraps the right-clickable area",
      "ContextMenuContent — dropdown panel",
      "ContextMenuItem — selectable row (variant?, inset?, disabled?, onSelect?)",
      "ContextMenuCheckboxItem — toggleable item (checked?, onCheckedChange?)",
      "ContextMenuRadioItem — single-select item (value: string required)",
      "ContextMenuRadioGroup — wrapper for ContextMenuRadioItems",
      "ContextMenuLabel — non-selectable section heading (inset?)",
      "ContextMenuSeparator — divider",
      "ContextMenuShortcut — right-aligned keyboard hint",
      "ContextMenuGroup — semantic grouping",
      "ContextMenuSub + ContextMenuSubTrigger + ContextMenuSubContent — nested submenu",
      "ContextMenuPortal — auto-rendered by Content",
    ],
    tokens: {
      "bg-popover + text-popover-foreground": "menu panel (DS-correct)",
      "border-border + rounded-md + shadow-lg": "panel chrome (DS-correct)",
      "focus:bg-accent + focus:text-accent-foreground": "highlighted item (DS-correct)",
      "data-[state=open]:bg-accent": "open submenu trigger state",
      "data-[variant=destructive]:text-destructive": "destructive item color (DS-correct)",
      "data-[variant=destructive]:focus:bg-destructive/10": "destructive hover (DS-correct)",
      "data-[inset]:pl-8": "indent for items aligned with check/radio dots",
      "text-muted-foreground + ml-auto + text-xs + tracking-widest": "shortcut hint",
      "min-w-[8rem] + px-2 + py-1.5 + text-sm": "panel and item sizing",
    },
    whenToUse: [
      "File explorers (right-click on files / folders)",
      "Table rows for row-specific actions (Edit, Duplicate, Delete)",
      "Canvas elements (design tools, whiteboards)",
      "Use variant='destructive' on Delete-type items for visual emphasis",
      "Use inset on items that don't have a check/radio dot, to align with sibling items that do",
    ],
    antiPatterns: [
      "❌ For click-triggered menus — use DropdownMenu (right-click only is unfamiliar to many users)",
      "❌ As primary navigation — context menus are discoverable only via right-click",
      "❌ Without a click-equivalent (DropdownMenu trigger) on touch contexts — context menus don't translate to touch",
      "❌ Mixing inset and non-inset items in same group — visual misalignment",
    ],
    example: `<ContextMenu>
  <ContextMenuTrigger className="flex items-center justify-center w-full h-32 border border-dashed border-border rounded-md text-sm text-muted-foreground">
    Right-click here
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuLabel>Actions</ContextMenuLabel>
    <ContextMenuItem>
      Open <ContextMenuShortcut>⌘O</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuItem>
      Duplicate <ContextMenuShortcut>⌘D</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuSeparator />

    <ContextMenuSub>
      <ContextMenuSubTrigger>Share</ContextMenuSubTrigger>
      <ContextMenuSubContent>
        <ContextMenuItem>Email link</ContextMenuItem>
        <ContextMenuItem>Copy link</ContextMenuItem>
      </ContextMenuSubContent>
    </ContextMenuSub>

    <ContextMenuSeparator />

    <ContextMenuCheckboxItem checked={pinned} onCheckedChange={setPinned}>
      Pinned
    </ContextMenuCheckboxItem>

    <ContextMenuRadioGroup value={view} onValueChange={setView}>
      <ContextMenuRadioItem value="grid">Grid view</ContextMenuRadioItem>
      <ContextMenuRadioItem value="list">List view</ContextMenuRadioItem>
    </ContextMenuRadioGroup>

    <ContextMenuSeparator />

    <ContextMenuItem variant="destructive">
      Delete <ContextMenuShortcut>⌫</ContextMenuShortcut>
    </ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>`,
  },

  "drawer": {
    name: "Drawer",
    import: `import { Drawer, DrawerPortal, DrawerTrigger, DrawerClose, DrawerContent, DrawerHeader, DrawerFooter, DrawerTitle, DrawerDescription } from 'strata-design-system';`,
    category: "overlays",
    description: "Slide-in panel from any edge with vaul-style swipe gestures (mobile-friendly drag handle, snap points). 9 exports cover the full structure.",
    props: [
      "Drawer — vaul Root: open?, onOpenChange?, direction? ('top' | 'right' | 'bottom' | 'left'), dismissible?, modal?",
      "DrawerTrigger — opens the drawer (use asChild for custom Button)",
      "DrawerContent — sliding panel; positions itself based on Drawer's direction",
      "DrawerHeader / DrawerFooter — semantic flex containers",
      "DrawerTitle / DrawerDescription — required for a11y (text-foreground / text-muted-foreground)",
      "DrawerClose — dismiss button (use asChild for custom Button)",
      "DrawerPortal — auto-rendered by Content",
    ],
    tokens: {
      "bg-black/50": "overlay (Tier 2 — direct color, conventional)",
      "bg-background": "drawer panel (DS-correct)",
      "bg-muted": "drag handle indicator (DS-correct)",
      "text-foreground": "title color (DS-correct)",
      "text-muted-foreground + text-sm": "description (DS-correct)",
      "border-b / border-t / border-l / border-r": "directional borders depending on side",
      "rounded-b-lg / rounded-t-lg": "rounded corners on the screen-edge side only",
    },
    whenToUse: [
      "Mobile-first bottom sheets (cart, filters, actions)",
      "Snap-to-open panels with swipe gesture",
      "Quick actions where Sheet feels too desktop-heavy",
      "Bottom drawer for forms on mobile (default direction='bottom')",
    ],
    antiPatterns: [
      "❌ Sheet and Drawer for the same use case — Sheet is desktop slide-over, Drawer is mobile-first with vaul gestures",
      "❌ For destructive confirmations — use AlertDialog",
      "❌ For tooltip-style hints — use Tooltip or HoverCard",
      "❌ Drawer without DrawerTitle — accessibility regression even when title is visually hidden",
    ],
    example: `<Drawer>
  <DrawerTrigger asChild>
    <Button>View Cart ({items.length})</Button>
  </DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Shopping Cart</DrawerTitle>
      <DrawerDescription>{items.length} items · \${total}</DrawerDescription>
    </DrawerHeader>

    <div className="px-4 max-h-[50vh] overflow-y-auto">
      {items.map((item) => (/* cart item row */))}
    </div>

    <DrawerFooter>
      <Button onClick={checkout}>Checkout</Button>
      <DrawerClose asChild>
        <Button variant="outline">Continue shopping</Button>
      </DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>`,
  },

  "dropdown-menu": {
    name: "DropdownMenu",
    import: `import { DropdownMenu, DropdownMenuPortal, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from 'strata-design-system';`,
    category: "overlays",
    description: "Click-triggered dropdown menu built on Radix DropdownMenu. 15 exports cover items, checkboxes, radios, submenus, shortcuts. Use destructive variant on delete-type items.",
    variants: {
      "DropdownMenuItem.variant": ["default", "destructive"],
      "DropdownMenuItem.inset / DropdownMenuLabel.inset / DropdownMenuSubTrigger.inset": ["false (default)", "true (left padding for icon alignment)"],
    },
    props: [
      "DropdownMenu — Radix Root: open?, onOpenChange?, modal? (default: true)",
      "DropdownMenuTrigger — opens menu (use asChild for custom Button)",
      "DropdownMenuContent — dropdown panel: sideOffset?: number (default: 4), align?, side?",
      "DropdownMenuItem.variant?: 'default' | 'destructive'",
      "DropdownMenuItem.inset?: boolean",
      "DropdownMenuItem.disabled? / onSelect?",
      "DropdownMenuCheckboxItem.checked? / onCheckedChange?",
      "DropdownMenuRadioItem.value: string — required (inside RadioGroup)",
      "DropdownMenuShortcut — right-aligned keyboard hint",
      "DropdownMenuSub + SubTrigger + SubContent — nested submenu",
    ],
    tokens: {
      "bg-white / dark:bg-zinc-900": "content background (Tier 2 — uses zinc directly)",
      "text-zinc-950 / dark:text-zinc-50": "text color (Tier 2)",
      "focus:bg-zinc-100 / dark:focus:bg-zinc-800": "highlighted item (Tier 2)",
      "data-[variant=destructive]:text-red-600 / dark:text-red-500": "destructive item color (Tier 2 — raw red, should use text-destructive)",
      "border-zinc-200 / dark:border-zinc-800": "border (Tier 2)",
      "rounded-md / rounded-sm": "panel and item radii",
    },
    whenToUse: [
      "User avatar menus (Settings, Sign out)",
      "Row action menus (⋮ buttons in tables)",
      "Column header sort/filter menus",
      "Toolbar overflow menus when actions don't fit",
      "Use destructive variant for Delete-type items for red coloring",
      "Use inset on items without leading icons to align with sibling items that have icons",
    ],
    antiPatterns: [
      "❌ Select for action menus — DropdownMenu is for commands; Select is for value selection",
      "❌ For right-click menus — use ContextMenu",
      "❌ Item without onSelect handler — clicks become no-ops",
      "❌ Mixing items with and without inset in the same group — visual misalignment",
    ],
    example: `<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon" aria-label="Order actions">
      <MoreHorizontalIcon className="size-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-56">
    <DropdownMenuLabel>Actions</DropdownMenuLabel>
    <DropdownMenuItem onSelect={() => editOrder(id)}>
      Edit <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
    </DropdownMenuItem>
    <DropdownMenuItem onSelect={() => duplicateOrder(id)}>
      Duplicate <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
    </DropdownMenuItem>

    <DropdownMenuSub>
      <DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuItem>Drafts</DropdownMenuItem>
        <DropdownMenuItem>Archive</DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>

    <DropdownMenuSeparator />
    <DropdownMenuItem variant="destructive" onSelect={() => deleteOrder(id)}>
      Delete <DropdownMenuShortcut>⌫</DropdownMenuShortcut>
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`,
    governance: {
      tier: 2,
      notes: "Uses zinc + raw red throughout. Destructive variant should use text-destructive instead of text-red-600. Should use bg-popover/text-popover-foreground/text-foreground/bg-accent. Flagged for Tier 1 refactor.",
    },
  },

  "feedback-toast": {
    name: "FeedbackToast",
    import: `import { FeedbackToast, FeedbackToastProvider, feedbackToastVariants, useFeedbackToast } from 'strata-design-system';`,
    category: "overlays",
    description: "Custom toast system with success/error/warning variants. Includes Provider, hook for show/hide, and the FeedbackToast component itself. Different from Sonner — this is a self-contained DS toast.",
    variants: {
      variant: ["success (default — green)", "error (red)", "warning (amber)"],
    },
    props: [
      "FeedbackToast.variant?: 'success' | 'error' | 'warning' (default: 'success')",
      "FeedbackToast.message: string — required",
      "FeedbackToast.onClose: () => void — required",
      "FeedbackToast.className?: string",
      "FeedbackToastProvider — wrap your app root once",
      "feedbackToastVariants — exported cva helper for advanced styling",
      "useFeedbackToast() — returns { show({ variant, message, duration? }), hide() }",
    ],
    tokens: {
      "bg-[#1e6e22] / dark:bg-emerald-900": "success bg (Tier 2 — hex literal + raw emerald)",
      "bg-red-800 / dark:bg-red-900": "error bg (Tier 2 — raw red)",
      "bg-amber-700 / dark:bg-amber-800": "warning bg (Tier 2 — raw amber)",
      "border-l-emerald-400 / border-l-red-400 / border-l-amber-400": "left accent border per variant (Tier 2)",
      "text-white": "toast text",
      "hover:bg-white/20": "close button hover",
    },
    whenToUse: [
      "Form submission results when you want consistent DS styling (vs. Sonner's external API)",
      "Async operation feedback within a self-contained app",
      "When the show/hide programmatic API via useFeedbackToast fits better than toast.success() pattern",
      "For new projects, prefer Sonner — FeedbackToast is older and uses raw colors",
    ],
    antiPatterns: [
      "❌ Alert for transient notifications — use Sonner or FeedbackToast",
      "❌ FeedbackToast without FeedbackToastProvider — show() will be a no-op",
      "❌ Multiple Providers in the same tree — only one at the app root",
      "❌ Hardcoded duration without dismissibility — long durations need a close button",
    ],
    example: `// 1. Wrap app root once
<FeedbackToastProvider>
  <App />
</FeedbackToastProvider>

// 2. Use the hook anywhere
function SaveButton() {
  const { show } = useFeedbackToast();

  const handleSave = async () => {
    try {
      await save();
      show({ variant: 'success', message: 'Saved successfully', duration: 3000 });
    } catch {
      show({ variant: 'error', message: 'Failed to save changes' });
    }
  };

  return <Button onClick={handleSave}>Save</Button>;
}`,
    governance: {
      tier: 2,
      notes: "Heavy raw color use (hex literal #1e6e22 + raw emerald/red/amber). Should use bg-status-* tokens. Prefer Sonner for new projects. Flagged for Tier 1 refactor or deprecation.",
    },
  },

  "popover": {
    name: "Popover",
    import: `import { Popover, PopoverTrigger, PopoverContent, PopoverAnchor } from 'strata-design-system';`,
    category: "overlays",
    description: "Floating content panel anchored to a trigger element, built on Radix Popover. PopoverAnchor lets you decouple the visual anchor from the trigger.",
    props: [
      "Popover — Radix Root: open?, onOpenChange?, modal? (default: false), defaultOpen?",
      "PopoverTrigger — clickable element (use asChild for custom Button)",
      "PopoverContent — floating panel: align?: 'start' | 'center' (default) | 'end', sideOffset?: number (default: 4), side?: 'top' | 'right' | 'bottom' | 'left'",
      "PopoverAnchor — virtual anchor for positioning (when trigger and anchor differ)",
    ],
    tokens: {
      "bg-popover": "panel background (DS-correct)",
      "text-popover-foreground": "panel text (DS-correct)",
      "border + rounded-md": "panel chrome (DS-correct)",
      "z-50": "stacking order",
      "w-72": "default width — override with className",
      "p-4": "default padding — override to p-0 for embedded controls (Calendar, etc.)",
    },
    whenToUse: [
      "Rich input controls inside popovers (DatePicker uses this internally)",
      "Filter panels triggered from a button",
      "Quick edit forms that don't warrant a Sheet or Dialog",
      "Inline color pickers, emoji pickers, mention lists",
      "Keyboard shortcuts cheatsheet on a button",
    ],
    antiPatterns: [
      "❌ HoverCard for interactive content — Popover is click-triggered (more discoverable)",
      "❌ For dropdown menus — use DropdownMenu (correct ARIA + keyboard nav)",
      "❌ For modal dialogs — use Dialog (Popover doesn't trap focus)",
      "❌ PopoverContent without explicit width when content is variable — default w-72 may not fit",
    ],
    example: `// Inline DatePicker
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline" className="w-[280px] justify-start text-left">
      <CalendarIcon className="size-4 mr-2" />
      {date ? format(date, 'PPP') : 'Pick a date'}
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-auto p-0">
    <Calendar mode="single" selected={date} onSelect={setDate} />
  </PopoverContent>
</Popover>

// Filter panel
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">
      <FilterIcon className="size-4 mr-2" /> Filters
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-80">
    <FilterPanel mode="sheet">{/* ... */}</FilterPanel>
  </PopoverContent>
</Popover>`,
  },

  "resizable": {
    name: "ResizablePanelGroup",
    import: `import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from 'strata-design-system';`,
    category: "overlays",
    description: "Resizable panel layout built on `react-resizable-panels`. ResizablePanelGroup defines orientation; ResizablePanel is each pane; ResizableHandle is the drag bar between panes.",
    props: [
      "ResizablePanelGroup — direction: 'horizontal' | 'vertical', onLayout?, autoSaveId? (persists size to localStorage), storage?",
      "ResizablePanel — defaultSize?, minSize?, maxSize?, collapsible?, collapsedSize?, onResize?, id?, order?",
      "ResizablePanel inherits all react-resizable-panels Panel props",
      "ResizableHandle.withHandle?: boolean — when true, renders a visible grip icon at the center",
      "ResizableHandle.className?: string",
    ],
    tokens: {
      "bg-border": "handle background (DS-correct)",
      "focus-visible:ring-ring + focus-visible:ring-1 + focus-visible:ring-offset-1": "focus ring on handle (DS-correct)",
      "rounded-xs": "subtle radius on grip icon area",
    },
    whenToUse: [
      "Split-view layouts (sidebar + content)",
      "Code editors with movable panes",
      "Email clients (folder list / message list / preview)",
      "Dashboards with adjustable panes",
      "Use autoSaveId on ResizablePanelGroup to persist user's pane sizes across sessions",
      "Use withHandle for visible grip when handle target area is small",
    ],
    antiPatterns: [
      "❌ CSS flex with manual resize via mouse events — Resizable handles drag, persistence, and a11y",
      "❌ For collapsible sidebars (toggle hide/show) — use Sheet or Sidebar",
      "❌ Mismatched defaultSize values that don't sum to 100 — sizes are percentages",
      "❌ ResizableHandle without withHandle in subtle UIs — users won't discover the resize affordance",
    ],
    example: `<ResizablePanelGroup
  direction="horizontal"
  autoSaveId="dashboard-layout"
  className="h-screen"
>
  <ResizablePanel defaultSize={20} minSize={15} maxSize={35}>
    <aside className="h-full p-4 border-r border-border">{/* sidebar */}</aside>
  </ResizablePanel>

  <ResizableHandle withHandle />

  <ResizablePanel defaultSize={50}>
    <main className="h-full p-4">{/* main content */}</main>
  </ResizablePanel>

  <ResizableHandle withHandle />

  <ResizablePanel defaultSize={30} collapsible collapsedSize={0}>
    <aside className="h-full p-4 border-l border-border">{/* details */}</aside>
  </ResizablePanel>
</ResizablePanelGroup>

// Vertical split (top + bottom)
<ResizablePanelGroup direction="vertical" className="h-96">
  <ResizablePanel defaultSize={60}>{/* top */}</ResizablePanel>
  <ResizableHandle />
  <ResizablePanel defaultSize={40}>{/* bottom */}</ResizablePanel>
</ResizablePanelGroup>`,
  },

  "scroll-area": {
    name: "ScrollArea",
    import: `import { ScrollArea, ScrollBar } from 'strata-design-system';`,
    category: "overlays",
    description: "Custom-styled scrollbar wrapper for overflow content, built on Radix ScrollArea. ScrollArea wraps the scrollable content; ScrollBar is auto-rendered for vertical (default) and can be added explicitly for horizontal.",
    variants: {
      "ScrollBar.orientation": ["vertical (default)", "horizontal"],
    },
    props: [
      "ScrollArea — wraps content; accepts className + children + Radix ScrollAreaPrimitive props (type?: 'auto' | 'always' | 'scroll' | 'hover', scrollHideDelay?: number)",
      "ScrollBar.orientation?: 'vertical' | 'horizontal' (default: 'vertical')",
      "ScrollBar.className?: string",
    ],
    tokens: {
      "focus-visible:ring-ring/50 + focus-visible:ring-[3px]": "viewport focus ring (DS-correct)",
      "bg-border": "scrollbar thumb (DS-correct)",
      "rounded-full": "thumb shape",
      "border-l + border-t": "transparent borders giving the thumb breathing room",
    },
    whenToUse: [
      "Sidebars and command lists with overflow",
      "Fixed-height containers where you want consistent thin scrollbars",
      "Tables with horizontal overflow — add explicit horizontal ScrollBar",
      "Use type='always' to keep scrollbars visible even when not scrolling",
      "type='hover' (default in many DS) shows scrollbar only on hover",
    ],
    antiPatterns: [
      "❌ overflow-y-auto with native browser scrollbar — inconsistent styling across OS",
      "❌ For full-page scrolling — let the body scroll naturally",
      "❌ ScrollArea without explicit height — content won't trigger overflow",
      "❌ Skipping horizontal ScrollBar when content overflows horizontally — Radix only renders vertical by default",
    ],
    example: `// Vertical scroll only
<ScrollArea className="h-72 rounded-md border border-border">
  <div className="p-4">
    {items.map((item) => (
      <div key={item.id} className="py-2 border-b border-border last:border-b-0">
        {item.name}
      </div>
    ))}
  </div>
</ScrollArea>

// Both scrollbars
<ScrollArea className="h-72 w-96 rounded-md border border-border">
  <div className="p-4 w-[1200px]">{/* very wide content */}</div>
  <ScrollBar orientation="horizontal" />
</ScrollArea>

// Always-visible scrollbar
<ScrollArea type="always" className="h-72">
  {/* long list */}
</ScrollArea>`,
  },

  "sheet": {
    name: "Sheet",
    import: `import { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription } from 'strata-design-system';`,
    category: "overlays",
    description: "Desktop-first slide-over panel from any screen edge, built on Radix Dialog. For mobile-first bottom-sheet UX with swipe gestures, use Drawer instead.",
    variants: {
      "SheetContent.side": ["right (default)", "left", "top", "bottom"],
    },
    props: [
      "Sheet — Radix Dialog Root: open?, onOpenChange?, modal? (default: true)",
      "SheetTrigger — opens the sheet (use asChild for custom Button)",
      "SheetContent — sliding panel: side?: 'top' | 'right' | 'bottom' | 'left' (default: 'right'), className?",
      "SheetHeader / SheetFooter — semantic flex containers",
      "SheetTitle / SheetDescription — required for a11y",
      "SheetClose — dismiss button (use asChild for custom Button or X icon)",
    ],
    tokens: {
      "bg-background": "panel background (DS-correct)",
      "bg-black/50": "overlay (Tier 2 — direct color, conventional)",
      "bg-secondary": "default close button background (DS-correct)",
      "text-foreground": "title and close icon (DS-correct)",
      "text-muted-foreground": "description (DS-correct)",
      "border-l / border-r / border-t / border-b": "directional border based on side",
      "ring-offset-background + focus:ring-ring": "focus state (DS-correct)",
    },
    whenToUse: [
      "Editing records (full Sheet for detail editing)",
      "Long forms > 10 fields — use Sheet instead of Dialog",
      "Detail panels alongside main content",
      "Filter drawers on desktop (use Drawer for mobile-first)",
      "side='left' for navigation drawers; default 'right' for editing/detail; 'top'/'bottom' less common",
    ],
    antiPatterns: [
      "❌ Dialog for forms > 10 fields — use Sheet (vertical scroll-friendly)",
      "❌ Sheet for mobile bottom sheets — use Drawer (vaul gestures)",
      "❌ Without SheetTitle / SheetDescription — accessibility regression",
      "❌ Sheet without explicit width on desktop — defaults can be too narrow for forms",
    ],
    example: `<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline">
      <PencilIcon className="size-4 mr-2" /> Edit Profile
    </Button>
  </SheetTrigger>
  <SheetContent side="right" className="w-[480px] sm:max-w-[480px]">
    <SheetHeader>
      <SheetTitle>Edit Profile</SheetTitle>
      <SheetDescription>Update your personal information.</SheetDescription>
    </SheetHeader>

    <div className="space-y-4 py-6">
      <Field>
        <FieldLabel>Display name</FieldLabel>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Bio</FieldLabel>
        <Textarea rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
      </Field>
    </div>

    <SheetFooter>
      <SheetClose asChild><Button variant="outline">Cancel</Button></SheetClose>
      <Button onClick={save}>Save Changes</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>`,
  },

  "sidebar": {
    name: "Sidebar",
    import: `import { Sidebar, SidebarHeader, SidebarBody, SidebarFooter, SidebarSection, SidebarLabel, SidebarItem } from 'strata-design-system';`,
    category: "overlays",
    description: "Catalyst-style sidebar primitives — flex column with header/body/footer slots and SidebarItem with `current` indicator. NOT the Radix-based sidebar of shadcn — this is the simpler P1 catalog version.",
    props: [
      "Sidebar — outer flex container (h-full + flex-col + bg-card-like)",
      "SidebarHeader — top section with bottom border",
      "SidebarBody — scrollable middle section (flex-1 + overflow-y-auto)",
      "SidebarFooter — bottom section with top border",
      "SidebarSection — group of items (flex-col + gap-0.5)",
      "SidebarLabel — section heading (uppercase + tracking-wider + text-muted-foreground)",
      "SidebarItem.current?: boolean — marks the active item with a left accent bar",
      "All accept className for overrides",
    ],
    tokens: {
      "bg-white / dark:bg-zinc-900": "sidebar background (Tier 2 — uses zinc directly)",
      "border-zinc-200 / dark:border-zinc-800": "borders (Tier 2)",
      "bg-zinc-100 / dark:bg-zinc-800": "current item background (Tier 2)",
      "text-zinc-600 / dark:text-zinc-400": "default text color (Tier 2)",
      "hover:bg-zinc-50 / dark:hover:bg-zinc-800/50": "hover state (Tier 2)",
      "before:bg-zinc-800 / dark:before:bg-zinc-50": "current item left accent bar (Tier 2)",
    },
    whenToUse: [
      "App-level navigation sidebar (dev tool docs, dashboards)",
      "When you don't need Radix's full Sidebar primitives (collapse, mobile sheet)",
      "Compose with SidebarHeader + SidebarBody + sections of SidebarItems",
      "Use current={true} on the active SidebarItem to render the left accent bar",
    ],
    antiPatterns: [
      "❌ bg-sidebar-* tokens — those don't exist in this Sidebar (different from shadcn Sidebar)",
      "❌ Multiple SidebarItem with current=true — only one active item per sidebar",
      "❌ Sidebar without proper height parent — h-full needs a parent with explicit height",
      "❌ Skipping SidebarLabel inside SidebarSection — labels improve scanability",
    ],
    example: `<Sidebar className="w-[280px] fixed h-full z-50">
  <SidebarHeader className="px-6 py-5">
    <Logo />
  </SidebarHeader>

  <SidebarBody>
    <SidebarLabel>Foundations</SidebarLabel>
    <SidebarSection>
      <SidebarItem current={view === 'overview'} onClick={() => setView('overview')}>
        Overview
      </SidebarItem>
      <SidebarItem current={view === 'colors'} onClick={() => setView('colors')}>
        Colors
      </SidebarItem>
    </SidebarSection>
  </SidebarBody>

  <SidebarFooter className="px-3 py-4">
    <Button variant="outline" size="sm" className="w-full">Sign out</Button>
  </SidebarFooter>
</Sidebar>`,
    governance: {
      tier: 2,
      notes: "Uses zinc throughout. Should use bg-card/border-border/bg-muted/text-muted-foreground/text-foreground. Flagged for Tier 1 refactor.",
    },
  },

  "slide-over": {
    name: "SlideOver",
    import: `import { SlideOver, SlideOverHeader, SlideOverTitle, SlideOverDescription, SlideOverBody } from 'strata-design-system';`,
    category: "overlays",
    description: "Full-height slide-in panel with composable header/body sections. Different from Sheet — SlideOver uses a simpler open/onClose API and provides explicit Header/Body subcomponents instead of Header/Footer/Title/Description/Close.",
    props: [
      "SlideOver — wrapper: open: boolean, onClose: (open: boolean) => void, className?",
      "SlideOverHeader — header section (extends div + onClose? for built-in close button)",
      "SlideOverTitle — title element",
      "SlideOverDescription — subtitle below title",
      "SlideOverBody — scrollable content section",
    ],
    tokens: {
      "bg-white / dark:bg-zinc-900": "panel background (Tier 2 — uses zinc directly)",
      "text-zinc-900 / dark:text-white": "title color (Tier 2)",
      "text-zinc-500 / dark:text-zinc-400": "description / muted text (Tier 2)",
      "border-zinc-200 / dark:border-zinc-800": "header border (Tier 2)",
      "bg-zinc-950/25 / bg-zinc-950/50 + backdrop-blur-sm": "overlay (Tier 2 — uses zinc literal)",
      "focus:ring-2 + focus:ring-blue-500 + focus:ring-offset-2": "close button focus (Tier 2 — raw blue)",
      "rounded-md": "close button radius",
    },
    whenToUse: [
      "Order details and user profiles alongside main content",
      "Document preview panels",
      "Inline editing flows where Sheet's chrome (Title/Description in header) feels heavy",
      "When you want explicit SlideOverBody for scrollable content separation",
      "For mobile bottom-sheet UX with swipe gestures — use Drawer instead",
    ],
    antiPatterns: [
      "❌ Sheet for the same use case — Sheet has Trigger/Close/Footer; SlideOver is simpler",
      "❌ Dialog for full-height side panels — use SlideOver or Sheet",
      "❌ SlideOver without onClose — required prop; missing it means it can't dismiss",
      "❌ Custom h2 in SlideOverHeader instead of SlideOverTitle — accessibility loss",
    ],
    example: `const [open, setOpen] = useState(false);

<Button onClick={() => setOpen(true)}>View Order</Button>

<SlideOver open={open} onClose={setOpen}>
  <SlideOverHeader onClose={() => setOpen(false)}>
    <SlideOverTitle>Order #ORD-1284</SlideOverTitle>
    <SlideOverDescription>Acme Corp · $1,250.00 · May 1, 2024</SlideOverDescription>
  </SlideOverHeader>
  <SlideOverBody>
    <DescriptionList>
      <DescriptionTerm>Status</DescriptionTerm>
      <DescriptionDetails><StatusBadge status="completed" /></DescriptionDetails>
      <DescriptionTerm>Customer</DescriptionTerm>
      <DescriptionDetails>Acme Corp</DescriptionDetails>
    </DescriptionList>
    {/* more order details */}
  </SlideOverBody>
</SlideOver>`,
    governance: {
      tier: 2,
      notes: "Uses zinc + raw blue throughout. Should use bg-card/text-foreground/border-border/ring-ring. Flagged for Tier 1 refactor.",
    },
  },

  "sonner": {
    name: "Toaster",
    import: `import { Toaster } from 'strata-design-system';
import { toast } from 'sonner';`,
    category: "overlays",
    description: "Toast notification system built on the `sonner` library. Strata exports the Toaster (the host); call `toast()` from `sonner` directly anywhere in your app. Theming pulls from DS popover tokens via CSS variables.",
    props: [
      "Toaster — wraps sonner's Toaster: theme?: 'light' | 'dark' | 'system', position?, expand?, richColors?, closeButton?, duration?, ...all sonner ToasterProps",
      "Common toast() patterns from sonner:",
      "  toast.success(message, { description?, action? })",
      "  toast.error(message)",
      "  toast.warning(message) / toast.info(message)",
      "  toast.promise(promise, { loading, success, error })",
      "  toast(message, { ... }) for default style",
    ],
    tokens: {
      "--normal-bg → var(--popover)": "default toast background (DS-correct via CSS var)",
      "--normal-text → var(--popover-foreground)": "default toast text (DS-correct)",
      "--normal-border → var(--border)": "toast border (DS-correct)",
    },
    whenToUse: [
      "All transient notifications across the app — single source of truth",
      "Async operation feedback (`toast.promise()` for loading→success/error)",
      "Form submission confirmations",
      "Action confirmations with optional action button (Undo, Retry)",
      "Add <Toaster /> ONCE at the app root, then call toast() from anywhere",
    ],
    antiPatterns: [
      "❌ Multiple Toaster instances — single root mount only",
      "❌ Alert for transient/dismissible messages — Alert is for inline persistent feedback",
      "❌ Dialog for confirmations after an action — use toast.success() with optional Undo action",
      "❌ FeedbackToast for new code — Sonner is the modern DS-aligned choice",
    ],
    example: `// 1. App root
import { Toaster } from 'strata-design-system';
<Toaster position="bottom-right" richColors closeButton />

// 2. Anywhere in the app
import { toast } from 'sonner';

toast.success('Order created', { description: 'Confirmation email sent.' });
toast.error('Failed to connect', { action: { label: 'Retry', onClick: retry } });
toast.warning('Quota at 90%');

toast.promise(saveData(), {
  loading: 'Saving changes...',
  success: 'Changes saved',
  error: 'Failed to save',
});

// Custom (default style)
toast('Welcome back, Diego');`,
  },

  "tooltip": {
    name: "Tooltip",
    import: `import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from 'strata-design-system';`,
    category: "overlays",
    description: "Hover/focus tooltip built on Radix Tooltip. Default delayDuration is 0 (immediate). TooltipProvider should wrap a section of the app once for shared tooltip behavior.",
    props: [
      "TooltipProvider — wraps tooltip section: delayDuration?: number (default 0), skipDelayDuration?, disableHoverableContent?",
      "Tooltip — Radix Root: open?, onOpenChange?, defaultOpen?, delayDuration?",
      "TooltipTrigger — wraps the trigger element (use asChild for custom Button)",
      "TooltipContent — floating panel: sideOffset?: number (default 0), side?: 'top' | 'right' | 'bottom' | 'left', align?: 'start' | 'center' | 'end', className?",
    ],
    tokens: {
      "bg-foreground": "tooltip background (DS-correct, inverts in dark mode)",
      "text-background": "tooltip text (DS-correct, inverts in dark mode)",
      "text-xs": "small text size",
      "rounded-md + w-fit + z-50": "tooltip chrome",
      "size-2.5": "default arrow size (when TooltipArrow is rendered by Radix)",
      "data-[state=open]:animate-in + fade-in-0 + zoom-in-95 + slide-in-from-{side}": "directional entrance animations",
      "data-[state=closed]:animate-out + fade-out-0 + zoom-out-95": "exit animations",
    },
    whenToUse: [
      "Labels for icon-only buttons (Settings ⚙, Edit ✎, Delete 🗑)",
      "Additional context for truncated text (full label on hover)",
      "Keyboard shortcuts (⌘K, Enter)",
      "Brief data hints in compact dense UIs",
      "Wrap multiple Tooltips in a single TooltipProvider for shared delay behavior",
    ],
    antiPatterns: [
      "❌ HoverCard for plain-text tooltips — Tooltip is purpose-built and lighter",
      "❌ Skipping tooltip on icon-only buttons — a11y regression for screen reader users (also add aria-label)",
      "❌ Tooltip on body text or links — relies on hover (not touch-friendly)",
      "❌ Long-form content in TooltipContent — use Popover or HoverCard instead",
    ],
    example: `<TooltipProvider delayDuration={300}>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="icon" aria-label="Settings">
        <CogIcon className="size-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>Settings (⌘,)</TooltipContent>
  </Tooltip>

  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="icon" aria-label="Delete">
        <TrashIcon className="size-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent side="right">Delete this row</TooltipContent>
  </Tooltip>
</TooltipProvider>`,
  },
};

// ─── TOKENS ───────────────────────────────────────────────────────────────────

const TOKENS = {
  status: {
    description: "Semantic status tokens — use instead of raw Tailwind colors for all status states.",
    tokens: [
      { name: "--color-status-success", tailwind: "bg-status-success / text-status-success", light: "#16a34a", dark: "#4ade80", use: "Active, completed, match, success" },
      { name: "--color-status-warning", tailwind: "bg-status-warning / text-status-warning", light: "#b45309", dark: "#fbbf24", use: "Warning, pending, review" },
      { name: "--color-status-error", tailwind: "bg-status-error / text-status-error", light: "#C11736", dark: "#ED5F74", use: "Error, critical, failure, rejected" },
      { name: "--color-status-info", tailwind: "bg-status-info / text-status-info", light: "#2563eb", dark: "#60a5fa", use: "Info, neutral, in-progress" },
      { name: "--color-status-ai", tailwind: "bg-status-ai / text-status-ai", light: "#8b5cf6", dark: "#a78bfa", use: "AI-generated, automation, Claude" },
      { name: "--color-status-success-foreground", tailwind: "text-status-success-foreground", light: "#ffffff", dark: "#000000", use: "Text on status-success background" },
    ],
  },
  semantic: {
    description: "Core semantic tokens used throughout the design system.",
    tokens: [
      { name: "--color-background", tailwind: "bg-background", use: "Page and app background" },
      { name: "--color-foreground", tailwind: "text-foreground", use: "Primary text color" },
      { name: "--color-card", tailwind: "bg-card", use: "Card surface background" },
      { name: "--color-card-foreground", tailwind: "text-card-foreground", use: "Card text color" },
      { name: "--color-primary", tailwind: "bg-primary", use: "Primary brand color" },
      { name: "--color-primary-foreground", tailwind: "text-primary-foreground", use: "Text on primary bg" },
      { name: "--color-secondary", tailwind: "bg-secondary", use: "Secondary surfaces" },
      { name: "--color-muted", tailwind: "bg-muted", use: "Muted/subtle backgrounds" },
      { name: "--color-muted-foreground", tailwind: "text-muted-foreground", use: "Secondary text, placeholders" },
      { name: "--color-accent", tailwind: "bg-accent", use: "Hover/active accent surfaces" },
      { name: "--color-border", tailwind: "border-border", use: "All borders" },
      { name: "--color-input", tailwind: "border-input", use: "Form input borders" },
      { name: "--color-ring", tailwind: "ring-ring", use: "Focus rings" },
      { name: "--color-destructive", tailwind: "bg-destructive", use: "Destructive/danger states" },
    ],
  },
  brand: {
    description: "Brand color palette (lime/yellow-green). Use bg-brand-300 light / bg-brand-500 dark for CTAs.",
    tokens: [
      { name: "--color-brand-50", tailwind: "bg-brand-50", light: "#f7fee7", use: "Brand tinted backgrounds" },
      { name: "--color-brand-200", tailwind: "bg-brand-200", light: "#d9f99d", use: "Soft brand fill" },
      { name: "--color-brand-300", tailwind: "bg-brand-300", light: "#E6F993", use: "CTA button fill (light mode)" },
      { name: "--color-brand-400", tailwind: "bg-brand-400", light: "#C3E433", use: "CTA dark mode / hover light" },
      { name: "--color-brand-500", tailwind: "bg-brand-500", light: "#84cc16", use: "Dark mode CTA button fill" },
      { name: "--color-brand-600", tailwind: "bg-brand-600", light: "#65a30d", use: "Button hover (light)" },
      { name: "--color-brand-700", tailwind: "bg-brand-700", light: "#4d7c0f", use: "Button hover (dark)" },
    ],
  },
  primitives: {
    description: "Primitive palette — prefer semantic tokens when a semantic equivalent exists.",
    categories: ["zinc", "red", "orange", "amber", "yellow", "lime", "green", "emerald", "teal", "cyan", "sky", "blue", "indigo", "violet", "purple", "fuchsia", "pink", "rose", "white", "black"],
    note: "Access via --color-{palette}-{shade} e.g. --color-zinc-900.",
  },
  foundations: {
    description: "Design foundations — spacing, typography, borders, shadows, color palette.",
    note: "Use get_foundations() tool for the complete foundations data with examples.",
    categories: ["colors", "typography", "spacing", "borders", "shadows"],
  },
};

// ─── RULES ────────────────────────────────────────────────────────────────────

const RULES = {
  "color-tokens": `
# Rule: Always Use Color Tokens

TIER 1+2: Hex hardcoded values BLOCK the commit.
TIER 3: Hex requires // @ds-ignore: reason comment.

## What to use instead

| Situation | Wrong | Correct |
|-----------|-------|---------|
| Primary text | text-[#02060C] | text-foreground |
| Background | bg-[#F8F9FA] | bg-background |
| Brand button bg | bg-[#E6F993] | bg-brand-300 |
| Success state | bg-green-600 or bg-[#098400] | bg-status-success |
| Warning state | bg-amber-600 or bg-[#D97706] | bg-status-warning |
| Error state | bg-red-600 or bg-[#DC2626] | bg-status-error |
| Info state | bg-blue-600 or bg-[#2563EB] | bg-status-info |
| AI state | bg-violet-600 or bg-[#8B5CF6] | bg-status-ai |
| Border | border-[#E2E8F0] | border-border |
`,
  buttons: `
# Rule: Button Variants

Use only official Button variants from CVA. Don't create custom button styles.

## Variant selection guide
- ONE primary (default/brand) per screen section
- Pair primary with outline or ghost for secondary actions
- Never use default for destructive actions — use destructive
- Ghost for icon-only controls in toolbars
- Link for inline text navigation

## Shape
- Use shape="pill" only for brand CTAs and hero sections
- Default (rounded-md) for all other contexts

## DO NOT
- Create a raw <button> with custom classes
- Override variant colors with className
- Use bg-[...] overrides on Button
`,
  containers: `
# Rule: Container Components

Always use DS container components. Never create raw div containers with manual tokens.

## Container hierarchy
1. Layout — full app shell (Navbar + PageHeader + main)
2. Card (variant: default/flat/glass/brand) — content grouping
3. SectionCard — secondary groupings within a page
4. NavbarFloating — floating pill header for landing pages

## Card variant selection
- default — most cards, dashboard panels
- flat — subtle grouping, no visual weight
- glass — over images, hero sections
- brand — onboarding, promotional

## DO NOT
- <div className="bg-white border rounded-lg p-4 shadow"> — use Card
- Nesting Card > 2 levels deep
- Adding backdrop-blur manually — use glass variant
`,
  "dark-mode": `
# Rule: Dark Mode Always

All components must work in both light and dark. Use DS tokens — they handle dark mode automatically.

## CSS pattern for custom elements
\`\`\`css
.my-element {
  background: var(--color-background);
  color: var(--color-foreground);
  border-color: var(--color-border);
}
/* DO NOT add @media (prefers-color-scheme: dark) — use class .dark instead */
\`\`\`

## Tailwind pattern
\`\`\`tsx
// ✅ Tokens handle dark mode automatically
<div className="bg-card text-card-foreground border border-border">

// ❌ Only light mode — will break in dark
<div className="bg-white text-gray-900 border-gray-200">
\`\`\`
`,
  "governance-tiers": `
# Governance Tiers

Declare tier in project's CLAUDE.md:
## DS Governance Tier: 1

## Tier 1 — Production Strict (smart-comparator, strata-ds)
- Hex hardcoded → BLOCKS commit
- Custom variants (no CVA) → BLOCKS commit
- Dark mode → REQUIRED
- Pre-commit hook → ACTIVE

## Tier 2 — Demo Flexible (front-react-strata-storybook)
- Hex hardcoded → BLOCKS commit
- Custom variants → WARNING (allowed with comment)
- Tailwind palette tokens → ALLOWED
- Dark mode → REQUIRED

## Tier 3 — Simulation Free (demo-2026-strata-v2)
- Hex with @ds-ignore → ALLOWED
- Custom variants → ALLOWED
- Dark mode → RECOMMENDED
`,
  icons: `
# Rule: Icons

**Library:** Use \`@heroicons/react\` for UI icons.
- \`import { IconName } from '@heroicons/react/24/outline'\` — UI/navigation (default)
- \`import { IconName } from '@heroicons/react/24/solid'\` — emphasis, filled states

## Sizing
| Class | px | Use |
|-------|----|-----|
| w-3 h-3 | 12px | Inline text icons, micro indicators |
| w-4 h-4 | 16px | Default — form prefix/suffix, table actions |
| w-5 h-5 | 20px | Card header icons, nav items |
| w-6 h-6 | 24px | Section headers, empty state icons |
| w-8 h-8 | 32px | Feature icons with containers |
| w-12 h-12 | 48px | Hero/illustration icons |

## Color tokens
- \`text-primary\` — brand/action icons (CTAs, active nav)
- \`text-muted-foreground\` — neutral/decorative icons
- \`text-status-success/warning/error/info/ai\` — status indicator icons
- \`text-destructive\` — danger/delete icons

## Icon containers
\`\`\`tsx
// Status container
<span className="inline-flex p-2 rounded-lg bg-status-success/10">
  <CheckCircleIcon className="w-5 h-5 text-status-success" />
</span>

// Brand container
<span className="inline-flex p-2 rounded-lg bg-primary/15">
  <StarIcon className="w-5 h-5 text-primary" />
</span>
\`\`\`

## Accessibility
- Decorative icons: \`aria-hidden="true"\`
- Icon-only buttons: \`aria-label="Delete item"\` on the <Button>

## DO NOT
- Use emoji as icons in UI components
- Use \`text-green-500\` instead of \`text-status-success\`
- Skip \`aria-label\` on icon-only interactive elements
`,
  "brand-colors": `
# Rule: Brand Colors

The Strata brand is lime/yellow-green. Use purposefully, not decoratively.

## Primary CTA Pattern
\`\`\`tsx
// Light: brand-300 (#E6F993)  |  Dark: brand-500 (#84cc16)
<div className="bg-brand-300 dark:bg-brand-500">…</div>
// Or simply: the Button variant="default" already applies this pattern
\`\`\`

## Where TO use brand colors
- Primary CTA button fill (handled by Button variant="default/brand")
- Active nav indicator / selected state underline
- Card accent strip or left border highlight
- Icon container background (\`bg-brand-300/15\`)
- Focus ring override for brand prominence

## Where NOT to use
- Body text or headings — brand-300 FAILS WCAG AA on white backgrounds
- Full section or page backgrounds — too visually heavy
- Error, warning, or info states — use status tokens instead
- Tables, form labels, or body copy

## Full brand scale
| Token | Hex | Use |
|-------|-----|-----|
| brand-50 | #f7fee7 | Tinted background |
| brand-200 | #d9f99d | Soft fill |
| brand-300 | #E6F993 | **CTA light (primary use)** |
| brand-400 | #C3E433 | CTA dark / hover light |
| brand-500 | #84cc16 | **Dark mode CTA** |
| brand-600 | #65a30d | Hover dark |

## NEVER use brand-300 as text
brand-300 (#E6F993) is a light lime — insufficient contrast on white.
Use \`text-foreground\` or \`text-primary\` for text.
`,
  typography: `
# Rule: Typography

**Font families:**
- Primary: Inter (UI text, headings, labels)
- Mono: JetBrains Mono (code, IDs, technical values)

## Type scale — use these, don't invent sizes
| Token | Size | Weight | Use |
|-------|------|--------|-----|
| display-lg | 36px / 700 | 700 | Hero titles |
| heading-1 | 30px / 700 | 700 | Page titles |
| heading-2 | 24px / 600 | 600 | Section headings |
| heading-3 | 20px / 600 | 600 | Card headings |
| heading-4 | 18px / 600 | 600 | Sub-headings |
| body-lg | 18px / 400 | 400 | Lead paragraphs |
| body-base | 16px / 400 | 400 | Default body text |
| body-sm | 14px / 400 | 400 | Secondary, captions |
| label | 14px / 500 | 500 | Form labels, metadata |
| caption | 12px / 400 | 400 | Timestamps, helper text |
| code | 14px / 400 | 400 | Code blocks, IDs |

## Tailwind usage
\`\`\`tsx
// ✅ Use Heading/Text DS components
<Heading level={1}>Page Title</Heading>
<Text size="sm" className="text-muted-foreground">Caption</Text>

// ✅ Direct Tailwind when DS components aren't needed
<h2 className="text-2xl font-semibold text-foreground">Section Title</h2>

// ❌ Custom arbitrary font sizes
<p className="text-[15px]">
<p style={{ fontSize: '15px' }}>
\`\`\`

## DO NOT
- Custom font-size with arbitrary values ([15px], [13px], [11px])
- Font families other than Inter / JetBrains Mono
- font-weight values not in the scale (300, 800, 900)
- Mix heading levels arbitrarily
`,
};

// ─── ANTI-PATTERNS ────────────────────────────────────────────────────────────

const ANTI_PATTERNS = [
  {
    category: "Color Tokens",
    severity: "Tier 1+2 Blocker",
    pattern: "Hex hardcoded colors",
    examples: ["bg-[#E6F993]", "text-[#02060C]", "border-[#D0D4D8]", "style={{ color: '#8b5cf6' }}"],
    fix: "Use DS tokens: bg-brand-300, text-foreground, border-border, bg-status-ai",
  },
  {
    category: "Status Colors",
    severity: "Tier 1+2 Blocker",
    pattern: "Raw Tailwind colors for status states",
    examples: ["bg-green-600", "bg-red-600", "bg-amber-600", "bg-blue-600"],
    fix: "Use status tokens: bg-status-success, bg-status-error, bg-status-warning, bg-status-info, bg-status-ai",
  },
  {
    category: "Buttons",
    severity: "Tier 1 Blocker",
    pattern: "Raw <button> elements or custom button styles",
    examples: ["<button className='px-4 py-2 bg-brand rounded'>", "<div onClick={...} className='cursor-pointer'>"],
    fix: "Use <Button variant='...'> from DS",
  },
  {
    category: "Containers",
    severity: "Tier 1+2 Warning",
    pattern: "Raw div replacing Card",
    examples: ["<div className='bg-white border rounded-lg p-4 shadow'>", "<div className='bg-card rounded-xl p-6'>"],
    fix: "Use <Card> or <SectionCard> from DS",
  },
  {
    category: "Dark Mode",
    severity: "Tier 1+2 Blocker",
    pattern: "Light-only color values",
    examples: ["bg-white", "text-gray-900", "border-gray-200", "@media (prefers-color-scheme: dark)"],
    fix: "Use semantic tokens: bg-background, text-foreground, border-border",
  },
  {
    category: "Alerts",
    severity: "Best Practice",
    pattern: "Wrong component for feedback type",
    examples: ["<Alert> for transient notifications", "<Alert> inside modals"],
    fix: "Transient → Sonner. Inside modals → AlertDialog. Inline → Alert",
  },
  {
    category: "Alerts",
    severity: "Tier 1+2 Warning",
    pattern: "Custom colored alert with className",
    examples: ["<Alert className='bg-[#16a34a] border-[#15803d]'>"],
    fix: "Use <Alert variant='success'> — CVA handles the colors",
  },
  {
    category: "Status Badges",
    severity: "Tier 1+2 Blocker",
    pattern: "Hardcoded state colors in status badges",
    examples: [
      "<Badge className='bg-green-100 text-green-800'>Active</Badge>",
      "<span className='inline-flex bg-red-500 text-white rounded-full px-2'>Error</span>",
    ],
    fix: "Use status tokens: bg-status-success/10 text-status-success border-status-success/20",
  },
  {
    category: "Container Backgrounds",
    severity: "Tier 1+2 Blocker",
    pattern: "Hardcoded container backgrounds",
    examples: [
      "<div className='bg-white rounded-xl p-6'>",
      "<section className='bg-gray-50 dark:bg-gray-900'>",
    ],
    fix: "Use bg-card (Card component) or bg-background / bg-muted for sections",
  },
  {
    category: "Legacy Tokens",
    severity: "Tier 1+2 Blocker",
    pattern: "Legacy token namespace (old ds- prefix or old variable names)",
    examples: ["var(--ds-color-brand)", "var(--ds-spacing-4)", "var(--color-primary-500)"],
    fix: "Use current token names: var(--color-brand-300), var(--color-primary), etc.",
  },
  {
    category: "Brand Colors",
    severity: "Tier 1+2 Blocker",
    pattern: "Using brand-300 as text color",
    examples: [
      "<p className='text-brand-300'>Title</p>",
      "<span className='text-[#E6F993]'>Label</span>",
    ],
    fix: "brand-300 (#E6F993) fails WCAG AA on white. Use text-foreground or text-primary",
  },
  {
    category: "Dark Mode",
    severity: "Tier 1+2 Blocker",
    pattern: "Using dark: modifier classes instead of semantic tokens",
    examples: [
      "<div className='bg-white dark:bg-zinc-900'>",
      "<p className='text-gray-900 dark:text-gray-100'>",
    ],
    fix: "Use bg-background and text-foreground — they auto-adapt without dark: modifiers",
  },
  {
    category: "Interactivity",
    severity: "Tier 2 Warning",
    pattern: "Missing hover states on interactive elements",
    examples: [
      "<tr className='border-b'>  {/* no hover */}",
      "<div onClick={...}>  {/* no cursor-pointer or hover bg */}",
    ],
    fix: "Add hover:bg-muted/50 to table rows. Use Button for clickable elements. Clickable cards: hover:shadow-md transition-shadow",
  },
  {
    category: "Opacity",
    severity: "Tier 2 Warning",
    pattern: "Incorrect container opacity pattern",
    examples: [
      "<div className='opacity-50 bg-card'>",  // wrong — makes content transparent too
    ],
    fix: "Use bg-card/50 (Tailwind color opacity) not opacity-50 (affects all children). Or use color-mix() in CSS.",
  },
  {
    category: "Sidebar",
    severity: "Best Practice",
    pattern: "Using sidebar-specific tokens outside sidebar context",
    examples: [
      "<div className='bg-sidebar-accent'>  {/* outside Sidebar component */}",
    ],
    fix: "Sidebar tokens (bg-sidebar, bg-sidebar-accent) are scoped to the Sidebar component. Use bg-muted/bg-accent outside sidebar.",
  },
  {
    category: "Layout",
    severity: "Best Practice",
    pattern: "Multiple primary CTAs on the same page section",
    examples: [
      "<Button variant='default'>Save</Button><Button variant='default'>Publish</Button>",
    ],
    fix: "Only ONE primary (default/brand) Button per screen section. Make others outline or ghost.",
  },
  {
    category: "CSS Variables",
    severity: "Tier 1+2 Blocker",
    pattern: "Local CSS variables duplicating DS tokens",
    examples: [
      ":root { --my-success: #16a34a; }  /* duplicates --color-status-success */",
      ".component { --local-border: #e2e8f0; }",
    ],
    fix: "Use DS CSS variables directly: var(--color-status-success), var(--color-border). No local overrides.",
  },
];

// ─── SEARCH HELPER ────────────────────────────────────────────────────────────

function searchGovernance(query) {
  const q = query.toLowerCase();
  const results = [];

  for (const [key, comp] of Object.entries(COMPONENTS)) {
    const text = JSON.stringify(comp).toLowerCase();
    if (text.includes(q)) {
      results.push({ type: "component", name: comp.name, relevance: (text.match(new RegExp(q, "g")) || []).length, snippet: comp.description });
    }
  }
  for (const [key, rule] of Object.entries(RULES)) {
    if (rule.toLowerCase().includes(q) || key.includes(q)) {
      results.push({ type: "rule", name: key, relevance: (rule.toLowerCase().match(new RegExp(q, "g")) || []).length, snippet: rule.split("\n")[1]?.trim() || key });
    }
  }
  for (const ap of ANTI_PATTERNS) {
    const text = JSON.stringify(ap).toLowerCase();
    if (text.includes(q)) {
      results.push({ type: "anti-pattern", name: ap.pattern, relevance: (text.match(new RegExp(q, "g")) || []).length, snippet: ap.fix });
    }
  }
  for (const [cat, data] of Object.entries(TOKENS)) {
    const text = JSON.stringify(data).toLowerCase();
    if (text.includes(q)) {
      results.push({ type: "token", name: `tokens:${cat}`, relevance: (text.match(new RegExp(q, "g")) || []).length, snippet: data.description || cat });
    }
  }
  for (const [cat, data] of Object.entries(FOUNDATIONS)) {
    const text = JSON.stringify(data).toLowerCase();
    if (text.includes(q)) {
      results.push({ type: "foundation", name: `foundations:${cat}`, relevance: (text.match(new RegExp(q, "g")) || []).length, snippet: data.description || cat });
    }
  }

  return results.sort((a, b) => b.relevance - a.relevance).slice(0, 10);
}

// ─── SESSION BRIEFING ─────────────────────────────────────────────────────────
// Returns a concise system-prompt-style rules dump that primes the AI for
// every subsequent task in this session. Equivalent to "reading CLAUDE.md"
// but live from the MCP — guarantees the rules are current.

function getSessionBriefing() {
  return [
    "# Strata DS — active session briefing",
    "",
    "You are connected to the Strata Design System MCP server. **The rules in this briefing are mandatory for the rest of the session.** Re-read them whenever you start a new UI task.",
    "",
    "## Mandatory workflow for UI tasks",
    "",
    "Whenever the user asks you to build/add/create/show/render/display any UI element (component, layout, navbar, form, table, button, modal, banner, badge, alert, card, etc.):",
    "",
    "1. **Call `plan_ui(description)` BEFORE writing any code.** Pass a concrete description.",
    "2. The response gives you: recommended component, required tokens, applicable rules, anti-patterns to avoid, starter snippet, alternatives.",
    "3. Follow up with `get_component(name)` for the full spec if you need more detail.",
    "4. **Never invent tokens, components, or patterns.** If `plan_ui` returns no good match, that's a real DS gap — say so explicitly and call `report_error`.",
    "",
    "## Token rules (zero drift)",
    "",
    "- Surfaces: `bg-background` / `bg-card` / `bg-popover` / `bg-muted` / `bg-accent` (with their `*-foreground` pairs)",
    "- Status: `bg-status-success` / `text-status-success` / `bg-status-success/10` (soft pattern). Same for warning, error, info, ai.",
    "- Brand CTA: `bg-primary text-primary-foreground` (semantic) — auto-resolves to brand-300 light / brand-500 dark. Never hardcode `bg-blue-500`, `bg-zinc-900`, or hex colors.",
    "- Borders: `border-border` (neutral), `border-destructive` (error)",
    "- Icons: `lucide-react` only. Sizes via `size-4`/`size-5`. Color via `text-muted-foreground` or status tokens.",
    "",
    "## Available tools (call by name on this MCP server)",
    "",
    "- `plan_ui(description)` — 🚨 MANDATORY before any UI. Returns blueprint.",
    "- `get_component(name)` — full spec for one component (variants, props, tokens, anti-patterns).",
    "- `get_component_code(name)` — React/HTML/CSS/AI-prompt code blocks.",
    "- `get_foundations(section)` — colors / typography / spacing / borders / shadows / branding / transparency / grid-containers.",
    "- `get_rules(category)` — color-tokens, brand-colors, buttons, containers, dark-mode, governance-tiers, icons, typography.",
    "- `get_anti_patterns()` — all 17 documented things to avoid.",
    "- `search_governance(q)` — full-text search across catalogue.",
    "- `report_error(...)` — flag a DS gap or violation for the team.",
    "",
    `## Catalogue size: ${Object.keys(COMPONENTS).length} components, ${Object.keys(FOUNDATIONS).length} foundations, ${Object.keys(RULES).length} rules, ${ANTI_PATTERNS.length} anti-patterns.`,
    "",
    "## How to behave when uncertain",
    "",
    "- If a user prompt is ambiguous (\"make it pretty\", \"fix the layout\"), still call `plan_ui` with your best interpretation — the response will help you ask the right follow-up question.",
    "- If you suspect a token doesn't exist, call `get_foundations('colors')` to verify before using it.",
    "- If a user wants something the DS doesn't cover, say so explicitly and call `report_error` to log the gap.",
    "",
    "Acknowledge this briefing in your next response by saying: \"Strata DS rules loaded. I'll call plan_ui before any UI task.\"",
  ].join("\n");
}

// ─── PLAN UI ──────────────────────────────────────────────────────────────────
// `plan_ui` is the "blueprint before code" tool. Given a free-text description
// of UI to build, returns a structured plan: recommended component(s),
// required tokens, applicable rules, anti-patterns to avoid, and a starter
// code snippet. Designed to be called by the ds-architect agent BEFORE any
// hand-written UI is produced.

const PLAN_UI_KEYWORDS = {
  // Layout / chrome
  navbar: ["navbar-floating", "navbar", "experiences-navbar"],
  navigation: ["navbar-floating", "navbar", "experiences-navbar", "navigation-menu", "menubar"],
  sidebar: ["sidebar"],
  header: ["page-header", "navbar-floating"],
  footer: ["divider", "page-layout"],

  // Content surfaces
  card: ["card", "section-card", "kpi-card"],
  surface: ["card", "section-card"],
  container: ["card", "page-layout"],
  hero: ["hero-section"],
  feature: ["feature-section"],
  pricing: ["pricing"],

  // Data display
  table: ["table", "table-empty-state"],
  list: ["stacked-list", "list-toolbar"],
  grid: ["product-list"],
  kanban: ["product-list"],
  empty: ["empty-state", "table-empty-state"],
  chart: ["chart"],
  metrics: ["kpi-card", "chart"],
  kpi: ["kpi-card"],
  progress: ["progress", "stage-progress"],
  timeline: ["activity-timeline"],
  description: ["description-list"],

  // Buttons / triggers
  button: ["button"],
  cta: ["button"],
  toggle: ["toggle", "toggle-group", "switch"],
  copy: ["copy-button"],

  // Inputs
  input: ["input"],
  search: ["input", "command"],
  textarea: ["textarea"],
  select: ["select", "combobox", "listbox", "searchable-multi-select"],
  combo: ["combobox"],
  multi: ["searchable-multi-select"],
  checkbox: ["checkbox"],
  radio: ["radio-group"],
  slider: ["slider"],
  date: ["date-picker", "calendar"],
  calendar: ["calendar"],
  form: ["form", "field", "fieldset"],
  otp: ["input-otp"],

  // Status / signals
  badge: ["badge", "status-badge", "priority-badge"],
  status: ["status-badge", "badge"],
  priority: ["priority-badge"],
  alert: ["alert", "banner", "info-banner"],
  banner: ["banner", "info-banner"],
  toast: ["sonner", "feedback-toast"],
  notification: ["sonner", "feedback-toast", "action-center"],

  // Overlays
  dialog: ["dialog", "alert-dialog", "confirm-dialog"],
  modal: ["dialog", "alert-dialog"],
  drawer: ["drawer", "sheet", "slide-over"],
  sheet: ["sheet", "drawer"],
  popover: ["popover", "hover-card"],
  tooltip: ["tooltip"],
  dropdown: ["dropdown-menu", "select"],
  menu: ["dropdown-menu", "menubar", "context-menu"],
  contextmenu: ["context-menu"],
  command: ["command"],
  palette: ["command"],

  // Misc
  tab: ["tabs"],
  accordion: ["accordion", "collapsible", "disclosure"],
  collapse: ["collapsible", "accordion"],
  disclosure: ["disclosure", "collapsible"],
  carousel: ["carousel"],
  separator: ["separator", "divider"],
  divider: ["divider", "separator"],
  skeleton: ["skeleton"],
  avatar: ["avatar"],
  link: ["link"],
  label: ["label"],
  text: ["text", "heading"],
  heading: ["heading", "text"],
  breadcrumb: ["breadcrumb"],
  pagination: ["pagination"],
  scroll: ["scroll-area"],
  resize: ["resizable"],
  ratio: ["aspect-ratio"],
  greeting: ["company-greeting"],
  filter: ["filter-panel"],
  toolbar: ["section-toolbar", "list-toolbar"],
  tracking: ["tracking"],
  layout: ["layout", "page-layout"],
  page: ["page-layout", "page-header"],
};

const FLOATING_HINTS = ["floating", "pill", "rounded", "demo", "landing", "marketing", "transparent", "glass", "blur"];
const PRODUCT_HINTS = ["app", "shell", "dashboard", "tenant", "experience", "product", "internal"];

function planUI(description) {
  if (!description || typeof description !== "string") {
    return { error: "Provide a description of the UI you want to build (e.g. 'navbar with logo and tabs')." };
  }

  const desc = description.toLowerCase();
  const wordHits = new Map();

  // Score components by keyword matches
  for (const [keyword, components] of Object.entries(PLAN_UI_KEYWORDS)) {
    if (desc.includes(keyword)) {
      for (const comp of components) {
        wordHits.set(comp, (wordHits.get(comp) || 0) + 1);
      }
    }
  }

  // Hint-based bias: floating/landing/demo → prefer NavbarFloating over Navbar
  const isFloating = FLOATING_HINTS.some((h) => desc.includes(h));
  const isProduct = PRODUCT_HINTS.some((h) => desc.includes(h));

  if (wordHits.has("navbar-floating") && wordHits.has("navbar")) {
    if (isFloating) wordHits.set("navbar-floating", wordHits.get("navbar-floating") + 5);
    if (isProduct) wordHits.set("navbar", wordHits.get("navbar") + 3);
  }

  if (wordHits.size === 0) {
    return {
      error: `No matching components found for "${description}". Try simpler keywords like "navbar", "card", "table", "form", or call search_governance for free-text matching.`,
      suggestion: "Use search_governance(q) for fuzzy lookup across the catalogue.",
    };
  }

  // Sort by relevance
  const ranked = [...wordHits.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const [primaryId] = ranked[0];
  const primary = COMPONENTS[primaryId];

  if (!primary) {
    return { error: `Internal: keyword matched ${primaryId} but COMPONENTS doesn't have it.` };
  }

  // Pull rules that match the description's tokens
  const rulesMatched = [];
  for (const [ruleKey, ruleText] of Object.entries(RULES)) {
    const ruleStr = String(ruleText).toLowerCase();
    if (
      desc.split(/\s+/).some((word) => word.length > 3 && ruleStr.includes(word)) ||
      desc.includes(ruleKey.replace("-", " "))
    ) {
      rulesMatched.push(ruleKey);
    }
  }

  // Always include color-tokens + brand-colors when the description
  // mentions any color/brand/status word — they apply to almost all UI.
  if (/(brand|color|status|lime|primary|destructive|warning|success|error)/i.test(desc)) {
    if (!rulesMatched.includes("brand-colors")) rulesMatched.push("brand-colors");
    if (!rulesMatched.includes("color-tokens")) rulesMatched.push("color-tokens");
  }

  // Pull anti-patterns that mention the primary component or related keywords
  const apMatched = ANTI_PATTERNS.filter((ap) => {
    const text = JSON.stringify(ap).toLowerCase();
    return text.includes(primaryId) || text.includes(primary.name.toLowerCase());
  }).slice(0, 5);

  return {
    query: description,
    primary_recommendation: {
      component: primary.name,
      id: primaryId,
      rationale: primary.description,
      import: primary.import,
      tokens: primary.tokens || {},
      example: primary.example || null,
      governance: primary.governance || null,
    },
    alternatives: ranked.slice(1).map(([id, score]) => {
      const c = COMPONENTS[id];
      return c
        ? {
            component: c.name,
            id,
            score,
            rationale: c.description,
            when_to_choose: (c.whenToUse || [])[0] || "—",
          }
        : null;
    }).filter(Boolean),
    rules_that_apply: rulesMatched,
    anti_patterns: apMatched.map((ap) => `❌ ${ap.pattern} → ${ap.fix}`),
    blueprint_questions: [
      "What's the active/inactive state pattern? (e.g. bg-primary text-primary-foreground for active)",
      "Is dark mode required? Pair with tokens that have light/dark pairs (avoid raw zinc/lime).",
      "Where does this live in the page tree? (chrome, content, overlay)",
    ],
    next_steps: [
      `Call get_component('${primary.name}') for the full spec`,
      `Call get_component_code('${primary.name}') for the React/HTML/CSS snippet`,
      ...(rulesMatched.length ? [`Read the matched rules: ${rulesMatched.join(", ")}`] : []),
    ],
  };
}

// ─── ERROR REPORTING ──────────────────────────────────────────────────────────

function reportError(payload) {
  const proposalsPath = join(DS_ROOT, "REFINEMENT_PROPOSALS.md");
  const timestamp = new Date().toISOString();
  const entry = `
## ${timestamp}

**Component:** ${payload.component || "unknown"}
**Error:** ${payload.error}
**Project:** ${payload.project || "unknown"}
**Tier:** ${payload.tier || "unknown"}
${payload.context ? `**Context:** ${payload.context}` : ""}
${payload.suggestedFix ? `**Suggested Fix:** ${payload.suggestedFix}` : ""}

---
`;
  let existing = "";
  if (existsSync(proposalsPath)) {
    existing = readFileSync(proposalsPath, "utf-8");
  } else {
    existing = "# Refinement Proposals\n\nErrors reported via MCP `report_error` tool.\n\n";
  }
  writeFileSync(proposalsPath, existing + entry, "utf-8");
  return { success: true, file: "REFINEMENT_PROPOSALS.md", timestamp };
}

// ─── MCP SERVER ───────────────────────────────────────────────────────────────

const server = new Server(
  { name: "strata-ds", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_overview",
      description: "Full overview of the Strata Design System: stack, token architecture, 111 component catalogue, and governance tiers.",
      inputSchema: { type: "object", properties: {}, required: [] },
    },
    {
      name: "get_component",
      description: "Detailed spec for a DS component: import, props/variants, token table, when-to-use, anti-patterns, and code example.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Component name (e.g. Button, Badge, Card, Input, Alert, Dialog, Avatar, Table, NavbarFloating)" },
        },
        required: ["name"],
      },
    },
    {
      name: "get_component_code",
      description: "Detailed code examples for a component: React, HTML, CSS, and AI prompt. Returns 4 code blocks.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Component name (e.g. Button, Badge, Card, Input, Alert, Dialog, Avatar, Table)" },
        },
        required: ["name"],
      },
    },
    {
      name: "get_tokens",
      description: "CSS token reference by category.",
      inputSchema: {
        type: "object",
        properties: {
          category: { type: "string", enum: ["status", "semantic", "brand", "primitives", "foundations"], description: "Token category" },
        },
        required: ["category"],
      },
    },
    {
      name: "get_foundations",
      description: "Complete design foundations data: colors (palette + semantic), typography (scale + fonts), spacing (8px grid), borders (radius + width), and shadows (elevation).",
      inputSchema: {
        type: "object",
        properties: {
          section: { type: "string", enum: ["colors", "typography", "spacing", "borders", "shadows", "all"], description: "Foundations section to retrieve. Use 'all' for everything." },
        },
        required: ["section"],
      },
    },
    {
      name: "get_rules",
      description: "Governance rules by category.",
      inputSchema: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: ["color-tokens", "buttons", "containers", "dark-mode", "governance-tiers", "icons", "brand-colors", "typography"],
            description: "Rule category",
          },
        },
        required: ["category"],
      },
    },
    {
      name: "get_anti_patterns",
      description: "All documented anti-patterns to avoid — indexed by severity and category (17 patterns).",
      inputSchema: { type: "object", properties: {}, required: [] },
    },
    {
      name: "search_governance",
      description: "Full-text search across components, rules, tokens, foundations, and anti-patterns.",
      inputSchema: {
        type: "object",
        properties: {
          q: { type: "string", description: "Search query (e.g. 'green status color', 'button destructive', 'card glass', 'icon size')" },
        },
        required: ["q"],
      },
    },
    {
      name: "get_session_briefing",
      description:
        "MUST BE CALLED ONCE AT SESSION START. Returns the active Strata DS rules, available tools summary, and mandatory workflow for UI tasks. The response is meant to be loaded into the AI's context so it knows the DS is connected and how to behave. Calling this is the equivalent of reading a project's CLAUDE.md — it primes the AI with the rules it must follow for the rest of the session.",
      inputSchema: { type: "object", properties: {}, required: [] },
    },
    {
      name: "plan_ui",
      description:
        "🚨 MANDATORY for any UI task. MUST be called BEFORE writing any UI code (component, layout, navbar, form, table, modal, button, etc.). Given a free-text description, returns the recommended DS component, required tokens, applicable rules, anti-patterns to avoid, and starter snippet. Skipping this tool causes drift, rework, and DS-rule violations. If the user says anything like 'build / add / create / make / show / render / display [a UI thing]', you MUST call plan_ui first. Examples that trigger this: 'navbar with tabs', 'kanban board for orders', 'sortable data table', 'modal dialog with form', 'pricing section', 'sign-in screen'.",
      inputSchema: {
        type: "object",
        properties: {
          description: {
            type: "string",
            description:
              "Plain-language description of the UI element you need. Be concrete: 'floating pill navbar for product app with logo, tenant subtitle, tabs, bell, theme toggle, avatar' is better than 'navbar'.",
          },
        },
        required: ["description"],
      },
    },
    {
      name: "report_error",
      description: "Report a DS violation or missing variant for the learning system. Appends to REFINEMENT_PROPOSALS.md.",
      inputSchema: {
        type: "object",
        properties: {
          component: { type: "string", description: "Component name where the error occurred" },
          error: { type: "string", description: "Description of the error or violation" },
          project: { type: "string", description: "Project name (optional)" },
          tier: { type: "string", description: "Governance tier of the project (optional)" },
          context: { type: "string", description: "Additional context (optional)" },
          suggestedFix: { type: "string", description: "Suggested fix or new variant needed (optional)" },
        },
        required: ["error"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "get_overview":
      return { content: [{ type: "text", text: OVERVIEW }] };

    case "get_component": {
      const key = args.name.toLowerCase().replace(/\s+/g, "-");
      const comp = COMPONENTS[key];
      if (!comp) {
        return {
          content: [{
            type: "text",
            text: `Component "${args.name}" not found.\n\nAvailable with full specs: ${Object.keys(COMPONENTS).join(", ")}\n\nFor other components, check src/components/ directory or use search_governance.`,
          }],
        };
      }

      const sections = [
        `# ${comp.name}`,
        `\n${comp.description}`,
        `\n## Import\n\`\`\`tsx\n${comp.import}\n\`\`\``,
      ];

      if (comp.variants) {
        sections.push("\n## Variants (CVA)\n" + Object.entries(comp.variants)
          .map(([k, v]) => `- **${k}:** ${Array.isArray(v) ? v.join(", ") : v}`)
          .join("\n"));
      }
      if (comp.props) {
        sections.push("\n## Props\n" + comp.props.map(p => `- \`${p}\``).join("\n"));
      }
      if (comp.tokens) {
        sections.push("\n## Token Reference\n| Token | Use |\n|-------|-----|\n" +
          Object.entries(comp.tokens).map(([token, use]) => `| \`${token}\` | ${use} |`).join("\n"));
      }
      if (comp.whenToUse) {
        sections.push("\n## When to Use\n" + comp.whenToUse.map(w => `- ${w}`).join("\n"));
      }
      if (comp.antiPatterns) {
        sections.push("\n## Anti-Patterns\n" + comp.antiPatterns.join("\n"));
      }
      if (comp.example) {
        sections.push(`\n## Code Example\n\`\`\`tsx\n${comp.example}\n\`\`\``);
      }
      sections.push(`\n> Use \`get_component_code("${comp.name}")\` for full React/HTML/CSS/AI Prompt examples.`);

      return { content: [{ type: "text", text: sections.join("\n") }] };
    }

    case "get_component_code": {
      const key = args.name.toLowerCase().replace(/\s+/g, "-");
      const code = COMPONENT_CODE[key];
      if (!code) {
        const available = Object.keys(COMPONENT_CODE).join(", ");
        return {
          content: [{
            type: "text",
            text: `No code examples for "${args.name}" yet.\n\nAvailable: ${available}\n\nFor other components, check expert-hub or src/components/ directory.`,
          }],
        };
      }

      const text = [
        `# ${args.name} — Code Examples`,
        `\n## React\n\`\`\`tsx\n${code.react}\n\`\`\``,
        `\n## HTML\n\`\`\`html\n${code.html}\n\`\`\``,
        `\n## CSS\n\`\`\`css\n${code.css}\n\`\`\``,
        `\n## AI Prompt\n${code.aiPrompt}`,
      ].join("\n");

      return { content: [{ type: "text", text }] };
    }

    case "get_tokens": {
      const cat = args.category;
      const data = TOKENS[cat];
      if (!data) {
        return { content: [{ type: "text", text: `Unknown token category: ${cat}. Available: ${Object.keys(TOKENS).join(", ")}` }] };
      }

      let text = `# Tokens: ${cat}\n\n${data.description}\n\n`;
      if (data.tokens) {
        text += "| Token | Tailwind | Light | Dark | Use |\n|-------|---------|-------|------|-----|\n";
        text += data.tokens.map(t =>
          `| \`${t.name}\` | \`${t.tailwind}\` | ${t.light || "—"} | ${t.dark || "—"} | ${t.use} |`
        ).join("\n");
      }
      if (data.categories) {
        text += `\nPalettes available: ${data.categories.join(", ")}\n\n${data.note}`;
      }
      if (cat === "foundations") {
        text += `\n\nUse \`get_foundations("all")\` to see the complete foundations data.`;
      }

      return { content: [{ type: "text", text }] };
    }

    case "get_foundations": {
      const section = args.section;
      if (section === "all") {
        const text = Object.entries(FOUNDATIONS).map(([key, data]) => {
          return `# ${key.charAt(0).toUpperCase() + key.slice(1)}\n\n${data.description}\n\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``;
        }).join("\n\n---\n\n");
        return { content: [{ type: "text", text: `# Strata DS — Foundations\n\n${text}` }] };
      }

      const data = FOUNDATIONS[section];
      if (!data) {
        return { content: [{ type: "text", text: `Unknown foundations section: "${section}". Available: ${Object.keys(FOUNDATIONS).join(", ")}, all` }] };
      }

      return {
        content: [{
          type: "text",
          text: `# Foundations: ${section}\n\n${data.description}\n\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``,
        }],
      };
    }

    case "get_rules": {
      const cat = args.category;
      const rule = RULES[cat];
      if (!rule) {
        return { content: [{ type: "text", text: `Unknown rule: ${cat}. Available: ${Object.keys(RULES).join(", ")}` }] };
      }
      return { content: [{ type: "text", text: rule }] };
    }

    case "get_anti_patterns": {
      const text = ANTI_PATTERNS.map(ap => [
        `## ${ap.category} — ${ap.severity}`,
        `**Pattern:** ${ap.pattern}`,
        `**Examples:** ${ap.examples.join(", ")}`,
        `**Fix:** ${ap.fix}`,
      ].join("\n")).join("\n\n---\n\n");
      return { content: [{ type: "text", text: `# Anti-Patterns (${ANTI_PATTERNS.length} documented)\n\n${text}` }] };
    }

    case "search_governance": {
      const results = searchGovernance(args.q);
      if (results.length === 0) {
        return { content: [{ type: "text", text: `No results for "${args.q}". Try: get_overview, get_anti_patterns, get_rules("color-tokens")` }] };
      }
      const text = results.map(r =>
        `**[${r.type}] ${r.name}** (relevance: ${r.relevance})\n${r.snippet}`
      ).join("\n\n");
      return { content: [{ type: "text", text: `# Search: "${args.q}"\n\n${text}` }] };
    }

    case "get_session_briefing": {
      return { content: [{ type: "text", text: getSessionBriefing() }] };
    }

    case "plan_ui": {
      const plan = planUI(args.description);
      if (plan.error) {
        return { content: [{ type: "text", text: `${plan.error}\n${plan.suggestion || ""}` }] };
      }
      // Render as markdown so the agent can quote it directly
      const lines = [
        `# UI Blueprint for: "${plan.query}"`,
        "",
        `## ✅ Use: \`${plan.primary_recommendation.component}\``,
        "",
        plan.primary_recommendation.rationale,
        "",
        "```ts",
        plan.primary_recommendation.import,
        "```",
        "",
        "### Tokens",
        ...Object.entries(plan.primary_recommendation.tokens).map(
          ([t, use]) => `- \`${t}\` — ${use}`,
        ),
        "",
        ...(plan.primary_recommendation.example
          ? ["### Starter snippet", "```tsx", plan.primary_recommendation.example, "```", ""]
          : []),
        ...(plan.alternatives.length
          ? [
              "### Alternatives",
              ...plan.alternatives.map(
                (a) => `- **${a.component}** (score ${a.score}) — ${a.when_to_choose}`,
              ),
              "",
            ]
          : []),
        ...(plan.rules_that_apply.length
          ? [
              "### Rules that apply",
              ...plan.rules_that_apply.map((r) => `- \`get_rules('${r}')\``),
              "",
            ]
          : []),
        ...(plan.anti_patterns.length
          ? ["### Anti-patterns to avoid", ...plan.anti_patterns, ""]
          : []),
        "### Blueprint questions",
        ...plan.blueprint_questions.map((q) => `- ${q}`),
        "",
        "### Next steps",
        ...plan.next_steps.map((s) => `1. ${s}`),
      ];
      return { content: [{ type: "text", text: lines.join("\n") }] };
    }

    case "report_error": {
      const result = reportError(args);
      return {
        content: [{
          type: "text",
          text: `Error reported.\nFile: ${result.file}\nTimestamp: ${result.timestamp}\n\nThank you for contributing to DS improvement!`,
        }],
      };
    }

    default:
      return { content: [{ type: "text", text: `Unknown tool: ${name}` }] };
  }
});

// ─── HEALTH SERVER (port 3001) ────────────────────────────────────────────────
// Allows browser-based dev apps to check if the MCP server is running.

const HEALTH_PORT = 3001;

const healthServer = createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== "GET") {
    res.writeHead(405);
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  // Parse URL (no query string handling needed)
  const url = req.url || "/";

  // GET /health or /
  if (url === "/health" || url === "/") {
    const health = {
      status: "ok",
      name: "strata-ds",
      version: "1.0.0",
      tools: 11,
      components: Object.keys(COMPONENTS).length,
      foundations: Object.keys(FOUNDATIONS).length,
      rules: Object.keys(RULES).length,
      antiPatterns: ANTI_PATTERNS.length,
    };
    res.writeHead(200);
    res.end(JSON.stringify(health));
    return;
  }

  // GET /components — full component map (id → spec)
  if (url === "/components") {
    res.writeHead(200);
    res.end(JSON.stringify(COMPONENTS));
    return;
  }

  // GET /components/:id — single component spec
  const componentMatch = url.match(/^\/components\/([\w-]+)$/);
  if (componentMatch) {
    const id = componentMatch[1];
    const comp = COMPONENTS[id];
    if (!comp) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: `Component "${id}" not found`, available: Object.keys(COMPONENTS) }));
      return;
    }
    res.writeHead(200);
    res.end(JSON.stringify({ ...comp, id, code: COMPONENT_CODE[id] || null }));
    return;
  }

  // GET /foundations — full foundations data
  if (url === "/foundations") {
    res.writeHead(200);
    res.end(JSON.stringify(FOUNDATIONS));
    return;
  }

  // GET /foundations/:section
  const foundationMatch = url.match(/^\/foundations\/([\w-]+)$/);
  if (foundationMatch) {
    const section = foundationMatch[1];
    const data = FOUNDATIONS[section];
    if (!data) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: `Foundation "${section}" not found`, available: Object.keys(FOUNDATIONS) }));
      return;
    }
    res.writeHead(200);
    res.end(JSON.stringify({ section, ...data }));
    return;
  }

  // GET /rules — full rules map
  if (url === "/rules") {
    res.writeHead(200);
    res.end(JSON.stringify(RULES));
    return;
  }

  // GET /anti-patterns — full anti-patterns array
  if (url === "/anti-patterns") {
    res.writeHead(200);
    res.end(JSON.stringify(ANTI_PATTERNS));
    return;
  }

  // GET /session_briefing — preload DS rules into the AI context.
  if (url === "/session_briefing") {
    res.writeHead(200);
    res.end(JSON.stringify({ briefing: getSessionBriefing() }));
    return;
  }

  // GET /plan_ui?description=...  — UI Blueprint helper
  // Returns the structured plan object (not the markdown render). The dev
  // app + ds-architect agent both use this to pre-flight any UI work.
  const planMatch = url.match(/^\/plan_ui(?:\?description=(.+))?$/);
  if (planMatch) {
    const raw = planMatch[1] ? decodeURIComponent(planMatch[1]) : "";
    const plan = planUI(raw);
    res.writeHead(plan.error ? 400 : 200);
    res.end(JSON.stringify(plan));
    return;
  }

  // 404 with available routes
  res.writeHead(404);
  res.end(JSON.stringify({
    error: "Not found",
    available: [
      "GET /health",
      "GET /components",
      "GET /components/:id",
      "GET /foundations",
      "GET /foundations/:section",
      "GET /rules",
      "GET /anti-patterns",
      "GET /plan_ui?description=<text>",
      "GET /session_briefing",
    ],
  }));
});

healthServer.on("error", () => {
  // Port in use or other error — silently ignore so stdio transport still works
});

healthServer.listen(HEALTH_PORT, "127.0.0.1");

// ─── START ────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
