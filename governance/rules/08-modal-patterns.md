# Strata DS — Modal Patterns

Modals are the most overloaded surface in any product. A bad modal hides the task behind walls of metadata, repeats actions, and forces the user to scroll inside a window that should already be self-contained. A good modal lets the user understand **what they are looking at, what is wrong, what the system recommends, and what they need to do** in under 5 seconds.

This rule extends [`rules/03-containers-and-cards.md`](./03-containers-and-cards.md) for surface tokens, [`rules/04-buttons-and-actions.md`](./04-buttons-and-actions.md) for action hierarchy, and the canonical `Dialog` / `SplitPaneReviewModal` / `DocumentReviewModal` components in the DS.

**Source**: this rule was authored from a frontend-team review of the smart-comparator discrepancy modal. The recommendations apply to any decision-oriented modal across Strata projects.

---

## The 5-second test

Every modal must let the user answer these five questions in under 5 seconds without scrolling:

1. **What am I looking at?** (the title)
2. **How many problems exist?** (a single count, not a paragraph)
3. **How severe are they?** (highest severity, not a description of each)
4. **What does the system recommend?** (one line)
5. **What action am I expected to take?** (clear footer CTA)

If the modal cannot answer these five questions above the fold, it is over-scoped. Demote content to expandable rows, tooltips, or secondary screens.

---

## Header

### Header height limit — 15-20% of visible modal area

The header must contain only:

- The title (the **task**, not the content)
- The state badge (`Critical`, `Pending`, `Resolved`)
- Minimal context line (IDs, vendor, run number — one row)
- Document/document-pair actions (`View PO`, `View ACK`)
- Close button

Do not put: long subtitles, instructional text, summary paragraphs, secondary navigation, or tab counts spread across multiple rows.

```tsx
// ✅ Do — compact 2-row header
<ModalHeader>
  <Row>
    <Title>Compare linked documents</Title>
    <StatusBadge tone="destructive">Critical</StatusBadge>
    <Metric>62% match</Metric>
    <CloseButton />
  </Row>
  <Row tone="muted">
    <Meta>PO-1027 ⇄ ACK-7839 · Steelcase · Run #1</Meta>
    <ActionGroup>
      <Button variant="ghost" size="sm">View PO</Button>
      <Button variant="ghost" size="sm">View ACK</Button>
    </ActionGroup>
  </Row>
</ModalHeader>

// ❌ Don't — 6-row header consuming 25% of modal height
<ModalHeader>
  <Title>Compare linked documents</Title>
  <Subtitle>Review discrepancies between purchase order and acknowledgement</Subtitle>
  <StatusBadge>Critical issues found</StatusBadge>
  <MetadataRow>PO: PO-1027</MetadataRow>
  <MetadataRow>ACK: ACK-7839</MetadataRow>
  <MetadataRow>Vendor: Steelcase</MetadataRow>
  <MetadataRow>Match: 62%</MetadataRow>
  <MetadataRow>Run: #1</MetadataRow>
  <TabBar>...</TabBar>
  <DocumentButtons>View PO · View ACK</DocumentButtons>
  <ExplanationRow>Show impact & 4 recommended actions</ExplanationRow>
</ModalHeader>
```

### Title describes the task, not the content

```tsx
// ✅ Do
<Title>Compare linked documents</Title>
<Title>Review discrepancies</Title>
<Title>Validate extracted fields</Title>

// ❌ Don't — long content description in the title
<Title>Compare purchase order PO-1027 with acknowledgement ACK-7839 from Steelcase</Title>
```

The content context (IDs, vendor, run number) belongs in the metadata row immediately below the title, not in the title itself.

### Metadata row — single compact line

```tsx
// ✅ Do
<Meta>PO-1027 ⇄ ACK-7839 · Steelcase · Run #1</Meta>

// ❌ Don't — cards or stacked labels for context data
<MetaGrid>
  <MetaCard><Label>PO</Label><Value>PO-1027</Value></MetaCard>
  <MetaCard><Label>ACK</Label><Value>ACK-7839</Value></MetaCard>
  <MetaCard><Label>Vendor</Label><Value>Steelcase</Value></MetaCard>
</MetaGrid>
```

---

## Tabs and content hierarchy

### Tabs sit adjacent to the content they control

Tabs are not part of the header — they are the first row of the body. Place them immediately above the active panel, with no gap or extra row between.

