# Figma ↔ Design System · Ledger de mapeo

Registro obligatorio de cada elemento construido en Figma. **Una fila se llena ANTES de construir**
(gate D8 del plan). Sin fila, el componente no está hecho.

Es el artefacto que hace la librería reutilizable: cada pieza queda trazada a su componente del DS,
a su fuente en código, a los tokens que consume, y con la desviación registrada para arreglarla del
lado del código.

**Archivo Figma:** `Strata Dealer Experience` · `MXoE4BJ0GpMn0TvChOhxWD`
**Fuente canónica de componentes:** `src/app/data/components-data.ts`
**Fuente canónica de tokens:** `src/styles/tokens/variables.css`
**Consumidor que valida:** `strata-projects/config-evolution/expert-hub`

Leyenda de estado: ⬜ pendiente · 🔨 en construcción · ✅ construido y verificado

---

## Auditoría de alineación · 2026-08-19

Diff automatizado de **cada** variable de Figma contra el Design System en disco — valor resuelto,
destino del alias, `codeSyntax`, scopes y descripción.

| Chequeo | Resultado |
|---|---|
| Primitivas presentes | **156 / 156** |
| Semánticas presentes | **43 / 43** |
| Valores que no coinciden | **0** |
| Alias que apuntan a otra primitiva | **0** |
| Variables faltantes | **0** |
| Variables sobrantes | **0** |
| Sin `codeSyntax` WEB | **0** |
| Con scope `ALL_SCOPES` (contamina los pickers) | **0** |
| Semánticas sin descripción | **0** |
| Familias tipográficas en text styles | **solo Inter** |
| Effect styles | 7 (`shadow/sm`…`2xl`, `inner`) |
| Fills/strokes sin bindear en los componentes construidos | **0 de 207 paints sólidos** |
| Repo · `npm run tokens:figma:check` | ✅ al día |
| Repo · `npm run validate:tokens` | ✅ 38 pasadas, 0 fallos |

**Pendiente de limpieza:** sigue viva la colección heredada `Collection 1` (19 vars, modo
"Dark Mode") porque 400+ nodos de la página Screens están bindeados a ella y a 9 variables remotas
de `UI Reps`. Se elimina al final, cuando las pantallas estén reconstruidas — borrarla antes
despintaría el diseño existente.

**Nota de método:** la primera corrida marcó 4 falsos positivos (`FontFamily/*` como "extra") por un
error de transcripción en el script de auditoría, no del archivo. Verificadas aparte: las 4 existen,
con el valor y los scopes correctos.

---

## 🗂️ Organización de la página `🧩 Components` · atomic design (2026-08-20)

Se reorganizó porque los componentes se montaban unos sobre otros — `OrderbahnGrid`, `Navbar`,
`DataListTable` y `KanbanFunnel` se pisaban, y `DocTypeChip` y `ResolutionPill` estaban en la
**misma coordenada exacta**.

Las dos secciones anteriores (`Library candidates` / `Product-specific`) se sustituyeron por
**cuatro secciones por nivel atómico**, de izquierda a derecha:

| Sección | Contenido | Qué entra |
|---|---|---|
| ⚛️ **1 · Atoms** | 14 sets + 166 iconos | Lo indivisible: `Button` `Badge` `StatusBadge` `PriorityBadge` `DocTypeChip` `ResolutionPill` `Input` `Checkbox` `Switch` `RadioButton` `Select` `Avatar` `ProgressRing` `DateRangeSegmented` |
| 🧬 **2 · Molecules** | 22 sets + 5 sueltos | Composiciones cortas: navegación (`Breadcrumb` `Tabs` `ViewToggle` `Pagination` `FunnelTabs` `FunnelStepper`), retroalimentación (`Banner` `FeedbackToast` `EmptyState` `OrderbahnSyncBanner`), entrada (`Dropzone` `Calendar` `FilterPanel` `FilterPills`), barras (`DataListToolbar` `OrderbahnGridToolbar` `BulkActionBar`), menús (`ViewMenu` `ViewSelectDropdown`) y las piezas de preflight (`FieldRow` `AiSuggestionBlock` `KnownValuesPicker` `KpiCallout` `StatusLegend` `UnmappedNotice` `CoercionFix`) |
| 🦠 **3 · Organisms** | 10 sets + 2 sueltos | Ensamblajes completos: `Navbar` `OrderbahnGrid` `OrderbahnGridState` `DataListTable` `DataListCard` `KanbanFunnel` `ActionCenter` `PdfViewer` `OcrDocCard` `ObjectFieldGroup` `PublishingOverlay` `PublishedView` |
| 🪟 **4 · Overlays** | 4 sets + 6 sueltos | Lo que se monta encima de una pantalla: `Dialog` `DocumentReviewModal` `DocumentPreviewModal` `PdfPreviewModal` `PreflightSyncModal` `ShareRecordModal` `UserFeedbackDetailModal` `FeedbackComposerModal` `UploadDocumentModal` `DocumentDeprecationModal` |

**El eje promotable / atado-a-app no se perdió.** Dentro de cada sección el orden es deliberado:
primero los candidatos a subir al DS, después los atados a Expert Hub o Quote Converter. Se conserva
la información sin necesitar un segundo eje de secciones, que era lo que producía el desorden.

**Verificado:** 63 componentes colocados, **0 solapamientos** dentro de cada sección, 0 huérfanos
fuera de las cuatro, y la leyenda dentro de los límites de su contenedor (antes estaba en `y = −230`,
o sea fuera). Se retiró de la leyenda la advertencia sobre la sección `🔴 LEGACY`, que ya no existe.

---

## 📤 Revisión previa a publicar la librería (2026-08-20)

**El team `Strata` pasó a plan Pro.** El plan registraba «Starter → sin publicar librerías y sin modos
de variables». Eso ya no aplica: **se puede publicar y se pueden usar modos**.

### Preparación hecha

| Qué | Estado |
|---|---|
| 63 componentes renombrados con ruta atómica (`1 Atoms/Button`, `4 Overlays/Dialog`…) | ✅ El panel de Assets agrupa por la ruta del **nombre**, no por secciones — sin esto se publican 63 entradas planas |
| Descripciones | ✅ 63/63 componentes · 50/50 semánticos · 157/157 primitives |
| Colecciones renombradas | `Strata · 1 Primitives · paleta · no bindear directo` y `Strata · 2 Semantic · usar estos` |
| **Modo `Dark`** | ✅ Añadido a los 50 semánticos · 41 aliaseados a un primitive, 2 en valor crudo (`card` `#0B0F1A` y `popover` `#0F1320`, sin primitive equivalente), 7 `-soft` derivados |
| Paints bindeados | 4.994 sólidos · **38 sueltos corregidos** · quedan 8 (ver hallazgo 3) |

### Hallazgos del diff Figma ↔ CSS

**1 · `input-background` no coincidía.** CSS `#F4F4F5`, Figma `#fafafa`. Se corrigió el CSS en la
reparación del colapso de superficies pero **no la variable de Figma**. Ya alineado.

**2 · Cinco tokens llevaban hex crudo en vez de aliasear.** `muted` `secondary` `accent`
`sidebar-accent` `input-background` tenían el valor literal mientras todos los demás aliasean un
primitive. Rompía la razón de ser de la rampa. Ahora los cinco aliasean **`zinc-75`**.

**3 · ✅ Faltaban dos superficies semánticas — resuelto.** El modo oscuro las delató: eran los únicos
8 paints sin bindear y las únicas dos filas ilegibles en dark.

**El hallazgo bueno: no hacía falta inventar un token de hover.** `accent` **ya era ese rol** —
es el `hover:bg-accent` de shadcn— pero valía exactamente lo mismo que `muted`, así que un hover no se
distinguía de una fila cebra. Solo se usaba 4 veces, y las cuatro en nodos de hover (`item`, `day`),
lo que confirmó el diagnóstico.

| Token | Claro | Oscuro | Rol |
|---|---|---|---|
| `accent` *(revalorado)* | `zinc-150` `#E8EAEC` | `zinc-850` `#1E2A3A` | **Superficie de hover.** En claro baja un paso desde `card`; en oscuro **sube** un paso desde `muted` |
| `primary-soft` *(nuevo)* | `#f8faef` | `#272f1e` | Lavado de primary para superficies **seleccionadas**. Es el `bg-primary/5` del código |
| `primary-tint` *(renombrado)* | `#cfe186` | `#4a5a28` | Antes `primary-foreground-soft`. El nombre engañaba: su valor es un tinte de **primary**, no del foreground |

Dos peldaños nuevos de paleta los sostienen: **`zinc-150`** y **`zinc-850`**. Mismo criterio que
`zinc-75`: se añade a *primitives*, los nombres semánticos no cambian.

**Resultado: 0 paints sin bindear en los 4.994 de la librería**, y el modo oscuro voltea entero sin
tocar una sola pantalla.

**4 · La familia `-soft` solo vivía en Figma.** Los 7 tokens pre-mezclados no existían en
`variables.css` ni en `variables-dark.css` — se inventaron como parche porque Figma pierde la
opacidad de un paint bindeado al instanciar (D14). **Se llevaron al CSS en ambos modos**, con sus
valores oscuros derivados al 15% sobre `card`. Diseño y código ya usan el mismo nombre y el mismo valor.

**5 · `primary-foreground-soft` está mal nombrado.** Su valor es verdoso (`#cfe186`), o sea un tinte
de `primary`, no de `primary-foreground` (que es casi negro). El nombre engaña; de hecho me hizo
usarlo por error en el modal de deprecación. Candidato a renombrarse a `primary-soft` — que es
justamente el token que falta en el hallazgo 3.

### Lo que NO se puede hacer desde aquí

**Publicar es una acción manual de la UI de Figma.** El Plugin API no expone publicación. Los pasos:
`Assets` → menú de libro → `Libraries` → pestaña del archivo → **Publish**, revisando el diff que
Figma muestra y escribiendo un mensaje de versión.

**Nota aparte:** el archivo tiene 8 librerías de comunidad suscritas (Material 3, Simple Design
System, los kits de Apple) que no usa nada de nuestro trabajo. Ensucian el panel de Assets para quien
entre. Quitarlas también es acción de UI.

---

## Foundations

| Elemento | Fuente DS | Estado | Notas |
|---|---|---|---|
| `Strata · Primitives` (156 vars) | `variables.css` | ✅ | Sembrado desde `strata-tokens.figma.json`. `codeSyntax` WEB en cada variable |
| `Strata · Semantic` (43 vars) | `variables.css` | ✅ | 42 aliasadas a primitivas; solo `popover` en hex crudo. Modo único `Light` |
| Effect styles (7) | `--shadow-*` | ✅ | `shadow/sm`…`2xl` + `inner`. Radius Figma = blur CSS 1:1 |
| Text styles (32) | `fonts.css` | ✅ | Solo Inter. Ver §Desviaciones tipográficas |

---

## Lote 1 · Átomos

| Elemento (Figma) | Componente DS | Fuente en código | Tokens que consume | Variantes | Desviación detectada | Estado |
|---|---|---|---|---|---|---|
| `Button` | **`Button`** | `components/application-ui/button` | `bg-primary`, `text-primary-foreground`, `bg-secondary`, `bg-destructive`, `text-destructive` | `variant`: default·secondary·destructive·outline·ghost·link · `size`: sm·md·lg·icon | El `button.tsx` real usa `bg-brand-300 dark:bg-brand-500` — viola LAW 4 y 5, y su propio anti-patrón *"Never hardcode bg-brand-300 directly"*. Figma dibuja `bg-primary`. Además la variante `link` usa `foreground` + subrayado: `text-primary` sería brand-300 sobre claro = 1.8:1, prohibido por LAW 2 | ✅ 72 variantes (variant ×6 · size ×4 · state ×3) |
| `Badge` | **`Badge`** | `components/application-ui/badge` | `bg-status-*/10` (soft fill) + `text-status-*` | `variant`: default·secondary·destructive·outline·success·warning·info·ai · `size`: sm·md | El `badge.tsx` real expone 19 colores crudos de Tailwind (orange, teal, cyan, purple…) que **no tienen token**. Figma implementa solo las 8 variantes documentadas | ✅ 16 (8 × sm·md) |
| `StatusBadge` | **`StatusBadge`** | `components/application-ui/status-badge` | `bg-status-success`, `bg-status-error`, `bg-status-warning`, `bg-status-ai` | `status`: active·inactive·pending·error·warning·success·ai | **Resuelve la inconsistencia del pill.** El DS ya define la forma "dot + label"; en prod hay 3 formas distintas (`rounded-md` en OCR, `rounded-full` en Comparisons, tamaños mezclados). Anti-patrón del DS: *"Never use inline green/red dots with hardcoded bg-green-500"* | ✅ 7 estados |
| `PriorityBadge` | **`PriorityBadge`** | `components/application-ui/priority-badge` | `bg-status-error/10` (critical), `bg-status-warning/10` (high), `bg-status-info/10` (medium), `bg-muted` (low) | `priority`: critical·high·medium·low | `FeedbackBoard.tsx:324` implementa esto a mano con `bg-amber-500/10 text-amber-600` y `bg-blue-500/10`. Solo `Critical` usa el token correcto | ✅ 4 niveles |
| `Input` / `SearchInput` | `Input` | `components/forms/input` | `bg-input-background`, `border-input`, `ring-ring`, `text-muted-foreground` | `type`: text·email·password·number·search·url · `size`: sm·md · `state`: default·focus·filled·disabled | — | ✅ 16 (Type default·search × sm·md × 4 estados) |
| `Checkbox` | `Checkbox` | `components/forms/checkbox` | `bg-primary`, `text-primary-foreground`, `border-border` | `state`: blank·checked·indeterminate·disabled | Donante: UI Reps (solo rebind) | ✅ 4 estados |
| `RadioGroup` | `RadioGroup` | `components/forms/radio-group` | `bg-primary`, `border-border` | `state`: unselected·selected·disabled | Donante: UI Reps | ✅ 3 estados · ⚠️ no documentado en el DS |
| `Switch` | `Switch` | `components/forms/switch` | `bg-primary`, `bg-muted` | `state`: on·off·disabled | Donante: UI Reps (`Toggle`) | ✅ 3 estados |
| `Avatar` | `Avatar` | `components/application-ui/avatar` | `bg-muted`, `text-foreground` | `size`: xs·sm·md·lg·xl · `shape`: circle·square · `type`: image·initials | **Decidido:** los 8 gradientes determinísticos de `teamMembers.ts` quedan **fuera del sistema** — son decoración, no token. En Figma se dibujan como fills directos en la variante `initials`, documentados como excepción consciente a LAW 1 | ✅ 20 (5 sizes × 2 shapes × initials·image) |
| `DocTypeChip` | *(no existe en el DS)* | `components/ocr/DocTypeChip.tsx` | `bg-status-info/10` (PO), `bg-status-warning/10` (ACK), `bg-status-ai/10` (Quote), `bg-status-success/10` (Invoice) | `type`: Purchase Order·Acknowledgment·Quote·Invoice · `size`: sm·md | Product-specific. Hoy usa blue/amber/purple/emerald crudos | ✅ 8 (4 tipos × sm·md) |
| Iconos (154) | — | `lucide-react` (88) + `@heroicons/react` (69) | `foreground`, `muted-foreground` | por nombre de icono | **Corrección al plan:** NO se traen de UI Reps — ese set es de familia Material (`add`, `more_vert`, `local_shipping`) y el producto no lo usa. Se generan desde los SVG de los paquetes instalados. **Decidido: ambos sets**, para ser fiel al estado actual. Deuda registrada: el producto usa dos librerías a la vez y la dirección del sistema es lucide (ver `expert-hub/DS-VIOLATIONS.md` §3.3) | ✅ 154 (85 lucide + 69 heroicons) · 0 paints sin bindear |

> ⚠️ **`StatusPill` no se construye.** Era un nombre inventado; el DS ya cubre esa forma con
> `StatusBadge`. Ejemplo de por qué el gate D8 existe.

---

## Lote 2 · Moléculas

| Elemento (Figma) | Componente DS | Estado |
|---|---|---|
| `Breadcrumb` | `Breadcrumb` | ✅ 2 (Depth 2·3) |
| `Tabs` | `Tabs` (default·pills·underline) | ✅ 3 variantes |
| `FilterPills` | `FilterPills` | ✅ 2 (active·inactive) |
| `FunnelTabs` | `FilterPills` + `Tabs` | ✅ 4 (Count 5·7 × Badge single·dual) |
| `DataListToolbar` | `DataListToolbar` | ✅ 2 (full·compact) |
| `ViewToggle` | `ViewToggle` | ✅ 6 · ⚠️ DS usa bg-foreground invertido; expert-hub usa bg-muted |
| `Pagination` | `Pagination` | ✅ 2 (short·long) |
| `EmptyState` | `EmptyState` | ✅ 2 (card·dashed) |
| `FeedbackToast` | `FeedbackToast` | ✅ 5 variantes |
| `Banner` / `InfoBanner` | `Banner`, `InfoBanner` | ✅ 10 (5 × dismissible) |
| `Select` / `Combobox` | `Select`, `Combobox` | ✅ Select 3 (default·open·disabled) |
| `Calendar` | `Calendar` | ✅ 3 (single·range·multiple) |
| `Dialog` | `Dialog` | ✅ 5 tamaños |
| `FileUploadModal` (dropzone) | `FileUploadModal` | ✅ Dropzone 4 estados |

