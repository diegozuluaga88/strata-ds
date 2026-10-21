# Token Reference — Strata Design System

Quick reference of all available tokens. Source: `src/styles/tokens/variables.css` + `variables-dark.css`

---

## Semantic surface colors

| CSS token | Tailwind class | Light | Dark | Usage |
|---|---|---|---|---|
| `--color-background` | `bg-background` | #EBECEE | #02060C | Page background |
| `--color-foreground` | `text-foreground` | #02060C | #EBECEE | Primary text |
| `--color-card` | `bg-card` | #fafafa | #02060C | Cards and panels |
| `--color-card-foreground` | `text-card-foreground` | #02060C | #EBECEE | Text inside cards |
| `--color-popover` | `bg-popover` | #fafafa | #02060C | Dropdowns, tooltips |
| `--color-popover-foreground` | `text-popover-foreground` | #02060C | #EBECEE | Text inside popovers |
| `--color-muted` | `bg-muted` | #fafafa | #141E2C | Secondary sections |
| `--color-muted-foreground` | `text-muted-foreground` | #959DA7 | #959DA7 | Secondary text |
| `--color-secondary` | `bg-secondary` | #fafafa | #141E2C | Alternative backgrounds |
| `--color-secondary-foreground` | `text-secondary-foreground` | #02060C | #EBECEE | Text over secondary |
| `--color-accent` | `bg-accent` | #fafafa | #141E2C | Hover backgrounds |
| `--color-accent-foreground` | `text-accent-foreground` | #02060C | #EBECEE | Text on hover |

---

## Primary action colors (Brand)

| CSS token | Tailwind class | Light | Dark | Usage |
|---|---|---|---|---|
| `--color-primary` | `bg-primary` / `text-primary` | #E6F993 | #C3E433 | CTA, active items |
| `--color-primary-foreground` | `text-primary-foreground` | #02060C | #02060C | Text over primary |

---

## Borders and inputs

| CSS token | Tailwind class | Light | Dark | Usage |
|---|---|---|---|---|
| `--color-border` | `border-border` | #D0D4D8 | #141E2C | General borders |
| `--color-input` | `border-input` | #D0D4D8 | #141E2C | Input borders |
| `--color-input-background` | `bg-input` | #fafafa | — | Input background |
| `--color-ring` | `ring-ring` | #959DA7 | — | Focus ring |

---

## State colors

| CSS token | Tailwind class | Value | Usage |
|---|---|---|---|
| `--color-destructive` | `bg-destructive` / `text-destructive` | #E52D49 | Errors, destructive |
| `--color-destructive-foreground` | `text-destructive-foreground` | #ffffff | Text over destructive |
| `--color-success` | `text-status-success` / `bg-status-success` | #098400 | Success, confirmation |
| `--color-success-light` | `bg-status-success-soft` | #e5f9e4 | Subtle success background |
| `--color-warning` | `text-status-warning` / `bg-status-warning` | #b27d00 | Warnings |
| `--color-warning-light` | `bg-status-warning-soft` | #fff5cd | Subtle warning background |
| `--color-info` | `text-status-info` / `bg-status-info` | #2164d1 | Information |
| `--color-info-light` | `bg-status-info-soft` | #ecf4ff | Subtle info background |
| `--color-error` | `text-status-error` / `bg-status-error` | #d20322 | Error (alternative) |
| `--color-error-light` | `bg-status-error-soft` | #ffe4e7 | Subtle error background |
| `--color-ai` | `text-status-ai` / `bg-status-ai` | #8b5cf6 | AI indicators |
| `--color-ai-light` | `bg-status-ai-soft` | #ede9fe | Subtle AI background |

---

## Sidebar tokens

| CSS token | Tailwind class | Usage |
|---|---|---|
| `--color-sidebar` | `bg-sidebar` | Sidebar background |
| `--color-sidebar-foreground` | `text-sidebar-foreground` | Sidebar main text |
| `--color-sidebar-primary` | `text-sidebar-primary` | Active brand in sidebar |
| `--color-sidebar-accent` | `bg-sidebar-accent` | Sidebar hover background |
| `--color-sidebar-accent-foreground` | `text-sidebar-accent-foreground` | Text on sidebar hover |
| `--color-sidebar-border` | `border-sidebar-border` | Sidebar divider border |

---

## Brand scale (primitives)

Only use when the semantic token is not enough.

| Token | Value |
|---|---|
| `--color-brand-50` | #fdfee7 |
| `--color-brand-100` | #f9fdc3 |
| `--color-brand-200` | #f4fb89 |
| `--color-brand-300` | #E6F993 ← primary light |
| `--color-brand-400` | #C3E433 ← primary dark |
| `--color-brand-500` | #a3c414 |
| `--color-brand-600` | #A0C114 |
| `--color-brand-700` | #7a9410 |
| `--color-brand-800` | #5c6f0f |
| `--color-brand-900` | #4a5810 |
| `--color-brand-950` | #233502 |

---

## Chart tokens

| Token | Value | Color |
|---|---|---|
| `--color-chart-1` | #6366f1 | Indigo |
| `--color-chart-2` | #22c55e | Green |
| `--color-chart-3` | #E52D49 | Red |
| `--color-chart-4` | #f59e0b | Amber |
| `--color-chart-5` | #818cf8 | Light Indigo |

---

## Typography

| Token | Value | Usage |
|---|---|---|
| `--font-brand` | 'PP Monument Extended' | Brand headings, hero text |
| `--font-sans` | Inter, system-ui | Body text (default) |
| `--font-mono` | ui-monospace, SFMono | Code, technical data |

---

## Source files

- `Strata Design System/strata-ds/src/styles/tokens/variables.css` → light mode tokens
- `Strata Design System/strata-ds/src/styles/tokens/variables-dark.css` → dark mode tokens
- `Strata Design System/strata-ds/src/styles/theme.css` → mapping to Tailwind v4