```tsx
// ✅ Do — tabs glue to content
<TabsList>
  <TabsTrigger value="actions">Action Required (3)</TabsTrigger>
  <TabsTrigger value="fields">Fields (6)</TabsTrigger>
  <TabsTrigger value="lines">Line Items (3)</TabsTrigger>
</TabsList>
<TabsContent value="actions">
  ...
</TabsContent>

// ❌ Don't — header rows between tabs and content
<TabsList>...</TabsList>
<HeaderRow>Showing 3 of 12 discrepancies for current filter</HeaderRow>
<HeaderRow>Sort: severity ↓</HeaderRow>
<HeaderRow>Last updated: 2 minutes ago</HeaderRow>
<TabsContent>...</TabsContent>
```

### Executive summary first, list second

Before any list of items, render a one-line executive summary that captures: count, status distribution, severity high-watermark, and AI/system recommendation if any.

```tsx
// ✅ Do
<ExecutiveSummary>
  3 discrepancies · 0 resolved · Highest severity: High · AI recommends: Reject report
</ExecutiveSummary>
<DiscrepancyList>...</DiscrepancyList>

// ❌ Don't — jump straight into the list, let the user count
<DiscrepancyList>...</DiscrepancyList>
```

---

## Rows and item structure

### Compare values in columns, never stacked

When a row carries multiple parallel values (Expected vs Received, PO vs ACK, Before vs After), render them as columns. Never stack two parallel values vertically when they fit horizontally.

```tsx
// ✅ Do — 4-column comparison row
<DiscrepancyRow severity="high">
  <Cell>Line 1 · Product</Cell>
  <Cell>Series 2</Cell>
  <Cell>Amia</Cell>
  <Cell>AI: Reject · 98% confidence</Cell>
</DiscrepancyRow>

// ❌ Don't — vertical stack inside a card per discrepancy
<DiscrepancyCard>
  <h3>Line 1 · Product</h3>
  <Label>Purchase Order value</Label>
  <Value>Series 2</Value>
  <Label>Acknowledgement value</Label>
  <Value>Amia</Value>
  <Section>AI Analysis</Section>
  <Bullet>Unauthorized model swap…</Bullet>
  <Bullet>Customer requested Series 2 specifically…</Bullet>
  <Bullet>Amia lacks lumbar support…</Bullet>
  <ActionGroup><Accept /><Flag /><Reject /></ActionGroup>
</DiscrepancyCard>
```

Use the canonical `<DiscrepancyRow>` + `<DiscrepancyComparisonBlock>` primitives from the DS.

### Severity is scanning, not decoration

Severity belongs at the start of the row so the user can scan a list of 10 items by left-edge color alone.

```tsx
// ✅ Do
<Row>
  <Severity tone="high">HIGH</Severity>
  <Field>Line 1 · Product</Field>
  ...
</Row>

// ❌ Don't — severity hidden in the middle, as a decoration
<Row>
  <Field>Line 1 · Product</Field>
  ...
  <DecorativeChip>· high severity</DecorativeChip>
</Row>
```

### Every row answers 4 questions

A discrepancy row that does not let the user answer **what changed · expected value · received value · recommendation** at a glance is over-engineered. Audit each row against these four. If any is missing or buried, restructure.

---

## Long reasoning — collapse by default

Show only the verdict above the fold:

```
AI: Reject · 98% confidence
Unauthorized model swap — Series 2 → Amia
```

Then offer a `View reasoning` link that expands to the bullets. The user reads the **decision** first, the **explanation** on demand.

```tsx
// ✅ Do
<AIVerdict>
  <Decision tone="destructive">Reject · 98%</Decision>
  <OneLineExplanation>Unauthorized model swap — Series 2 → Amia</OneLineExplanation>
  <Collapsible label="View reasoning">
    <ReasoningBullet>Customer specced Series 2 explicitly in the original PO</ReasoningBullet>
    <ReasoningBullet>Amia lacks lumbar support required for the spec</ReasoningBullet>
    <ReasoningBullet>No swap authorization on file</ReasoningBullet>
  </Collapsible>
</AIVerdict>

// ❌ Don't — render all 3-5 reasoning bullets visible by default
```

---

## Actions

### Per-row actions are secondary; demote to a menu

When a row offers multiple decisions (accept, flag, reject), do not render three buttons per row. Demote to a single `Override ▾` dropdown that contains the row-level actions.

```tsx
// ✅ Do
<Row>
  ...
  <RecommendedDecision>Reject</RecommendedDecision>
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="sm">Override ▾</Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem>Accept this item</DropdownMenuItem>
      <DropdownMenuItem>Flag for review</DropdownMenuItem>
      <DropdownMenuItem>Reject this item</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</Row>

// ❌ Don't — three buttons in every row, multiplying visual noise
<Row>
  ...
  <Button>Accept</Button>
  <Button>Flag</Button>
  <Button>Reject</Button>
</Row>
```

### Global actions live in the footer — never duplicated per row

If the modal\'s footer carries `Accept report · Review manually · Reject report`, do not also offer per-row `Accept · Review · Reject`. Pick one scope per action verb.

