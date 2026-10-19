# Strata DS — Accessibility and Focus Management

Accessibility is not a checkbox at the end of a project — it is a design principle that shapes every component decision. Strata's components ship a11y wiring (focus rings, ARIA attributes, keyboard handlers) but the application code must use them correctly. This rule covers the application-level rules that complement the component-level a11y.

This rule extends [`rules/01-color-tokens.md`](./01-color-tokens.md) (color contrast), [`rules/04-buttons-and-actions.md`](./04-buttons-and-actions.md) (interactive elements), and [`rules/05-icons.md`](./05-icons.md) (aria-hidden / aria-label).

---

## Focus management

### Visible focus on every interactive element

Every focusable element (button, link, input, card-as-button) must show a clear focus ring. Strata components do this automatically — never disable it.

```tsx
// ✅ Do — keep the focus ring that Strata ships
<Button>Save</Button>

// ❌ Don't — strip the outline globally
<Button className="outline-none">Save</Button>

// ❌ Don't — restore an invisible outline
<Button style={{ outline: '0px' }}>Save</Button>
```

### Use focus-visible, not focus

Focus rings should appear on keyboard focus, not on mouse click. Strata buttons use `focus-visible:ring-2` so the ring shows on Tab/keyboard but not on a click.

```tsx
// ✅ Do — Strata default
<button className="focus-visible:ring-2 focus-visible:ring-primary/40">
  ...
</button>

// ❌ Don't — focus ring on every mouse click (visually noisy)
<button className="focus:ring-2 focus:ring-primary/40">
  ...
</button>
```

### Restore focus after closing overlays

After a modal, popover, or sheet closes, focus must return to the element that opened it. Radix-based DS components (Dialog, Sheet, Popover) do this automatically — do not override.

```tsx
// ✅ Do — Radix Dialog manages focus restoration
<Dialog>
  <DialogTrigger asChild><Button>Open</Button></DialogTrigger>
  <DialogContent>...</DialogContent>
</Dialog>

// ❌ Don't — custom modal without focus restoration
{open && (
  <div className="fixed inset-0">{modalContent}</div>
)}
```

---

## Keyboard navigation

### Tab order matches visual order

Tab order must follow the natural reading order of the page (top-to-bottom, left-to-right). Avoid `tabIndex` overrides unless you have a specific accessibility reason.

```tsx
// ✅ Do — natural source order
<Form>
  <Input name="first" />
  <Input name="last" />
  <Input name="email" />
  <Button>Submit</Button>
</Form>

// ❌ Don't — tabIndex acrobatics
<Form>
  <Input tabIndex={3} />
  <Input tabIndex={1} />
  <Input tabIndex={2} />
</Form>
```

### Standard shortcuts

| Key | Action |
|---|---|
| `Tab` | Move focus forward |
| `Shift+Tab` | Move focus back |
| `Enter` | Activate primary button / submit form |
| `Space` | Toggle checkbox / activate button |
| `Esc` | Close modal / cancel inline edit |
| `Arrow keys` | Navigate within menus, radio groups, tabs |
| `Cmd/Ctrl+K` | Open command palette (where present) |

Component primitives (Radix Menu, Tabs, RadioGroup) wire these up. Use them instead of rolling custom keyboard handlers.

### Skip-to-content link

Pages with persistent navigation chrome (sidebar, top nav) must offer a "Skip to main content" link as the first focusable element.

```tsx
// ✅ Do
<a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-card border border-border px-3 py-2 rounded-md">
  Skip to main content
</a>
<Sidebar />
<main id="main">...</main>
```

---

## ARIA usage

### Icon-only buttons need aria-label

```tsx
// ✅ Do
<Button size="icon" aria-label="Delete row">
  <Trash className="size-4" />
</Button>

// ❌ Don't
<Button size="icon">
  <Trash className="size-4" />
</Button>
```

### Icons that decorate labeled buttons are aria-hidden

```tsx
// ✅ Do — the label says "Export", the icon is decorative
<Button>
  <Download className="size-4" aria-hidden="true" />
  Export
</Button>

// ❌ Don't — duplicate announcement ("Download Export")
<Button>
  <Download className="size-4" />
  Export
</Button>
```

### Form labels

