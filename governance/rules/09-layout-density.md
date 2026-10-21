# Strata DS — Layout Density and Information Grouping

The most common complaint about UI built quickly is the same: **too much vertical scroll, too much empty space, related elements pushed to separate rows, important things buried below the fold**. This rule codifies how to lay out information for maximum usable density on desktop without compromising legibility on smaller viewports.

This rule extends [`rules/03-containers-and-cards.md`](./03-containers-and-cards.md) and [`rules/08-modal-patterns.md`](./08-modal-patterns.md).

---

## Core principle — maximize desktop real estate

Strata users work primarily on desktop. The viewport is 1280-1920px wide; using only the center 600-800px for a single column wastes 60% of the screen and forces unnecessary scroll. Default to **2-column or 3-column layouts** at the `lg` breakpoint and above.

```tsx
// ✅ Do — 2-column layout on lg, collapses to stack on mobile
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <section>{leftContent}</section>
  <section>{rightContent}</section>
</div>

// ❌ Don't — single narrow column on every viewport
<div className="max-w-2xl mx-auto space-y-6">
  <section>{leftContent}</section>
  <section>{rightContent}</section>
</div>
```

---

## Avoid orphan elements

An orphan is a single line of text, a lone label, or a metric pushed onto its own row when it could naturally sit next to a related element. Orphans waste vertical space and break visual flow.

```tsx
// ❌ Don't — every piece of metadata on its own row
<div>
  <div>Quote: QT-1042</div>
  <div>Vendor: NorthPoint</div>
  <div>Date: Mar 28, 2025</div>
  <div>Status: Pending</div>
  <div>Total: $4,159.12</div>
</div>

// ✅ Do — group related metadata on the same row
<div className="flex items-baseline gap-4 text-sm">
  <span className="font-semibold">QT-1042</span>
  <span className="text-muted-foreground">·</span>
  <span>NorthPoint</span>
  <span className="text-muted-foreground">·</span>
  <span>Mar 28, 2025</span>
  <Badge>Pending</Badge>
  <span className="ml-auto tabular-nums font-semibold">$4,159.12</span>
</div>
```

### Use middle-dot or pipe separators for one-line metadata

```tsx
// ✅ Do
<Meta>SO2604102 · Leland Furniture · Mar 28, 2025 · $4,159.12</Meta>
<Meta>PO-1027 ⇄ ACK-7839 · Steelcase · Run #1</Meta>

// ❌ Don't
<MetaLine>SO2604102</MetaLine>
<MetaLine>Leland Furniture</MetaLine>
<MetaLine>Mar 28, 2025</MetaLine>
<MetaLine>$4,159.12</MetaLine>
```

---

## Group related information and actions

Every panel must have a clear answer to: **what does this group of fields represent?** If you cannot give the group a 2-3 word name (Quote Info, Vendor, Terms), the grouping is wrong.

```tsx
// ✅ Do — three named groups, each carrying their fields
<FieldSection label="Quote Info" icon={<Package />}>
  <FieldValueRow field="Quote number" value="SO2604102" />
  <FieldValueRow field="Date" value="Mar 28, 2025" />
  <FieldValueRow field="Linked PO" value="4522-7162" />
</FieldSection>

<FieldSection label="Vendor" icon={<Building />}>
  <FieldValueRow field="Dealer" value="Leland Furniture" />
  <FieldValueRow field="Ship-to" value="Continua IL Warehouse" />
  <FieldValueRow field="Contact" value="orders@leland.com" />
</FieldSection>

// ❌ Don't — 12 ungrouped fields in a single column
<div>
  <Field>Quote number: SO2604102</Field>
  <Field>Date: Mar 28, 2025</Field>
  <Field>Linked PO: 4522-7162</Field>
  <Field>Dealer: Leland Furniture</Field>
  <Field>Ship-to: Continua IL Warehouse</Field>
  <Field>Contact: orders@leland.com</Field>
  <Field>...</Field>
</div>
```