## Lote 3 · Organismos

| Elemento (Figma) | Componente DS | Estado |
|---|---|---|
| `Navbar` | `Navbar` / `StrataTopBar` | ⬜ |
| `PageLayout` / Shell | `PageLayout`, `PageHeader` | ⬜ |
| `DataListTable` | `DataListTable` | ⬜ |
| `DataListCard` | `DataListCard` | ✅ 3 (default·hover·selected) |
| `KanbanFunnel` | `KanbanFunnel` | ⬜ |
| `KpiCard` | `KpiCard` | ✅ 6 (trend ×3 × card·ticker) |
| `FilterPanel` | `FilterPanel` | ⬜ |
| `BulkActionBar` | `BulkActionBar` | ✅ 2 (inline·floating) |
| `ActionCenter` | `ActionCenter` | ⬜ |

## Lote 4 · Preflight (product-specific)

| Elemento (Figma) | Equivalente en el DS | Estado |
|---|---|---|
| `ResolutionPill` | *(no existe)* | ✅ 7 estados |
| `FieldRow` | `FieldValueRow` cubre solo label/valor | ✅ 6 (densidad × resolución) |
| `ObjectFieldGroup` | *(no existe)* | ✅ 2 (collapsed·expanded) |
| `AiSuggestionBlock` | `ConfidenceIndicator` cubre el % | ✅ 4 estados |
| `KnownValuesPicker` | *(no existe)* | ✅ |
| `CoercionFix` | *(no existe)* | ✅ |
| `UnmappedNotice` | *(no existe)* | ✅ |
| `FunnelStepper` | **`FunnelStepper`** ← el gate evitó duplicarlo | ✅ 3 · en Library candidates |
| `ProgressRing` | `Progress` es lineal | ✅ 3 · en Library candidates |
| `SegmentedBar` + `StatusLegend` | *(no existe)* | ✅ |
| `KpiCallout` | *(no existe)* | ✅ 2 (PO·ACK) |
| `OrderbahnSyncBanner` | *(no existe)* | ✅ 3 estados |
| `PublishingOverlay` | *(no existe)* | ✅ |
| `PublishedView` + `StatCard` | *(no existe)* | ✅ |
| `DerivedStatusBadge` | `StatusBadge` (distinto vocabulario) | ⬜ |
| `MultiselectCombo` · `BooleanEditable` · `PreflightSummaryPopover` | — | ⬜ |

---

## Fase 3A · OCR Tracking contra producción (2026-08-19/20)

Producción (`gostrata.app/expert-hub/ocr`) **divergió del código local de `expert-hub`**. Donde hay
conflicto manda producción para el chrome y el código para la anatomía.

| Elemento (Figma) | Componente DS | Fuente | Tokens | Variantes | Desviación detectada | Estado |
|---|---|---|---|---|---|---|
| `FunnelTabs` (Count=7) | *(no existe en el DS)* | producción | `primary`, `primary-foreground`, `muted` | Count 5·7 × Badge single·dual | **Los 7 estados de producción no son los del código**: `Processing · To Review · In Review · Ready to Sync · Completed · Failed` vs `Ingesting · Needs Attention · Awaiting Expert · In-progress · Reviewed · Completed` | ✅ |
| `KanbanFunnel` | *(no existe)* | producción | `foreground`, `border`, `muted-foreground` | default · with-empty | Producción tiene **4 columnas**, no 6; `Completed` y `Failed` son solo tabs de filtro. Títulos **neutros**, no coloreados por etapa como el código. **No existe tab `Deprecated`** | ✅ |
| `OcrDocCard` | *(no existe)* | producción + `OCRTracking.tsx` | `card`, `border`, `foreground`, `muted-foreground`, `status-*-soft` | Selected × HasCompare | Producción no muestra *Compare linked documents*; el 5º icono (`Mark as Completed`) es **alternativa del último**, no un icono extra. Columnas a 300px (`min-w-[300px]`) | ✅ |
| `DateRangeSegmented` | *(no existe)* | **solo producción** | `primary`, `primary-foreground`, `card`, `border`, `muted-foreground` | Active=range · Active=full | **No existe en el código local ni en `components-data.ts`.** Par de pills `Last 30 days` / `Full history` | ✅ |
| `lucide/Columns3` | — | **solo producción** | `foreground` | — | El código usa `LayoutGrid` (`OCRTracking.tsx:375`); producción usa un icono de columnas. **No venía en el set extraído de `lucide-react`** — dibujado a mano | ✅ |
| `Badge` · propiedad `Icon` | `Badge` | `OCRTracking.tsx:514–528` | `status-*`, `status-*-soft` | Variant ×8 × Size ×2 × **Icon bool** | **Gate D8 evitó un componente inventado**: el pill de *Review Status* no necesita un `ReviewStatusPill`; en código es `<Badge variant="success"><CheckCircle2/>…</Badge>`. `components-data.ts:102` no documenta que `Badge` acepte icono | ✅ |
| `UploadDocumentModal` | *(no existe)* | `components/ocr/UploadDocumentModal.tsx` | `card`, `border`, `background`, `muted`, `primary`, `status-success-soft`, `destructive-soft` | Step ×5 | Los pasos reales son **`select · dropzone · review · uploading · complete`** — el plan había supuesto otros cinco. Panel `max-w-xl` (576px). El paso `review` incluye la fila de archivo inválido (>10MB) | ✅ |

**Modales de OCR (Etapa 5):**

| Elemento (Figma) | Componente DS | Fuente | Variantes | Nota | Estado |
|---|---|---|---|---|---|
| `DocumentReviewModal` | **`document-review-modal`** ✅ existe en el DS | `components-data.ts:1501` + `ocr/DocumentReviewModal.tsx` | Tab=header-fields · line-items | Se construyó el **shell del DS**, no una copia del de expert-hub. Reusa `FieldRow` en el cuerpo | ✅ |
| `DocumentDeprecationModal` | *(no existe)* | `components/DocumentDeprecationModal.tsx` | — | 3 razones de `REASON_OPTIONS`: Manually Archived · Duplicated · Other | ✅ |
| `FeedbackComposerModal` | *(no existe)* | `feedback/FeedbackComposerModal.tsx` | State=empty · with-attachment | Category obligatoria, Severity opcional. El bloque de adjunto es la base del componente de attachments de la Fase 4 | ✅ |
| `PreflightSyncModal` | *(no existe)* | `ocr/PreflightSyncModal.tsx` | — | **Pendiente.** Es split-pane con secciones colapsables; se construye junto al subsistema preflight | ⏳ |

**Evidencia nueva del colapso de superficies** (ver la sección del hallazgo más abajo): al construir
el estado de carga, las barras de skeleton en `bg-muted` sobre una card **desaparecen** — `muted` y
`card` son ambos `#FAFAFA` en claro. Hubo que usar `border` (`#D0D4D8`). No es un caso teórico: es
un componente que no se puede construir con el token que le corresponde semánticamente.

**Deuda de código detectada en esta fase** (va a `DS-VIOLATIONS.md`):

- `strata-ds/src/styles/theme.css:11` mapea `--primary: #27272a` (zinc). **Ningún proyecto usa ese
  valor**: `expert-hub/src/styles/theme.css:11` hace `--primary: var(--color-primary)` = `#E6F993`.
  El DS canónico documenta un primary que no existe en producción.
- `components-data.ts:1412,1421` documenta *row selection* en `DataListTable`, pero
  `data-list-table.tsx` no tiene checkbox, ni `selectedKeys`, ni `onSelectionChange`.

---

## Fase 6-A · Preferencias de grid por usuario (US-GP) · 2026-08-20

Origen: documento de historias de usuario del equipo de Strata. Solo entra a Figma lo que tiene
consecuencia visible; el contrato de base de datos (índices parciales, `savedNameNormalized`,
`gridName`, el enum `documentType`, los NFR) queda registrado aquí como contexto y **no se dibuja**.

| Elemento | En el DS | Tokens | Variantes | Desviación / decisión |
|---|---|---|---|---|
| `OrderbahnGridToolbar` · `State=unsaved` | *(no existe en el DS)* | `primary` / `primary-foreground` en Save · `border` en el contorno de Save as new · `muted-foreground` en Discard | — | **Se añadió `Discard` y se etiquetó `Save as new`.** AC-5b exige que las tres opciones estén disponibles; antes solo había `Save` y un `+` sin etiqueta |
| `OrderbahnGridToolbar` · `State=pinned` | *(nueva)* | `status-info-soft` / `status-info` | — | Badge **«Opens by default»** dentro del selector. AC-7 · US-06 |
| `ViewMenu` | *(no existe en el DS)* | `popover`, `border`, `foreground`, `muted-foreground`, `destructive` | `State=unpinned` · `State=pinned` | Menú `⋮` de la vista: Rename · Duplicate · Set as default/Unpin · Delete. Implementa el hallazgo **R2** de la auditoría: reemplaza los cinco controles apilados de OrderBahn |
| `DeleteViewConfirm` | reusa la forma de `SaveNewPreference` | `card`, `border`, `destructive`, `destructive-foreground` | — | Único modal de confirmación que se conserva. Regla 04 del DS: confirmar solo lo destructivo |
| Estado de conflicto del campo `Name` | `Input` (DS) + mensaje | `status-error` en borde, icono y texto | — | AC-4 exige que el rechazo **nombre el campo**. El DS no tenía estado de error documentado para este input |

**Jerarquía de las tres acciones de guardado.** `muted` y `card` son ambos `#FAFAFA`, así que un
botón relleno de `muted` sobre el toolbar es invisible. Por eso `Save as new` va **contorneado con
`border`** y `Discard` va fantasma. Queda: Save (primario lima) › Save as new (contorno) ›
Discard (fantasma). Es el mismo colapso de superficies ya registrado más abajo.

**Hueco del set de iconos — ✅ cerrado (2026-08-20).** Faltaban los glifos de pin, así que
`Set as default` y `Unpin` usaban prestados `CheckCircle2` y `XCircle`. Se sembraron
**`lucide/Pin` y `lucide/PinOff`** con los paths **verbatim de `lucide-react` v0.562.0**
(`node_modules/lucide-react/dist/esm/icons/pin.js` y `pin-off.js`), no dibujados a mano — la lección
del icono de luna. El set pasa de 164 a **166 iconos** y `ViewMenu` ya usa los correctos.

> El generador `scripts/figma-icons.mjs` solo extrae los iconos que el código **usa**, así que no los
> habría recogido: `Pin` todavía no aparece en ningún proyecto. Cuando el grid se implemente y los
> use, el generador los tomará solo.

### `My feedback` · la página de estado (2026-08-20)

Construida contra `quote-converter/src/pages/FeedbackStatusPage.tsx` y poblada con los tres tickets
de `src/feedback/seedUserFeedbacks.ts` — descripciones, ids, categorías, severidades y estados
literales del seed, no inventados.

| Zona | Anatomía |
|---|---|
| Cabecera | `MessageSquarePlus` + `My feedback` + badge de no leídos en `destructive` · bajada explicando qué es |
| Toolbar | tabs `All · Open · Resolved` con contador cada uno, sobre `muted`; el activo va en `card` · buscador |
| Tabla | `Description` (con punto rojo de no leído y meta `id · N attachment`) · `Category` · `Severity` · `Status` · `Last update` · `Actions` |
| Vacío | tile `muted` con `Inbox` + *You haven't sent any feedback yet* y la instrucción de usar el botón del navbar |

**Variante de navbar nueva: `Product=dealer, ActiveTab=none`.** `My feedback` **no es un tab** — se
llega desde el botón de feedback —, así que ningún pill debe estar encendido. Antes se veía
`Transactions` activo, que era mentira. La variante deja los tres tabs en icono, sin píldora.

**En la pantalla vacía se oculta el badge de no leídos**: no se puede tener notificaciones sin haber
enviado nada.

### Refinado contra producción (2026-08-20)

Capturas de `gostrata.app/expert-hub/feedback` y `/my-feedback`.

**`FeedbackComposerModal` ya coincidía** — mismo título y bajada, las cuatro categorías
(`Bug · Suggestion · Data Quality · Other`), las tres severidades con su texto de ayuda, el
`0/4000`, y los límites literales de adjuntos (*Max 10MB (images) · 100MB (video) · up to 5 files ·
PNG, JPG, PDF, WEBM, MP4, MOV*). **Severity va con asterisco: es obligatoria**, lo que confirma la
divergencia ya registrada entre producción y el código local, que la marca opcional.

**`My feedback` tenía dos diferencias, ya corregidas:**

| | Antes | Ahora, como producción |
|---|---|---|
| Título y bajada | dentro de la card | **fuera**, sobre el fondo de página, encima de la card |
| Tab activo | relleno `card` | relleno **`primary`** (lima) |

**Estado de error añadido** — producción lo muestra tal cual: *Failed to load feedback* ·
*Unauthorized user. Invalid or expired backend_jwt token*, con marca circular en `status-error-soft`.
Es el tercer estado de la lista, junto al poblado y al vacío.

> El **Feedback Board** de las capturas (9 tabs: All · In Jira · Submitted · Triaged · Assigned ·
> Resolved · Closed · Dropped · Duplicated) sigue **fuera de alcance** por D16: es superficie de
> administración interna, no del dealer.

**Sección `✅ NEW · Feedback (dealer)` · 5 pantallas:** poblada · vacía · **dropdown del navbar**
(los dos items exactos de `Navbar.tsx:143–202`, `Send feedback` y `My feedback Status` con su badge,
anclado bajo el botón) · **detalle del ticket**.

| Componente nuevo | Nota |
|---|---|
| `UserFeedbackDetailModal` | 1000px. Cabecera con chips de estado/categoría/severidad · aside izquierdo con el **contexto desde el que se reportó** (documento, tipo, estado en ese momento, experiencia, adjunto) · hilo a la derecha con los mensajes del usuario en `primary` y los de soporte en `muted`, más el composer |

Los datos salen literales de `FB-SEED-001`: el reporte de las dos líneas perdidas en el PO-1029 de
Steelcase y la respuesta de Sofía Ramírez.

### Visores de documento — el backlog que era dependencia (2026-08-20)

| Componente | Estado | Nota |
|---|---|---|
| `PdfViewer` | ya existía | Átomo net-new del DS: toolbar con nombre, zoom y Export; lienzo con la hoja |
| `DocumentPreviewModal` | **ya existía** (1160×700) | Split pane · **es el detalle del ACK (D24)** · cabecera con contadores y % · pie con *94% average confidence*, *Open original PDF* y *Create record* |
| `PdfPreviewModal` | **ya existía** (1240×720) | El archivo original + *Open in new tab* y *Download* |

> ⚠️ **Error registrado (2026-08-20).** Ambos se dieron por inexistentes y **se reconstruyeron por
> duplicado**. La causa: la búsqueda escaneó solo `COMPONENT_SET` y estos son **componentes sueltos**,
> así que no aparecieron. Los duplicados se eliminaron y las pantallas F27/F28 se reapuntaron a los
> originales, que además eran más completos.
> **Regla:** al comprobar si un componente existe hay que buscar `['COMPONENT', 'COMPONENT_SET']`,
> nunca solo sets.

**Lo que sí sobrevivió del intento duplicado**, portado a los originales: los campos ahora usan el
esquema canónico del ACK (`Acknowledged Ship Date` · `Ship Via` · `Freight Terms` ·
`Vendor Order Number`) en vez de cuatro *Payment terms* idénticos, y **el nombre del archivo coincide
en cabecera y visor** — decía `ST-683-VERIFY-PO` dentro y `AIS Furniture` fuera. En
`PdfPreviewModal` el nombre repetido dentro del visor se oculta: la cabecera ya lo nombra.

### Compartir y adjuntos — los dos últimos puntos abiertos (2026-08-20)

**`ShareRecordModal`** · desbloqueado por una captura de producción. El primer icono de `Actions`
copia un **deep link al registro** y lo reporta con un toast. El diálogo muestra la URL para poder
leerla y copiarla a mano, no solo por el botón.
Producción añade una cuenta regresiva —*«This message will disappear in … 4 seconds»*— que **no se
replica**: un toast que anuncia su propia caducidad no aporta nada (hallazgo **R4**).

**La misma captura corrige el inventario de `Actions`.** Los cuatro iconos son
**compartir · ojo · descargar · más (+)**. El tercero se había anotado como *ver documento* y es
**descargar**. El cuarto sigue sin identificar.