Every input has an associated label. The DS `Field` compound does this automatically; for raw HTML, use `htmlFor` + `id`.

```tsx
// ✅ Do — DS pattern
<Field>
  <FieldLabel>Email</FieldLabel>
  <Input type="email" />
</Field>

// ✅ Acceptable — raw HTML with proper association
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// ❌ Don't — placeholder as the only label
<input type="email" placeholder="Email" />
```

### Live regions for async updates

When content updates without user action (toast appears, new notification arrives), use a `aria-live` region so screen readers announce it.

```tsx
// ✅ Do
<Toaster />   {/* Strata Sonner wires aria-live automatically */}

// ❌ Don't — silent visual update
<div className="fixed bottom-4 right-4">{toastMessage}</div>
```

---

## Color contrast

Color alone is never the only carrier of information.

```tsx
// ✅ Do — color + icon + text
<StatusBadge status="completed">
  <Check className="size-3" aria-hidden="true" />
  Reviewed
</StatusBadge>

// ❌ Don't — color is the only signal
<div className="w-3 h-3 rounded-full bg-success" />   {/* no text, no aria */}
```

### Minimum contrast ratios

| Surface | Minimum |
|---|---|
| Body text on `bg-background` / `bg-card` | 4.5:1 (WCAG AA) |
| Large text (18pt+ or 14pt+ bold) | 3:1 |
| Icon stroke on background | 3:1 |
| Border that conveys structure | 3:1 |
| **The selected state of a control** | **3:1 — or a cue that is not colour** |
| **A filled destructive button, as a shape** | **3:1 against the surface behind it** |

Most Strata semantic tokens pass these ratios in both themes. **The selected state is the exception, and it is worth knowing why.**

### The selected state needs more than the brand colour

Marking "this one is chosen" with `bg-primary` alone does not meet 1.4.11 in the light theme: the brand lime (`brand-300`, `#E6F993`) contrasts **1.03:1** with the page background. It reads by hue, not by lightness, so for anyone who cannot separate those hues — or on a washed-out screen — there is nothing to see. The first step of the ramp that crosses 3:1 in light is `brand-700` (3.29:1), which is olive and no longer looks like the lime on the buttons, so raising the tone is not the answer.

The answer is to keep the lime and add a cue that is not colour. `Toggle`, `FilterPills` and `Tabs` all do this:


```tsx
// ✅ Do — colour, plus weight, plus an outline
data-[state=on]:bg-primary data-[state=on]:text-primary-foreground
data-[state=on]:font-semibold
data-[state=on]:outline-1 data-[state=on]:[outline-style:solid]
data-[state=on]:outline-primary-foreground

// ❌ Don't — the brand colour on its own
data-[state=on]:bg-primary data-[state=on]:text-primary-foreground
```

Three things that are easy to get wrong here:

- **Use `outline`, not `ring`.** Tailwind shares one variable between the state ring and the focus ring. With a ring, the selected state wins and the focus indicator takes its colour — measured in the dark theme, that gave a focus ring of **1.00:1**, black on black. `outline` does not share the variable, and it does not take up space either.
- **Tie the outline colour to the pill's text**, not to `foreground`. With `foreground` it shows in light and vanishes in dark, because there it is nearly white and the lime pill is light too.
- **The weight changes the label width.** Measured: 0.2&nbsp;px where the buttons already share a width, 1.6&nbsp;px where the label sets it. In a segmented control that makes the neighbours shift; reserve the width of the semibold label if it shows.

Never override any of this with arbitrary colors.

---

## Motion and prefers-reduced-motion

Respect the user's motion preference. Transitions and animations must be disabled or reduced when `prefers-reduced-motion: reduce` is set.

```tsx
// ✅ Do — Tailwind v3+ honors prefers-reduced-motion in `motion-safe:` and `motion-reduce:`
<div className="motion-safe:transition-all motion-safe:hover:-translate-y-px">
  ...
</div>
```

---

## Forms

### Required fields are marked visually AND announced

```tsx
// ✅ Do — asterisk + aria-required
<Field>
  <FieldLabel>
    Email <span className="text-destructive" aria-hidden="true">*</span>
  </FieldLabel>
  <Input type="email" aria-required="true" />
</Field>

// ❌ Don't — visual only
<FieldLabel>Email *</FieldLabel>
<Input type="email" />
```

