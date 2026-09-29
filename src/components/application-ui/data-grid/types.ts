
import type { LucideIcon } from 'lucide-react';
import type { GridDensity } from './state/density';
import type { PersistedGridState } from './state/persisted-state';
import type { EditorType, EditRenderer } from './editors/types';
import type { CellChange } from './editing/edit-session';

export type { CellChange, DirtyCell } from './editing/edit-session';
export type { PersistedGridState } from './state/persisted-state';

export type FilterType = 'text' | 'number' | 'date' | 'date-tree' | 'select' | 'boolean';

export interface SparklineColumnOptions<TData = any> {
  type?: 'line' | 'area' | 'bar' | 'winloss'; // Default 'line'
  values?: (row: TData) => number[]; // Derive the series; defaults to the cell value (must be number[])
  width?: number; // px, default 120
  height?: number; // px, default 28
  color?: string; // line/area stroke and bar positive fill. Default: theme primary / --sparkline-positive.
  negativeColor?: string; // bar/winloss negative fill. Default: --sparkline-negative.
  labels?: string[] | ((row: TData) => string[]); // per-point tooltip labels (e.g. months)
  format?: (value: number) => string; // tooltip value formatting
}
export type AggregateFunction = 'sum' | 'avg' | 'min' | 'max' | 'count';
export type NumberFilterOperator = '=' | '!=' | '<' | '>' | '<=' | '>=' | 'between' | 'isEmpty' | 'isNotEmpty';
export const numberFilterOperators: NumberFilterOperator[] = ['=', '!=', '<', '>', '<=', '>=', 'between', 'isEmpty', 'isNotEmpty'];

export type TextFilterOperator = 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'isEmpty' | 'isNotEmpty';
export const textFilterOperators: TextFilterOperator[] = ['contains', 'equals', 'startsWith', 'endsWith', 'isEmpty', 'isNotEmpty'];

export type DateFilterOperator = 'is' | 'before' | 'after' | 'onOrBefore' | 'onOrAfter' | 'between' | 'isEmpty' | 'isNotEmpty';
export const dateFilterOperators: DateFilterOperator[] = ['is', 'before', 'after', 'onOrBefore', 'onOrAfter', 'between', 'isEmpty', 'isNotEmpty'];

export type SelectFilterOperator = 'isAnyOf' | 'isNoneOf' | 'isEmpty' | 'isNotEmpty';
export const selectFilterOperators: SelectFilterOperator[] = ['isAnyOf', 'isNoneOf', 'isEmpty', 'isNotEmpty'];

export type BooleanFilterOperator = 'isChecked' | 'isNotChecked';
export const booleanFilterOperators: BooleanFilterOperator[] = ['isChecked', 'isNotChecked'];

export type DateTreeFilterOperator = 'inBucket' | 'isEmpty' | 'isNotEmpty';
export const dateTreeFilterOperators: DateTreeFilterOperator[] = ['inBucket', 'isEmpty', 'isNotEmpty'];

export type ConditionalFormatOperator =
  | '='
  | '!='
  | '<'
  | '>'
  | '<='
  | '>='
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'between';

export interface ConditionalFormatRule<TData = any> {
  field?: keyof TData & string;
  operator?: ConditionalFormatOperator;
  value?: any;
  value2?: any;
  style?: React.CSSProperties;
  className?: string;
  colorScale?: {
    min?: number;
    max?: number;
    minColor: string;
    maxColor: string;
  };
  dataBar?: {
    min?: number;
    max?: number;
    color?: string;
  };
}

export type DateRangePreset = 'all' | 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'custom';