**Adjuntos · en Transactions no se adjunta.** Los archivos llegan por OCR. Coherente con
`UI-Dealer/src/AckDetail.tsx:822` y con D18. Verificado que no hay ninguna afordance de attach en el
grid, el toolbar, los menús, el selector, los dos visores ni el modal de compartir; la regla quedó
escrita en la descripción de `OrderbahnGrid` y `DocumentPreviewModal`.
→ **El `+` de OrderBahn no es adjuntar** en la Dealer Experience.

> Los adjuntos **sí siguen en Feedback** (`FeedbackComposerModal` y el detalle del ticket): son
> evidencia del usuario sobre un problema, no parte del documento del vendor. Dos cosas distintas.

### Modales de OCR (2026-08-20)

| Componente | Nota |
|---|---|
| `DocumentDeprecationModal` | Las tres razones de `REASON_OPTIONS` (`DocumentDeprecationModal.tsx:29-33`): Manually Archived · Duplicated · Other. **GAP:** el código tiñe la opción elegida con `bg-primary/5` y el DS no tiene `primary-soft` pre-mezclado, así que la selección la cargan el borde lima y el radio sobre `muted` |
| `PreflightSyncModal` | **Reusa la cáscara de `DocumentReviewModal`** — misma cabecera con *View Original PDF*, mismos dos tabs, mismas secciones campo/valor. Lo propio del preflight es el colapsable **UNMAPPED FIELDS** con su contador (`PreflightSyncModal.tsx:311-316`): valores que el vendor mandó y para los que Strata no tiene campo. Esa es la razón de que esta pantalla exista antes de un sync | El toolbar del átomo conserva zoom y Export.

Ambos modales llevan en su descripción la regla que los gobierna: el dealer **no puede modificar**
un acknowledgement del vendor (`UI-Dealer/src/AckDetail.tsx:822`), así que son superficies de lectura
y decisión, no de edición.

### Bloque Data en contexto (etapa 7-E · 2026-08-20)

Los nueve flujos de datos pasaron de esquema a pantalla completa. Se reusó todo lo que existía:

| Flujo | Cómo se resolvió |
|---|---|
| F10 filtrar | `FilterPanel` `State=expanded` anclado bajo su control, retargeteado a **Problem Code** con los valores reales del grid · `FilterPills` en el resultado · contador y pie a `Showing 1–2 of 2 · filtered from 149` |
| F11 buscar | override de texto del campo a `Knoll` con relleno `foreground` (no placeholder) + chip `1 of 1 match on this page` |
| F12 seleccionar | `BulkActionBar` `Variant=floating`, retargeteado a *acknowledgements* · toast en el resultado. **Se corrigieron las leyendas** para decir lo que la pantalla enseña de verdad |
| F13 densidad | variantes `Density` del propio `OrderbahnGrid` (standard → compact) + menú de tres alturas |
| F14 exportar | menú CSV/XLSX con su línea de ayuda + toast nombrando el archivo |
| F15 borrados | **instancia de `Switch` `State=on` junto al control** — es el arreglo del hallazgo **R6** hecho visible: el control parece botón y es interruptor · una fila pasa a `Deleted` con su badge en gris |
| F16 paginar | menú `Rows per page` **abriendo hacia arriba** (vive en el pie) + pie a `Showing 101–149 of 149` |
| F19 agrupar | panel de agrupación punteado con el chip `Vendor Name` arrastrado dentro |
| F26 refrescar | `OrderbahnGridState` `State=loading` sustituye al grid + toast de datos frescos |

**Ninguno necesitó desprender el grid.** Marcar una fila como borrada se hizo por sobrescritura de
texto y de paint sobre la instancia, usando el valor resuelto del token (el gotcha 5 de más abajo).

### Poda por procedencia y reorganización (Fase 7 · 2026-08-20)

**Ocho flujos salieron por no venir del proyecto.** Se habían tomado del catálogo de capacidades del
grid genérico (Fancy UI Grid) usado para nombrar lo que una tabla puede hacer, y se colaron como si
fueran requisitos. Viven en `🅿️ Parked · from the generic grid documentation`, al final del archivo,
con la razón de cada uno escrita:

`F17` reordenar fila · `F18` cabecera de grupo · `F20` selección de bloque · `F21` editar celda ·
`F22` fill handle · `F23` master-detail · `F24` gráfica de selección · `F25` crear registro.

- `F21` y `F22` **contradicen una regla de negocio**: `UI-Dealer/src/AckDetail.tsx:822` dice que el
  dealer no puede modificar un acknowledgement del vendor.
- `F18` estaba construido en contexto y **hubo que retirarlo**: no aparece en ninguna captura de
  OrderBahn, solo en la documentación.
- `F25` sí se observó en OrderBahn, pero en la Dealer Experience el registro llega del OCR
  → **se eliminó `icon-btn/create-record` (el ⊕) de las cuatro variantes de `OrderbahnGridToolbar`**.

**`F19` se salvó de la poda**: venía de la documentación, pero §5.2 de US-GP persiste `groupModel`
con agregaciones, así que la spec lo convierte en requisito.

**Limpieza.** Se eliminaron 3 secciones LEGACY (2 en Screens, 1 en Components con 217 componentes),
4 páginas (`Development`, `Staging`, el separador y `Archive`), `Slice 1`, `image 4`, ~28 sets basura
y la colección `Collection 1` con sus 19 variables. Antes de borrar la sección LEGACY de Components
se recorrieron las 27 instancias del screen base hasta su componente maestro: cero dependencias.
El archivo queda en **4 páginas** y **2 colecciones de variables**.

**Reorganización.** La tira vertical de 5.200×25.648 pasó a **44.480×9.038**: cuatro bloques por
superficie del grid —`Columns & layout` · `Saved views` · `Data` · `Documents`— y ocho sub-columnas
de máximo 5 filas. Cada esquema de 760px bajó **debajo de su flujo** como `Detail · …`; los 12 que
no tienen versión en contexto llevan chip `SCHEMATIC ONLY`.

### Gestión de vistas — lo que faltaba (etapa 6-E)

| Elemento | En el DS | Decisión |
|---|---|---|
| `ViewSelectDropdown` | *(no existe en el DS)* | Lista de vistas guardadas del grid. **El encabezado del grupo declara el tipo de documento** (`ACKNOWLEDGEMENT VIEWS`), que es como el FR-01 se vuelve visible: las vistas de acknowledgements y las de purchase orders no se pueden confundir. La aplicada va con check sobre `primary`; la fijada lleva el badge *Opens by default* |
| `RenameView` | reusa la forma de `SaveNewPreference` | El campo abre con el nombre actual: se edita, no se reescribe |

**`Save` frente a `Save as new` (AC-5).** Son dos resultados distintos y por eso ocupan dos pantallas
de la misma fila: `Save` actualiza la misma vista —conserva su id y su fijada— y `Save as new` crea
una adicional dejando la original intacta.

**Aplicar una vista no la fija** (AC-7c): `G14.3` termina en `State=named`, nunca en `pinned`.

### Resiliencia — cuando la vista guardada ya no encaja (etapa 6-D)

| Caso | Cómo se ve | Regla |
|---|---|---|
| Columna inexistente (AC-9 · FR-08) | `Banner` `Variant=warning, Dismissible=true` dentro de la card, encima del toolbar: *«Restored without “Problem Code” — that column no longer exists. Everything else was applied.»* | Se **descarta la columna y se aplica el resto**. Nunca un error, nunca un grid en blanco |
| Versión de payload no soportada (AC-12) | `Banner` `Variant=error, Dismissible=true` + el toolbar en `State=default` | Cae a la **definición base** e **informa la versión concreta** (`v4` contra `v3`). La vista guardada **no se borra ni se sobrescribe** |

**Cirugía de columna.** `G10.2` y `G10.3` desprenden el grid (`OrderbahnGrid · detached — structural
variant`) y eliminan la celda de índice 7 en la cabecera y en las seis filas. Los 180px liberados se
reparten entre `Acknowledgement Number` y `Vendor Name` (+90 cada una) para que la tabla siga
ocupando los 1.472px de la card. Es el único modo de mostrar el descarte: quitar una columna no se
puede por sobrescritura de instancia.

### Portabilidad — exportar e importar (etapa 6-C)

| Elemento | En el DS | Decisión |
|---|---|---|
| `ViewMenu` · `Export view` · `Import view…` | — | **Importar vive en el mismo menú `⋮`**, no en una superficie propia. El `⋮` está pegado al selector, así que se lee como *gestión de vistas del grid*, no como acciones de una vista concreta: exportar actúa sobre la actual, importar añade una nueva. El menú queda en 6 items + 2 divisores, dentro del límite de la regla 09 |
| Modal de importación | **reusa `UploadDocumentModal` · `Step=dropzone`** | Instancia con textos sobrescritos y el chevron de retroceso oculto (importar no tiene paso previo). **No se creó un dropzone nuevo** |
| Rechazos de importación | **reusa `Banner` · `Variant=error, Dismissible=false`** (520px, encaja exacto en el modal de 576) | La instancia del modal **se desprende** para poder insertar el banner; la capa queda nombrada `ImportViewModal · detached — error state added` |
| `G07 · What the file carries` | — | Panel de documentación en dos columnas: qué viaja y qué **nunca** viaja. Es la garantía del AC-8 puesta donde el dev la ve |

**Los tres rechazos nombran la causa concreta**, nunca un error genérico: el grid esperado, el archivo
ilegible, o la versión exacta del payload (`v4` contra `v3`) que exige el AC-12.

**Exportar no ofrece Undo.** El AC-8 dice que la vista exportada queda sin cambios, así que no hay nada
que deshacer; el `Undo` del toast se oculta en `G07.3` y en `G08.3`.

### Cómo se representa la persistencia (etapa 6-B)

Figma no guarda estado entre pantallas, así que lo que el documento describe como *«se conserva»*,
*«al volver a entrar»* o *«desde otro dispositivo»* **se simula**, nunca se prototipa:

| Pieza | Qué es | Regla |
|---|---|---|
| `context-band` | Píldora de **contorno punteado** con texto de 10px en mayúsculas — `DEVICE A · SAVED AND PINNED HERE` | Va **encima del frame, fuera del chrome de la app**. El punteado es deliberado: nada punteado es UI real |
| `G12 · Resolution rule` | Panel que enuncia las tres reglas —fijada → última usada → definición base— y un bloque punteado *«Not drawn — behaviour the design assumes»* | Es documentación para devs, no una superficie del producto |

El chip de procedencia de estas dos filas dice **`SPEC · US-GP · SIMULATED`**, para distinguirlas de
las que sí son interacción real.

**Contexto de backend, para los devs (no se dibuja):** la clave canónica es
*(user, tenant, `documentType`, `gridName`)*. El diseño solo cubre `documentType = acknowledgement`
(D28) y `gridName = main`, porque la Dealer Experience solo maneja ACKs. Cuando el grid sirva a
purchase orders o invoices, los conjuntos de vistas son independientes: mismo nombre puede existir
en cada tipo sin conflicto.

---

## Desviaciones tipográficas registradas

| Token | Declara | Realidad | Resolución en Figma |
|---|---|---|---|
| `--fontFamily-sans` | Inter + system stack | Inter se carga de Google Fonts | ✅ Inter, 400/500/600/700/800 |
| `--fontFamily-brand` | `PP Monument Extended` | **No existe ningún archivo de fuente en el repo.** `fonts.css` apunta a `/fonts/PPMonumentExtended-*.woff2` y esa carpeta no existe → en producción cae a `sans-serif`. ⚠️ La copia disponible (`monument-extended-v3-0-font-family.zip`, befonts.com) trae licencia **"Personal Use Only"** — no cubre embeberla en el producto. La fuente es comercial de Pangram Pangram | Variable oculta de los pickers, valor Inter. Sin estilos `Brand/*`. **Decidido 2026-08-19: paridad con producción** — Figma y código muestran ambos Inter. La fuente está instalada localmente en la máquina de Diego pero NO se usa en el archivo: los `.otf` no pueden distribuirse y el MCP (Figma web, sin Font Helper) tampoco los ve |
| `--fontFamily-mono` | Stack de sistema | En Windows el navegador resuelve a **Consolas**. Ninguna de las 7 familias está disponible en Figma web | Variable oculta. Los IDs se dibujan en Inter; gap documentado |
| `--fontFamily-serif` | Georgia + stack | No lo usa el producto | Variable oculta |

---

## ✅ RESUELTO (2026-08-20) · el colapso de superficies era un bug de modo claro

El hallazgo de abajo se cerró. **No era una decisión de diseño pendiente: era una regresión.**

**La prueba.** Modo oscuro siempre tuvo la escalera de tres peldaños, y `theme.css` —el tema por
defecto del propio DS— también:

| Rol | dark (`variables-dark.css`) | shadcn (`theme.css`) | light **antes** | light **ahora** |
|---|---|---|---|---|
| `background` | `#02060C` | — | `#EBECEE` | `#EBECEE` |
| `card` | `#0B0F1A` | `#ffffff` | `#fafafa` | `#fafafa` |
| `secondary` · `muted` · `accent` · `input-background` · `sidebar-accent` | `#141E2C` | `#f4f4f5` | **`#fafafa` ← igual que card** | **`#F4F4F5`** |

**La causa raíz.** La rampa de Strata salta de `zinc-50 #fafafa` directo a `zinc-100 #EBECEE`, que
**es** `--color-background`. La familia recesiva no tenía ningún peldaño donde sentarse, así que la
aparcaron sobre `zinc-50` — encima de `card`. Por eso no producían separación.

**La corrección, y por qué se hizo así.** Se añadió **`--color-zinc-75: #F4F4F5`** al bloque de
*primitives* y se apuntaron los cinco roles recesivos a ese valor.

> **Los nombres semánticos no cambiaron.** Es la regla del contrato: los nombres semánticos son la
> API que consume el producto, los primitives son la paleta. Añadir un valor a la paleta no rompe a
> nadie; renombrar o duplicar un rol semántico sí. Crear un token paralelo tipo `surface-sunken`
> habría dado **dos nombres para un rol que ya tenía uno**, que es justo lo que un DS no debe hacer.

**Radio de impacto.** Cualquier superficie en `bg-muted` / `bg-secondary` / `bg-accent` /
`bg-input-background` en modo claro pasa de `#fafafa` a `#F4F4F5`. Nada se rompe: lo que era
invisible se vuelve visible. Modo oscuro no se tocó.

**Consecuencia en Figma:** el cambio se propagó solo a todos los paints bindeados —el selector de
vista, el buscador, la cabecera del grid, los botones de icono— sin añadir un borde. Los contornos
que había puesto en `Save as new` y `⋮` se conservan porque ahí sí son estilo de botón secundario,
no un parche.

---

## 🔍 Hallazgo original · seis superficies semánticas son el mismo color en modo claro

Detectado al construir `Calendar`: su relleno de rango (`bg-accent` sobre `bg-card`) es
**literalmente invisible**. Resolviendo los tokens en el modo Light:

| Token | Light | Dark |
|---|---|---|
| `card` | **#FAFAFA** | #0B0F1A |
| `accent` | **#FAFAFA** | #141E2C |
| `muted` | **#FAFAFA** | #141E2C |
| `secondary` | **#FAFAFA** | #141E2C |
| `input-background` | **#FAFAFA** | #141E2C |
| `sidebar` | **#FAFAFA** | #02060C |

En dark los seis se separan en tres niveles. **En light son uno solo.** Consecuencias directas:

- `bg-accent` como relleno de hover y de rango (lo que el DS documenta para `Calendar`) no se ve.
- `bg-muted/30` como fila hover de `DataListTable` sobre `bg-card` no se ve.
- `bg-secondary` para tarjetas anidadas dentro de `bg-card` no se ve — solo las separa el borde.
- El sidebar no se distingue de una tarjeta.

**No es un bug de tipeo: es deliberado.** `TOKEN_ARCHITECTURE.md` lo documenta — probaron `zinc-200`
para elementos internos, les pareció poco contraste, y decidieron `zinc-50` con borde `zinc-300`.
La jerarquía en light se sostiene **con bordes, no con superficies**.

**Lo que sí es un problema:** el DS sigue documentando `bg-accent` como "hover and range fill" y
`bg-muted/30` como "hover row", que en light no hacen nada. O el token cambia, o la documentación
debe decir que en claro la señal es el borde.

→ ~~**Decisión pendiente de Diego.**~~ En Figma se mantuvo el token fiel (`bg-accent`), con la nota
en la descripción del componente, porque arreglarlo es cambiar el Design System, no el archivo.

