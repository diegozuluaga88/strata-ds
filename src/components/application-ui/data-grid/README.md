# DataGrid

Vendored from [doktorigi/Fancy-UI-Grid](https://github.com/doktorigi/Fancy-UI-Grid) (MIT).
See `LICENSE` in this folder for the upstream notice, which must be kept.

- **Upstream commit:** `d7a80f6e3ddbeec3f4e4f67f355132d0a69e257e`
- **Vendored on:** 2026-08-18
- **Why:** evaluated against an in-house TanStack-based grid and chosen by the operator;
  the in-house implementation was removed.

## Architecture

`DataGrid.tsx` is a ~170-line shell. Everything else lives in three layers with one
hard boundary between two of them:

- **`hooks/`** — all state and behaviour. `hooks/use-data-grid.ts` is the single
  orchestrator: it calls every other hook in a fixed order and returns three buckets
  (`config`, `data`, `volatile` — see "The two contexts" below). Its own local
  handlers and its config/data aggregation are split into `hooks/use-grid-basic-actions.ts`,
  `hooks/use-grid-toolbar-actions.ts` and `hooks/use-grid-config-value.ts` purely to
  stay under the 300-LOC ceiling — the same escape hatch `hooks/use-column-handlers.ts`
  (split from `use-grid-layout.ts`) and `hooks/use-fill-and-paste.ts` (split from
  `use-range-selection.ts`) already used in earlier tasks.
- **`view/`** — presentation only. `view/grid-body.tsx` (unmemoised — cheap, re-renders
  on every volatile change), `view/grid-row.tsx` and `view/grid-cell.tsx` (both
  `React.memo`), plus the header/footer/col-group/banners/context-menu pieces.
- **`lib/`** — pure functions with no React dependency (filtering, sorting, grouping,
  export, conditional formatting, sparkline math).

**Boundary rule: `hooks/` never imports from `view/`.** A hook that both layers need
goes in `internal-types.ts`, not in a view file re-exported by a hook. Verify with:

```bash
grep -rn "from '\.\./view/\|from '\./view/" src/components/application-ui/data-grid/hooks/
```

Expected: no output. The reverse (a view file importing a hook's value, not just its
type, and calling it inside a memoised row) is also wrong — check with:

```bash
grep -rln "from '\.\./hooks/\|from '\./hooks/" src/components/application-ui/data-grid/view/
```

**The 300-LOC ceiling is a maintained constraint, not a one-off cleanup.** When a file
you're editing would cross it, split the largest cohesive block into a sibling module
and import it back — don't let it grow past 300 "just this once". (Two pre-existing
files predate this rule and are intentionally left alone: `DataGridFilterPopover.tsx`
(615) and `RangeChartDialog.tsx` (447) — both were already under the design doc's
800-line ceiling for files this refactor doesn't touch.)

### The two contexts

`context.tsx` splits grid state into two React contexts by change frequency
(`GridProvider`, consumed via `useGridConfig()` / `useGridDataContext()`):

- **`GridConfigContext`** — column geometry, every flag, and every handler. Changes
  only on props/columns/layout-level state (sort, filter, pin, column resize) —
  never on a keystroke.
- **`GridDataContext`** — the derived row arrays (filtered/sorted/paginated/grouped)
  that change on page, filter, or sort.

### Why volatile state is NOT in a context

`selectedRows`, `focusedCell`, `editingCell`, the range/fill rectangles and the find
match set change on every keystroke, drag and hover. **Do not fold these into
`GridConfigContext`, even for convenience** (e.g. to save a prop on some new slot) —
a context value's identity change forces every consumer to re-render regardless of
`React.memo`, so putting per-keystroke state in the same context `GridRow`/`GridCell`
already subscribe to would re-render every row on every keystroke, which is exactly
what `view/grid-row.tsx` and `view/grid-cell.tsx` being memoised was supposed to
prevent. Instead, `useDataGrid()` returns this state as a separate `volatile` object,
threaded as a **prop** into `GridBody`, which derives per-row primitives
(`isFocused`, `isEditing`, `inRange`, …) and passes those primitives down to `GridRow`
and `GridCell`. When a new composed slot or view file needs a volatile value, pass it
as an explicit prop (see `GridContextMenu`'s `target`/`rangeBounds` props, or
`slots.tsx`'s `GridTableSlot.selectNone` / `GridPaginationSlot.selectedRowsCount`) —
never add it to `config`.

`view/grid-row.tsx`'s `GridRow` uses a **custom** `React.memo` comparator (not the
default shallow one) because `cellFlags` is a fresh array every `GridBody` render;
the comparator walks it element-wise instead. **Every field of `GridRowProps` must
appear in that comparator** — a prop added later and forgotten there is a
stale-render bug no test will catch. `view/grid-cell.tsx`'s `GridCell` uses the
default shallow comparator: every one of its props is already a scalar or a
stable-identity object, so a custom one would add cost with no benefit.

### Composed slots

`DataGrid.Toolbar`, `DataGrid.Table`, `DataGrid.Footer` and `DataGrid.Pagination`
(`slots.tsx`) are an escape hatch for layouts the flat `<DataGrid {...props} />` props
can't express — e.g. a caller that wants its own toolbar row between the grid's
toolbar and its table, or a completely custom body inside the grid's own scroll
container/header/footer chrome. The default shell (`DataGrid.tsx`) renders through
these same slots, so the default path and the composed path are one code path — a
slot that only worked when hand-assembled would be a slot that silently rotted.

No current consumer uses the composed form; the common case stays the plain
`<DataGrid {...props} />` shown throughout this README. A sketch of the composed
form, for the day a consumer needs it:

```tsx
<DataGrid.Table checkboxColumnLeft={0} detailColumnLeft={0} selectNone={false}>
  {/* a custom body, or <GridBody volatile={volatile} /> */}
</DataGrid.Table>
```

`GridTableSlot` and `GridPaginationSlot` take a few explicit props (`selectNone`,
`selectedRowsCount`, `currentPage`, …) for exactly the volatile/per-render values
described above — they are deliberately not zero-prop, because the only alternative
would be smuggling volatile state through `GridConfigContext`.

## What we changed relative to upstream

Keep this list current — it is what tells a maintainer whether a bug belongs here or upstream.

| Change | Where | Why |
|---|---|---|
| Component stylesheet re-created | `src/styles/data-grid.css` | upstream's `globals.css` defined 10 classes + 2 attribute selectors the components apply (`resize-handle`, `sticky-*-cell`, `pinned-*-shadow`, `cell-focused`, `fill-handle`, `grouping-panel*`, `th[data-is-dragged]`, `th[data-is-drop-target]`). The port never brought it, so all of them rendered unstyled — column resize was a 0x0 invisible handle, pinned cells were neither sticky nor opaque. Rules adapted to this repo's `--color-*` tokens, not shadcn's `hsl(var(--x))` form |
| Import specifiers rewired to this repo's primitives | every file | upstream used `@/components/ui/*`, `@/lib/*`, `@/types/data-grid` |
| `cn` split from `getCellValue` | `DataGrid.tsx` | `cn` comes from this repo's `@/utils`; `getCellValue` is upstream's |
| `TableFooter` shim added | `table-footer.tsx` | this repo's `table.tsx` does not export one. Note: upstream imports `TableFooter` but never renders it |
| `initialFocus` → `autoFocus` on `<Calendar>` (×2) | `DataGridFilterPopover.tsx` | this repo is on react-day-picker v9; `initialFocus` was a v8 prop |
| Test files moved and their imports rewired | `src/__tests__/.../data-grid/` | vitest only collects `src/__tests__/**` |
| `node:test` import replaced with vitest's | the 5 test files | to run under this repo's runner; assertions untouched |
| `PersistedGridState` extracted; state moved into `useDataGridState` | `state/`, `DataGrid.tsx` | so a consumer can own and persist the view state (`gridState` / `onGridStateChange`) instead of only localStorage |
| `field` widened from `keyof TData` to `string`; `valueGetter` / `valueFormatter` / `valueSetter` added | `types.ts`, `lib/utils.ts` | per-tenant dynamic fields and computed columns are not keys of the row |
| `density` prop | `types.ts`, `state/density.ts`, `DataGrid.tsx` | Orderbahn persists a numeric `densityFactor`; three presets map to and from it |
| `loading` prop | `types.ts`, `parts/loading-overlay.tsx` | upstream's skeleton only showed when `data` was falsy and wiped the whole component |
| State layer hardened after review: batched `setState` calls in one tick no longer drop updates, an emptied `visibleColumns` falls back to every column, the persisted/transient key lists are exhaustiveness-checked, and the persisted memo keys on the column-field signature | `state/persisted-state.ts`, `state/use-data-grid-state.ts` | an inline `columnDefs` literal was re-running normalization and localStorage writes on every unrelated render; a second `setState` in one handler was reading stale state |
| Sticky header in virtualized mode | `DataGrid.tsx` | the shared `<Table>` primitive's own scroll wrapper nested inside DataGrid's own scroll viewport broke `position: sticky`; now renders a bare `<table>` |
| Sparkline stroke/fill tokens | `Sparkline.tsx` | used shadcn's `hsl(var(--primary))` triplet convention; this repo's tokens are `--color-*` literal hex values with no `hsl()` wrapper |
| Row-selection checkbox accessible name | `DataGrid.tsx` | `aria-labelledby` pointed at the checkbox's own `id` instead of a real label; replaced with `aria-label` |
| Light-theme `--color-muted-foreground` raised to meet WCAG AA | `src/styles/tokens/variables.css` | **design-system-wide token change, not a grid-scoped override.** `#959DA7` was 2.62:1 against `--color-card` (`#fafafa`) and 2.32:1 against `--color-background` (`#EBECEE`) — AA needs 4.5:1 for body text, and it was the single cause of all 5 `color-contrast` axe nodes in the grid. Now `#616A76` (same grey-blue hue family, H 214° vs 213°): 5.25:1 on `--color-card`, 4.64:1 on `--color-background`. The dark theme's `#B4BBC2` already passed (~9.87:1) and is deliberately unchanged. Tracked as `str-5c0`, closed on this branch after review; the process exception (this task was originally marked deferred pending the design owner) was approved by the operator post-hoc |
| `striped` prop | `types.ts`, `DataGrid.tsx` | Orderbahn parity — reuses the shared `Table` primitive's own striped classes |
| `tsconfig` `types: []` + child-component field types | `tsconfig.json`, `DataGridColumnVisibilityToggle.tsx`, `DataGridFilterPopover.tsx`, `DataGridGroupingPanel.tsx`, `DataGridHeaderCell.tsx` | ancestor `node_modules` carry a stub `@types/minimatch` with no `.d.ts`, which silently skipped every per-file diagnostic; pinned `types: []` restored tsc and surfaced real errors, finishing the `field: string` propagation into all consumers |
| Explicit `operator` on every `FilterValue` variant; number's symbolic operator extended with `isEmpty`/`isNotEmpty`, the other five types gained word-based operators | `types.ts`, `filters/operators.ts`, `filters/apply-operator.ts` | Orderbahn's `@mui/x-data-grid-pro` grids expose per-type operators; the port only filtered by `filterType` |
| `filterRows`'s per-type match logic extracted into `filters/apply-operator.ts` | `lib/gridProcessing.ts` | one seam for the popover to reuse instead of importing grid-processing internals |
| `normalizePersistedState` repairs an invalid/missing operator per column, and drops a filter whose `type` no longer matches its column | `state/persisted-state.ts`, `state/use-data-grid-state.ts` | a saved filter from before this sub-project has no `operator` and must keep filtering the same way |
| `handleColumnFilterChange`'s clearing rule and the popover's `isFilterActive` both delegate to one `isFilterEffectivelyEmpty` | `DataGrid.tsx`, `DataGridFilterPopover.tsx` | previously two hand-kept copies of the same per-type emptiness rules |
| Editing gained an `editRenderer` slot + a registry of 11 typed editors (`editors/`) | `editors/`, `types.ts`, `DataGrid.tsx` | upstream only ever rendered a text-or-number `<Input>`; there was no per-column injection point, and a boolean column edited as a text box because no checkbox editor existed at all |
| `editable` widened from `boolean` to `boolean \| ((row) => boolean)`, honoured at every check site (start-edit, F2/Enter, double-click, fill, paste) | `types.ts`, `lib/utils.ts` (`isColumnEditable`), `DataGrid.tsx` | carries the dealer-side field-level role model — a field can be editable only for some roles or some row states; upstream read a plain boolean in three places and never consulted it from fill or paste |
| `onCellEdit` gained a 4th, **required** `nextRow` argument and may return a `Promise` | `types.ts`, `DataGrid.tsx` | consumes sub-project 1's `valueSetter` (a computed column can't be written back with `row[field] = value`) and lets the grid show a pending state + roll back on rejection. **Rejecting the promise is the supported way to refuse an edit**: the grid rolls the cell back visually, keeps the edit out of the undo stack, and shows a self-clearing "Save failed — reverted" message |
| An editable column with a `valueGetter` and no `valueSetter` logs one dev-time `console.error` per column | `DataGrid.tsx` | otherwise the parent silently loses every edit to a computed field |
| Inline per-cell validation (`editValidator` + built-in per-type checks) gates every commit | `editors/validation.ts`, `DataGrid.tsx` | upstream either silently coerced an invalid value back or committed it as-is; now the commit is blocked, the editor stays mounted with the buffer intact, and a `FieldError` shows under the cell |
| Async commit path: one `commitCellEdit` seam, a per-cell pending indicator, rollback on rejection, and only confirmed edits on the undo stack | `DataGrid.tsx` (`commitCellEdit`) | upstream's `applyEdits`/undo/redo called `onCellEdit` fire-and-forget with no way to reflect a failed save, and pushed the batch onto the undo stack whether or not it stuck. Inline, fill, paste, undo and redo now all route through the one seam, so pending/rollback is implemented once |
| A pending or rolled-back cell renders the grid's own value, not the parent's | `DataGrid.tsx` (`renderCellContent`) | rollback must not depend on how fast the parent re-renders, or whether it re-renders at all |
| A native `<select>` no longer commits on `change` — it commits on blur or Enter | `editors/select-editor.tsx` | deliberate: a *closed* native select fires `change` on every arrow key and typeahead keystroke, so committing on `change` made keyboard selection impossible (it committed a neighbouring option and closed the editor). Consequence for consumers: a mouse pick commits when focus leaves the cell, not on the click |
| Date/time editors read and write **local** date parts | `editors/date-editor.tsx`, `time-editor.tsx`, `datetime-editor.tsx` | the design system's `DatePicker` parses a `YYYY-MM-DD` at *local* noon, so reading a `Date` via `toISOString()` renders (and then commits) the wrong day either side of UTC. **Do not flip these to UTC** — local is the convention across all three editors |
| The `datetime` editor preserves the precision/offset it was handed | `editors/datetime-editor.tsx` | splitting and re-joining keeps seconds and a `Z`/`+02:00` tail (editing `10:30:45` to 11:45 yields `11:45:45`), because dropping either silently shifts the instant by the viewer's offset. A value with a date and no time is treated as `…T00:00` |
| `.cell-fill-preview` / `.cell-range-selected` style rules added | `src/styles/data-grid.css` | the port applies both class names but never brought their rules, so a fill drag and a selected range were visually indistinguishable from a normal cell |
| Select-all header checkbox aligned with the row checkboxes (`justify-center` → `justify-start`) | `DataGrid.tsx` | pre-existing upstream defect found by the operator: the header checkbox sat centred in a ~158px-wide selection column while every row checkbox sat left, so they didn't line up |
| The focus effect no longer steals DOM focus from a text entry | `DataGrid.tsx` | pre-existing upstream defect found by the operator: the effect re-runs on every `paginatedData` change, i.e. every keystroke in the global filter, so it pulled focus back to the table wrapper after each character. Now it skips the refocus when the active element is an `INPUT`/`TEXTAREA`/`SELECT`/`contenteditable` — the same target test `handleGridKeyDown` already used |
| `ColumnFilter` — several conditions per column joined by AND/OR, plus a grid-level `filterLogicOperator` | `types.ts`, `filters/filter-model.ts`, `filters/evaluate-column.ts`, `lib/gridProcessing.ts` | Orderbahn's grid sends a multi-item filter model with a logic operator to its backend; one filter per column cannot express it |
| `filterRenderer` per column | `types.ts`, `DataGridFilterPopover.tsx` | Orderbahn's filter inputs are async domain pickers (users, entities, statuses); the design system must not hold that domain |
| `filterApplyMode`, defaulting to `manual` under `serverSide` | `types.ts`, `DataGridFilterPopover.tsx`, `DataGrid.tsx` | filtering per keystroke against a server is a query per keystroke |
| Toolbar extracted into a part, with a `toolbarActions` slot and a live `DataGridToolbarContext` | `parts/data-grid-toolbar.tsx` | Orderbahn's toolbar carries app actions (Refresh, Import, Export ZIP, Delete, Bulk edit); the grid had no slot at all |
| Density picker in the toolbar (`showDensityControl`) | `parts/data-grid-toolbar.tsx` | sub-project 1 added the prop; Orderbahn also exposes the control to the user |
| `DataGridViewSelector` — generic saved-views control | `parts/view-selector.tsx` | Orderbahn's `GridOptions` UI, without its GraphQL: the app owns the list and the persistence |
| `editSessionMode: 'session'` + `onSaveEdits` | `editing/edit-session.ts`, `DataGrid.tsx` | Orderbahn buffers every edited cell behind a grid-wide Edit toggle and saves them together; a rejected save rolls all of them back |
| `onBulkEdit` + the bulk-edit dialog | `parts/bulk-edit-dialog.tsx` | Orderbahn's `BulkEditDialog`, built from the editor registry so it carries no domain |
| `enableSelectAllMatching`, and `onSelectionChange` gains a `{ allMatching }` meta argument | `types.ts`, `DataGrid.tsx` | a server-mode grid cannot materialise the ids of pages it never loaded |
| `isRowSelectable`, `getCellClassName` | `types.ts`, `DataGrid.tsx` | Orderbahn blocks selection while editing and tints cells the user's role cannot edit |
| `RangeChartDialog` colours use `--color-*` tokens | `RangeChartDialog.tsx` | same invalid `hsl(var(--…))` defect as the sparkline |
| Rows-per-page combobox has an `aria-label` | `DataGridPagination.tsx` | it is a `role="combobox"` with no accessible name — the second axe `button-name` violation |

