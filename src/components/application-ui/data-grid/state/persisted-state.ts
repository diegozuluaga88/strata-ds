import type { ActiveFilters, AggregateFunction, ColumnDefinition, FilterLink, SortConfig } from '../types';
import { DENSITIES, type GridDensity } from './density';
import { asColumnFilter, pruneColumnFilter } from '../filters/filter-model';

const VALID_AGGREGATES = new Set<AggregateFunction>(['sum', 'avg', 'min', 'max', 'count']);

/** The slice of grid state a consumer persists. Everything else is UI-transient. */
export type PersistedGridState<TData = any> = {
  currentPage: number;
  pageSize: number;
  sortConfig: SortConfig<TData> | null;
  globalFilter: string;
  columnFilters: ActiveFilters<TData>;
  visibleColumns: string[];
  columnOrder: string[];
  columnWidths: Record<string, string | number>;
  pinnedColumns: { left: string[]; right: string[] };
  groupedBy: string[];
  /** The aggregation the user picked for a grouped, multi-aggregate column (see
   * `colDef.aggregate` when it is an array). Keyed by field, absent for a field with
   * zero or one available aggregate — those have nothing to choose between. */
  groupAggregations: Record<string, AggregateFunction>;
  expandedRows: Set<string | number>;
  expandedGroups: Set<string>;
  density: GridDensity;
  /** How this grid combines filters across columns. Orderbahn sends the same flag to its backend. */
  filterLogicOperator: FilterLink;
};

const DEFAULT_COL_WIDTH = 150;

export function defaultPersistedState<TData>(
  columnDefs: ColumnDefinition<TData>[],
  defaultPageSize: number,
): PersistedGridState<TData> {
  const columnWidths: Record<string, string | number> = {};
  const left: string[] = [];
  const right: string[] = [];

  columnDefs.forEach((col) => {
    columnWidths[col.field] = col.defaultWidth || `${DEFAULT_COL_WIDTH}px`;
    if (col.pinned === 'left') left.push(col.field);
    else if (col.pinned === 'right') right.push(col.field);
  });

  const allFields = columnDefs.map((col) => col.field);

  return {
    // Upstream pagination is one-based.
    currentPage: 1,
    pageSize: defaultPageSize,
    sortConfig: null,
    globalFilter: '',
    columnFilters: {},
    visibleColumns: allFields,
    // Pinned columns live in `pinnedColumns`, so the order list holds only the rest.
    columnOrder: allFields.filter((field) => !left.includes(field) && !right.includes(field)),
    columnWidths,
    pinnedColumns: { left, right },
    groupedBy: [],
    groupAggregations: {},
    expandedRows: new Set(),
    expandedGroups: new Set(),
    density: 'standard',
    filterLogicOperator: 'AND',
  };
}

/**
 * Drops anything that does not match a current column and clamps the numbers.
 * Per-tenant column sets change, so a stored state routinely names fields that
 * no longer exist — that must never break the grid.
 */