export const dateRangePresetOptions: { label: string; value: DateRangePreset }[] = [
  { label: 'Any Date', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 Days', value: 'last7days' },
  { label: 'Last 30 Days', value: 'last30days' },
  { label: 'This Month', value: 'thisMonth' },
  { label: 'Last Month', value: 'lastMonth' },
  { label: 'Custom Range', value: 'custom' },
];


export interface ColumnDefinition<TData = any> {
  /**
   * Column key. Not restricted to keys of TData: a column may be computed or come
   * from a dynamic per-tenant field, in which case supply `valueGetter`.
   */
  field: string;
  /** Derive the cell value. Sorting, filtering, grouping, search and export all use it. */
  valueGetter?: (row: TData) => unknown;
  /** Format the value for display. `cellRenderer` takes precedence over this. */
  valueFormatter?: (value: unknown, row: TData) => string;
  /** Write an edited value back into the row. Consumed by the editing sub-project. */
  valueSetter?: (value: unknown, row: TData) => TData;
  headerText: string;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: FilterType;
  hideable?: boolean; // Default true
  /** Fixed, or a per-row predicate — carries the dealer-side field-level role model. Default false. */
  editable?: boolean | ((row: TData) => boolean);
  /** Which built-in editor to use. Inferred from filterType/value when omitted. */
  editorType?: EditorType;
  /** Full editor override — the only place the grid lets an app inject domain semantics
   * (a users dropdown, a status picker, an entity autocomplete). Takes precedence over editorType.
   * Must be a stable reference: an inline `editRenderer: p => <X {...p}/>` in an inline
   * `columnDefs` literal is a new component type every render, so the open editor remounts
   * and loses focus mid-edit. Define it at module scope (or memoize it). */
  editRenderer?: EditRenderer<TData>;
  /** Options for the 'select'/'multiselect' editorType. Falls back to filterOptions when omitted. */
  editOptions?: { label: string; value: any }[];
  /** Extra validation beyond the built-in per-type check (e.g. email format). Return a message to block the commit. */
  editValidator?: (value: unknown, row: TData) => string | null | undefined;
  pinned?: 'left' | 'right' | null; // For column pinning
  groupable?: boolean; // Default true, whether column can be dragged to grouping panel
  pivotable?: boolean; // Whether column can be pivoted
  headerRenderer?: () => React.ReactNode;
  cellRenderer?: (value: any, row: TData) => React.ReactNode; // Custom cell content; takes precedence over built-in rendering
  aggregate?: AggregateFunction | AggregateFunction[]; // Single function or list of aggregate metrics shown in group header
  defaultWidth?: string | number;
  minWidth?: string | number; // Minimum width for resizing
  resizable?: boolean; // Default true
  reorderable?: boolean; // Default true
  /** Whether the column can be pinned left/right via its header's pin icon. Default true,
   * independent of `reorderable` -- a column that's fixed in column order (e.g. a trailing
   * "Actions" column) can still be pinnable. */
  pinnable?: boolean;
  filterOptions?: { label: string; value: any }[];
  /**
   * Renders this column's filter input instead of the built-in one. The slot Orderbahn
   * needs for async domain pickers (users, business entities, statuses, problem codes).
   * The grid still owns the operator selector, the condition list and the apply button.
   */
  filterRenderer?: (props: {
    value: FilterValue;
    operator: string;
    onChange: (next: FilterValue) => void;
  }) => React.ReactNode;
  dateTreeBuckets?: DateTreeBucket[]; // Auto-derived for filterType 'date-tree' if not supplied
  iconName?: string;
  group?: string; // Header group label; contiguous columns sharing a label render under one spanning header
  sparkline?: SparklineColumnOptions<TData>; // Render the cell as an inline mini chart; cellRenderer takes precedence
  conditionalFormats?: ConditionalFormatRule<TData>[]; // Conditional formatting rules specific to this column
  /** When true, this column's cells render no native `title` (browser tooltip) —
   * for a column whose raw value isn't meaningful to show on hover (e.g. an
   * Actions column keyed by row id). Default false — every existing column keeps
   * today's title-on-hover behavior unchanged. */
  suppressTitle?: boolean;
  /** When false, clicking a cell in this column does not update the grid's
   * `focusedCell` state — which is what drives keyboard-navigation's
   * scroll-into-view effect. For a column whose cells are action buttons (e.g.
   * an Actions column), clicking a button should never scroll the grid to bring
   * that column into view. Default true (undefined = true) — every existing
   * column keeps today's click-focuses-the-cell behavior unchanged. Keyboard
   * navigation into/through the column is unaffected; this only changes what a
   * mouse click does. Covers both the click path (use-edit-session.ts's
   * handleCellClick) and the mousedown/range-selection path
   * (use-range-selection.ts's handleCellMouseDown) -- a `cellRenderer` using
   * a non-interactive element (e.g. a `<div>`/`<span>` with its own `onClick`)
   * is covered the same as a real button/link/input. */
  navigable?: boolean;
}

export interface SortConfig<TData = any> {
  field: keyof TData & string;
  direction: 'asc' | 'desc';
}

export interface BaseFilterValue {
  type: FilterType;
}
export interface TextFilterValue extends BaseFilterValue {
  type: 'text';
  value: string;
  operator?: TextFilterOperator; // default 'contains' — today's only behaviour
}
export interface NumberFilterValue extends BaseFilterValue {
  type: 'number';
  value?: number; // For 'between', this is the lower bound
  value2?: number; // For 'between', this is the upper bound
  operator: NumberFilterOperator;
}
export interface DateFilterValue extends BaseFilterValue {
  type: 'date';
  preset?: DateRangePreset;
  value?: Date; // For 'custom' range, this is the start date
  value2?: Date; // For 'custom' range, this is the end date
  operator?: DateFilterOperator; // only meaningful when preset === 'custom'; default 'between'
}
export interface SelectFilterValue extends BaseFilterValue {
  type: 'select';
  value: string | string[];
  operator?: SelectFilterOperator; // default 'isAnyOf' — today's only behaviour
}
export interface BooleanFilterValue extends BaseFilterValue {
  type: 'boolean';
  value?: boolean;
  operator?: BooleanFilterOperator; // derivable from value; explicit for the operator selector + persistence
}
export interface DateTreeFilterValue extends BaseFilterValue {
  type: 'date-tree';
  selected: string[]; // 'YYYY-MM' keys; empty/undefined means no filter (show all)
  operator?: DateTreeFilterOperator; // default 'inBucket' — today's only behaviour
}

export type FilterValue = TextFilterValue | NumberFilterValue | DateFilterValue | SelectFilterValue | BooleanFilterValue | DateTreeFilterValue;

export interface DateTreeBucket {
  year: string;
  months: string[]; // '01'..'12', present in the data for that year
}

export type FilterLink = 'AND' | 'OR';

/**
 * One column's filter: a list of conditions joined by `link`. Orderbahn's grid allows
 * several conditions per column (`filterModel.items` + `GridLogicOperator`), so one
 * `FilterValue` per column cannot express "status is Synced OR status is On Hold".
 * `link` is `'AND'` to require every condition to match, `'OR'` to require any one of them.
 */
export interface ColumnFilter {
  conditions: FilterValue[];
  link: FilterLink;
}

/**
 * A bare `FilterValue` is still accepted on the way in — that is what every payload
 * saved before this sub-project holds, and what a consumer passing `gridState` by hand
 * is likely to write. `asColumnFilter` in `filters/filter-model.ts` normalizes both.
 */
export interface ActiveFilters<TData = any> {
  [field: string]: ColumnFilter | FilterValue;
}

// TData items can optionally have children for tree data
export interface HierarchicalData<TData = any> {
  id: string | number;
  children?: TData[];
  // Other properties of TData
  [key: string]: any;
}

export interface ProcessedRow<TData extends HierarchicalData<TData>> {
  originalRow: TData;
  id: string | number;
  level: number;
  hasChildren: boolean;
  isExpanded?: boolean; // Optional, can be derived from expandedRows set
  isGroupHeader?: boolean; // True if this row is a group header
  groupField?: keyof TData & string; // Field used for grouping if this is a group header
  groupValue?: any; // Value of the group field if this is a group header
  groupKey?: string; // e.g., "City: New York"
  groupItems?: ProcessedRow<TData>[]; // Items within this group if it's a group header
  // Allow direct access to originalRow properties
  [key: string]: any;
}


/**
 * What the toolbar slot gets. Orderbahn's toolbar buttons all need one of these:
 * the selection (Delete, Bulk edit), the counts (Export ZIP labels), or a way to
 * reset the view (Reset filters).
 */
export interface DataGridToolbarContext {
  selectedIds: (string | number)[];
  /** True when the user chose "select all matching" rather than individual rows. */
  allMatchingSelected: boolean;
  /** Rows after filtering: the server total when `serverSide`, the filtered length otherwise. */
  filteredCount: number;
  totalCount: number;
  clearFilters: () => void;
  /** The batch edit session. `isEditing` is false in 'cell' mode and `begin` is a no-op. */
  editSession: {
    isEditing: boolean;
    dirtyCount: number;
    /** True while a save started by `saveAll` is in flight — no new edits are accepted meanwhile. */
    isSaving: boolean;
    begin: () => void;
    saveAll: () => void;
    discard: () => void;
  };
  /** Opens the built-in bulk-edit dialog. A no-op when `onBulkEdit` is not supplied. */
  openBulkEdit: () => void;
}

export interface DataGridProps<TData extends HierarchicalData<TData>> {
  data: TData[];
  columnDefs: ColumnDefinition<TData>[];
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  enableRowSelection?: boolean;
  onCellEdit?: (
    rowId: string | number,
    field: keyof TData & string,
    value: any,
    /** The row with the edit applied (built via `valueSetter` when the column has one). */
    nextRow: TData,
  ) => void | Promise<void>;
  /**
   * 'cell' (default) commits every edit through `onCellEdit` as it happens.
   * 'session' buffers edits until the toolbar's Save, then calls `onSaveEdits` once —
   * Orderbahn's grid-wide Edit toggle.
   *
   * Must not change after the grid mounts: switching it away from 'session' while a
   * session has dirty cells would orphan them, with no UI left to save or discard them.
   */
  editSessionMode?: 'cell' | 'session';
  /** Receives every buffered change. Reject to roll all of them back. */
  onSaveEdits?: (changes: CellChange[]) => void | Promise<void>;
  /** Applies one patch to many rows. `allMatching` means "every row the current filter matches". */
  onBulkEdit?: (
    patch: Record<string, unknown>,
    target: { ids: (string | number)[]; allMatching: boolean },
  ) => void | Promise<void>;
  /** `meta.allMatching` is true when the user chose "select all matching" instead of rows. */
  onSelectionChange?: (selectedIds: (string | number)[], meta: { allMatching: boolean }) => void;
  /** Offers "select all N matching" once the page is fully selected. Needs serverSide + totalRowCount. */
  enableSelectAllMatching?: boolean;
  /** Rows for which this returns false cannot be selected. */
  isRowSelectable?: (row: TData) => boolean;
  isTreeData?: boolean;
  treeColumn?: keyof TData & string; // Specifies which column shows tree controls
  enableGroupingPanel?: boolean; // To enable the grouping panel
  storageKey?: string; // localStorage key for state persistence; set a unique key per grid instance
  virtualized?: boolean;
  rowHeight?: number;
  /** Row height preset. Overrides `gridState.density`; `rowHeight` overrides both. */
  density?: GridDensity;
  /** Replaces the body with a skeleton while keeping header and toolbar. */
  loading?: boolean;
  virtualizedMaxHeight?: number; // Height (px) of the scroll viewport when virtualized. Default 500.
  detailRenderer?: (row: TData) => React.ReactNode; // Enables master-detail: an expander column + a full-width detail panel under each expanded row
  detailRowHeight?: number; // Fixed detail panel height (px) used by the virtualization window math. Default 300. Panels auto-size when not virtualized.
  enableRangeSelection?: boolean; // Excel-style cell range selection via drag / Shift+click / Shift+arrows. Default true.
  enableContextMenu?: boolean; // Right-click context menu with copy/pin/hide/export actions. Default true.
  getRowStyle?: (row: TData) => React.CSSProperties | undefined; // Inline style for data rows (e.g. status background)
  /** Extra class for one data cell. Not called for group-header rows. */
  getCellClassName?: (row: TData, column: ColumnDefinition<TData>) => string | undefined;
  /** Tints every other body row for readability. A row's own `getRowStyle` background always wins — it is set as an inline style, which beats any stylesheet rule. */
  striped?: boolean;
  onFilteredDataChange?: (rows: TData[]) => void; // Fires with the filtered+sorted rows whenever they change
  globalFilterFields?: (keyof TData & string)[]; // Restrict the global search box to these fields; omit to search all visible columns
  globalFilterPlaceholder?: string;
  enableFillHandle?: boolean; // Drag the range corner to fill editable cells (series or repeat). Default true; needs onCellEdit + range selection.
  enableClipboardPaste?: boolean; // Ctrl+V pastes TSV into editable cells starting at the selection. Default true; needs onCellEdit.
  enableUndoRedo?: boolean; // Ctrl+Z / Ctrl+Y over cell edits made through the grid. Default true; needs onCellEdit.
  enableStatusBar?: boolean; // Footer bar with filtered/selected counts and range Sum/Avg/Min/Max/Count. Default true.
  enableFind?: boolean; // Ctrl+F find-in-grid bar with match highlighting and next/previous. Default true.
  enableRowReorder?: boolean; // Drag-handle column for reordering rows. Default false; needs onRowsReordered. Ignored for tree data and while sorted/grouped.
  onRowsReordered?: (data: TData[]) => void; // Receives the full data array in its new order after a row drag
  enableRangeChart?: boolean; // "Chart Selection" in the context menu: chart the selected range in a dialog. Default true; needs range selection.
  conditionalFormats?: ConditionalFormatRule<TData>[]; // Grid-level conditional formatting rules applied across columns
  serverSide?: boolean; // If true, filtering, sorting, and pagination are handled on the server
  /**
   * 'manual' shows Apply/Cancel in the filter popover and commits nothing until Apply.
   * Defaults to 'manual' when `serverSide` is true (a keystroke-per-query is a bug there)
   * and to 'immediate' otherwise, which is the existing client-side behaviour.
   */
  filterApplyMode?: 'immediate' | 'manual';
  /** Initial cross-column filter logic. Overrides the persisted value, like `density`. */
  filterLogicOperator?: FilterLink;
  /** Consumer buttons rendered in the toolbar, right of the built-in controls. */
  toolbarActions?: React.ReactNode | ((ctx: DataGridToolbarContext) => React.ReactNode);
  /** Rendered on the toolbar's top row, to the left of the global search. Typically a DataGridViewSelector. */
  toolbarViewSelector?: React.ReactNode;
  /** A saved-view persistence failure, e.g. from `toolbarViewSelector`'s save/save-as.
   * Rendered as a destructive Alert between the toolbar and the table. */
  viewSaveError?: string;
  /** Field names dropped when a saved view was restored against columns that no
   * longer exist. Rendered as a dismissible Alert alongside `viewSaveError`. */
  viewPartialRestoreNotice?: string[];
  /** Dismisses the `viewPartialRestoreNotice` Alert. */
  onDismissViewPartialRestoreNotice?: () => void;
  /** Shows the density picker in the toolbar. Default true. */
  showDensityControl?: boolean;
  /** Shows the Columns visibility toggle in the toolbar. Default true. */
  showColumnsControl?: boolean;
  /** Shows the Filters control in the toolbar. Default true. */
  showFiltersControl?: boolean;
  /** Shows the Export control in the toolbar. Default true. */
  showExportControl?: boolean;
  /** Shows the footer/pagination slot (row-count text + page controls). Default true.
   * Set false when the host page already surfaces the total elsewhere and the built-in
   * footer would duplicate it. */
  showPagination?: boolean;
  totalRowCount?: number; // Total count of rows across all pages when serverSide is true
  onServerParamsChange?: (params: {
    page: number;
    pageSize: number;
    sortConfig: SortConfig<TData> | null;
    columnFilters: ActiveFilters<TData>;
    globalFilter: string;
    filterLogicOperator: FilterLink;
  }) => void; // Event triggered when grid params change in serverSide mode
  /**
   * Activates lazy mode. Returns the row at an ABSOLUTE index in the full result set,
   * or `undefined` when that row has not been loaded yet — the grid renders a skeleton
   * in its place. Requires `totalRowCount`; without it the grid logs a warning and
   * stays in normal mode, because sizing the scrollbar wrongly is worse than not
   * lazy-loading at all.
   *
   * In lazy mode the `data` prop is ignored — pass `[]`.
   */
  getRow?: (index: number) => TData | undefined;
  /**
   * The grid needs rows `startIndex` through `lastIndex` (both inclusive) and cannot
   * get them from `getRow`. Fires after scrolling settles, never during the drag.
   *
   * `lastIndex` is inclusive on purpose: a consumer mapping a range onto pages wants
   * `Math.floor(lastIndex / pageSize)` to name the last page it must fetch. It is named
   * `lastIndex` rather than `endIndex` so it can never be mistaken for
   * `LazyWindow.endIndex`, which is exclusive.
   */
  onLoadRange?: (range: { startIndex: number; lastIndex: number }) => void;
  /**
   * Rows `startIndex` through `lastIndex` (both inclusive) are on screen. Fires for any
   * `virtualized` grid once scrolling settles -- lazy mode is not required.
   *
   * This is the windowing signal with no policy attached, for consumers that page a
   * cursor API and so cannot use lazy mode: lazy mode bypasses the row pipeline, which
   * would silently stop client-side filtering from working. Compare `lastIndex` against
   * however many rows you have fetched to decide whether to fetch more.
   *
   * Deliberately not an `onScrollEnd`. What counts as "the end", whether more exists,
   * and what to do about it belong to whoever owns the cursor, not to the grid.
   */
  onVisibleRangeChange?: (range: { startIndex: number; lastIndex: number }) => void;
  /**
   * Milliseconds of settled scrolling before `onLoadRange` and `onVisibleRangeChange`
   * fire. Default 150.
   */
  loadRangeDebounceMs?: number;
  /** Rows to prefetch beyond the viewport in each direction. Default 10. */
  loadRangeOverscan?: number;
  /**
   * Server-computed footer aggregates, keyed by column field, each holding the value
   * for that column's ACTIVE aggregate function. In lazy mode the grid never computes
   * aggregates itself: with only part of the dataset loaded, a locally-computed total
   * would be a partial number presented as a final one. A field with no entry renders
   * an empty footer cell.
   *
   * When a column offers a choice of aggregate functions, `onAggregateChange` tells you
   * which one the user selected so you can refetch the matching value.
   */
  serverAggregates?: Record<string, number | undefined>;
  pivotMode?: boolean; // Enable pivot table mode
  pivotColumns?: (keyof TData & string)[]; // Columns to pivot into dynamic header columns
  /** Persisted view state. When supplied the consumer owns it and localStorage is not used. */
  gridState?: PersistedGridState<TData>;
  onGridStateChange?: (state: PersistedGridState<TData>) => void;
}

export interface DataGridState<TData extends HierarchicalData<TData>> {
  currentPage: number;
  pageSize: number;
  sortConfig: SortConfig<TData> | null;
  globalFilter: string;
  columnFilters: ActiveFilters<TData>;
  visibleColumns: (keyof TData & string)[];
  selectedRows: Set<string | number>;
  columnOrder: (keyof TData & string)[];
  columnWidths: Record<keyof TData & string, string | number>;
  draggedColumn: (keyof TData & string) | null; // For reordering
  draggedOverColumn: (keyof TData & string) | null; // For reordering
  editingCell?: { rowId: string | number; field: keyof TData & string } | null;
  editInputValue?: any;
  pinnedColumns: {
    left: (keyof TData & string)[];
    right: (keyof TData & string)[];
  };
  expandedRows: Set<string | number>; // For tree data
  focusedCell: { rowId: string | number; colField: keyof TData & string } | null; // For keyboard navigation
  groupedBy: (keyof TData & string)[]; // For column grouping
  groupAggregations: Record<string, AggregateFunction>;
  expandedGroups: Set<string>; // Tracks expanded group keys
  density: GridDensity;
  filterLogicOperator: FilterLink;
}
