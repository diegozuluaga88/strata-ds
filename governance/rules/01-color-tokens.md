# Rule 01 — Color Tokens Usage

## Layer system

The DS has 3 layers of tokens. Always use the most semantic one available.

```
Layer 3 — Semantic (PREFERRED)
  bg-primary, text-foreground, bg-card, text-muted-foreground

Layer 2 — Brand primitive (only when the design requires a specific shade)
  bg-brand-300, bg-brand-400, text-brand-600

Layer 1 — Neutral primitive (only for internal construction of DS components)
  bg-zinc-950, text-zinc-400
```

---

## Available semantic tokens

### Surface backgrounds
| Token | Light | Dark | Use for |
|---|---|---|---|
| `bg-background` | #EBECEE | #02060C | Page background, root layout |
| `bg-card` | #fafafa | #0B0F1A | Cards, panels, elevated containers |
| `bg-muted` | #F4F4F5 | #141E2C | Secondary sections, tables |
| `bg-secondary` | #F4F4F5 | #141E2C | Alternative backgrounds |
| `bg-accent` | #E8EAEC | #1E2A3A | Hover state backgrounds — **hover only**, see below |
| `bg-popover` | #f4f4f0 | #0F1320 | Dropdowns, tooltips, popovers |

### Text colors
| Token | Light | Dark | Use for |
|---|---|---|---|
| `text-foreground` | #02060C | #EBECEE | Primary text |
| `text-muted-foreground` | #616A76 | #B4BBC2 | Secondary text, placeholders |
| `text-card-foreground` | #02060C | #EBECEE | Text inside cards |
| `text-primary-foreground` | #02060C | #02060C | Text over primary (lime) background |

### Primary action colors
| Token | Light | Dark | Use for |
|---|---|---|---|
| `bg-primary` | #E6F993 | #C3E433 | Main CTA button |
| `text-primary` | #E6F993 | #C3E433 | Highlighted icons, active links |

> **`bg-accent` is for hover, not for "this one is selected".** It sits one step from the page background, so a control that marks its selected state with it is marking nothing: measured on a real screen, the selected option contrasted **1.02:1** with the one beside it. `Toggle` did exactly this until Oct 2026. The selected state belongs to `bg-primary` plus a cue that is not colour — see [`rules/15-accessibility-focus.md`](./15-accessibility-focus.md).

### Borders and inputs
| Token | Light | Dark | Use for |
|---|---|---|---|
| `border-border` | #D0D4D8 | #141E2C | General borders |
| `border-input` | #546070 | #959DA7 | Input borders |
| `bg-input-background` | #F4F4F5 | #141E2C | Input fill — **no `bg-input`**, que resuelve al color del borde |
| `ring-ring` | #141E2C | #B4BBC2 | Focus ring |

### Semantic states

**Llevan prefijo `status-`.** `bg-success` y `text-success` no existen: no hay
`--color-success`, así que esas clases no resuelven nada y el elemento se queda
sin color. Esta tabla las nombraba durante meses.

| Token | Light | Dark | Use for |
|---|---|---|---|
| `text-status-success` / `bg-status-success` | #16a34a | #4ade80 | Confirmations, success |
| `text-status-warning` / `bg-status-warning` | #b45309 | #fbbf24 | Warnings |
| `text-status-error` / `bg-status-error` | #C11736 | #ED5F74 | Error states |
| `text-status-info` / `bg-status-info` | #2563eb | #60a5fa | Information, help |
| `text-status-ai` / `bg-status-ai` | #8b5cf6 | #a78bfa | AI indicators |

### La acción destructiva

| Token | Light | Dark | Use for |
|---|---|---|---|
| `text-destructive` / `bg-destructive` | #C11736 | #ED5F74 | Destructive actions |
| `text-destructive-foreground` | #ffffff | #000000 | Texto sobre un relleno destructivo |

`destructive` y `status-error` tienen **el mismo valor y siguen siendo dos**
tokens, a propósito: uno es una **intención** —esta acción destruye— y el otro un
**estado** —esto está mal—. Hoy coinciden porque el rojo correcto es el mismo;
mañana pueden separarse sin tocar los componentes. Aliasarlos ahorraría una línea
y escondería la decisión.

> **`destructive-foreground` cambia por modo**, que es lo que nadie espera de un
> token de texto. No es un descuido: es lo que permite que un solo token cumpla en
> los dos. Un rojo lo bastante oscuro para llevar blanco encima es demasiado oscuro
> para leerse como texto sobre fondo oscuro. Si cambias el relleno, el `foreground`
> se mueve con él.

---

## Opacity pattern for soft states

For subtle state backgrounds, use opacity utilities:

```tsx
// Subtle success state
className="bg-success/5 border border-success/40 text-success"

// Subtle warning state
className="bg-warning/5 border border-warning/40 text-warning"

// Subtle error state
className="bg-destructive/10 border border-destructive/30 text-destructive"

// Subtle info state
className="bg-info/5 border border-info/40 text-info"

// Subtle AI state
className="bg-ai/10 text-ai"
```

---

## Charts rule

For charts use the chart tokens, not arbitrary colors:

```tsx
// Correct
stroke="var(--color-chart-1)"   // indigo
fill="var(--color-chart-2)"     // green

// The 5 available chart tokens:
// --color-chart-1: #6366f1 (indigo)
// --color-chart-2: #22c55e (green)
// --color-chart-3: #E52D49 (red)
// --color-chart-4: #f59e0b (amber)
// --color-chart-5: #818cf8 (light indigo)
```

---

## State light variants (subtle background)

For notification, banner, or subtle badge backgrounds, pre-calculated `*-light` variants exist. Use them instead of `bg-success/10` when the design needs a specific pastel tone.

| Token | Tailwind | Light value | Usage |
|---|---|---|---|
| `--color-success-light` | `bg-success-light` | #e5f9e4 | Background of success banners, subtle badges |
| `--color-warning-light` | `bg-warning-light` | #fff5cd | Subtle warning background |
| `--color-info-light` | `bg-info-light` | #ecf4ff | Informational message background |
| `--color-error-light` | `bg-error-light` | #ffe4e7 | Subtle error background (alternative to destructive) |
| `--color-ai-light` | `bg-ai-light` | #ede9fe | Subtle AI suggestion background |

```tsx
// Subtle success banner
<div className="bg-success-light border border-success/30 rounded-lg p-3">
  <p className="text-success font-medium">Order finalized</p>
</div>

// AI tag
<span className="bg-ai-light text-ai rounded-md px-2 py-0.5 text-xs">
  AI suggestion
</span>
```

**Rule:** For subtle backgrounds, prefer `*-light` over `*-token/10` when the result must be a solid pastel color. The `/N` syntax gives more control for overlays on any surface, but `-light` guarantees the same color regardless of background.

---

## Surface hierarchy

Each level has its assigned background. Do not swap them — see `governance/rules/03-containers-and-cards.md` for full detail.

```
Level 0 — Root layout         → bg-background  (#EBECEE light / #02060C dark)
Level 1 — Cards and Panels    → bg-card        (#fafafa light / #02060C dark)
Level 2 — Sub-sections        → bg-muted       (#fafafa light / #141E2C dark)
Sidebar — Inversion           → bg-sidebar     (zinc-950 light / white dark)
```

For elevation (shadows) see `governance/rules/07-elevation.md`. For typography see `governance/rules/06-typography.md`.