export function normalizePersistedState<TData>(
  state: PersistedGridState<TData>,
  columns: ColumnDefinition<TData>[],
): PersistedGridState<TData> {
  // Takes the column defs, not just their names: repairing a stored filter needs
  // the column's `filterType`, which a list of field names cannot provide. The
  // filter-operator sub-project builds directly on that.
  const known = new Set(columns.map((col) => col.field));
  const keep = (list: string[]) => list.filter((field) => known.has(field));

  // A column with no filterType never gets a filter from the UI, but a hand-built
  // gridState can still carry one — pruneColumnFilter passes it through unchanged
  // (filterType undefined) rather than inventing an operator for a type that does
  // not exist.
  const columnByField = new Map(columns.map((col) => [col.field, col]));
  const columnFilters = Object.entries(state.columnFilters ?? {}).reduce<Record<string, unknown>>(
    (acc, [field, entry]) => {
      if (!known.has(field)) return acc;
      // Repairs the legacy bare-FilterValue shape, drops conditions the column can
      // no longer hold (e.g. its filterType changed since this filter was stored),
      // and replaces an operator that is invalid for its filterType.
      const pruned = pruneColumnFilter(entry, columnByField.get(field)?.filterType);
      if (pruned) acc[field] = pruned;
      return acc;
    },
    {},
  ) as ActiveFilters<TData>;

  const columnWidths = Object.fromEntries(
    Object.entries(state.columnWidths ?? {}).filter(([field]) => known.has(field)),
  );

  const pageSize = Math.trunc(state.pageSize);

  // Upstream's load effect fell back to every column when the reconciled visible
  // list came out empty (e.g. every previously-visible field was since removed
  // from the schema) — without it a schema-drift tenant renders zero columns.
  const allFields = columns.map((col) => col.field);
  const keptVisibleColumns = keep(state.visibleColumns ?? []);
  const visibleColumns =
    keptVisibleColumns.length === 0 && allFields.length > 0 ? allFields : keptVisibleColumns;

  // `columnOrder` decides which columns render at all, not merely in what order:
  // use-grid-layout's `orderedVisibleColumnDefs` builds the scrollable columns by
  // mapping over it, so a field missing from it never appears however visible it
  // is. Filtering alone is therefore not enough — a stored order naming only
  // dead fields would render a grid with no data columns, and a column added
  // since the state was stored would silently vanish. So reconcile: keep the
  // stored arrangement for fields that still exist, then append every current
  // unpinned field it does not mention. The empty case needs no branch — if the
  // stored order keeps nothing, every field counts as missing and gets appended.
  const pinned = {
    left: keep(state.pinnedColumns?.left ?? []),
    right: keep(state.pinnedColumns?.right ?? []),
  };
  const isUnpinned = (field: string) =>
    !pinned.left.includes(field) && !pinned.right.includes(field);
  const keptOrder = keep(state.columnOrder ?? []).filter(isUnpinned);
  const columnOrder = [
    ...keptOrder,
    ...allFields.filter((field) => isUnpinned(field) && !keptOrder.includes(field)),
  ];

  return {
    ...state,
    currentPage: Math.max(1, Math.trunc(state.currentPage || 1)),
    pageSize: pageSize > 0 ? pageSize : 25,
    sortConfig:
      state.sortConfig && known.has(state.sortConfig.field as string) ? state.sortConfig : null,
    columnFilters,
    visibleColumns,
    columnOrder,
    columnWidths,
    pinnedColumns: pinned,
    groupedBy: keep(state.groupedBy ?? []),
    groupAggregations: Object.fromEntries(
      Object.entries(state.groupAggregations ?? {}).filter(
        ([field, agg]) => known.has(field) && VALID_AGGREGATES.has(agg as AggregateFunction),
      ),
    ),
    density: DENSITIES.includes(state.density) ? state.density : 'standard',
    filterLogicOperator: state.filterLogicOperator === 'OR' ? 'OR' : 'AND',
  };
}

function rehydrateCondition(condition: unknown): unknown {
  if (!condition || (condition as { type?: string }).type !== 'date') return condition;
  const dateFilter = condition as { value?: unknown; value2?: unknown };
  return {
    ...(condition as object),
    ...(dateFilter.value ? { value: new Date(dateFilter.value as string) } : {}),
    ...(dateFilter.value2 ? { value2: new Date(dateFilter.value2 as string) } : {}),
  };
}

/**
 * JSON has no Date, so a persisted date condition comes back as an ISO string while
 * the filter logic calls Date methods on it. Both shapes are rehydrated: a stored
 * `ColumnFilter` (each condition) and a legacy bare `FilterValue`.
 */
function rehydrateFilters<TData>(filters: ActiveFilters<TData>): ActiveFilters<TData> {
  const out: Record<string, unknown> = {};
  for (const [field, entry] of Object.entries(filters)) {
    const asFilter = asColumnFilter(entry);
    out[field] = asFilter
      ? { conditions: asFilter.conditions.map(rehydrateCondition), link: asFilter.link }
      : entry;
  }
  return out as ActiveFilters<TData>;
}

export function toStorageJson<TData>(state: PersistedGridState<TData>): string {
  return JSON.stringify({
    ...state,
    expandedRows: Array.from(state.expandedRows),
    expandedGroups: Array.from(state.expandedGroups),
  });
}

/**
 * Reads a stored payload, tolerating upstream's shape (which has no `density`,
 * `currentPage` or `globalFilter`). Anything unrecognised falls back to defaults
 * rather than throwing — a corrupt payload must not stop the grid mounting.
 */
export function fromStorageJson<TData>(
  json: string,
  columnDefs: ColumnDefinition<TData>[],
  defaultPageSize: number,
): PersistedGridState<TData> {
  const defaults = defaultPersistedState(columnDefs, defaultPageSize);
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return defaults;
  }
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return defaults;

  const saved = raw as Record<string, unknown>;
  const merged: PersistedGridState<TData> = {
    ...defaults,
    ...(saved as Partial<PersistedGridState<TData>>),
    columnFilters: rehydrateFilters((saved.columnFilters ?? {}) as ActiveFilters<TData>),
    expandedRows: new Set((saved.expandedRows as (string | number)[]) ?? []),
    expandedGroups: new Set((saved.expandedGroups as string[]) ?? []),
  };

  return normalizePersistedState(merged, columnDefs);
}