## Known upstream issues, unfixed at vendoring time

- **`src/styles/theme.css`** is dead — unreferenced anywhere under `src/` or `.storybook/` — and holds a stale, non-namespaced `--muted-foreground: #71717a` that disagrees with the live `--color-muted-foreground` in `src/styles/tokens/variables.css`. A landmine for anyone who greps `muted-foreground` and lands here instead. Not deleted as part of the contrast fix above; needs its own bead.
  This is outside the four core defects in the DataGrid component itself; filed as a separate
  design-system audit.
- **Filter popover closes on the first keystroke of a text filter** (`DataGridHeaderCell.tsx`'s
  auto-close rule) — tracked as bead `str-781`.
- **Date-only cell values bucket one day early west of UTC** — tracked as bead `str-7fb`.

## Sharp edges

- **`allMatching` is intent, not data.** When the user picks "select all matching", the grid reports
  `{ allMatching: true }` with only the loaded ids. Applying the same filter server-side is the
  app's job; the grid cannot verify it did.
- **One shared localStorage key.** A grid with no explicit `storageKey` uses the same default key as
  every other grid, so two un-keyed grids overwrite each other's column layout — and in tests, a
  grid from a previous test restores its state into the next one. Pass a distinct `storageKey` per
  grid instance.
- **`nextRow` is per-cell, not per-batch.** `onCellEdit(rowId, field, value, nextRow)` builds
  `nextRow` from the row as it is *before* that batch, so a multi-column edit (a range paste, a fill
  across two columns) fires one call per cell, each carrying a `nextRow` that only has its own field
  applied. A consumer that stores `nextRow` wholesale (`setData(prev => prev.map(r => r.id === rowId
  ? nextRow : r))`) therefore keeps only the last field and silently drops the others — observed with
  a two-column paste where Total landed and Qty did not. Merge per field (`{ ...r, [field]: value }`,
  or apply `nextRow`'s changed field onto the current row) when the parent may receive several cells
  of the same row in one batch. This matters most for `valueSetter` columns, where `nextRow` is the
  only place the setter's result is exposed.
- **`editRenderer` must be a stable reference.** The grid looks the editor up on every render
  (`getEditRenderer(colDef, cellValue)`) and renders it as a component; an inline
  `editRenderer={(props) => …}` is a new component type each render, so React unmounts and remounts
  the open editor and the cell loses focus mid-edit. Define it at module scope or memoize it.
- **`prevValue` assumes a non-optimistic parent.** `commitCellEdit` reads the prior value out of the
  grid's current data just before calling `onCellEdit`, so a parent that applies the edit
  *optimistically* (state updated before the promise settles) has already moved on by then — the
  rollback still works, because the grid renders its own value over the parent's while a commit is
  pending or rolled back, but the `prevValue` recorded on the undo stack is only trustworthy for a
  parent that commits after confirmation. An optimistic parent works; just know the assumption.
- **A date cell cannot be cleared — and the fix is not in this folder.**
  `src/components/forms/date-picker.tsx:60` opens `handleSelect` with `if (!date) return;`, so
  react-day-picker's deselect is swallowed and there is no Clear button anywhere in the product. The
  grid side is already correct (`handleEditCommit` treats an `undefined` from an editor as a
  deliberate clear and commits it), so the day the design system's `DatePicker` grows a clear path,
  date cells become clearable with no change here.
- **`DataGrid.tsx` was ~2,300 lines** (down to ~170 after the architecture refactor below) with no
  tests of its own. Upstream's 51 tests cover the pure logic in `lib/` only; everything else is
  covered by the tests this repo added under `src/__tests__/design-system/components/ui/data-grid/`.

## Exported from the package barrel

`src/components/index.ts` re-exports this folder via its own `index.ts`:
`DataGrid`, `DataGridFilterPopover`, `FilterConditionEditor`, `DataGridFindBar`,
`DataGridGroupingPanel`, `DataGridHeaderCell`, `DataGridPagination`,
`DataGridStatusBar`, `ColumnVisibilityToggle`, `RangeChartDialog`, `Sparkline`,
and every public type from `types.ts` (`ColumnDefinition`, `DataGridProps`,
`DataGridState`, `FilterType`, `FilterValue` and its variants, `AggregateFunction`,
`ConditionalFormatRule`, `DateRangePreset`, `CellChange`, `DirtyCell`, etc.). The
grid's stylesheet (`src/styles/data-grid.css`) ships via the package's
`./styles.css` export (already `@import`ed from `src/styles/index.css`). The
upstream MIT notice in `LICENSE` (this folder) must stay with the code.

## Painting cells

A `cellRenderer` picks a **meaning**, never a colour.

- Status, state or outcome → `StatusBadge`
  (`src/components/application-ui/status-badge.tsx`). It owns the canonical
  palette and handles both themes. See `data-grid.stories.tsx`'s `STATUS_BADGE`
  map for the pattern: the story's own wording stays as the badge's children,
  only the colour comes from the status.
- Anything else that needs colour → the `status-*` tokens
  (`--color-status-success`, `--color-status-warning`, `--color-status-error`,
  `--color-status-info`, `--color-status-ai`).
- Never raw Tailwind palette utilities (`bg-green-100`, `text-red-800`). They do
  not follow the Strata theme and drift the moment the tokens change.

Row, selection, header and range colours are not a renderer's business — they
come from the `--dg-*` variables at the top of `src/styles/data-grid.css`.
Re-skin a grid by redefining those ten variables, not by styling cells.