### Error association

Field errors must be associated with the input via `aria-describedby`.

```tsx
// ✅ Do — DS Field compound handles this
<Field>
  <FieldLabel>Email</FieldLabel>
  <Input />
  <FieldError>Email must include a domain.</FieldError>
</Field>

// ❌ Don't — error message orphaned from the input
<label>Email</label>
<input />
<p className="text-destructive">Email must include a domain.</p>
```

---

## Anti-patterns

| ❌ | ✅ |
|---|---|
| `outline:none` on focused buttons | Keep Strata's `focus-visible:ring-2` |
| Icon-only button without `aria-label` | Always include `aria-label` |
| `<div onClick>` as a button | `<button>` or DS `<Button>` |
| Placeholder as the only label | Real `<label>` (or DS `<FieldLabel>`) |
| Color-only status (red dot, no text) | Icon + text + color |
| Custom modal without focus trap | Use Radix `<Dialog>` |
| Tab order overridden with `tabIndex` | Match source to visual order |

---

## Source files

- `governance/rules/01-color-tokens.md` — contrast ratios
- `governance/rules/05-icons.md` — icon aria-hidden vs aria-label
- `Strata Design System/strata-ds/src/components/overlays/dialog.tsx` — Radix focus trap
- `Strata Design System/strata-ds/src/components/forms/field.tsx` — Field compound

---

## El par destructivo tiene que moverse junto

Un token de relleno y su `foreground` son una pareja, y el destructivo es el caso
donde eso deja de ser teoría: **un rojo lo bastante oscuro para llevar texto blanco
encima es demasiado oscuro para leerse como texto sobre un fondo oscuro.** Un solo
token no puede servir para las dos cosas si su `foreground` no cambia por modo.

Hasta octubre de 2026 no lo hacía, y el resultado medido en la galería era **14 de
19 cruces por debajo del mínimo**:

| | antes | ahora | mínimo |
|---|---|---|---|
| claro · texto sobre el relleno | 4,37:1 | **6,10:1** | 4,5:1 |
| claro · el relleno como forma | 4,19:1 | **5,84:1** | 3:1 |
| claro · el hover `/90` con su texto | 3,92:1 | **5,36:1** | 4,5:1 |
| claro · como texto, sobre la página | 3,70:1 | **5,16:1** | 4,5:1 |
| claro · el tinte `/10` de menú con su texto | 3,61:1 | **4,90:1** | 4,5:1 |
| oscuro · texto sobre el relleno | 16,95:1 | 6,49:1 | 4,5:1 |
| oscuro · el relleno como forma | **1,06:1** | **5,91:1** | 3:1 |
| oscuro · como texto | **1,12:1** | **6,28:1** | 4,5:1 |
| oscuro · el borde de campo inválido | **1,06:1** | **5,91:1** | 3:1 |

Lo que estaba roto **no era el botón**. En oscuro el token era `red.900` (#340209),
elegido como fondo para texto blanco y nunca como color visible: el mensaje de error
de un formulario, el borde de un campo inválido, el punto de error de una celda y los
items destructivos de menú eran ilegibles. Y en claro casi todo fallaba por poco,
incluido el hover, que nadie había medido.

Peor que ilegible: en oscuro el botón destructivo pesaba **menos** que el `secondary`
de al lado. La jerarquía quedaba invertida — la acción peligrosa parecía la más
callada de la fila.

### Lo que no hay que volver a hacer

- **Subir sólo el relleno.** Si `destructive` se aclara y `destructive-foreground` se
  queda en blanco, el texto deja de cumplir. Se mueven los dos o ninguno.
- **Elegir el rojo por lo bonito que queda en claro.** El valor tiene que pasar los
  dos modos y las seis formas de uso: relleno, forma, hover, texto sobre página,
  texto sobre tarjeta y tinte de menú.
- **Aliasar `destructive` a `status-error`.** Tienen el mismo valor y siguen siendo
  dos tokens a propósito: uno es una intención, el otro un estado.

> Si tocas este par, mídelo. La batería de contraste del demo de UW Health ya sabe
> entrar en los diálogos, que es donde vive el botón; la galería del sistema todavía
> no la mide nadie.