**✅ Resuelto (2026-08-26): cambia el token, no la documentación.** `accent` pasa de `#fafafa` a
`#E8EAEC` en claro, y la familia recesiva (`secondary` `muted` `input-background` `sidebar-accent`)
de `#fafafa` a `#F4F4F5`. Todas valían lo mismo que `--color-card`, así que un hover no se
distinguía de una fila cebra. Para sostenerlas se añaden los peldaños `zinc-75`, `zinc-150` y
`zinc-850`, declarados en los dos temas porque la rampa es primitiva y una semántica necesita
primitiva a la que aliasear **en cada modo** de Figma. La jerarquía en claro deja de sostenerse
solo con bordes.

---

## Gotchas de construcción (Plugin API)

Patrones que ya costaron un ciclo de corrección. Aplicarlos de entrada.

1. **La opacidad de un fill bindeado se pierde si se asigna durante la creación del componente.**
   Los fills suaves (`bg-status-*/10`) salen sólidos y el texto del mismo tono queda invisible.
   Poner la opacidad en el paint de entrada *no alcanza* si el nodo aún no está en el árbol.
   → **La opacidad solo persiste si se aplica en una invocación SEPARADA de `use_figma`**, cuando
   los nodos ya están comprometidos en el documento. Diferirla al final del mismo script **no
   alcanza** — se probó y los 8 paints volvieron a salir en 1.

   **Mecanismo real, verificado:** la opacidad se pierde cuando el nodo **no tenía ya un fill
   sólido**. Si `fills` estaba vacío, la primera asignación con alpha aterriza en opacidad 1; una
   segunda asignación sobre ese mismo nodo —que ahora sí tiene fill— conserva el alpha.

   **Receta:**
   1. Al crear el componente, darle **siempre un fill sólido bindeado** (nunca `fills = []` si va a
      llevar alpha).
   2. En una llamada posterior, reasignar el paint con la opacidad.
   3. Verificar leyendo `fills[0].opacity`. Si volvió 1, repetir el paso 2 una vez más.

   > ⚠️ Costó **cuatro** ciclos y tres hipótesis equivocadas: (a) hornear la opacidad en el paint de
   > entrada, (b) diferirla al final del mismo script, (c) usar una llamada de cierre sin creación
   > posterior. Las tres fallan. La variable que importa no es *cuándo* se aplica sino **si el nodo
   > ya tenía fill**. Las veces que "funcionó" con la regla (c) era porque el nodo venía de un
   > intento fallido previo y por eso ya tenía un fill sólido.

2. **`figma.createAutoLayout()` crea el frame con relleno blanco.** En paneles oscuros tapa el
   contenido; en claros pasa desapercibido pero ensucia. → `fills = []` en todo wrapper de layout.

3. **`ALL_FILLS` no se combina con `FRAME_FILL`, `SHAPE_FILL` ni `TEXT_FILL`** en `variable.scopes`
   — Figma lanza error. `ALL_FILLS` ya los cubre a los tres.

4. **Cuidado con excluir por nombre.** Un barrido que preservaba los frames llamados `card` también
   preservó la fila del token `card`. Filtrar por ancestro, no solo por nombre.

5. **🔑 En una sobrescritura de instancia, Figma NO resuelve la variable atada: usa el color crudo
   del paint.** Este es el gotcha más caro del archivo y **explica también el punto 1**.

   `figma.variables.setBoundVariableForPaint(paint, 'color', v)` devuelve un paint que conserva el
   `color` que le pasaste como base y le adosa el binding. En un nodo **del master**, Figma resuelve
   la variable al pintar y el color base es irrelevante. En un nodo **dentro de una instancia**, no:
   pinta el color base. Si construiste el paint desde `{r:0,g:0,b:0}` como placeholder, la instancia
   sale **negra** aunque el binding esté correcto y el master se vea bien.

   → **Regla: el color base del paint debe ser siempre el valor resuelto de la variable, nunca un
   placeholder.** Y como las variables semánticas son alias de primitivas, hay que resolver la
   cadena hasta el valor literal antes de construir el paint:

   ```js
   async function resolve(v, d) {
     const col = await figma.variables.getVariableCollectionByIdAsync(v.variableCollectionId)
     const val = v.valuesByMode[col.modes[0].modeId]
     if (val && val.type === 'VARIABLE_ALIAS' && d < 6)
       return resolve(await figma.variables.getVariableByIdAsync(val.id), d + 1)
     return val
   }
   const c = await resolve(v, 0)
   const paint = figma.variables.setBoundVariableForPaint(
     { type: 'SOLID', color: { r: c.r, g: c.g, b: c.b } }, 'color', v)
   ```

   **Cómo se detecta:** barrer buscando paints cuyo `color` sea negro pero cuya variable resuelva a
   otra cosa. En este archivo dio **26 nodos** con el defecto latente (Banner, Dropzone,
   AiSuggestionBlock, UnmappedNotice, filas hover, fechas de `OcrDocCard`) más los `DocTypeChip`
   dentro de `OcrDocCard`, que ya se veían negros en pantalla. Todos reparados el 2026-08-19.

   > El punto 1 describe el mismo fenómeno visto desde la opacidad: el alpha del paint tampoco
   > sobrevive al instanciado. La solución de fondo fue la misma —**tokens `-soft` pre-mezclados**—
   > porque un color sólido no depende de que Figma resuelva nada al instanciar.

6. **`query()` sí entra en las instancias; `findOne()` no.** Para anclar un popover bajo su botón hay
   que localizar el control, pero el control vive dentro de la **instancia** del toolbar.
   `frame.findOne(n => n.name === 'control/columns')` devuelve `null`, el cálculo de posición se cae
   en silencio y el overlay se queda en (0,0), tapando el navbar.

   ```js
   // MAL — no atraviesa instancias
   const btn = frame.findOne(n => n.name === 'control/columns')   // null

   // BIEN — query() sí, y la posición se calcula con absoluteBoundingBox
   const btn = frame.query('[name=control/columns]').first()
   const fb = frame.absoluteBoundingBox, bb = btn.absoluteBoundingBox
   panel.x = Math.round(bb.x - fb.x)
   panel.y = Math.round(bb.y - fb.y + bb.height + 6)
   ```

   **Y antes de posicionar, hay que saber si el frame es auto-layout.** Si `layoutMode !== 'NONE'`,
   el overlay entra en el flujo y hay que ponerlo en `layoutPositioning = 'ABSOLUTE'` **después** de
   insertarlo. Si es `'NONE'`, basta con `x`/`y` — y ahí `layoutPositioning = 'ABSOLUTE'` **lanza
   error**: *"Can only set layoutPositioning = ABSOLUTE if the parent node has layoutMode !== NONE"*.
   Detectado el 2026-08-20 en `F05.2`.

7. **Una sección nueva creada en (0,0) tapa a las que ya están ahí.** Las secciones no se apartan
   solas ni avisan. El 2026-08-20 la sección de flujos en contexto (5200×8188 en el origen) sepultó
   entera la de Transactions (1760×1500 en (0,−20)) y pareció trabajo borrado.
   **Barrido obligatorio al cerrar cada etapa:** comparar `x/y/width/height` de todas las secciones
   de la página y exigir cero intersecciones.

---

## Fase 8-A · etapa 8A-1 — los 10 componentes vivos de Quote Converter

Se construyen **en el archivo de librería** (`MXoE4BJ0GpMn0TvChOhxWD`) y se republican, no en el
archivo de cada proyecto (D35). Los 5 componentes que ningún proyecto importa no se construyen (D36).

| # | Componente | Fuente | Variantes | Estado |
|---|---|---|---|---|
| 1 | `4 Overlays/CreateRecordModal` | `quote-converter/src/components/create-record/CreateRecordModal.tsx` | — | ✅ |
| 2 | `1 Atoms/DatePicker` | `create-record/fields/DatePicker.tsx` · envuelve `2 Molecules/Calendar` | closed · open | ✅ |
| 3 | `2 Molecules/ReplacementDocPicker` | `components/ReplacementDocPicker.tsx` | — | ✅ |
| 4 | `2 Molecules/DiscrepancyCard` | `comparison/DiscrepancyList.tsx` | open · resolved | ✅ |
| 5 | `4 Overlays/ComparisonReviewModal` | `comparison/ComparisonReviewModal.tsx` | report · processing | ✅ |
| 6 | `3 Organisms/FieldReviewPanel` | `components/FieldReviewModal.tsx` | — | ✅ |
| 7-8 | `3 Organisms/RecordCreationForm` | `forms/OrderCreationForm.tsx` + `forms/AckCreationForm.tsx` | order · acknowledgement | ✅ |
| 9-10 | `3 Organisms/RecordImportFlow` | `forms/OrderImportFlow.tsx` + `forms/AckImportFlow.tsx` | upload · processing · review·ack · review·order | ✅ |

**Etapa cerrada.** Los 10 componentes vivos entraron como **8 piezas** en la librería: los cuatro
archivos de `forms/` son dos parejas de gemelos —mismo cascarón, distinto juego de campos— y se
fusionaron en dos component sets con una propiedad que nombra la diferencia, en vez de cuatro
componentes que habría que mantener en paralelo. Nada se perdió: cada variante existe.

**Conteos tras la etapa:** Atoms 15 sets · Molecules 24 sets + 5 sueltos · Organisms 12 sets +
3 sueltos · Overlays 5 sets + 7 sueltos = **71 componentes** sin contar los 166 iconos.

> ✅ **Librería republicada (2026-09-29).** Era acción manual en la UI de Figma y se hizo una sola
> vez, al cerrar la etapa, para no generar actualizaciones sueltas en `Strata · Quote Converter`
> (`2dzdBwbG1ESDSLvzwC2vlc`), que ya la consume.

### Desviaciones registradas al construir

| Componente | Qué hace el código | Qué se construyó | Por qué |
|---|---|---|---|
| `DiscrepancyCard` | El bloque de IA trae sus propios botones `Accept` / `Pick another`, **y además** la fila *Your call* ofrece `Keep PO` / `Accept ACK` | Se ocultan los botones del bloque de IA; la decisión vive solo en *Your call* | Dos superficies para la misma decisión en la misma tarjeta. Regla 04: una acción primaria por bloque |
| `DiscrepancyCard` · resolved | `line-through` + `opacity` sobre la tarjeta entera | Borde `status-success`, chip `ACCEPTED` sobre `status-success-soft`, texto a `muted-foreground` con tachado, y los bloques de par/IA/decisión ocultos | La opacidad no sobrevive a la instanciación (D14). El estado se comunica con tokens sólidos |
| `ComparisonReviewModal` | `bg-red-600` / `bg-blue-600` / `text-white` crudos en los botones de decisión; `bg-green-50 text-green-700` en `MatchedPill` | `primary` para la acción sugerida, `background` + `border` para las demás | LAW 5 y regla 01: nada de Tailwind crudo para estado. La jerarquía la marca `routing.suggested_action`, no el color semántico del verbo |
| `ComparisonReviewModal` | `bg-brand-300/20` como fondo del tab activo | `status-warning-soft` / `status-error-soft` / `primary-soft` según `derived_status` | `brand-*` no es un rol semántico. El tab hereda el color del estado que anuncia |
| `ComparisonReviewModal` | Cuerpo con `overflow-y-auto` sin alto declarado | Cuerpo a alto fijo con `clipsContent`, modal a 1400×920 | Figma no scrollea: el recorte **es** la representación honesta de la región scrolleable |
| `FieldReviewModal` | Se llama *Modal* pero es `border-l` + `h-full`: **es el panel derecho** de los visores | Archivado como `3 Organisms/FieldReviewPanel` | El nombre inducía a montarlo centrado. Seis hexes duros (`#EBECEE`, `#FF4D4D`, `#16A34A`, `#2E71D3`, `#F4F9FF`) y los `green-500`/`amber-500` → `status-*` |
| `RecordCreationForm` | Dos archivos con el mismo cascarón y distinto juego de campos | Un set con `Type=order \| acknowledgement` | Cuatro componentes gemelos se desincronizan; una propiedad nombra la diferencia real |
| `RecordImportFlow` | `AckImportFlow` y `OrderImportFlow`, idénticos salvo el paso de revisión | Un set con `Step=upload \| processing \| review·acknowledgement \| review·order` | La tabla de orden no lleva columna `Status` ni pills de excepción: eso **es** la diferencia, y así queda visible |
| `RecordImportFlow` · upload | Chips de formato en `bg-blue-100` / `bg-indigo-100`; pills de resultado en `bg-green-100` / `bg-amber-100` | `status-info-soft` · `status-ai-soft` · `status-success-soft` · `status-warning-soft` | LAW 5 |

### Gotcha 9 · `layoutGrow` reparte el eje del PADRE, no el ancho

`layoutGrow = 1` en un hijo de un contenedor **vertical** reparte **alto**, no ancho. Si el padre
hugea su altura no hay sobrante que repartir y el hijo **colapsa a 0**: los campos desaparecen sin
error. Pasó dos veces en esta etapa — en las columnas de datos extraídos y en las tarjetas Vendor /
Shipping & Billing.

```js
// hijo de un padre HORIZONTAL que debe repartir el ancho
child.layoutGrow = 1
child.counterAxisSizingMode = 'FIXED'   // vertical: el ancho es el counter axis
child.primaryAxisSizingMode = 'AUTO'    // el alto sigue hugeando

// hijo de un padre VERTICAL que debe ocupar todo el ancho
child.layoutGrow = 0
child.layoutAlign = 'STRETCH'
```

Y para forzar el hug de un frame que se resizeó a mano, `layoutSizingVertical = 'HUG'` funciona
donde `primaryAxisSizingMode = 'AUTO'` se queda corto.

### Gotcha 8 · `counterAxisSizingMode` bloquea el alto que el frame tenía al crearse

Un frame recién creado mide 100×100. Si se le pone `layoutMode = 'HORIZONTAL'` y acto seguido
`counterAxisSizingMode = 'FIXED'`, **el alto queda clavado en 100** aunque los hijos midan 41.
Y `layoutAlign = 'STRETCH'` no estira el ancho mientras `primaryAxisSizingMode` siga en `'AUTO'`.

```js
// Fila horizontal que debe ocupar todo el ancho del padre vertical:
row.layoutAlign = 'STRETCH'
row.primaryAxisSizingMode = 'FIXED'   // ancho ← lo impone el padre
row.counterAxisSizingMode = 'AUTO'    // alto  ← hug de los hijos
```

El eje se invierte en un frame vertical: ahí el ancho es el counter axis y el alto el primary.
Detectado el 2026-08-26 construyendo la fila de tabs del `ComparisonReviewModal`.

---

## Fase 8-A · etapa 8A-2 — OCR Tracking de Quote Converter

Archivo `Strata · Quote Converter` (`2dzdBwbG1ESDSLvzwC2vlc`). **6 pantallas base + 5 flujos ×
3 estados = 21 frames**, todos consumiendo la librería publicada.

### El mapa de claves vive dentro del archivo

Para crear nodos nuevos ya bindeados a la librería hay que importar por clave. Las claves quedaron
guardadas en el propio documento con `setSharedPluginData('strata.ds', …)`:
`vars` (51) · `text` (32) · `eff` (7) · `comps` (71) · `icons` (97). Cualquier script posterior las
lee sin volver a pedirlas al archivo de la librería.

> ⚠️ `figma.root.setPluginData()` **no existe** en este runtime (solo plugins privados en web).
> Hay que usar `setSharedPluginData(namespace, key, value)` con un namespace estable.

> `getAvailableLibraryVariableCollectionsAsync()` devuelve **vacío** en este entorno aunque la
> librería esté suscrita y funcionando. No sirve como comprobación: lo que sí prueba el consumo es
> que `importVariableByKeyAsync` devuelva `remote: true`.

### El OCR de Quote Converter NO es el del dealer recoloreado

Seis divergencias verificadas contra `quote-converter/src/OCRTracking.tsx`:

| | Dealer | Quote Converter | Fuente |
|---|---|---|---|
| Título de la card | `Acknowledgements` | `SIF Generator` | L295 |
| Breadcrumb | `Dealer Experience › OCR` | `SIF Generator › OCR Tracking` | L258-261 |
| Funnel | 7 etapas de producción | `All · OCR Running · Ready to Review · Completed` │ `Not Processed` | L299-336 |
| Tipo de documento | solo ACK | `Quote` | L48-69 |
| Vista por defecto | kanban | **lista** | L105 |
| Toolbar | avatar group + segmented de rango | checkbox `My Documents` | L354-363 |

**Producción colapsa los 8 estados internos en 3 etapas + archivo** (`prodStage()`, L82-87), pero el
**kanban sigue usando las 6 columnas internas** (`COLUMNS`, L71-78). Son dos taxonomías conviviendo
en la misma pantalla, y el diseño las muestra tal cual porque así está el código.

### Decisiones de la etapa

