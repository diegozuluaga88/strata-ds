import * as React from 'react';
import type { ColumnDefinition, DataGridState, HierarchicalData } from '../types';
import {
  defaultPersistedState,
  fromStorageJson,
  normalizePersistedState,
  toStorageJson,
  type PersistedGridState,
} from './persisted-state';

const PERSISTED_KEYS = [
  'currentPage',
  'pageSize',
  'sortConfig',
  'globalFilter',
  'columnFilters',
  'visibleColumns',
  'columnOrder',
  'columnWidths',
  'pinnedColumns',
  'groupedBy',
  'groupAggregations',
  'expandedRows',
  'expandedGroups',
  'density',
  'filterLogicOperator',
] as const satisfies readonly (keyof PersistedGridState)[];

/** Fails to compile if a key is added to PersistedGridState but not to PERSISTED_KEYS. */
type MissingPersistedKey = Exclude<keyof PersistedGridState, (typeof PERSISTED_KEYS)[number]>;
const _persistedKeysAreExhaustive: MissingPersistedKey extends never ? true : never = true;
void _persistedKeysAreExhaustive;

const TRANSIENT_KEYS = [
  'selectedRows',
  'draggedColumn',
  'draggedOverColumn',
  'editingCell',
  'editInputValue',
  'focusedCell',
] as const satisfies readonly (keyof Omit<DataGridState<any>, keyof PersistedGridState>)[];

/** Fails to compile if a key is added to the transient half of DataGridState but not to TRANSIENT_KEYS. */
type MissingTransientKey = Exclude<
  keyof Omit<DataGridState<any>, keyof PersistedGridState>,
  (typeof TRANSIENT_KEYS)[number]
>;
const _transientKeysAreExhaustive: MissingTransientKey extends never ? true : never = true;
void _transientKeysAreExhaustive;

function pickPersisted<TData extends HierarchicalData<TData>>(
  state: DataGridState<TData>,
): PersistedGridState<TData> {
  const out = {} as PersistedGridState<TData>;
  for (const key of PERSISTED_KEYS) {
    (out as Record<string, unknown>)[key] = (state as unknown as Record<string, unknown>)[key];
  }
  return out;
}

function pickTransient<TData extends HierarchicalData<TData>>(
  state: DataGridState<TData>,
): Omit<DataGridState<TData>, keyof PersistedGridState<TData>> {
  const out = {} as Omit<DataGridState<TData>, keyof PersistedGridState<TData>>;
  for (const key of TRANSIENT_KEYS) {
    (out as Record<string, unknown>)[key] = (state as unknown as Record<string, unknown>)[key];
  }
  return out;
}

// `columnFilters`/`pinnedColumns`/`columnWidths` are compared by reference here, which
// is only sound because `a` and `b` are always two snapshots derived from the same
// baseline inside one `setState` call — never two independently normalized states.
function samePersisted<TData>(a: PersistedGridState<TData>, b: PersistedGridState<TData>): boolean {
  return PERSISTED_KEYS.every((key) => {
    const left = a[key];
    const right = b[key];
    if (left instanceof Set && right instanceof Set) {
      return left.size === right.size && [...left].every((item) => right.has(item as never));
    }
    return left === right;
  });
}

/** The transient half: everything in DataGridState that is not persisted. */
function defaultTransient<TData extends HierarchicalData<TData>>(): Omit<
  DataGridState<TData>,
  keyof PersistedGridState<TData>
> {
  return {
    selectedRows: new Set<string | number>(),
    draggedColumn: null,
    draggedOverColumn: null,
    editingCell: null,
    editInputValue: '',
    focusedCell: null,
  };
}

export type UseDataGridStateArgs<TData> = {
  columnDefs: ColumnDefinition<TData>[];
  defaultPageSize: number;
  storageKey?: string;
  /** When supplied the consumer owns the persisted state; the hook only emits. */
  gridState?: PersistedGridState<TData>;
  onGridStateChange?: (state: PersistedGridState<TData>) => void;
};

/**
 * Same signature as `React.useState<DataGridState<TData>>`, so every existing
 * `setState(prev => ...)` call site in DataGrid.tsx keeps working unchanged. The
 * persisted half is routed to the `gridState` prop when controlled, or to internal
 * state plus localStorage when not.
 */
export function useDataGridState<TData extends HierarchicalData<TData>>({
  columnDefs,
  defaultPageSize,
  storageKey,
  gridState,
  onGridStateChange,
}: UseDataGridStateArgs<TData>): [
  DataGridState<TData>,
  (updater: (prev: DataGridState<TData>) => DataGridState<TData>) => void,
] {
  const controlled = gridState !== undefined;

  const [internalPersisted, setInternalPersisted] = React.useState<PersistedGridState<TData>>(() => {
    const defaults = defaultPersistedState(columnDefs, defaultPageSize);
    if (controlled || !storageKey || typeof window === 'undefined') return defaults;
    const stored = window.localStorage.getItem(storageKey);
    return stored ? fromStorageJson<TData>(stored, columnDefs, defaultPageSize) : defaults;
  });

  const [transient, setTransient] = React.useState(() => defaultTransient<TData>());

  // normalizePersistedState looks at each column's field AND its filterType (it
  // repairs a stored operator against the column's type), so the key must cover
  // both — while still letting an inline `columnDefs={[...]}` avoid re-running
  // everything on identity alone.
  const columnFieldsKey = columnDefs.map((col) => `${col.field}:${col.filterType ?? ''}`).join(' ');
  const persisted = React.useMemo(
    () => normalizePersistedState<TData>(controlled ? gridState! : internalPersisted, columnDefs),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [controlled, gridState, internalPersisted, columnFieldsKey],
  );

  const state = React.useMemo(
    () => ({ ...persisted, ...transient }) as DataGridState<TData>,
    [persisted, transient],
  );

  // Uncontrolled only: mirror the persisted half into localStorage.
  React.useEffect(() => {
    if (controlled || !storageKey || typeof window === 'undefined') return;
    window.localStorage.setItem(storageKey, toStorageJson(persisted));
  }, [controlled, storageKey, persisted]);

  const stateRef = React.useRef(state);
  stateRef.current = state;

  /**
   * Holds the value produced by a `setState` earlier in the same tick. React only
   * refreshes `stateRef` on render, so without this a second call in one handler
   * would read stale state and silently drop the first update.
   */
  const pendingRef = React.useRef<DataGridState<TData> | null>(null);
  React.useEffect(() => {
    pendingRef.current = null;
  });

  const setState = React.useCallback(
    (updater: (prev: DataGridState<TData>) => DataGridState<TData>) => {
      const base = pendingRef.current ?? stateRef.current;
      const next = updater(base);
      pendingRef.current = next;
      const nextPersisted = pickPersisted(next);
      const changed = !samePersisted(nextPersisted, pickPersisted(base));

      setTransient(pickTransient(next));

      if (!changed) return;
      if (!controlled) setInternalPersisted(nextPersisted);
      onGridStateChange?.(nextPersisted);
    },
    [controlled, onGridStateChange],
  );

  return [state, setState];
}
