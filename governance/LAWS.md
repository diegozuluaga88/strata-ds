# Strata Design System — Absolute Laws

These rules are NEVER broken. They are the foundation of every component, flow, and variant.

---

## LAW 1 — Never hardcode hex values or raw colors

**FORBIDDEN:**
```tsx
className="bg-[#E6F993] text-[#02060C]"
className="text-green-500"
className="bg-zinc-900"
```

**CORRECT:**
```tsx
className="bg-primary text-primary-foreground"
className="text-status-success"
className="bg-background"
```

**Why:** Hardcoded hex breaks dark/light theming and does not propagate when tokens change. Raw Tailwind classes (green-500, zinc-900) ignore the semantic system.

---

## LAW 2 — brand-300 and brand-400 are NEVER text color on light backgrounds

**FORBIDDEN:**
```tsx
className="text-brand-300"           // contrast 1.8:1 — FAILS accessibility
className="text-primary"             // on body text over bg-white
```

**CORRECT — brand-300/400 only as:**
- CTA button background
- Border of active indicator
- Highlighted icon background (small area)
- Focus indicator (focus ring)

**Why:** brand-300 (#E6F993 lime) over white yields contrast 1.8:1. WCAG requires a minimum of 4.5:1 for text. Using it as text is inaccessible.

---

## LAW 3 — primary-foreground is always dark text (#02060C)

In both modes (light and dark), when the background is `bg-primary` (lime):

```tsx
// ALWAYS
className="bg-primary text-primary-foreground"
// primary-foreground = #02060C in light AND dark
```

**Never:**
```tsx
className="bg-brand-300 text-white"   // contrast fails on lime
className="bg-primary text-foreground" // use the correct variable
```

---

## LAW 4 — Semantic tokens before primitive tokens

Preference order:
1. `bg-primary` ✓ (semantic — adapts to mode)
2. `bg-brand-300` ✓ only if you need the specific shade by design
3. `bg-[#E6F993]` ✗ NEVER

For states:
1. `text-status-success` ✓
2. `text-green-600` ✗
3. `text-[#098400]` ✗

---

## LAW 5 — Dark mode via semantic tokens, not via dark: classes

**FORBIDDEN:**
```tsx
className="bg-white dark:bg-zinc-900"
className="text-zinc-900 dark:text-white"
```

**CORRECT:**
```tsx
className="bg-background"    // #EBECEE light / #02060C dark — automatic
className="text-foreground"  // #02060C light / #EBECEE dark — automatic
```

**Valid exception:** The sidebar uses explicit inversion. See `rules/03-containers-and-cards.md`.

---

## LAW 6 — Do not mix legacy and new color systems

The system has two historical namespaces. Only use the new one:

| Legacy (DO NOT use) | New (use) |
|---|---|
| `--primary` (#27272a) | `--color-primary` (#E6F993) |
| `--secondary` (#f4f4f5) | `--color-secondary` (#fafafa) |
| `--background` (#ffffff) | `--color-background` (#EBECEE) |

If you see classes producing unexpected colors (dark gray instead of lime), they are likely using the legacy namespace.

---

## LAW 7 — Every interactive element must have a hover state

```tsx
// Minimum required for any clickable element:
className="... hover:bg-primary/90 transition-colors"

// For cards:
className="... hover:shadow-lg hover:border-primary/50 transition-all"

// For text/icons:
className="... hover:text-primary transition-colors"
```

---

## Quick summary for AI agents

When generating code for Strata DS, before writing any className:
1. Is it a color? → Use a semantic token (`bg-background`, `text-foreground`, `text-status-success`)
2. Is it lime/brand? → Only as primary action background, never as text
3. Does it have dark mode? → If you use semantic tokens, it is already covered automatically
4. Is it interactive? → Add hover + transition
5. Unsure of the right token? → Check `tokens/token-reference.md`
