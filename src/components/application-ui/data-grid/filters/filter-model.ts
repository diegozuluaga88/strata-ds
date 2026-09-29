import type { ColumnFilter, FilterLink, FilterType, FilterValue } from '../types';
import { defaultOperatorFor, isFilterEffectivelyEmpty, isValidOperator } from './operators';

type FilterEntry = ColumnFilter | FilterValue;

function isColumnFilter(entry: FilterEntry): entry is ColumnFilter {
  return Array.isArray((entry as ColumnFilter).conditions);
}

function normalizeLink(link: unknown): FilterLink {
  return link === 'OR' ? 'OR' : 'AND';
}

/**
 * The one place a stored/incoming entry becomes a `ColumnFilter`. A bare `FilterValue`
 * (every payload written before this sub-project) reads as one AND condition; an entry
 * with no conditions left is no filter at all.
 */
export function asColumnFilter(entry: FilterEntry | undefined): ColumnFilter | undefined {
  if (!entry) return undefined;
  if (isColumnFilter(entry)) {
    return entry.conditions.length > 0
      ? { conditions: entry.conditions, link: normalizeLink(entry.link) }
      : undefined;
  }
  return { conditions: [entry], link: 'AND' };
}

export function conditionsOf(entry: FilterEntry | undefined): FilterValue[] {
  return asColumnFilter(entry)?.conditions ?? [];
}

/** Appends `condition` to the existing conditions (or starts a fresh AND-linked filter if there is none). */
export function withCondition(entry: FilterEntry | undefined, condition: FilterValue): ColumnFilter {
  const current = asColumnFilter(entry);
  return {
    conditions: [...(current?.conditions ?? []), condition],
    link: current?.link ?? 'AND',
  };
}

/**
 * Replaces the condition at `index`; never throws on a bad index. Against an existing
 * filter, an out-of-range `index` (negative or `>=` its condition count) is a no-op that
 * returns the input unchanged. Against no filter at all, only `index === 0` creates a
 * fresh single-condition `ColumnFilter`; any other index returns `undefined`.
 */
export function withConditionAt(
  entry: FilterEntry | undefined,
  index: number,
  condition: FilterValue,
): ColumnFilter | undefined {
  const current = asColumnFilter(entry);
  if (!current) return index === 0 ? { conditions: [condition], link: 'AND' } : undefined;
  if (index < 0 || index >= current.conditions.length) return current;
  const conditions = [...current.conditions];
  conditions[index] = condition;
  return { ...current, conditions };
}

/** Drops the condition at `index`; returns `undefined` once no conditions are left. */
export function withoutConditionAt(
  entry: FilterEntry | undefined,
  index: number,
): ColumnFilter | undefined {
  const current = asColumnFilter(entry);
  if (!current) return undefined;
  const conditions = current.conditions.filter((_, i) => i !== index);
  return conditions.length > 0 ? { ...current, conditions } : undefined;
}

/** Swaps the AND/OR link on an existing filter; returns `undefined` when there is nothing to link. */
export function withLink(entry: FilterEntry | undefined, link: FilterLink): ColumnFilter | undefined {
  const current = asColumnFilter(entry);
  return current ? { ...current, link } : undefined;
}

/** Whether this column shows as filtered: at least one condition actually filters. */
export function isColumnFilterActive(entry: FilterEntry | undefined): boolean {
  return conditionsOf(entry).some(condition => !isFilterEffectivelyEmpty(condition));
}

/**
 * Repairs an incoming filter against the column it belongs to: drops conditions that
 * no longer match the column's `filterType` (the column's type can change between
 * sessions), drops the ones with nothing left to filter by, and replaces an operator
 * that is invalid for the type with that type's default. Returns undefined when
 * nothing survives, so the caller deletes the key.
 */
export function pruneColumnFilter(
  entry: FilterEntry | undefined,
  filterType: FilterType | undefined,
): ColumnFilter | undefined {
  const current = asColumnFilter(entry);
  if (!current) return undefined;

  const conditions = current.conditions
    .filter(condition => (filterType ? condition.type === filterType : true))
    .map(condition => {
      if (!filterType) return condition;
      return isValidOperator(filterType, condition.operator)
        ? condition
        : ({ ...condition, operator: defaultOperatorFor(filterType) } as FilterValue);
    })
    .filter(condition => !isFilterEffectivelyEmpty(condition));

  return conditions.length > 0 ? { conditions, link: current.link } : undefined;
}