```tsx
// ✅ Do — clear scopes
<RowAction>Override item</RowAction>
<FooterAction>Accept report</FooterAction>

// ❌ Don't — same verb at two scopes
<RowAction>Accept</RowAction>      // accepts what? this row? the report?
<FooterAction>Accept</FooterAction>
```

### Action labels carry the consequence

```tsx
// ✅ Do
<Button>Reject report</Button>
<Button>Send to review</Button>
<Button>Apply AI recommendations</Button>

// ❌ Don't — bare verbs that read as ambiguous when the context scrolls off
<Button>Reject</Button>
<Button>Review</Button>
<Button>Accept</Button>
```

A user who arrives at the footer after scrolling should know exactly what `Reject` rejects — the line item, this discrepancy, the whole report?

### AI suggests, human decides — visual separation

```tsx
// ✅ Do — clear AI recommendation block, separate action block
<Recommendation>AI recommends: Reject report</Recommendation>
<UserDecision>
  <Button variant="outline">Accept</Button>
  <Button variant="outline">Review</Button>
  <Button variant="destructive">Reject</Button>
</UserDecision>

// ❌ Don't — make the AI recommendation look like the final action was already taken
<AILabel>AI decision: Reject</AILabel>
<TinyOverride>Override decision</TinyOverride>
```

---

## Footer

### Footer is compact, not full-width buttons

```tsx
// ✅ Do
<ModalFooter>
  <RoutingMeta>Routing: Mandatory Review · 35% confidence</RoutingMeta>
  <ActionGroup>
    <Button variant="outline">Accept</Button>
    <Button variant="outline">Review</Button>
    <Button variant="destructive">Reject</Button>
  </ActionGroup>
</ModalFooter>

// ❌ Don't — three full-width buttons consuming half the footer height
<ModalFooter style={{ flexDirection: 'column', gap: '1rem' }}>
  <Button fullWidth size="lg">Accept report</Button>
  <Button fullWidth size="lg">Review manually</Button>
  <Button fullWidth size="lg" variant="destructive">Reject report</Button>
</ModalFooter>
```

### En estrecho el pie se apila, y lo seguro queda abajo

El pie del sistema (`DialogFooter`, `AlertDialogFooter`) trae
`flex-col-reverse sm:flex-row`: en ancho, los botones van en fila con el
destructivo a la derecha; por debajo de `sm` se apilan, y **el orden invertido deja
el destructivo arriba y el de cancelar abajo**.

Eso no es un descuido, es la posición segura. En un móvil el pulgar descansa abajo,
así que quien cierra diálogos por reflejo pulsa el de abajo — y ahí tiene que estar
el que no rompe nada. Coincide además con iOS y con Material.

```tsx
// ✅ Do — se deja al pie hacer su trabajo
<DialogFooter className="gap-3">
  <Button variant="secondary" onClick={onClose}>Keep draft</Button>
  <Button variant="destructive" onClick={onConfirm}>Discard draft</Button>
</DialogFooter>

// ❌ Don't — `flex-row` gana por tailwind-merge y anula el apilado:
// en pantalla estrecha los dos botones se aprietan en una fila
<DialogFooter className="flex flex-row justify-end gap-3">
```

`ConfirmDialog` hizo exactamente eso durante meses. Si necesitas cambiar el `gap`,
pasa `gap-*` y nada más: cualquier `flex-row` o `flex-col` en el `className` pisa la
decisión del sistema sin que nada avise.

### Footer stays fixed — header fixed, body scrolls

Decision modals must keep the footer (and header) sticky. The body scrolls; the action surface never disappears under the fold.

```tsx
<Modal>
  <ModalHeader sticky>...</ModalHeader>
  <ModalBody scrollable>...</ModalBody>
  <ModalFooter sticky>...</ModalFooter>
</Modal>
```

---

## Modal sizing and scroll behavior

### Match the modal width to the content type

| Use case | Width | Notes |
|---|---|---|
| Confirmation (single question) | `max-w-md` (~28rem) | Dialog primitive |
| Form (3-8 fields) | `max-w-lg` (~32rem) | Sheet preferred over modal for >5 fields |
| Detail / review (parallel data) | `max-w-4xl` (~56rem) | Allows column comparison |
| Document comparison / split pane | `max-w-6xl` + sidebar offset | Use `SplitPaneReviewModal` |
| Full hero / dashboard takeover | Full screen | Reconsider — a full route is often better |

### Internal scroll budget

The user should always see at least: full header · executive summary · 2-3 list items · full footer. If only one item is visible, the row design is too tall — restructure to columns + collapsibles before resizing the modal.