| # | Decisión | Por qué |
|---|---|---|
| **D37** | **La multi-selección va en el kanban, no en la lista** | `onToggleSelect` solo se le pasa a `OcrDocCard` (L441-442). Las filas de la tabla no tienen checkbox |
| **D38** | **Compare no se dibuja en Quote Converter** | L531: la acción exige `type === 'Purchase Order' && relatedDocId`. El seed es todo Quotes, así que no aparece nunca. Va en Expert Hub |
| **D39** | **`DeprecatedCard` se construye dentro de la pantalla, no como componente de librería** | Hoy la usa un solo sitio. Se promueve en 8-B si Expert Hub la necesita, para republicar una sola vez |
| **D40** | **El tablero se recorta y no se estrecha** | 6 columnas × `min-w-[300px]` + gaps = 1.880 px mínimos, que nunca caben. Estrechar las columnas mentiría sobre la spec; el recorte es el `overflow-x-auto` real |

### Hallazgo de auditoría · el kanban esconde el final del funnel

Consecuencia de D40: `Reconciled` y `Completed` —las dos últimas columnas, una de ellas el estado
final— quedan **siempre** fuera de la vista inicial. Mismo tipo de hallazgo que R1–R12 del grid,
pendiente de proponer arreglo.

### Flujos construidos

`FQ1` subir documento · `FQ2` revisar campos extraídos · `FQ3` preflight sync a Orderbahn ·
`FQ4` deprecar · `FQ5` reemplazar un documento archivado. Cada uno como fila
`inicial → interacción → final`, con velo de `foreground` al 40% bajo los modales.

**El `ReplacementDocPicker` va anclado y sin velo** (D26.4): es un panel inline, no un modal.
Centrarlo sobre un velo lo habría hecho pasar por lo que no es.

**Retargeting obligatorio al reusar un componente de la librería:** los másters se construyeron con
datos de ACK (`AIS Furniture · ACK-8842`). En Quote Converter todo es `Quote`, así que cada instancia
se reapunta al seed real (`Magnuson Group, Inc. · QT007508`). Y los estados finales se diferencian
**cambiando la variante de `ResolutionPill` a `resolved`**, nunca recoloreando la instancia — una
sobrescritura de color se descarta en cuanto alguien toca el máster.

### Verificación

0 solapamientos entre secciones y entre frames · 0 contenido desbordando · **0 componentes locales ·
0 colecciones locales · 0 estilos locales · 0 pinturas sin bindear** (el velo se excluye: su opacidad
es deliberada) · solo Inter.

---

## Fase 8-A · etapa 8A-3 — Observability de Quote Converter

**3 pantallas.** El navbar ya traía la variante `Product=quote-converter, ActiveTab=Observability`
en la librería: cero trabajo de componente.

### Lo que Strata controla y lo que no

El dashboard **no vive en el frontend de Strata**: es un embed de terceros con URL firmada. Por eso
`quote-converter/src/Observability.tsx` son 45 líneas que solo renderizan el empty state — el resto
lo pinta el proveedor.

| Zona | Dueño |
|---|---|
| Breadcrumb `SIF Generator › Observability` · selector de dashboard · pill de estado de sesión | **Strata** |
| Los 6 KPI, la gráfica por tipo y la tabla `Top 5 Longest Documents to Convert` | **el proveedor del embed** |

La evidencia de que el dashboard es remoto está en el propio selector: dice **`PDF to Sif (dark)`**,
y ese `(dark)` es el nombre del dashboard remoto, **no** un modo de Strata.

→ En Figma el área del proveedor va con **borde punteado y chip `THIRD-PARTY EMBED`**, para que
nadie la lea como superficie de Strata ni intente rediseñarla dentro del DS.

### D41 · El pill es un solo slot con tres estados

No son tres componentes: es el **estado de la sesión del embed**, y el código ya lo trata como un
único elemento en la esquina superior derecha (`Observability.tsx:22-27`).

| Estado | Cuándo | Token |
|---|---|---|
| `Error` | Sin dashboards asignados a la cuenta — **lo único que el código local implementa hoy** | `destructive` |
| `Live · expires 15m` | Sesión firmada viva | `status-success` |
| `Session expired` | La URL firmada caducó · recargar pide una nueva | `status-warning` |

El estado caducado **no existe en el código**: es diseño propuesto. Se representa vaciando el área
del embed y ofreciendo *Reload dashboard*, porque el proveedor deja de renderizar cuando la firma
vence. Queda marcado como abierto.

> ⚠️ **Los datos del embed salen de la captura de producción del tenant Devtests, no del seed de
> Quote Converter.** No están verificados contra este producto y no deben leerse como cifras reales.

### Abierto

Decidir si el dashboard se re-tematiza con tokens de Strata o se acepta el look del proveedor. Es
decisión de producto, no de diseño: depende de qué permita el proveedor del embed.

### Verificación

0 solapamientos entre las 3 secciones del archivo · 0 pinturas sin bindear · solo Inter ·
**0 componentes locales, 0 colecciones locales, 0 estilos locales**.

---

## Fase 8-A · etapa 8A-4 — Feedback de Quote Converter

**5 pantallas.** Dos superficies, no el `FeedbackBoard` de admin (D16).

| Pantalla | Qué muestra |
|---|---|
| `My feedback · populated` | Tabs `All 3 · Open 2 · Resolved 1` · tabla de 6 columnas · los 3 seeds reales |
| `My feedback · empty` | Sin tickets · CTA que apunta al botón del navbar |
| `Navbar · Feedback menu open` | Dropdown de 2 items anclado bajo el icono, con badge de no leídos |
| `Send feedback · composer` | `FeedbackComposerModal [State=attached]` |
| `Ticket detail · FB-SEED-001` | `UserFeedbackDetailModal` con el hilo de respuestas de soporte |

### D42 · `My feedback` no es un tab del navbar

Se llega por el **dropdown del icono de feedback**, no por la barra de tabs
(`Navbar.tsx:143-202`). Por eso todas estas pantallas montan la variante
`Product=quote-converter, ActiveTab=OCR`: el navbar **no marca ninguna sección como activa** cuando
estás en esta página, exactamente como hace el código (`FeedbackStatusPage.tsx:166` pasa
`activeTab="OCR"`). No es un descuido del diseño; es lo que el usuario ve.

### Los adjuntos viven aquí, y no en Transactions

D31 dice que en Transactions no se adjunta nada: los documentos llegan por OCR. **Aquí sí**, y no es
una contradicción — son dos cosas distintas: en Feedback el adjunto es **evidencia del usuario sobre
un problema** (una captura, un vídeo de pantalla), no un documento del vendor. Por eso la pantalla
del composer usa `State=attached`: si se dibujara vacía, la capacidad quedaría invisible.

### Sin retargeting, por una vez

`UserFeedbackDetailModal` ya se había construido en la librería **con el contenido de `FB-SEED-001`**
(el ticket de Steelcase, con la respuesta de Sofía Ramírez). Se instanció tal cual. Es el primer
componente de toda la Fase 8 que no necesitó reapuntar datos — porque su máster ya se hizo desde el
seed de Quote Converter, no desde el de ACKs.

**Vocabularios** (`FeedbackStatusPage.tsx:33-56` + el seed): `Category` Bug · Data · Feature Request ·
Suggestion · Other · `Severity` Low · Medium · High · `State` Submitted · Triaged · Assigned ·
Resolved · Closed · Dropped · Duplicated.

### Verificación

4 secciones en el archivo, 0 solapamientos · 0 pinturas sin bindear · solo Inter ·
**0 componentes locales, 0 colecciones locales**.

---

## Fase 8-A · etapa 8A-5 — cierre · **Quote Converter completo**

Archivo `Strata · Quote Converter` (`2dzdBwbG1ESDSLvzwC2vlc`) · **41 frames en 5 secciones**.

| Sección | Frames |
|---|---|
| `✅ OCR Tracking · SIF Generator` | 7 (tarjeta de registro + 6 pantallas) |
| `🖼️ OCR flows · in context` | 20 (5 flujos × 3 estados + rótulos) |
| `✅ Observability` | 4 (tarjeta + 3 pantallas) |
| `✅ Feedback · My feedback + composer` | 6 (tarjeta + 5 pantallas) |
| `🌙 Dark mode check` | 4 (nota + 3 clones) |

### Modo oscuro como prueba de tokens, no como entregable

Los 3 clones llevan `setExplicitVariableModeForCollection(coll, Dark)`. **No son pantallas nuevas**:
son el control de que ningún color se salió del sistema. Si algo no cambia de color ahí, está
hardcodeado — y se arregla **en la librería**, no en este archivo. Las tres superficies voltearon
limpias.

### Verificación final · los 6 criterios de §8.8

| # | Criterio | Resultado |
|---|---|---|
| 1 | Librería suscrita · cero componentes locales duplicados | **0** componentes · **0** colecciones · **0** estilos de texto · **0** estilos de pintura locales |
| 2 | Paints sin bindear | **0** (el velo de los modales se excluye: su opacidad es deliberada) |
| 3 | Ambos modos revisados en una pantalla por superficie | ✅ OCR · Observability · Feedback |
| 4 | Tarjeta de registro por sección | ✅ las 3 secciones de producto; `Dark mode check` lleva nota en su lugar |
| 5 | Chip de procedencia por fila de flujo | ✅ `OBSERVED · CODE` / `CODE` |
| 6 | Solapamientos entre secciones | **0** · y **0** contenido desbordando su sección |

**17 componentes de librería + 36 iconos** consumidos. Ninguno local.

### Fase 8-A cerrada

Quote Converter queda cubierto de punta a punta. El flujo de *consumir la librería publicada desde
un archivo de producto* está validado (era el objetivo de D34: empezar por el proyecto casi cubierto
antes de entrar en el grande).

**Lo que sigue es la Fase 8-B · Expert Hub**, y ahí está el volumen real: `Transactions` completa
(3.181 líneas · 3 tabs × 2 vistas), `Comparisons` y el `FeedbackBoard` de 9 tabs. `OCR` se clona de
8A-2 cambiando navbar y tenant.

**Candidatas a promover a la librería en 8B-1**, detectadas aquí: `DeprecatedCard` (D39) — si Expert
Hub la usa, se promueve y se republica una sola vez junto con los 7 componentes de esa etapa.

---

## Fase 8-B · etapas 8B-0 y 8B-1 — Expert Hub

**8B-0 ✅** · Archivo `Strata · Expert Hub` (`rLP7p3oPrFpQF8Po4F8JlB`), creado en el team Strata.
Consume la librería: 0 colecciones locales, `importVariableByKeyAsync` devuelve `remote: true`,
mapa de claves sembrado con `setSharedPluginData('strata.ds', …)`. El navbar ya trae sus 4 variantes
de `expert-hub`.

**8B-1 ✅** · Los 7 componentes, construidos en el archivo de librería (D35).

### Filtro de código muerto — esta vez no cayó ninguno

Los 7 están importados de verdad (`AckReconciliationModal` y `TransactionVerifyPill` desde dos sitios
cada uno; el resto desde uno). En Quote Converter se descartaron 5 de 23; aquí, cero.

| Componente | Sección | Variantes |
|---|---|---|
| `1 Atoms/TransactionVerifyPill` | Atoms | verified · verified-compact · syncing · unverified |
| `4 Overlays/CreateOrderModal` | Overlays | — |
| `4 Overlays/AssignFeedbackModal` | Overlays | — |
| `4 Overlays/ResolveDiscrepancyModal` | Overlays | — |
| `4 Overlays/FeedbackDetailModal` | Overlays | — |
| `4 Overlays/DocumentConversionModal` | Overlays | select · compare · review · confirm |
| `4 Overlays/AckReconciliationModal` | Overlays | — |

### Decisiones de la etapa

| # | Decisión | Por qué |
|---|---|---|
| **D43** | **`CreateOrderModal` es SOLO el paso de selección** | Sus otros dos pasos delegan en `OrderImportFlow` y `OrderCreationForm`, ya en la librería como `RecordImportFlow` y `RecordCreationForm [Type=order]`. La fusión de gemelos de 8A-1 se paga aquí |
| **D44** | **`DocumentConversionModal` no son dos componentes** | Los modos `quote-to-order` y `order-to-ack` son el mismo flujo con otras etiquetas y otro set de documentos elegibles |
| **D45** | **`AckReconciliationModal` se construye SOLO como «All Inconsistencies»** | Sus 4 pasos declarados **no se renderizan**: el bloque de All Inconsistencies está siempre activo, y esos 4 pasos son la misma forma que `DocumentConversionModal`. Duplicarlos habría metido 4 másters muertos en la librería |
| **D46** | **`TransactionVerifyPill` no es solo un pill** | `verified` y `syncing` son indicadores de lectura, pero **`unverified` es un botón** que dispara la sync con Orderbahn. Por eso lleva `primary`. Leerlo como badge llevaría a implementarlo sin acción |

### Estados deshabilitados, dibujados como tales

Tres CTAs van en `muted` y no en `primary`: el de `ResolveDiscrepancyModal`, el de
`DocumentConversionModal [Step=review]` y el de `AckReconciliationModal`. Los tres están bloqueados
en el código hasta resolver todos los ítems (`allResolved`). Dibujarlos activos habría mentido sobre
la regla de negocio.

### `FeedbackDetailModal` ≠ `UserFeedbackDetailModal`

No son duplicados: son las dos caras del mismo ticket. El de admin ofrece **transiciones de estado,
reasignar y enlace a Jira**; el del usuario no ofrece ninguna de las tres. Queda anotado en ambas
descripciones. Además, el selector *«Reply as Expert / Reporter»* del composer es una **herramienta
de demo, no una capacidad de producto** — está marcado para que no acabe implementado por accidente.

### Desviaciones de color registradas

`bg-green-100` · `bg-brand-300` + `text-zinc-900` · `bg-indigo-50` · `bg-red-50` · `bg-amber-100` ·
`bg-blue-50` · `text-blue-600` · `solidAvatarColor()` · y un **gradiente `indigo-500 → indigo-700`**
en el avatar de grupo — el DS no tiene gradientes, se resolvió con `status-ai` sólido.

### Verificación · cierre de 8B-1

0 solapamientos entre secciones · 0 pinturas sin bindear en las 7 piezas · solo Inter ·
**78 componentes** sin contar los 166 iconos (Atoms 16 · Molecules 24+5 · Organisms 12+3 ·
Overlays 6+12).

> ✅ **Librería republicada (2026-09-29).** Acción manual, una sola vez, con los 7 juntos — para no
> generar actualizaciones sueltas en `Strata · Quote Converter` y `Strata · Expert Hub`, que ya la
> consumen.

---

## Fase 8-B · etapa 8B-2 — OCR Tracking de Expert Hub

**5 pantallas**: Kanban · List · Multi-select · Failed · Loading. Todas con `Navbar [expert-hub/OCR]`
y componentes de la librería; cero locales.

### El conflicto H1 se resuelve por D10 — y era real

`expert-hub/src/OCRTracking.tsx` **no coincide con su propia producción**, y aquí manda producción:

| | Producción (lo construido) | Código local |
|---|---|---|
| Funnel | `All 103 · Processing 0 · To Review 10 · In Review 70 · Ready to Sync 23 · Completed 0 · Failed 93` | `Ingesting · Needs Attention · Awaiting Expert · In-progress · Reviewed · Completed` + `Deprecated` |
| Kanban | 4 columnas | 6 columnas |
| Título de card | `Expert Hub` | `OCR Tracking` |
| Toolbar | avatar group `+17` + segmented `Last 30 days / Full history` | sin el segmented |

> Y el navbar local **está a medio migrar**: `type NavTab = 'OCR' \| 'Feedback'` declara dos tabs,
> pero el array tiene cuatro. Es deuda del código, no ambigüedad de diseño.

**`Completed` y `Failed` son tabs de filtro, no columnas del kanban.** Se confirmó con la captura del
tenant Tangram Interiors. Por eso el tablero tiene 4 columnas y no 6 — y a diferencia de Quote
Converter, **caben todas** (4 × 300 + gaps = 1.248 px).

### Diverge de Quote Converter en tres puntos

| | Quote Converter | Expert Hub |
|---|---|---|
| Tipos ingeridos | solo `Quote` | `Purchase Order` · `Quote` · `Acknowledgment` |
| Acción `Compare` | nunca aparece (D38) | **sí**, en Purchase Orders con ACK enlazado |
| Navbar | 3 tabs | 4 tabs (OCR · Transactions · Comparisons · Feedback) |

### La pantalla `Failed` no es la lista con otro filtro

La columna `REVIEW STATUS` deja de tener sentido y pasa a ser **`FAILURE REASON`** (tipo no
soportado · timeout de OCR tras 3 reintentos · PDF protegido con contraseña), y las acciones cambian:
`RefreshCw` para reintentar, sin `Send` ni `CheckSquare` porque no hay nada que sincronizar.

### Verificación

0 solapamientos · 0 pinturas sin bindear · solo Inter · **0 componentes locales, 0 colecciones**.

---

## Fase 8-B · etapa 8B-3 — Transactions de Expert Hub

**9 pantallas.** La superficie más grande del proyecto (`Transactions.tsx`, 3.181 líneas).

