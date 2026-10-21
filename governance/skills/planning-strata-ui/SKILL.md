---
name: planning-strata-ui
description: Plan any Strata DS UI before writing code — consult laws/tokens/rules, choose components, lint the output.
allowed-tools:
  - Read
  - Glob
  - Grep
  - WebFetch
---

# Planning Strata UI

Use this skill **before** generating any TSX / JSX for Strata Design System UI. The Strata DS has strict governance: hardcoded colors, raw HTML, and undocumented patterns cause downstream rejections in code review. Following this skill makes the first iteration the right iteration.

## When to use

- Adding any new component or page that consumes Strata.
- Refactoring existing UI to align with the DS.
- Sanity-check before committing AI-generated UI.

## The five steps

### 1. Read the laws

Always call `get_laws()` first. There are 7 absolute laws — break one and the DS cannot help you. Most-common pitfalls: hex hardcoding, brand-300 as text, `dark:` cascades.

### 2. Decide the layout

For modals and dense pages, call `get_rules({category: 'modal-patterns'})` and `get_rules({category: 'layout-density'})`. The Strata-canonical pattern for dense decision modals is documented as an ASCII mockup; honor it.

### 3. Pick components, not raw HTML

Call `list_components()` and `get_component({id})` to find the right primitive. Use the DS `<Button>` over `<button>`, the DS `<Field>` over raw label/input, the DS `<Heading>` over `<h1>`. Then call `get_rules({category: 'code-usage'})` to confirm import paths.

### 4. Use semantic tokens for color

Never inline hex. Call `get_tokens()` for the full table. Surface = `bg-card` or `bg-muted`, body text = `text-foreground`, helper = `text-muted-foreground`, states = `text-status-success / text-status-warning / text-destructive / text-status-info`. Brand = CTA / focus ring / accent ONLY.

### 5. Lint before committing

Call `validate_component_against_rules({code: yourTSX})`. The validator returns per-violation rule references + line numbers + suggested fixes. Iterate until the report shows 0 errors.

## Quick recipes

- **A confirmation dialog**: `get_rules({category: 'modal-patterns'})` → use `Dialog` + `DialogTrigger` + `DialogContent` + `DialogFooter`. Footer: outline `Cancel` left, primary or destructive CTA right.
- **A data list**: `get_rules({category: 'data-display'})` → `<StrataTopBar>` + `<DataListToolbar>` + `<DataListTable>` or `<DataListCardGrid>` + `<BulkActionBar hideWhenEmpty>`.
- **A form**: `get_rules({category: 'code-usage'})` Rule 6 → `<Field>` + `<FieldLabel>` + `<Input>` + `<FieldDescription>` + `<FieldError>`. For RHF, wrap in `<Form>` + `<FormField>` + `<FormControl>`.
- **An empty state**: `get_rules({category: 'empty-states'})` → icon + 2-3 word headline + 1-sentence reason + CTA. Never just "No data".
- **A loading state**: `get_rules({category: 'loading-states'})` → measure expected duration. <200ms = nothing, <1s = button loading, <3s = skeleton, >3s = progress + cancel.

## Anti-patterns to flag immediately

- `bg-white` / `bg-zinc-*` / `text-gray-500` → semantic tokens
- `<button onClick>` with manual border classes → `<Button>`
- `<a href>` with manual text-primary classes → `<Link>`
- Custom modal with `fixed inset-0 bg-black/50` → `<Dialog>`
- `dark:bg-zinc-900` cascades → drop the `dark:`, tokens adapt
- Icon-only buttons without `aria-label` → add it
- Bare button labels like `Save` / `Reject` → verb + object

## When in doubt

Call `get_overview()` for a map of every rule category and a session briefing. Then drill into specific rules with `get_rules({category})`.