```tsx
// ✅ Do — bounded modal height, internal scroll on the body only
<ModalContent className="max-h-[90vh] flex flex-col">
  <ModalHeader />
  <ModalBody className="overflow-y-auto flex-1 min-h-0">
    <Summary />
    <List>...</List>
  </ModalBody>
  <ModalFooter />
</ModalContent>

// ❌ Don't — modal grows to fit content, page itself scrolls
<ModalContent className="h-auto">
  ...
</ModalContent>
```

---

## Reference layout — target shape for a dense decision modal

Apply the rules in this file and the resulting modal should approximate this skeleton. The original review of the smart-comparator discrepancy modal used exactly this shape to recover ~30% of the visible space.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Compare linked documents     [Critical]   62% match                       × │
│  PO-1027 ⇄ ACK-7839 · Steelcase · Run #1                  [View PO] [View ACK]│
├──────────────────────────────────────────────────────────────────────────────┤
│  [Action Required (3)]  Fields (6)  Line Items (3)              [Export ▾]   │
├──────────────────────────────────────────────────────────────────────────────┤
│  3 discrepancies · 0 resolved · Highest: High · AI recommends: Reject report │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌─ HIGH · Line 1 · Product ─────────────────────────────────────────────┐  │
│  │ PO: Series 2          ACK: Amia          AI: Reject · 98% confidence  │  │
│  │ Unauthorized model swap — Series 2 → Amia          [View reasoning]   │  │
│  │                                                    [Override ▾]       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌─ HIGH · Line 1 · Qty ─────────────────────────────────────────────────┐  │
│  │ PO: 12                ACK: 3             AI: Reject · 94% confidence  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌─ MEDIUM · Estimated Ship Date ────────────────────────────────────────┐  │
│  │ PO: Apr 15            ACK: Apr 22        AI: Flag · 71% confidence    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────────────────┤
│  Routing: Mandatory Review · 35% confidence    [Accept] [Review] [Reject]    │
└──────────────────────────────────────────────────────────────────────────────┘
```

**What this shape encodes:**

1. **Compact 2-row header** — no metadata cards, no helper paragraph, no fragment counter spread across separate rows.
2. **Tabs adjacent to body** — no extra "showing N of M" row between tab strip and content.
3. **Single-line executive summary** — count · resolved · severity · AI recommendation in one row.
4. **Comparison rows in columns** — each discrepancy reads PO ⇄ ACK ⇄ AI in a single horizontal scan instead of three stacked sections.
5. **Verdict above the fold; reasoning behind a link** — the user sees the decision first, opens the reasoning only if they want to challenge it.
6. **Per-row actions demoted to `Override ▾`** — no triple `Accept · Flag · Reject` row competing with the footer.
7. **Compact footer with routing context** — three small buttons + the routing meta in one line. No full-width button stack.

A modal that follows this shape lets the reviewer see 3-4 discrepancies plus the action footer without scrolling, and lets them make a confident decision in under 5 seconds.

---

## Anti-patterns

| ❌ | ✅ |
|---|---|
| Header spans 25% of modal height | Header ≤ 20% with compact 2-row layout |
| Title contains IDs and vendor | Title describes the task; IDs in meta row |
| Tab bar separated from content by 2-3 rows | Tabs glue to content directly |
| Long AI reasoning visible by default | Decision + 1 line visible; reasoning collapsible |
| 3 buttons per row + 3 buttons in footer | Per-row `Override ▾`; global verbs in footer |
| Full-width footer buttons stacked | Compact button group right-aligned |
| Body scrolls past the header | Sticky header + body scroll + sticky footer |
| `<Button>Accept</Button>` (bare verb) | `<Button>Accept report</Button>` (verb + object) |
| AI verdict styled as final decision | Clear "AI recommends" label + separate user action group |

---

## Component primitives in the DS

Use these instead of rolling custom modal scaffolding:

- `<DocumentReviewModal>` — for single-document review with tab strip
- `<SplitPaneReviewModal>` — for two-document compare (PO ⇄ ACK)
- `<DiscrepancyRow>` + `<DiscrepancyComparisonBlock>` — for the inner rows
- `<Dialog>` (Radix) — for confirmations and forms
- `<DropdownMenu>` — for the per-row `Override ▾`

See [`code-usage.md`](../code-usage.md) for the import paths.

---

## Source files

- `governance/rules/03-containers-and-cards.md` — surface tokens used by modals
- `governance/rules/04-buttons-and-actions.md` — action hierarchy applied here
- `Strata Design System/strata-ds/src/components/overlays/document-review-modal.tsx`
- `Strata Design System/strata-ds/src/components/overlays/split-pane-review-modal.tsx`
- `Strata Design System/strata-ds/src/components/application-ui/discrepancy-row.tsx`
