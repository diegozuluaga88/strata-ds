"use client";
import * as React from 'react';
import type { ColumnDefinition, HierarchicalData } from '../types';
import {
  CHECKBOX_COLUMN_WIDTH,
  DEFAULT_COL_WIDTH,
  DETAIL_COLUMN_WIDTH,
  REORDER_COLUMN_WIDTH,
} from '../constants';

export interface GridColGroupProps<TData extends HierarchicalData<TData>> {
  orderedVisibleColumnDefs: ColumnDefinition<TData>[];
  columnWidths: Record<string, string | number>;
  showReorderColumn: boolean;
  showSelectionColumn: boolean;
  showDetailColumn: boolean;
}

/**
 * A bare number is NOT a valid CSS width. `defaultWidth` (and a `gridState`'s stored
 * `columnWidths` entry) is typed `string | number`, so `190` — or the string `"190"` —
 * is the natural thing to write, but `String(190)` is `"190"`, which React silently
 * drops from the style object: no warning, no error, and the element renders with no
 * width attribute at all. The visible result is not a broken build but a column with
 * no configured width, falling back to browser distribution while its neighbours honour
 * theirs — and any arithmetic over "the sum of the specified widths" is then wrong.
 *
 * So: a unitless number becomes pixels; anything already carrying a unit or keyword
 * ("190px", "20%", "12rem", "auto") passes through untouched.
 */
export function toCssWidth(value: string | number): string {
  const raw = String(value).trim();
  return /^-?\d*\.?\d+$/.test(raw) ? `${raw}px` : raw;
}

/**
 * table-layout:fixed (see ui/table.tsx) makes column widths authoritative instead of
 * content-driven — without it, a header's text+icons can force a column wider than its
 * configured width, while sticky offsets (computed from that same configured width)
 * don't know it happened, so later pinned columns render short and overlap real
 * content. A <colgroup> is what makes the configured width stick even though the header
 * has a colSpan'd group row above it, which fixed layout can't otherwise derive
 * per-column widths from.
 *
 * Because fixed layout makes the <col> width authoritative, an explicit `colDef.minWidth`
 * must be enforced HERE, not just in the resize-drag/double-click-autofit handlers in
 * DataGridHeaderCell — a `<th>`'s CSS `min-width` is not honored for column sizing under
 * table-layout:fixed. Without this floor, a restored view or an app-supplied `defaultWidth`
 * smaller than `minWidth` renders the column too narrow with no way to detect it visually.
 *
 * A non-numeric `minWidth` or resolved width parses to `NaN` and is silently skipped
 * (treated as "no floor to apply"), not surfaced as an error — intentional, since this
 * is display-layer sizing, not validation.
 */
function resolveColWidth(
  field: string,
  columnWidths: Record<string, string | number>,
  colDef: ColumnDefinition<unknown>,
): string {
  const resolved = toCssWidth(columnWidths[field] || colDef.defaultWidth || `${DEFAULT_COL_WIDTH}px`);
  const resolvedPx = parseFloat(resolved);
  const minPx = colDef.minWidth != null ? parseFloat(String(colDef.minWidth)) : NaN;
  if (!isNaN(minPx) && minPx > 0 && !isNaN(resolvedPx) && resolvedPx < minPx) {
    return `${minPx}px`;
  }
  return resolved;
}

/**
 * The pixel sum of every <col> this colgroup will emit — the table's explicit width
 * under single-column resize (the table is min-w-full, so it never renders narrower
 * than its container, but may exceed it and scroll).
 */
export function specifiedTotalWidth(
  orderedVisibleColumnDefs: ColumnDefinition<unknown>[],
  columnWidths: Record<string, string | number>,
  flags: { showReorderColumn: boolean; showSelectionColumn: boolean; showDetailColumn: boolean },
): number {
  const isPixelValue = (raw: string) => /^-?\d*\.?\d+(px)?$/.test(raw);
  const px = (v: string | number) => {
    const raw = String(v).trim();
    if (!isPixelValue(raw)) return NaN; // not a bare pixel value; caller falls back below
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n : NaN;
  };
  const pxOrDefault = (v: string | number) => {
    const n = px(v);
    return Number.isFinite(n) ? n : DEFAULT_COL_WIDTH;
  };
  let total = 0;
  if (flags.showReorderColumn) total += pxOrDefault(REORDER_COLUMN_WIDTH);
  if (flags.showSelectionColumn) total += pxOrDefault(CHECKBOX_COLUMN_WIDTH);
  if (flags.showDetailColumn) total += pxOrDefault(DETAIL_COLUMN_WIDTH);
  for (const colDef of orderedVisibleColumnDefs) {
    total += pxOrDefault(resolveColWidth(colDef.field, columnWidths, colDef));
  }
  return total;
}

export function GridColGroup<TData extends HierarchicalData<TData>>({
  orderedVisibleColumnDefs,
  columnWidths,
  showReorderColumn,
  showSelectionColumn,
  showDetailColumn,
}: GridColGroupProps<TData>) {
  return (
    <colgroup>
      {showReorderColumn && <col style={{ width: REORDER_COLUMN_WIDTH }} />}
      {showSelectionColumn && <col style={{ width: CHECKBOX_COLUMN_WIDTH }} />}
      {showDetailColumn && <col style={{ width: DETAIL_COLUMN_WIDTH }} />}
      {orderedVisibleColumnDefs.map(colDef => (
        <col
          key={colDef.field}
          // Cast erases TData: resolveColWidth only reads field/minWidth/defaultWidth,
          // none of which depend on the row shape.
          style={{ width: resolveColWidth(colDef.field, columnWidths, colDef as ColumnDefinition<unknown>) }}
        />
      ))}
    </colgroup>
  );
}
