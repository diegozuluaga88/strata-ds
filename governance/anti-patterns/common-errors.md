# Anti-patterns — Documented Errors

These errors have been observed repeatedly across the projects. Each one has its correction.

---

## ERROR 01 — Hardcoded state colors

**Observed in:** UI-Dealer, Smart Comparator, MBI Builder

```tsx
// ❌ WRONG — using raw Tailwind classes for states
className="text-green-500 dark:text-green-400"
className="text-red-500"
className="bg-yellow-100 text-yellow-800"
className="text-blue-600"
```

```tsx
// ✅ CORRECT — semantic state tokens
className="text-status-success"
className="text-destructive"
className="bg-status-warning/10 text-status-warning"
className="text-status-info"
```

**Why it fails:** Raw colors (green-500, red-500) do not adapt to the theme system and may have inadequate contrast in dark mode. They are not synced with the DS tokens.

---

## ERROR 02 — Hardcoded container backgrounds

**Observed in:** all projects

```tsx
// ❌ WRONG
className="bg-white"              // Does not adapt to dark mode
className="bg-zinc-900"           // Not the correct token
className="bg-[#EBECEE]"          // Hardcoded hex
className="bg-gray-50"            // Raw Tailwind class
```

```tsx
// ✅ CORRECT
className="bg-background"         // Page background
className="bg-card"               // Cards and panels
className="bg-muted"              // Secondary sections
```

**Why it fails:** `bg-white` in dark mode becomes white on a dark background — completely broken. The `bg-background` token already handles both modes.

---

## ERROR 03 — Mixing legacy and new color systems

**Observed in:** all projects (inherited from migration)

```tsx
// ❌ WRONG — using the legacy namespace
className="text-primary"          // May resolve to #27272a (gray) instead of #E6F993 (lime)
                                   // depending on which CSS loaded first
```

**The problem:** `theme.css` has two systems:
- Legacy: `--primary: #27272a` (dark gray from shadcn)
- New: `--color-primary: #E6F993` (lime brand)

If you see a "primary" button that looks gray instead of lime, it is using the legacy namespace.

```tsx
// ✅ CORRECT — verify that theme.css maps correctly
// The --color-primary token must be the one used via Tailwind
// Check that vite/tailwind config uses @theme inline with --color-* prefix
```

**Action:** If a component shows unexpected colors, check in DevTools what value `--primary` vs `--color-primary` resolves to.

---

## ERROR 04 — brand-300 as text

**Observed in:** demos, new components in prototype flows

```tsx
// ❌ WRONG — lime as text color
className="text-brand-300"        // 1.8:1 contrast over white — FAILS WCAG
className="text-primary"          // same problem if the token is lime
```

```tsx
// ✅ CORRECT — lime only as background
className="bg-primary text-primary-foreground"  // lime background, dark text
className="bg-brand-300 text-zinc-900"          // explicit
```

---

## ERROR 05 — Dark mode with dark: classes instead of semantic tokens

**Observed in:** UI-Dealer src/components/, Smart Comparator

```tsx
// ❌ WRONG — manual per-component dark mode
className="text-zinc-900 dark:text-white"
className="bg-white dark:bg-zinc-800"
className="border-zinc-200 dark:border-zinc-700"
```

```tsx
// ✅ CORRECT — semantic token (already handles both modes)
className="text-foreground"
className="bg-background"
className="border-border"
```

**Why it fails:** Every component that uses manual `dark:` creates a fragile dependency that breaks when token values change. It also doubles the code to maintain.

---

## ERROR 06 — Missing hover state on interactive elements

**Observed in:** components in new flows, proof-of-concept

```tsx
// ❌ WRONG — clickable element with no visual feedback
<div className="bg-card border border-border rounded-xl p-6 cursor-pointer">

// ❌ WRONG — button without hover
<button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg">
```

```tsx
// ✅ CORRECT
<div className="bg-card border border-border rounded-xl p-6 cursor-pointer
                hover:shadow-lg hover:border-primary/50 transition-all">

<button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg
                   hover:bg-primary/90 transition-colors">
```

**Why it fails:** Without a hover state, the user does not know the element is interactive. It is a basic usability problem and it breaks the visual consistency of the DS.

---

## ERROR 07 — Using container opacity instead of color opacity utility

**Observed in:** several projects

```tsx
// ❌ WRONG — opacity on container affects ALL children including text
<div className="bg-primary opacity-10">
  <span className="text-foreground">This text also drops to 10% opacity</span>
</div>
```

```tsx
// ✅ CORRECT — opacity only on the background color
<div className="bg-primary/10">
  <span className="text-foreground">This text keeps normal opacity</span>
</div>
```

---

## ERROR 08 — Not using sidebar tokens for the sidebar

**Observed in:** DemoSidebar.tsx and variants

```tsx
// ❌ WRONG — hardcoding sidebar colors
className="bg-zinc-950 text-white"
className="bg-white text-zinc-900"
```

```tsx
// ✅ CORRECT — dedicated sidebar tokens
className="bg-sidebar text-sidebar-foreground"
// The sidebar-* tokens already handle theme inversion automatically
```

---

## ERROR 09 — Multiple primary CTAs in the same view

**Observed in:** demo flows with multiple actions

```tsx
// ❌ WRONG — three primary buttons competing for attention
<button className="bg-primary ...">Save</button>
<button className="bg-primary ...">Publish</button>
<button className="bg-primary ...">Export</button>
```

```tsx
// ✅ CORRECT — clear hierarchy
<button className="bg-primary text-primary-foreground ...">Save</button>      // Primary (1)
<button className="border border-input bg-background ...">Publish</button>    // Outline
<button className="text-muted-foreground hover:text-foreground ...">Export</button>  // Ghost
```

---

## ERROR 10 — Creating local CSS variables that duplicate DS tokens

**Observed in:** components in specific projects

```tsx
// ❌ WRONG — in the component CSS
.my-component {
  --accent-color: #E6F993;  /* duplicating --color-primary */
  --text-color: #02060C;    /* duplicating --color-foreground */
}
```

```tsx
// ✅ CORRECT — reference existing tokens
.my-component {
  color: var(--color-foreground);
  accent-color: var(--color-primary);
}
// Or simply use Tailwind: className="text-foreground"
```