| Pantalla | |
|---|---|
| `Acknowledgements · Pipeline` | 4 etapas · CTA *Reconcile with PO* |
| `Acknowledgements · List (row expanded)` | fila abierta con Contact Details / Items / References |
| `Orders · Pipeline` · `Orders · List` | 4 etapas · columnas de importe |
| `Quotes · Pipeline` · `Quotes · List` | **5 etapas** · `Valid Until` en vez de `Date` |
| `Multi-select` · `Empty (no results)` · `Loading` | estados |

### No son tres pantallas: son tres ejes que se combinan

`lifecycleTab` (Orders · Acknowledgements · Quotes) × `activeTab` (Active · Completed · All) ×
`viewMode` (pipeline por defecto · list). **Cada rama trae sus propias etapas, KPIs y columnas** —
no es la misma tabla filtrada, y por eso hay 6 pantallas de contenido y no 2.

| Rama | Etapas |
|---|---|
| Orders | `Received → Pending Review → In Review → Approved` |
| Acknowledgements | `Received → Pending Review → Discrepancy → Approved` |
| Quotes | `Draft → Sent → Negotiating → Approved → Lost` |

**Columnas** · ACK: `Vendor · PO & Location · Inconsistency · Status · Date · Actions` ·
Orders/Quotes: `Details · Project & Location · Amount · Status · Date` (→ `Valid Until` en Quotes).

### D47 · Las etapas están adaptadas al rol Expert, y eso no se toca

`Transactions.tsx:271-281` lo declara explícitamente: los estados de producción y envío
(*In Production*, *In Transit*, *Delivered*) son responsabilidad de otros roles. El funnel del experto
es de **validación**, no de fulfillment. `Partial` se eliminó por redundante con `Discrepancy`
(ambos significaban «items necesitan atención»). Es decisión de producto ya tomada; el diseño la
respeta y no reintroduce estados de dealer/manufacturer.

### ⚠️ 33 slots pendientes de sustituir

Los marcadores `slot · TransactionVerifyPill` están en las 9 pantallas. El componente existe
(`1 Atoms/TransactionVerifyPill`, etapa 8B-1) pero **no se puede instanciar por clave hasta
republicar la librería**. Al republicar hay que barrer por ese nombre y sustituir por la instancia
real, eligiendo variante: `verified` · `syncing` · `unverified` (recordar D46: el último es un
**botón**, no un badge).

### Defecto corregido · la variante de tendencia no sigue al dato

Al clonar pantallas, los `KpiCard` heredan la variante `Trend=up/down` del original, así que
aparecían flechas que contradecían el signo (`8 ↘ +3`). **Cambiar el texto del delta no cambia la
flecha: hay que hacer `swapComponent` y reponer los textos.** Seis instancias corregidas.

### Verificación

0 solapamientos entre secciones y dentro de la sección · 0 desbordes · 0 pinturas sin bindear ·
solo Inter · **0 componentes locales, 0 colecciones locales**.

---

## Fase 8-B · etapas 8B-4, 8B-5 y 8B-6 — cierre · **Expert Hub completo**

Archivo `Strata · Expert Hub` (`rLP7p3oPrFpQF8Po4F8JlB`) · **31 frames en 5 secciones**.

| Sección | Frames |
|---|---|
| `✅ OCR Tracking` | 6 |
| `✅ Transactions` | 10 |
| `✅ Comparisons` | 6 |
| `✅ Feedback Board` | 4 |
| `🌙 Dark mode check` | 5 |

### Tras republicar · las claves nuevas y el barrido de slots

Las claves de los 7 componentes de 8B-1 **no estaban en el mapa** (se capturó antes de construirlos).
Se añadieron y se verificó que importan con `remote: true`. Después, los **33 slots
`slot · TransactionVerifyPill`** se sustituyeron por instancias reales, repartidas por estado del
registro y no uniformemente: `verified` 9 (aprobado/reconciliado) · `syncing` 4 (en revisión o
negociación) · `unverified` 20 (el resto). Slots pendientes: **0**.

> **Lección para la próxima republicación:** el mapa de claves guardado en `sharedPluginData` es una
> foto. Al añadir componentes a la librería hay que **volver a capturar sus claves**, no solo
> republicar.

### D48 · Comparisons son TRES superficies de decisión, no tres versiones de una

Se distinguen por alcance, y confundirlas lleva a construir la misma pantalla tres veces:

| Modal | Alcance |
|---|---|
| `ComparisonReviewModal` | **un** par PO↔ACK · tabs Review / Fields / Line Items |
| `AckReconciliationModal` | **todas** las discrepancias del tenant, agrupadas por documento |
| `ResolveDiscrepancyModal` | las inconsistencias de línea de **un** documento, en acordeón |

**Comparisons no existe en el dealer (D13) ni en Quote Converter (D38)** porque el contrato del
servicio toma `po_json + ack_json`: solo aplica a Purchase Orders con ACK enlazado. No es una omisión
del diseño, es el alcance real.

### D49 · Las acciones rápidas del Feedback Board dependen del estado

`FeedbackBoard.tsx:348-375` · `Submitted` → Triage · Drop · Mark Duplicate ·
`Triaged` → Assign · Resolve · Drop · Mark Duplicate · `Assigned` → Resolve · Close · Promote to Jira ·
`Resolved` y `Closed` → Reopen. **Dibujar el mismo juego de iconos en todas las filas sería falso.**

Y **`In Jira` no es un estado del ciclo**: es un filtro transversal — un ticket puede estar `Assigned`
y en Jira a la vez. Por eso el funnel tiene 9 tabs y no 8 estados.

### Contraste registrado · admin vs usuario

`4 Overlays/FeedbackDetailModal` (admin: transiciones de estado, reasignar, enlace a Jira) vs
`4 Overlays/UserFeedbackDetailModal` (usuario: ninguna de las tres). Anotado en ambas descripciones
para que no se monten intercambiados.

### Verificación final

| # | Criterio | Resultado |
|---|---|---|
| 1 | Cero locales | **0** componentes · **0** colecciones · **0** estilos de texto · **0** de pintura |
| 2 | Paints sin bindear | **0** (el velo se excluye) |
| 3 | Ambos modos por superficie | ✅ OCR · Transactions · Comparisons · Feedback Board |
| 4 | Tarjeta de registro por sección | ✅ las 4 de producto |
| 5 | Solapamientos y desbordes | **0** y **0** |
| 6 | Slots pendientes | **0** |

**17 componentes de librería + 45 iconos**, ninguno local. Solo Inter.

### Fase 8 cerrada

| Archivo | Frames |
|---|---|
| `Strata Dealer Experience` (librería + pantallas) | 78 componentes · 166 iconos · 209 variables |
| `Strata · Quote Converter` | 41 |
| `Strata · Expert Hub` | 31 |

Los tres productos consumen la misma librería. Un cambio de token o de componente se propaga a los
tres sin trabajo de diseño.

---

## Fase 5 · cierre — no quedaba trabajo de construcción, sí de exactitud

Se retomaron las etapas 5-C a 5-F, pospuestas al pivotar a US-GP. **Auditoría antes de construir:
ya estaban cubiertas.**

### Inventario real de `🖼️ Transactions · grid flows`

**33 flujos · 98 pantallas · 4 bloques · 6 sub-columnas.**

| Etapa pospuesta | Qué la cubrió |
|---|---|
| 5-C · preferencias F07–F09 | **6-E**, renumerados a G14 · G15 · G16 |
| 5-D · datos F10–F17 | **7-E** (F17 aparcado en 7-A) |
| 5-E · avanzados F19–F26 | **7-E** para F19 y F26; F20–F25 aparcados en 7-A |
| 5-F · visores F27–F29 | cerrados en el bloque Documents |

→ Construir esas etapas habría duplicado trabajo ya hecho. **La auditoría previa se pagó sola.**

### El hueco de numeración era real y ahora está explicado

`F07`, `F08` y `F09` no existen. Gestionar una preferencia guardada —cambiar, guardar,
renombrar/duplicar/borrar— fue **respecificado por las user stories de US-GP** y vive como
`G14`–`G16` en el bloque *Saved views*. No se perdió nada: se renumeró para coincidir con la spec
desde la que trabajan los devs. Antes de esta pasada, nadie que abriera el archivo podía saberlo.

### Tres defectos de exactitud corregidos

1. **La leyenda y la tarjeta de registro seguían hablando de filas `SCHEMATIC ONLY`** — ninguna
   existe ya: 7-E construyó todas las del bloque Data en contexto. Mandaban al lector a buscar algo
   que no está.
2. **Decían que «bajo cada fila hay un esquema de detalle»**, y no es cierto: solo lo tienen los
   **21 flujos que nacieron como esquema** en la Fase 4. Los **12 de US-GP (G01–G13)** nacieron como
   pantallas completas y no tienen versión compacta. Corregido en ambos textos.
3. **`Detail · F29` estaba desalineado** (39489, 5029 en vez de 39360, 5060) y la tarjeta de registro
   invadía la cabecera de `BLOCK 1`. La tarjeta se movió al final de la fila superior.

`G13` tiene 2 pantallas y no 3 **por diseño**: es «la vista me sigue de dispositivo», que se
representa como Device A → Device B (§6.2).

### Verificación

0 solapamientos entre secciones · 0 dentro de la sección de flujos · 0 chips residuales.

---

## Deuda técnica · `sync-tokens.mjs` apuntaba a la copia obsoleta — **en 11 proyectos, no en uno**

El plan lo tenía anotado como un defecto de `demo-2026-strata`. Al abrirlo, el mismo bug estaba en
**todos** los proyectos que tienen el script.

### El bug

Dentro de `Strata Design System/` hay **dos** carpetas de tokens y solo una es la fuente de verdad:

| Ruta | |
|---|---|
| `Strata Design System/src/styles/tokens/` | copia antigua (mayo) |
| `Strata Design System/strata-ds/src/styles/tokens/` | **canónica** — la que generan `npm run tokens:figma` y la que siembra Figma |

Los 11 scripts apuntaban a la primera.

**Y dos estaban doblemente rotos:** `catalog-test` y `read` tenían mal la **profundidad** —
`catalog-test` subía un nivel de más y `read` uno de menos—, así que sus rutas no resolvían a nada
y el script fallaba en silencio con *Source not found*. Llevaban tiempo sin sincronizar y nadie lo
había notado porque el fallo no rompe el build.

### Corregido

Los 11 apuntan ya a `strata-ds`, con la ruta relativa calculada por proyecto y verificada
(`resuelve: true` en los 11). Cada script lleva ahora un comentario que explica cuál es cuál, para
que no se vuelva a apuntar a la copia vieja.

### `demo-2026-strata` sincronizado

Repo bajo git y árbol limpio, así que había red. Traía **los dos bugs** que se corrigieron en la
canónica: el colapso de superficies en claro (`accent` · `muted` · `secondary` · `input-background` ·
`sidebar-accent` todos en `#fafafa`, o sea idénticos a `card`) y `card` = `background` en oscuro.
Tras el sync: **+10 tokens en claro, +10 en oscuro, 6 valores corregidos en claro y 3 en oscuro**, y
los dos archivos quedan byte-idénticos a la canónica.

> ⚠️ Es un cambio **visual** en una demo activa: superficies que antes eran invisibles ahora se ven.
> Es el arreglo buscado, pero conviene levantar la demo y mirarla antes de mostrarla a un cliente.
> Reversible con `git checkout` si algo desentona.

### Desfase pendiente en los demás — el script ya no es el obstáculo

| Proyecto | Tokens que faltan | Valores distintos |
|---|---|---|
| `expert-hub` · `quote-converter` | — | — (al día desde §8.4c) |
| `expert-catalog` | 10 | 5 |
| `catalog-test` · `demo-officeworks` · `inbound-outbound` · `read` · `strata-experiences-demo` · `UI-Dealer` · `UI-Manufacturer` | 25 | 6 |

Los que muestran **25 tokens faltantes** no tienen siquiera la familia `status-*`: son la misma
migración pendiente que los `packages/strata-ds` vendorizados, no un simple cambio de valores.
Correr el sync ahí es una decisión de producto por proyecto, no un barrido automático.

---

## Deuda técnica · los `packages/strata-ds` vendorizados — **el problema no era el que decía el plan**

El plan lo anotaba como *«sincronizar los tokens de los paquetes vendorizados es una migración
aparte»*. Al investigarlo, la premisa se cae: **sincronizarlos no arreglaría nada, porque ese CSS no
se carga nunca.**

### Qué se carga de verdad

10 proyectos tienen `packages/strata-ds` con sus propios `src/styles/tokens/` y `dist/styles/tokens/`.
Ninguna app los importa:

- Las apps cargan `src/index.css` → `src/styles/theme.css` → `./tokens/variables.css`, es decir
  **sus propios tokens**, no los del paquete.
- Del paquete se importan **componentes JS** (de 2 a 37 por proyecto) y se compila su lib en el
  `build`. Su carpeta de tokens es **peso muerto**.
- Búsqueda de `import … 'strata-design-system/*.css'` en los 10 proyectos: **cero resultados**.

→ **Los tokens de los paquetes vendorizados no hay que migrarlos: hay que borrarlos**, o al menos
dejar de tratarlos como fuente. Mantenerlos sincronizados es trabajo que no cambia ningún píxel.

### La deuda real es otra

Los 7 proyectos que "no tienen la familia `status-*`" no la perdieron por un fallo de sync:
**nunca migraron a tokens semánticos de estado**. Verificado en dos direcciones:

- Ninguno usa clases `bg-status-*` / `text-status-*` → **0 estilos rotos**. No hay urgencia.
- Usan Tailwind crudo en su lugar: `inbound-outbound` tiene 549 `text-green-400`, 481
  `text-amber-400`, 476 `bg-green-500`…

**Correr `sync-tokens` ahí añadiría 25 variables CSS que ningún componente usa y cambiaría 6 valores
de superficie**, con riesgo visual y cero beneficio. Por eso no se corrió.

### Tamaño real de la migración pendiente

Clases de color crudas vs semánticas por proyecto:

| Proyecto | Tailwind crudo | Semántico | % semántico |
|---|---|---|---|
| `demo-officeworks` | 348 | 3.521 | **91%** |
| `strata-experiences-demo` | 2.839 | 25.587 | **90%** |
| `expert-catalog` | 2.859 | 7.218 | 71% |
| `quote-converter` | 975 | 2.307 | 70% |
| `inbound-outbound` | 10.576 | 19.926 | 65% |
| `demo-2026-strata` | 12.100 | 23.203 | 65% |
| `expert-hub` | 1.803 | 2.851 | 61% |
| `UI-Dealer` | 3.134 | 4.576 | 59% |
| `UI-Manufacturer` | 5.441 | 7.136 | 56% |

**~40.000 ocurrencias crudas en total.** No es una tarea de diseño ni un copiado de archivos: es una
migración de código por proyecto, y conviene atacarla por orden inverso de deuda —
`demo-officeworks` y `strata-experiences-demo` están casi hechos.

> Ojo: el porcentaje **no** mide calidad por sí solo. `demo-2026-strata` tiene 65% y es la demo
> activa; `UI-Manufacturer` tiene 56% y puede que ni esté en uso. Antes de migrar hay que decidir qué
> proyectos siguen vivos.

---

## Revisión de la sincronización de tokens en código

### Corrección a una nota anterior · sí hay red de git

§8.4c decía *«⚠️ Sin red de git. El repositorio no está bajo control de versiones»*. **Es falso para
los cuatro proyectos tocados**: `Strata Design System`, `expert-hub`, `quote-converter` y
`demo-2026-strata` están todos bajo git, y los cambios aparecen como modificaciones sin commitear.
Son reversibles con `git checkout`.

### Integridad del CSS · verificada

Los 6 archivos de tokens modificados: **217 declaraciones cada uno · llaves balanceadas · ningún
`;` faltante · ningún duplicado**. No hay riesgo de romper el build por sintaxis.

### La familia `-soft` estaba a medio conectar

§8.4c trajo los `-soft` al CSS *«para que diseño y código usen el mismo nombre y el mismo valor»*.
Pero traerlos al CSS no basta: **Tailwind no los exponía**, así que un desarrollador que leyera
`status-error-soft` en una spec de Figma no podía escribirlo — no era una clase.

Completado en los tres proyectos que tienen los tokens: `status-{success,warning,error,info,ai}-soft`
y `primary-{soft,tint}` añadidos al `tailwind.config.js`. Es **aditivo**: no cambia ninguna clase
existente. Los tres configs verificados con `import()` — parsean sin error.

> Pendiente del lado canónico: `strata-ds` usa **Tailwind v4** con `@theme inline`, y ese bloque
> expone solo los roles base — ni `status-*` ni `-soft`. Son dos mecanismos distintos (v4 `@theme`
> vs v3 `tailwind.config.js`) y conviene unificarlos antes de seguir añadiendo tokens.

### 🛑 Bug encontrado en `demo-2026-strata` · 4.198 clases apuntan a variables inexistentes