### Action groups follow the same rule

Group buttons by what they act on. Confirmation actions go together; navigation actions go together; destructive actions sit alone (left or right edge).

```tsx
// ✅ Do
<Footer>
  <Button variant="destructive">Delete</Button>  {/* Isolated destructive */}
  <Spacer />
  <ButtonGroup>                                  {/* Confirmation group */}
    <Button variant="outline">Cancel</Button>
    <Button>Save</Button>
  </ButtonGroup>
</Footer>

// ❌ Don't — six buttons in a row with no grouping
<Footer>
  <Button>Delete</Button>
  <Button>Cancel</Button>
  <Button>Save draft</Button>
  <Button>Save</Button>
  <Button>Preview</Button>
  <Button>Help</Button>
</Footer>
```

---

## Density modes — comfortable vs compact

Strata supports two density modes for data lists. Pick per context, never mix on the same page.

| Mode | Row height | Padding | Use when |
|---|---|---|---|
| **Comfortable** | 48-56px | `py-3 px-4` | Default for browsing, primary navigation, hero lists |
| **Compact** | 32-40px | `py-1.5 px-3` | Data-dense tables, reports, modals, sub-panels |

```tsx
// ✅ Comfortable — main transactions table
<DataListTable rowClassName="py-3 px-4">...</DataListTable>

// ✅ Compact — line items inside a quote
<EditableLineTable rowClassName="py-1.5 px-3">...</EditableLineTable>
```

---

## Avoid stacking related elements when they fit horizontally

If two pieces of information are read together (label + value, before + after, count + label), render them on the same row.

```tsx
// ✅ Do — KPI with delta inline
<div className="flex items-baseline gap-3">
  <span className="text-3xl font-extrabold tabular-nums">$4,159</span>
  <span className="text-sm font-semibold text-status-success">+12.5%</span>
</div>

// ❌ Don't — two rows for one KPI
<div>
  <div className="text-3xl">$4,159</div>
  <div className="text-sm text-status-success">+12.5%</div>
</div>
```

---

## Sticky chrome + scroll-bound body

For long lists or scrollable detail views, keep navigation, search, and primary actions sticky at the top so the user always has them in reach.

```tsx
// ✅ Do
<PageLayout>
  <Header sticky>
    <Title>Transactions</Title>
    <Toolbar><Search /><FilterPills /></Toolbar>
  </Header>
  <ScrollableBody>
    <Table>...</Table>
  </ScrollableBody>
</PageLayout>
```

---

## Anti-patterns

| ❌ | ✅ |
|---|---|
| One field per row, 12 rows of vertical stacking | 2-3 grouped sections, each with 3-5 fields |
| `max-w-2xl mx-auto` on every panel | `grid grid-cols-1 lg:grid-cols-2 gap-6` |
| Metadata as orphan lines (4 rows for 4 facts) | Single inline meta with `·` separators |
| Comfortable density inside a modal with 10 line items | Compact density (`py-1.5`) for data-dense surfaces |
| Buttons scattered with no visual grouping | Logical groups: destructive isolated, confirmation paired |
| Critical actions below the fold | Sticky footer + scrollable body |

---

## Quick audit

Open any view and ask:

1. **Are there 3+ consecutive rows with one piece of info each?** → orphan problem
2. **Is more than 30% of horizontal space empty on desktop?** → single-column problem
3. **Can I name every section in 2-3 words?** → grouping problem
4. **Do I see the same density (row height) across panels of different scope?** → density-mode problem

If any answer is yes, restructure before adding more content.

---

## Source files

- `governance/rules/03-containers-and-cards.md` — surface hierarchy
- `governance/rules/08-modal-patterns.md` — applies layout density specifically to modals
- `Strata Design System/strata-ds/src/components/application-ui/data-list-table.tsx`
- `Strata Design System/strata-ds/src/components/application-ui/data-list-card.tsx`
