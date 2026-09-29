import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { ColumnDefinition, HierarchicalData, ProcessedRow } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const warnedColumns = new Set<string>();

/** Test-only escape hatch: the "warn once" Sets above are module-level state that
 * otherwise leaks across test files in the same Vitest worker/run, making warn-once
 * assertions order-dependent. Call from a `beforeEach` to isolate tests. */
export function resetWarnedColumns(): void {
  warnedColumns.clear();
}

/**
 * The single place the grid reads a cell value. Pass `column` so a computed
 * column (`valueGetter`) is honoured by sorting, filtering, grouping, search and
 * export alike.
 */
export const getCellValue = <TData extends HierarchicalData<TData>>(
  processedRow: ProcessedRow<TData>,
  field: string,
  column?: ColumnDefinition<TData>,
): any => {
  if (processedRow.isGroupHeader) {
    // Group headers carry no data-field values; exports filter them out first.
    return '';
  }

  const row = processedRow.originalRow;

  if (column?.valueGetter) {
    if (!row) return undefined;
    try {
      return column.valueGetter(row);
    } catch (error) {
      // A throwing getter must not take the row down with it.
      if (process.env.NODE_ENV !== 'production' && !warnedColumns.has(field)) {
        warnedColumns.add(field);
        console.error(`[DataGrid] valueGetter for column "${field}" threw:`, error);
      }
      return undefined;
    }
  }

  return row ? (row as Record<string, unknown>)[field] : (processedRow as any)[field];
};

/** `editable` is either a fixed boolean or a per-row predicate — the latter carries
 * the dealer-side field-level role model (some fields are editable only for some
 * roles, or only in some row states). */
export function isColumnEditable<TData extends HierarchicalData<TData>>(
  column: ColumnDefinition<TData>,
  row: TData,
): boolean {
  if (typeof column.editable === 'function') {
    try {
      return column.editable(row);
    } catch (error) {
      // A throwing predicate must not take the row down with it — fail closed.
      const key = `${column.field}::editable`;
      if (process.env.NODE_ENV !== 'production' && !warnedColumns.has(key)) {
        warnedColumns.add(key);
        console.error(`[DataGrid] editable predicate for column "${column.field}" threw:`, error);
      }
      return false;
    }
  }
  return !!column.editable;
}

/** `getCellClassName` is arbitrary consumer code invoked for every visible cell on
 * every render — a throw must not take the whole grid down. Same shape as
 * `isColumnEditable`'s guard: warn once (dev-only) per field, fail closed to `undefined`
 * (no extra class) rather than letting the render crash. */
export function getSafeCellClassName<TData extends HierarchicalData<TData>>(
  getCellClassName: ((row: TData, column: ColumnDefinition<TData>) => string | undefined) | undefined,
  row: TData,
  column: ColumnDefinition<TData>,
): string | undefined {
  if (!getCellClassName) return undefined;
  try {
    return getCellClassName(row, column);
  } catch (error) {
    const key = `${column.field}::getCellClassName`;
    if (process.env.NODE_ENV !== 'production' && !warnedColumns.has(key)) {
      warnedColumns.add(key);
      console.error(`[DataGrid] getCellClassName threw for column "${column.field}":`, error);
    }
    return undefined;
  }
}

/**
 * Stable key for the transient per-cell edit-status map. Same scheme as `editing/
 * edit-session.ts`'s local `keyOf` (duplicated there, not imported, so that module stays
 * dependency-free) — if this separator ever changes, change it in both places.
 */
export function cellEditKey(rowId: string | number, field: string): string {
  return `${rowId}::${field}`;
}

/** Is a re-commit of `b` over `a` a no-op? `===` alone says no for every non-primitive,
 * so a `Date` cell or a multiselect's `string[]` re-commits on every editor close — the
 * editor hands back a fresh, equal object. Covers the two shapes the grid's own editors
 * produce and nothing more: two `Date`s compare by instant (two invalid dates count as
 * equal), arrays element-wise by `===`. Deliberately NOT a deep equal — nested arrays,
 * plain objects and Maps still fall back to reference identity, and a `Date` compared
 * against a non-`Date` (e.g. an ISO string) is a real change, not a no-op. */
export function isSameCellValue(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a instanceof Date || b instanceof Date) {
    if (!(a instanceof Date) || !(b instanceof Date)) return false;
    if (isNaN(a.getTime()) && isNaN(b.getTime())) return true;
    return a.getTime() === b.getTime();
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, i) => item === b[i]);
  }
  return false;
}

/** A date-only ISO string: `YYYY-MM-DD`, nothing after it. */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
/** An ISO datetime: `YYYY-MM-DDThh:mm` plus any seconds/millis/offset tail. */
const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

/**
 * Display text for a cell the grid renders itself (no `cellRenderer`, no
 * `valueFormatter`). Everything except dates is `String(value)`, as before.
 *
 * Dates used to print raw: an ISO datetime showed as `2026-07-26T15:01:00.000Z` and a
 * `Date` object as `Sat Jul 26 2026 15:01:00 GMT-0400 (…)`. A date-only string is read
 * as local parts rather than through `new Date('2026-08-10')`, which parses as UTC
 * midnight and renders the previous day west of UTC — the same trap the editors avoid.
 */
export function formatCellDisplay(value: unknown, column: { filterType?: string; editorType?: string }): string {
  if (value === null || value === undefined) return '';

  const isDateColumn =
    column.filterType === 'date' ||
    column.filterType === 'date-tree' ||
    column.editorType === 'date' ||
    column.editorType === 'datetime';

  if (value instanceof Date) {
    if (isNaN(value.getTime())) return '';
    // A Date carries a time whether or not the column advertises one, so the column
    // decides: a plain date column shows the day, anything else shows both.
    return column.filterType === 'date' || column.filterType === 'date-tree' || column.editorType === 'date'
      ? value.toLocaleDateString()
      : `${value.toLocaleDateString()} ${value.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }

  if (typeof value === 'string' && (isDateColumn || ISO_DATETIME.test(value) || ISO_DATE.test(value))) {
    if (ISO_DATE.test(value)) {
      const [year, month, day] = value.split('-').map(Number);
      return new Date(year, month - 1, day).toLocaleDateString();
    }
    if (ISO_DATETIME.test(value)) {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        return `${parsed.toLocaleDateString()} ${parsed.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
      }
    }
  }

  return String(value);
}