**No lo introduje yo** — es anterior al sync y sigue ahí. Su `tailwind.config.js` referencia cinco
variables que **no existen en ningún CSS del proyecto**:

| Variable referenciada | Existe | Equivalente que sí existe | Usos de la clase |
|---|---|---|---|
| `--color-success` | ❌ | `--color-status-success` | **1.866** |
| `--color-ai` | ❌ | `--color-status-ai` | **1.128** |
| `--color-warning` | ❌ | `--color-status-warning` | **744** |
| `--color-info` | ❌ | `--color-status-info` | **429** |
| `--color-danger` | ❌ | `--color-destructive` | 31 |

`bg-success` emite `rgb(from var(--color-success) r g b / 1)`; con la variable indefinida la
declaración es inválida y el navegador la descarta. El elemento se queda **sin color**.

**Origen probable:** el commit `ee5980e` («F80.0 · tailwind phantom classes») arregló las clases
`-light` fantasma pero las cableó a `--color-success` en vez de `--color-status-success`. El arreglo
quedó a medias.

**Verificado**, no deducido: búsqueda de `--color-(success|warning|info|ai|danger):` en **todos** los
`.css` del proyecto → cero resultados, antes y después del sync.

> **No se ha corregido a propósito.** Es una demo activa de cara a cliente y el arreglo daría color a
> ~4.200 elementos de golpe: cambio visual grande, aunque sea el correcto. Requiere decisión y una
> pasada visual, no un `sed`. El parche es de cinco líneas en `tailwind.config.js`.

---

## Higiene de librerías en los tres archivos

### `UI Reps` no está suscrita en ninguno — deprecarla es seguro

Verificado con `get_libraries` en `Strata Dealer Experience` y en `Strata · Quote Converter`:
**`UI Reps` no aparece en las librerías añadidas de ninguno**. Deprecarla no rompe nada en estos
archivos. Sigue siendo acción manual (Figma no expone despublicar por API) y conviene avisar antes,
por si algún archivo fuera de este proyecto la consume.

### 🛑 Más urgente · la librería de Strata NO está suscrita en los archivos de producto

`Strata · Quote Converter` **no tiene `Strata Dealer Experience` en sus librerías añadidas**, y aun
así consume sus componentes sin problema. La explicación es la que ya estaba en el ledger:
`importComponentByKeyAsync` trae un máster publicado **sin necesidad de suscripción**.

Consecuencia práctica, y va justo en contra del objetivo de publicar la librería:

- Todo lo construido por script funciona y se actualiza solo. **Nada roto.**
- Pero un diseñador que abra el archivo en Figma **no ve los componentes de Strata en el panel
  Assets** — no puede arrastrarlos para crear pantallas nuevas a mano.

**Arreglo (manual, 30 segundos por archivo):** en cada archivo de producto, panel *Assets* → icono de
librería → añadir **Strata Dealer Experience**. Verificado en Quote Converter; Expert Hub se creó por
el mismo camino, así que conviene comprobarlo también.

### 🧹 Y hay 7 UI kits de comunidad suscritos que no pintan nada

Los tres archivos arrastran **Material 3 Design Kit · Simple Design System · iOS 26 · iOS 27 ·
macOS 26 · macOS 27 · watchOS 26 · visionOS 26**.

Ninguno se usa (barrido de instancias: 100% de los másters son de la librería Strata). Pero mientras
estén suscritos, el panel Assets ofrece **cientos de componentes ajenos al DS** — botones de Material,
inputs de Apple — justo al lado de los de Strata. Es exactamente el camino por el que un componente
fuera de sistema entra a un archivo de producto.

**Recomendación:** quitarlos de los tres archivos. Riesgo cero —no hay instancias suyas— y elimina la
principal vía de contaminación del panel Assets.

---

## D50 · Las cabeceras del grid vuelven a los nombres de campo de OrderBahn

**Revierte la decisión 1 del 2026-08-20** (`Record Status → Status`, `Problem Code → Inconsistency`).

**Origen:** comentario de **Wendy Marchuck** en el archivo — *«If we will be continuing with the field
names Record Status and Problem Code, that is what the column headers should reflect»*. Wendy es la
autoridad declarada del vocabulario de ACK en el código (`Neocon review 2026-06-05`) y conoce a los
usuarios finales. Decisión de Diego: aplicar su criterio.

**Lo que Wendy enuncia no es una preferencia de etiqueta, es una regla:** la cabecera debe reflejar el
nombre del campo. Su condicional da por hecho que los campos son los de OrderBahn — es decir, así los
llaman los usuarios.

### El archivo se contradecía a sí mismo, y esa era la mitad del problema

El rename de agosto quedó registrado como *«propagado a las 95 pantallas»*. **No lo estaba.** Los dos
másters del grid nunca se alinearon:

| Máster | Decía |
|---|---|
| `3 Organisms/OrderbahnGrid` (3 densidades) | `Status` · `Inconsistency` |
| `3 Organisms/OrderbahnGridState` (4 estados) | **`Record Status`** — nunca renombrado |

Por eso convivían 89 `Status` con 34 `Record Status` en el mismo archivo. Wendy comentó sobre el grid
(que decía `Status`) habiendo visto F05 (que decía `Record Status`).

**Corregido desde el máster**, que arrastró casi todo: 6 nodos en `OrderbahnGrid` + **2 sobrescrituras**
de instancia (`FilterPanel` y `FilterPills`). Resultado en toda la página: **123 `Record Status` ·
109 `Problem Code` · 0 pendientes.**

> **Lección:** un rename global se declara cerrado solo tras contar en **todos** los másters, no en las
> pantallas. Un segundo máster sin tocar reintroduce el nombre viejo en cada instancia nueva.

### ⚠️ Lo que este cambio NO resuelve · pregunta abierta para Wendy

Las columnas siguen mostrando **valores de Strata**: `Record Status` enseña
`Received · Pending Review · Discrepancy · Approved` (el pipeline de Strata) y `Problem Code` enseña
`Price mismatch` / `Backorder` (el `subFlag`).

Ahora hay **etiquetas de OrderBahn sobre datos de Strata**. Es coherente con la regla de Wendy solo si
los conjuntos de valores también son los de OrderBahn — y **eso no lo sabemos**: en las capturas
`Problem Code` salía cortada y los valores de `Record Status` nunca se vieron. Ya estaba anotado como
pendiente en §4.7.2.

**Hay que preguntárselo a ella en la misma respuesta:** ¿cuáles son los valores reales de `Record
Status` y `Problem Code`? Sin eso, la coherencia es solo de nombre.

---

## Comentarios de Wendy Marchuck · qué se aplicó (2026-08-27)

### WM-1 · Cabeceras del grid → ✅ aplicado

Ver **D50**. Cabeceras unificadas a `Record Status` / `Problem Code` en toda la página: 123 y 109
usos, 0 pendientes. Sigue abierta la pregunta de los **valores**, que hay que hacerle a ella.

### WM-2 · Feedback desde dentro de un registro → ✅ aplicado

**Su pregunta tenía respuesta afirmativa en código**: `quote-converter/src/OCRTracking.tsx:641` pasa
`onSendFeedback` a `DocumentReviewModal`, que abre el composer con contexto
`{docId, vendor, docType, status}`. El ticket viaja con el documento.

**Lo que faltaba era representarlo en el dealer.** De los tres visores, `DocumentReviewModal` y
`PreflightSyncModal` ya ofrecían *Send feedback*; **`DocumentPreviewModal` no** — y ése es
precisamente el detalle del ACK del dealer (D24), el que se abre desde el grid.

Aplicado:
1. **`Send feedback` añadido** a la cabecera de `4 Overlays/DocumentPreviewModal`, junto a
   *Mark as Deprecated*.
2. **Fila de flujo `WM-2`** en la sección de Feedback, 3 pantallas: detalle del ACK → composer ya
   enlazado al documento (`ACK-8842 · AIS Furniture · Acknowledgement`) → ticket en *My feedback* con
   toast *«Feedback submitted · linked to ACK-8842»*.

El valor del patrón está en la segunda pantalla: **el usuario no reescribe de qué documento habla**,
y soporte recibe el ticket sabiendo cuál es.

### WM-3 · Show/hide de columnas fuera de V1 → ⏸️ marcado, no ejecutado

**No se borró nada, a propósito.** Sacar F05 no es quitar un flujo suelto: la spec de US-GP persiste
`hiddenFields`, así que arrastra otros cuatro. Y F05 **está observado en OrderBahn** — existe hoy en
la herramienta que se reemplaza, así que es un recorte deliberado, no una simplificación.

En su lugar, los cinco rótulos llevan ya una marca de alcance visible en el archivo:

| Flujo | Marca |
|---|---|
| `F05` Show and hide columns | `PROPOSED OUT OF V1 · WM` |
| `G01` Discard unsaved changes | `SHRINKS IF F05 GOES` |
| `G07` Export a view | `SHRINKS IF F05 GOES` |
| `G08` Import a view file | `SHRINKS IF F05 GOES` |
| `G10` Column gone | `DEPENDS ON F05` |

Así la decisión queda a la vista de cualquiera que abra el archivo, sin destruir trabajo y sin
pre-decidir por el dueño de US-GP. **Ejecutar el recorte requiere su confirmación**, porque cambia el
documento desde el que trabajan los devs.

### Verificación

0 solapamientos entre secciones · la sección de Feedback se reorganizó en vertical para no invadir la
de flujos al crecer.

---

## Versionado y salud del archivo del dealer (2026-08-27)

La página `🖥️ Screens` ya está compartida con desarrollo, así que cada cambio les llega en caliente.
Había además riesgo real de saturación.

### El peso estaba en una sola sección

| | Antes | Después |
|---|---|---|
| `🖥️ Screens` | **55.885 nodos** | **5.497** (−90%) |
| `🖼️ Grid flows · spec` | — | 47.639 (aislada en página propia) |

`🖼️ Transactions · grid flows` era el **85% de la página y el 72% del archivo entero**
(16.166 vectores · 45.720 px de ancho). No hacía falta reestructurar nada más: aislarla bastó.
Capas ocultas: 19 en todo el archivo — irrelevante. El canvas ocupa 54.021 px de los ~260.000
disponibles.

### Qué permite Professional — y qué no

| Función | |
|---|---|
| Historial completo · versiones con nombre (título ≤25, descripción ≤140) | ✅ |
| Restaurar (no destructivo) · **duplicar una versión a un archivo nuevo** | ✅ |
| Dev Mode · `Ready for dev` · **Compare changes** | ✅ (asiento Full o Dev) |
| Separadores de página (página vacía con nombre que empieza por `-`) | ✅ |
| **Branching / merging** | ❌ **Solo Organization y Enterprise** |
| Estado `Completed` en Dev Mode | ❌ Solo Org/Enterprise |

### D51 · No se replica el patrón `[Staging] / [Development] / [Design]`

Diego lo probó en el archivo antiguo de Expert Hub. **Tiene un fallo de mecánica que lo invalida:
duplicar páginas no congela nada.** Las instancias de las tres páginas siguen resolviendo contra el
mismo máster de `Components`; tocar un componente cambia también «Staging». Da la sensación de un
entorno estable sin serlo — peor que no tenerlo, porque un dev confía en ella.

Además triplicaría el canvas (~168.000 nodos aquí), la divergencia entre páginas sería invisible
—Figma no compara páginas— y `v1.0 [Feb 12]` en el nombre es un historial escrito a mano que miente
en cuanto alguien edita.

**El patrón nació para suplir la falta de branching**, que en Professional no existe. La sustitución
correcta es historial de versiones + `Ready for dev`.

### Estructura aplicada

```
🖥️ Screens              5.497  · las 4 superficies de producto
🖼️ Grid flows · spec   47.639  · la especificación, aislada
----------------
🧩 Components            9.178
🎨 Foundations           1.178
- - - - - - - - - -
📋 Changelog                51  · nuevo
🔍 UX Audit                191
📦 Archive               2.558  · lo aparcado
📑 References                5
```

Mismo archivo, mismo enlace para los devs — solo cambia la página. Se añadió en `Screens` un frame
**`ÍNDICE · dónde está cada cosa`** para que nadie tenga que preguntar dónde quedó la spec.

### Convención de versionado

Al entregar algo a desarrollo: `Save to Version History` con título `v1.3 · Transactions` (≤25 car.)
y descripción con **qué cambió · quién lo pidió · qué NO cambió**. Y marcar la sección como
`Ready for dev`, que es lo que le da al dev el **Compare changes** — el diff que la duplicación de
páginas intentaba dar y no daba.

> ⚠️ `Ready for dev` **se marca a mano**: `devStatus` no está expuesto en este runtime del plugin
> (`"devStatus" is not a supported API`). No es automatizable desde aquí.

La página `📋 Changelog` duplica esa información **dentro del archivo**, porque el historial vive en
un menú y puede no estar al alcance de quien solo tiene permiso de ver.

### Verificación

**0 instancias sin máster** tras mover 3 secciones entre páginas · **0 solapamientos** en ninguna
página · total del archivo intacto (66.297 nodos).

---

## ST-1113 + ST-1114 · review de Acks V1 (2026-09-01)

Dos tickets, una sola entrega y una sola versión con nombre: `v1.4 · Acks V1 review`. Todo se aplicó
**por sobrescritura de instancia**. **Ningún máster cambió, así que la librería no se republica** —
es lo que mantiene la IA de Quote Converter intacta y la spec de flujos completa.

### La regla que decidió el alcance

**Un cambio pedido en Jira se aplica en las dos páginas** — `🖥️ Screens` y `🖼️ Grid flows · spec`—,
porque las dos describen el mismo producto y un dev las lee juntas. Dejarlo solo en Screens produce
dos verdades y el que abra la spec asume que el control existe.

La única excepción es **la pantalla donde el elemento retirado ES el sujeto del flujo**. Ahí apagarlo
no documenta el diferimiento: deja un flujo que se contradice a sí mismo. Por eso `F05 · Show and
hide columns` conserva su botón en sus 3 pantallas, con el chip `DEFERRED TO V2+ · ST-1113` que dice
por qué sigue ahí. Se detecta programáticamente: **es la única fila cuyas pantallas montan
`ColumnsPanel`** (95 de 98 apagadas, 3 conservadas).

### ST-1113 · Wendy

| AC | Qué se hizo |
|---|---|
| 1 · cabeceras `Record Status` / `Problem Code` | Ya estaba, del mismo día. **123 + 109, 0 pendientes**, claro y oscuro |
| 2 · quitar el control de columnas de V1 | `control/columns` oculto en **las 5 instancias de Screens** (`Transactions · Acknowledgements`, su DARK MODE, `Feedback · navbar dropdown`, `WM-2.1`, `WM-2.2`) **y en 95 de las 98 de la spec** |
| 3 · feedback desde el registro | **No se entrega**: rotulado como propuesta pendiente |

El diferimiento quedó escrito en tres sitios, no solo en el ticket: las 5 `scope-flag` de la spec
pasan a `DEFERRED TO V2+ · ST-1113` (`4554:46577` F05 · `…79/81/83` los que encogen · `…85` el que
depende), la tarjeta `SECTION · Transactions` gana una línea en *Deliberately out of scope*, y su
línea `Features` deja de prometer *show/hide* entre las capacidades de columnas.

**WM-2** conserva sus 3 pantallas y el botón *Send feedback* —le sirven a Wendy para decidir sobre
algo concreto— pero con chip `PENDING · AWAITING WENDY'S CONFIRMATION` en el rótulo de fila, las tres
leyendas de paso prefijadas, y la advertencia explícita en la tarjeta de Feedback de **no marcarlo
`Ready for dev`** hasta que ella confirme.

> ⚠️ **Sigue abierto:** las dos columnas llevan etiquetas de OrderBahn sobre **valores de Strata**
> (`Received · Pending Review · Discrepancy · Approved` / `Price mismatch · Backorder`). Nunca vimos
> los valores reales — en las capturas `Problem Code` salía cortada. Hay que pedírselos a Wendy.

### ST-1114 · Matt

| AC | Qué se hizo |
|---|---|
| 1 · quitar «reorder row» | **Nada que hacer.** El máster `OrderbahnGrid` nunca tuvo handle de fila y `F17` ya estaba en `📦 Archive`. Los 4 `GripVertical` que quedan son de **columna** (F02 ×2) y del panel de agrupación — borrarlos rompería F02 |
| 2 · quitar la IA del Document Review | **6 instancias** sobrescritas: 1 en Screens (`WM-2.1`) + 5 en la spec (`F27` y su detalle) |
| 3 · simplificar F27 | Se resuelve con el AC2: queda documento a la izquierda, panel de metadatos editable a la derecha |
| 4 · Orderbahn → Strata en las notas de OCR | **Una sola aparición** (`4080:13878`). Las otras 4 de la página son legítimas: nombres de componente, procedencia y el índice de la auditoría |

