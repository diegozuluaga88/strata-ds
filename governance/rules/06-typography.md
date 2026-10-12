# Rule 06 — Typography

## Font families

The DS ships 3 font families. Each one has a specific role — do not swap them.

| Token | Family | CSS var | Usage |
|---|---|---|---|
| `font-brand` | **PP Monument Extended** | `--font-brand` | Brand headings, hero text, large numbers in KPIs |
| `font-sans` (default) | **Inter** + system-ui fallback | `--font-sans` | Body text, general UI, anything that is not a brand heading |
| `font-mono` | ui-monospace + SFMono + Menlo | `--font-mono` | Code, IDs, technical data, file paths |

Three. There is no fourth.

### `font-serif` is not a Strata family

A `--fontFamily-serif` variable exists in `variables.css`, and the Tailwind
`font-serif` utility reads it. **It is not part of this system.** It arrived in
the initial commit with the Tailwind and shadcn defaults, no component in the DS
has ever used it, and no rule has ever named it. **Having the variable is not
having a role.**

So `font-serif` is a deviation wherever it appears — not a narrow exception and
not a facsimile family. If a surface has to read as paper from somewhere else,
that is carried by weight, spacing, rules and layout, inside the three families
above.

```tsx
// ❌ Never. Not a dialog title, not a letterhead, not a quoted email.
<DialogTitle className="font-serif text-2xl font-semibold">Add Standard</DialogTitle>

// ✅ The same title, in the system
<DialogTitle className="text-2xl font-semibold">Add Standard</DialogTitle>
```

**Why this is written down.** The token shipped before any rule named it, so for
a while `font-serif` was a class that worked and that nothing checked. One app
inherited 17 serif titles across its cards, its record and every dialog — the
markup asked for it, the build obeyed, and QA reported it as a CSS bug. It was
not a bug. It was a family nobody had declared, doing work nobody had approved.

The variable itself stays: it is inherited scaffolding, and removing a shipped
custom property would break any consumer still reading it for no gain the rule
does not already give. The rule and the validator are the enforcement.
```tsx
// Brand heading
<h1 className="font-brand text-4xl text-foreground">Strata</h1>

// Body (default — no class needed)
<p className="text-foreground">Regular text.</p>

// Code / IDs
<code className="font-mono text-xs text-muted-foreground">ORD-23914</code>
```

**Rule:** Do not mix PP Monument in body text. It is designed for short headings and numbers — it loses legibility in long blocks.

---

## Size scale

| Token | Value | Typical use |
|---|---|---|
| `text-xs`   | 0.75rem  / 12px | Captions, badges, very small labels |
| `text-sm`   | 0.875rem / 14px | Secondary UI, card descriptions |
| `text-base` | 1rem     / 16px | Default body text |
| `text-lg`   | 1.125rem / 18px | Sub-headings, emphasized body |
| `text-xl`   | 1.25rem  / 20px | Heading h4 |
| `text-2xl`  | 1.5rem   / 24px | Heading h3 |
| `text-3xl`  | 1.875rem / 30px | Heading h2 |
| `text-4xl`  | 2.25rem  / 36px | Heading h1 |
| `text-5xl`  | 3rem     / 48px | Hero text (with `font-brand`) |
| `text-6xl`  | 3.75rem  / 60px | Large hero text (with `font-brand`) |
| `text-7xl`  | 4.5rem   / 72px | Display hero |
| `text-8xl`  | 6rem     / 96px | Marketing display |
| `text-9xl`  | 8rem     / 128px | Extreme marketing display |

**Rule:** For brand headings (with `font-brand`), prefer sizes from `text-3xl` and up.

---

## Weights

| Token | Value | Usage |
|---|---|---|
| `font-thin`       | 100 | (rare) |
| `font-extralight` | 200 | (rare) |
| `font-light`      | 300 | Subtle captions |
| `font-normal`     | 400 | Default body — **no class needed** |
| `font-medium`     | 500 | Light emphasis, labels, buttons |
| `font-semibold`   | 600 | Sub-headings, card headings |
| `font-bold`       | 700 | Headings h1-h3, strong emphasis |
| `font-extrabold`  | 800 | Display |
| `font-black`      | 900 | Extreme display |

**Rule:** Body always uses `font-normal` (default). To create hierarchy, use size + color + spacing before bold.

---

## Line-height

| Token | Value | Usage |
|---|---|---|
| `leading-none`    | 1     | Very large headings, display numbers |
| `leading-tight`   | 1.25  | Headings h1-h3 |
| `leading-snug`    | 1.375 | Headings h4-h6, multiline labels |
| `leading-normal`  | 1.5   | Default body |
| `leading-relaxed` | 1.625 | Long reading blocks |
| `leading-loose`   | 2     | Generous spacing (rare) |

---

## Letter-spacing

| Token | Value | Usage |
|---|---|---|
| `tracking-tighter` | -0.05em  | Very large PP Monument display |
| `tracking-tight`   | -0.025em | PP Monument headings |
| `tracking-normal`  | 0        | Default — **no class needed** |
| `tracking-wide`    | 0.025em  | Caption captions in caps |
| `tracking-wider`   | 0.05em   | Uppercase labels |
| `tracking-widest`  | 0.1em    | Decorative |

```tsx
// Uppercase label
<span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
  Status
</span>
```

---

## Canonical patterns

### Heading + description
```tsx
<header className="space-y-1">
  <h1 className="font-brand text-3xl text-foreground">Dashboard</h1>
  <p className="text-sm text-muted-foreground">Summary of the last week</p>
</header>
```

### KPI with large number
```tsx
<div className="space-y-1">
  <span className="text-xs uppercase tracking-wider text-muted-foreground">
    Orders this week
  </span>
  <div className="font-brand text-4xl tracking-tight text-foreground">128</div>
</div>
```

### Form label
```tsx
<label className="block text-sm font-medium text-foreground">
  Email
  <Input className="mt-1" />
</label>
```

### File path / inline code
```tsx
<code className="font-mono text-[10px] text-muted-foreground">
  src/components/button.tsx:42
</code>
```

---

## Anti-patterns

| ❌ Wrong | ✅ Right | Why |
|---|---|---|
| `font-bold` in body text | `font-medium` or `font-normal` | Bold creates visual noise in long blocks |
| `font-brand` inside `<p>` | `font-sans` or no class | PP Monument is display, not body |
| Inline hex for text color | `text-foreground` / `text-muted-foreground` | Automatic dark mode |
| Mixing `font-mono` with `font-brand` | One or the other | Character conflict |

---

## Source files

- Variables: `src/styles/tokens/variables.css` (lines with `--fontFamily-`, `--fontSize-`, `--fontWeight-`, `--lineHeight-`, `--letterSpacing-`)
- Theme mapping: `src/styles/theme.css`
