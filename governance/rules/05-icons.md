# Rule 05 — Icons

## Icon library

Strata DS uses **@heroicons/react** as the main library.

```tsx
import { PlusIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { SparklesIcon } from '@heroicons/react/24/solid'  // solid for emphasis
```

---

## Icon color by context

### Primary action icons (brand)
```tsx
// In CTA or featured-feature context
<SparklesIcon className="text-primary w-5 h-5" />
<PlusIcon className="text-primary w-5 h-5" />
```

### State icons
```tsx
// Success
<CheckCircleIcon className="text-status-success w-5 h-5" />

// Warning
<ExclamationTriangleIcon className="text-status-warning w-5 h-5" />

// Error / Destructive
<XCircleIcon className="text-destructive w-5 h-5" />

// Info
<InformationCircleIcon className="text-status-info w-5 h-5" />

// AI / Magic
<SparklesIcon className="text-status-ai w-5 h-5" />
```

### Secondary / neutral icons
```tsx
// Support, navigation, general UI icons
<ChevronRightIcon className="text-muted-foreground w-4 h-4" />
<MagnifyingGlassIcon className="text-muted-foreground w-5 h-5" />
<EllipsisHorizontalIcon className="text-muted-foreground w-5 h-5" />
```

### Hover icons
```tsx
// Icon that reacts to its container's hover (using group)
<div className="group hover:bg-accent rounded-md p-2 transition-colors">
  <CogIcon className="text-muted-foreground group-hover:text-foreground w-5 h-5 transition-colors" />
</div>

// Icon that turns brand on hover
<button className="group flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
  <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
  View more
</button>
```

---

## Sizes

| Context | Class | Pixels |
|---|---|---|
| Inline in text (sm) | `w-3 h-3` | 12px |
| Inline in text (base) | `w-4 h-4` | 16px |
| Buttons, inputs | `w-5 h-5` | 20px |
| Cards, sections | `w-6 h-6` | 24px |
| Illustration / empty state | `w-8 h-8` or `w-12 h-12` | 32-48px |

---

## Icon container

For icons that need a background:

```tsx
// Brand container (feature highlight)
<div className="bg-primary/15 rounded-lg p-2 w-fit">
  <SparklesIcon className="text-primary w-5 h-5" />
</div>

// Success container
<div className="bg-status-success/10 rounded-lg p-2 w-fit">
  <CheckCircleIcon className="text-status-success w-5 h-5" />
</div>

// Muted container (neutral)
<div className="bg-muted rounded-lg p-2 w-fit">
  <CogIcon className="text-muted-foreground w-5 h-5" />
</div>
```

---

## Rules

1. **Do not use emojis as icons** — always use heroicons
2. **Outline vs Solid** — outline for general UI, solid for emphasis states or active indicators
3. **aria-hidden on decorative icons** — `<Icon aria-hidden="true" />`
4. **aria-label on icon buttons** — `<button aria-label="Close"><XMarkIcon /></button>`
5. **Do not hardcode color hex** — always use semantic classes (`text-status-success`, `text-primary`, etc.)
6. **Size consistency within groups** — all icons in the same component must share the same size
