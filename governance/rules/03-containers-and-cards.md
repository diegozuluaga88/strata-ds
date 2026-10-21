# Rule 03 — Containers, Cards and Sections

## Background hierarchy

Each UI level has its assigned background. Do not swap them between levels.

```
Level 0 — Root layout
  bg-background (#EBECEE light / #02060C dark)
  
Level 1 — Panels, Cards, Modals
  bg-card (#fafafa light / #02060C dark)
  
Level 2 — Inner sections, Tables, Sub-panels
  bg-muted or bg-secondary (#fafafa light / #141E2C dark)
  
Special level — Sidebar
  bg-sidebar (see sidebar section below)
```

---

## Level 0 — Root layout and pages

```tsx
// Page background
<main className="bg-background min-h-screen">

// View / route background
<div className="bg-background p-6">
```

---

## Level 1 — Cards and Panels

```tsx
// Standard card
<div className="bg-card border border-border rounded-xl p-6">
  <h3 className="text-foreground font-semibold">Title</h3>
  <p className="text-muted-foreground text-sm">Description</p>
</div>

// Interactive card (hover state required)
<div className="bg-card border border-border rounded-xl p-6 
                hover:shadow-lg hover:border-primary/50 
                transition-all cursor-pointer">

// Modal / Dialog
<div className="bg-background border border-border rounded-2xl shadow-xl">

// Popover / Dropdown
<div className="bg-popover border border-border rounded-lg shadow-md">
```

---

## Level 2 — Inner sections

```tsx
// Sub-section inside a card
<div className="bg-muted rounded-lg p-4">

// Table row / list item
<div className="bg-muted/50 hover:bg-muted rounded-md px-4 py-3 transition-colors">

// Input / form section area
<div className="bg-secondary rounded-lg p-4 border border-border">

// Section header inside a panel
<div className="bg-muted px-6 py-3 border-b border-border">
  <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
    Section
  </span>
</div>
```

---

## Sidebar — Theme inversion

The sidebar ALWAYS uses inverted colors relative to the app mode. This is intentional design behavior.

```
App in Light → Dark sidebar (zinc-950)
App in Dark  → Light sidebar (white / zinc-50)
```

```tsx
// Dedicated sidebar tokens (do not use bg-background here)
<aside className="bg-sidebar text-sidebar-foreground border-r border-sidebar-border">

// Regular nav item
<NavItem className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">

// Active nav item
<NavItem className="bg-sidebar-primary/15 text-sidebar-primary border-l-2 border-sidebar-primary">

// Icon in sidebar
<Icon className="text-sidebar-foreground/70 group-hover:text-sidebar-foreground" />
```

Available sidebar tokens:
- `--color-sidebar` → main background
- `--color-sidebar-foreground` → main text
- `--color-sidebar-primary` → brand color for active items
- `--color-sidebar-accent` → hover background
- `--color-sidebar-accent-foreground` → text on hover
- `--color-sidebar-border` → divider border

---

## Status sections

When a card or section represents a specific state:

```tsx
// Success section
<div className="bg-status-success/5 border border-status-success/40 rounded-lg p-4">
  <div className="flex items-center gap-2">
    <CheckIcon className="text-status-success w-5 h-5" />
    <span className="text-status-success font-medium">Completed</span>
  </div>
  <p className="text-foreground text-sm mt-1">Result description</p>
</div>

// Warning section
<div className="bg-status-warning/5 border border-status-warning/40 rounded-lg p-4">
  <ExclamationIcon className="text-status-warning w-5 h-5" />
  <span className="text-status-warning font-medium">Warning</span>
</div>

// Error section
<div className="bg-destructive/5 border border-destructive/30 rounded-lg p-4">
  <XCircleIcon className="text-destructive w-5 h-5" />
  <span className="text-destructive font-medium">Error</span>
</div>

// Info section
<div className="bg-status-info/5 border border-status-info/40 rounded-lg p-4">
  <InfoIcon className="text-status-info w-5 h-5" />
  <span className="text-status-info font-medium">Information</span>
</div>

// AI section
<div className="bg-status-ai/10 border border-status-ai/30 rounded-lg p-4">
  <SparklesIcon className="text-status-ai w-5 h-5" />
  <span className="text-status-ai font-medium">AI suggestion</span>
</div>
```

---

## Elevation / Shadows

Shadows indicate elevation — use them consistently:

```tsx
// Level 0 — no shadow (integrated with the background)
className="bg-card border border-border"

// Level 1 — small shadow (cards)
className="bg-card border border-border shadow-sm"

// Level 2 — medium shadow (floating panels)
className="bg-card border border-border shadow-md"

// Level 3 — large shadow (modals, drawers)
className="bg-background border border-border shadow-xl"

// Card hover state (elevation on interaction)
className="... hover:shadow-lg hover:border-primary/50 transition-all"
```