Por instancia: `OrderbahnSyncBanner` oculto · `ResolutionPill` de `ai_suggested` a `unresolved` ·
«Did you mean … · 92% confidence» → **«No value extracted — enter manually»** · el chip de
«94% average confidence» oculto.

**Lo que NO se tocó, y por qué:** los contadores `9 valid · 3 issues` y la barra de `75%` se quedan.
El AC nombra tres cosas —badge de *AI match*, porcentajes de confianza y banner de sync— y esos
contadores son **validación de campos, no IA**. Quitarlos dejaría al usuario sin saber qué le falta,
que es justo lo que Matt sí quiere que vea.

### Gotcha 10 · `setProperties` no reajusta el ancho de una instancia con ancho fijo

Al pasar el pill de `ai_suggested` («AI match», 8 car.) a `unresolved` («Needs choice», 12 car.), el
texto quedó **recortado**: la instancia tenía ancho fijo heredado de la variante anterior y el padre
`head` recorta. Cambiar de variante **no** vuelve a medir.

→ Tras cualquier `setProperties` que alargue el contenido, `layoutSizingHorizontal = 'HUG'`. Es
válido en una instancia aunque el padre sea auto-layout horizontal, porque la instancia **es** un
frame auto-layout. Corregidas las 5 (80 → 106 px; una de 52 → 69).

### Verificación

| Comprobación | Resultado |
|---|---|
| IA en el dealer | **0** textos de *AI match* / *confidence* / *Did you mean* y **0** banners visibles, en Screens y en la spec |
| Quote Converter (`2dzdBwbG1ESDSLvzwC2vlc`) | **intacto** · 2 banners y 6 textos de IA siguen visibles |
| Control de columnas | **0** visibles en Screens · **3/98** en la spec, y las 3 son `F05` |
| Máster `OrderbahnGridToolbar` (`4240:21781`) | `control/columns` visible en **las 4 variantes** |
| Integridad de Screens | 702 instancias, **0 sin máster** · solo Inter |
| Naming | «Orderbahn» = 0 en la tarjeta de OCR |

---

## El logotipo del navbar era un marcador de texto (2026-09-01)

Lo detectó Diego revisando. El frame `logo` del máster `3 Organisms/Navbar` medía ya lo correcto
—**80×32**, igual que el `h-8 w-20` del código— pero dentro tenía un **texto «STRATA»**: un
marcador de la primera pasada que nunca se sustituyó. Se arrastró a **112 pantallas**.

En producción son dos imágenes (`logo-light-brand.png` / `logo-dark-brand.png`), la marca de capas
hexagonal sobre la palabra STRATA, con `object-contain` — `quote-converter/src/components/Navbar.tsx:60-61`.

### ⚠️ En el design system, ese activo está roto

Los dos archivos de marca existen en cinco sitios y **solo los de los proyectos sirven**:

| Ruta | `logo-light-brand` / `logo-dark-brand` |
|---|---|
| `quote-converter/src/assets/` · `expert-hub/src/assets/` | **1024×840 · 79–80 KB** ✅ |
| `Strata Design System/src/components/assets/logos/` | **1×1 px · 0 KB** ❌ |
| `Strata Design System/strata-ds/src/components/assets/logos/` | **1×1 px · 0 KB** ❌ |

Es decir: **el design system no tiene el logotipo de marca**. Los que sí tiene —`branding/logo-black ·
white · lime · gray`, 1024×840— son solo la marca, sin la palabra. Los PNG se tomaron de
`quote-converter`, que es la copia buena. **Arreglar las dos copias del DS queda pendiente**, no se
tocó desde aquí.

Y no existe **ninguna versión vectorial** del logotipo en el repositorio. Ni siquiera `BrandingView`
del propio DS la tiene: sus cuatro variantes oficiales son PNG. Por eso va como imagen.

### Cómo quedó

Una sola capa **`brand-lockup`** (80×32, `scaleMode: FIT`) dentro del frame `logo`, en las **10
variantes**. El modo oscuro se resuelve **sobrescribiendo el `imageHash` en la instancia** a la
versión lima — el equivalente en Figma del `dark:hidden` / `hidden dark:block` del código.

`imageHash` claro `e791340d…` · lima `39e1dcc9…`.

> **Esto sí toca el máster** → hay que **republicar la librería**, y a `Strata · Quote Converter` y
> `Strata · Expert Hub` les llega aviso de actualización. Es el único cambio de esta entrega que lo
> hace; ST-1113 y ST-1114 fueron todo sobrescritura.

### Gotcha 11 · `query()` no devuelve capas ocultas, y una capa oculta del máster no llega a la instancia

Dos cosas distintas, las dos descubiertas aquí:

1. **`node.query('*')` omite los nodos invisibles.** Buscar una capa que acabas de ocultar devuelve
   vacío y parece que no existe. Para tocar capas ocultas hay que recorrer `children` a mano.
2. El primer intento montó **dos capas** (`logo/light` + `logo/dark` oculta), calcado del código. En
   el máster quedaron bien, pero **las instancias solo recibieron la visible** — la oculta nunca se
   propagó. Por eso se cambió a **una capa con el relleno sobrescrito**, que sí soporta override de
   instancia y además deja el máster más simple.

### Verificación

**112 navbars** con la imagen: 18 en `🖥️ Screens` + 94 en la spec de flujos · **0 sin `brand-lockup`** ·
0 pantallas oscuras en la spec (la única del archivo es `Transactions · DARK MODE`, ya en lima) ·
los dos rectángulos temporales de subida, eliminados.

---

## Pendiente de Diego, a mano

1. **Republicar la librería** — obligatorio ahora, por el logotipo.
2. Marcar `Ready for dev` en lo entregado, **sin incluir WM-2**.
3. Guardar la versión `v1.4 · Acks V1 review`.

---

## Line items del Acknowledgement · detalle, edición e historial (2026-09-14) · ✅ construido, pendiente de republicar

### Estado final

| Qué | Resultado |
|---|---|
| Librería | `Tooltip` `4685:7694` · `LineItemsToolbar` `4684:7675` · `LineItemsPanel` `4694:7936` · `LineItemHistoryModal` `4691:7914` · **0 pinturas sin token** · solo Inter · revisados en claro y oscuro |
| Estados de `LineItemsPanel` | **6**: `default` · `saved` · `editing` · `loading` · `empty` · `error` |
| Máster `OrderbahnGrid` | 18 iconos `List` (3 densidades × 6 filas) · `td/actions` sigue en **228 px** · verificado en Transactions, DARK MODE y **86/86 grids de la spec** |
| Máster `FeedbackToast` | Propiedad `Action#4696:0` · probada en instancia: con `true` aparece Undo y el toast sigue en 360 px · con `false` no cambia nada (los 2 de Quote Converter) |
| Sección | `4697:48952` · **13 pantallas** (LI-1 → LI-4 + oscuro) · 0 solapamientos · 1099 instancias, **0 sin máster** · solo Inter · **0 grids desprendidos** |
| Mantenimiento | F21/F23 del Archive → `REOPENED` · índice de Screens con la sección · Changelog `v1.5 · Line items`, en revisión |

**Pendiente de Diego:**
1. Republicar la librería.
2. Marcar `Ready for dev` en la sección.
3. Guardar `v1.5 · Line items`.
4. **Avisar a desarrollo de D52.**

**Deuda previa detectada (no introducida aquí):** el avatar del máster `3 Organisms/Navbar` lleva
`#7a37d3` con texto `#ffffff` **sin token** en sus 10 variantes. Solo en esta sección son 26 pinturas
sin token (2 por pantalla × 13), y lo mismo pasa en todas las pantallas de los tres productos. El
átomo `1 Atoms/Avatar` ya resuelve las iniciales con `muted` / `muted-foreground` / `border`.
**Arreglo propuesto:** cambiar el avatar hecho a mano del navbar por una instancia de `Avatar`, o
atar esos dos colores a token. Toca el máster de los tres productos, así que queda por decidir.

### Gotchas de la construcción de la sección

- **15 · Dentro de una instancia no se puede mover un hijo** (`This property cannot be overridden in
  an instance: relative-transform`). Un scroll horizontal no se simula por override: **tiene que ser
  una variante**. Por eso existe `State=saved`.
- **16 · Al clonar una pantalla, las instancias pasan a llamarse como su componente**
  (`3 Organisms/OrderbahnGrid`, no `OrderbahnGrid`), y lo mismo con una instancia recién creada.
  **Buscar instancias por su máster** (`getMainComponentAsync`), nunca por nombre exacto.
- **17 · Un script que falla a mitad no deja nada:** Figma deshizo por completo las cuatro
  construcciones fallidas. Aun así, hay que leer el canvas antes de reintentar (gotcha 13).

Diego compartió el flujo actual de OrderBahn para revisar los items de un ACK (tenant `Devtests`,
`acknowledgmenttransitioning`). El dealer de Strata no tenía esa vista: la pestaña `Line Items` de
`DocumentReviewModal` era relleno, el paso «Line items» de `CreateRecordModal` nunca se construyó, y
**no había tabla de line items en ningún sitio del archivo**.

**Flujo observado en OrderBahn:**
1. El 4º icono de acciones, el `+` —el que teníamos como «sin identificar»—, despliega el registro.
2. Aparece un sub-grid con toolbar propio (`Find in current page · Ctrl K · Columns · Filters · Density · Import`) y 14 columnas.
3. **Lápiz** → toda la fila pasa a edición → guardar (disquete) / cancelar (✕).
4. **Reloj** → modal «Data Update» (`ID · Name · Before · After · Activity · User · Date Updated`, filas expandibles, `Done`).

### Decisiones

| # | Decisión | Qué implica |
|---|---|---|
| **D51** | Los line items **se abren desde un botón de acción de la fila** y se despliegan bajo el registro, en el mismo grid | Reabre `F23`. D24 sigue vigente para cabecera y documento. Glifo `lucide/List`, **no `+`**: en Strata `+` es *crear*, y el ⊕ se quitó por esa confusión (F25/D31) |
| **D52** | **El dealer edita line items en línea, fila completa** | ⚠️ **Revoca para esta superficie** la regla de `UI-Dealer/src/AckDetail.tsx:822-823`: *«Add Item is intentionally absent on ACK detail because the dealer cannot modify a vendor acknowledgement here.»* Reabre `F21`. **Desarrollo tiene que saberlo: el código dice lo contrario** |
| **D53** | **Historial por line item en un modal** | Antes/después **por campo, en columnas** (regla 08). Sin `ID` ni `Name`: al dealer no le dicen nada |
| **D54** | Sub-toolbar = `Find (Ctrl K)` · `Filters` · `Density` | Sin `Columns` (ST-1113) · sin `Import` (D31) |

### Componentes

| Componente | Estado | Variantes | Fuente de anatomía |
|---|---|---|---|
| `1 Atoms/Tooltip` | ✅ `4685:7694` | `Side=top\|bottom` | DS `src/components/overlays/tooltip.tsx`: `bg-foreground` · `text-background` · `rounded-md` · `px-3 py-1.5` · `text-xs` · flecha. Faltaba en la librería y R7 lo exige para botones de solo icono |
| `2 Molecules/LineItemsToolbar` | ✅ `4684:7675` | — | Búsqueda, `Filters` y `Density` **clonados** de `OrderbahnGridToolbar`, sobre `card` + `border` porque el panel es `muted`. Chip `Ctrl K` |
| `3 Organisms/LineItemsPanel` | ✅ `4694:7936` | `State=default\|saved\|editing\|loading\|empty\|error` | `LineItemsPane.tsx` · `QuoteProposalReviewScene.tsx:94-221` · reglas 16, 09, 03 y 13. `saved` = tras guardar, desplazado hasta los valores editados (gotcha 15) |
| `4 Overlays/LineItemHistoryModal` | ✅ `4691:7914` | `State=collapsed\|expanded` | Anatomía de `Dialog Size=xl` (960 · radio 16 · `shadow/xl`) · `RevisionHistory.tsx` + `DiffViewer.tsx` · regla 08 |
| `3 Organisms/OrderbahnGrid` · **cambio de máster** | ✅ | — | `lucide/List` (`action/line-items`) como primer icono de `td/actions`, con trazo `muted-foreground` · 18 filas · ancho de 228 px intacto |
| `2 Molecules/FeedbackToast` · **cambio de máster** | ✅ `Action#4696:0` | + booleano `Action` (por defecto `false`) | «Undo» con el átomo `Button Variant=link` (D27). **Visibilidad atada a la propiedad, no capa oculta** (gotcha 11) |

**Verificado en los cuatro:** 0 pinturas sin token · solo Inter · revisados en claro y en oscuro (con
marco temporal en modo Dark, borrado después).

**Anatomía del panel:**
- 1472 px sobre `muted`, con sangría izquierda de 44 px, que alinea con la columna de checkbox del grid.
- Filas compactas.
- `Line Number` (76) e `Item Number` (150) fijadas a la izquierda; **`Actions` (150) fijada a la derecha**.
- Las otras 12 columnas (1316 px) se ven por una ventana de 1036 px con barra de scroll visible.
- Cabeceras en 2 líneas, como el grid principal.

**Estados del panel:**
- **`editing`:** línea 2 con tinte `primary-soft` e inputs `sm`. `Line Number` y `Extended` quedan en solo lectura (identidad y cálculo). Acciones **«Cancel» / «Save» con verbo** y tabla desplazada hasta `Extended`.
- **`loading`:** skeleton del ancho de cada columna.
- **`empty`:** «This acknowledgement has no line items», remitiendo a OCR (D31).
- **`error`:** en línea, con **Retry**.

**Por qué `Actions` mide 150 y no 88:** `Button Size=icon` de la librería **no tiene hueco para el
icono** (lleva un glifo fijo), así que un Save/Cancel de solo icono obligaba a dibujar botones a mano.
Con `Button sm` y verbo se usa el átomo, se cumplen las reglas 04/08 y mejora la accesibilidad. Los
150 px se reservan **en los cinco estados** para que la columna no salte al entrar en edición.

**Datos de la edición (flujo LI-2):** `Unit Net Price` 388.83 → 369.33 · `Discount` — → 19.50 ·
`Extended` 4,665.96 → 4,431.96. Es la fila del *Price mismatch* del grid.

### Gotchas de esta tanda

- **12 · `figma.createFrame()` nace con 100×100 fijo.** Al darle `layoutMode`, sus ejes siguen en
  `FIXED`: una entrada del modal colapsó a 100 px de ancho con el contenido recortado. Hay que
  **estirar o poner en `AUTO` explícitamente**, o usar `figma.createAutoLayout()`, que ya nace ajustado al contenido.
- **13 · Un «internal error» no significa que no se ejecutó.** El `Tooltip` falló así y **sí se
  creó**, con sus dos variantes. Antes de reintentar hay que leer el canvas, o se duplica el componente.
- **14 · `Button Size=icon` no admite cambiar el icono:** su contenido no es una instancia. Si hace
  falta un botón de icono con otro glifo, hay que ampliar el máster; no se puede sobrescribir.

### Procedencia de los datos

| Columna | Fuente |
|---|---|
| Item Number · Item Description · Unit List Price · Unit Net Price | ✅ **Observado** en las capturas de OrderBahn |
| Customer Order Line Item # · Item Configuration | ✅ Observado **vacío** en el tenant → se muestra vacío |
| QTY Ordered / Shipped / Backorder | 💻 Seed de `inbound-outbound/src/OrderDetail.tsx:65-93` (D12) |
| Unit of Measure | 💻 `UI-Dealer/src/features/po-conversion/types.ts:22-28` |
| Discount % · Extended | Calculados, **solo donde existen los dos valores** |
| Entrada `Created` del historial | ✅ Observada: Leonardo Fundora · Aug 14, 2026 · `6325CTBLBB-MN54*` · Qty 12 · 388.83 |
| Entrada `Updated` del historial | La produce el flujo LI-2 |

### Sección

`✅ NEW · Transactions · Line items (dealer) · Sep 2026` en `🖥️ Screens`, con el patrón de WM-2 y la
plantilla `4212:16782` clonada. Flujos LI-1 (abrir) · LI-2 (editar) · LI-3 (historial) · LI-4
(estados) + 1 pantalla en oscuro.

La fila expandida se compone **sin desprender**: grid A (cabecera + filas 1–2) · `LineItemsPanel` ·
grid B (filas 3–6 + pie), con visibilidad por override. El grid hace hug en vertical, verificado.

---

## Cómo se usa este ledger

1. Antes de construir un elemento, se busca su entrada en `components-data.ts` y se llena la fila:
   componente DS, tokens, variantes, y la desviación entre lo que el DS dice y lo que el código hace.
2. Si **no existe** en el DS, se marca *(no existe en el DS)* y se decide: se construye como
   product-specific, o es candidato a promoverse al DS.
3. Al terminar, se marca ✅ y se verifica que no quedó ningún hex sin bindear.
4. Las filas con desviación alimentan `expert-hub/DS-VIOLATIONS.md` para el arreglo del código.
