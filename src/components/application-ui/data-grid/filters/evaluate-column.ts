import type { DateTreeFilterValue, ColumnFilter, FilterValue } from '../types';
import { matchesFilterValue } from './apply-operator';
import { asColumnFilter } from './filter-model';
import { isFilterEffectivelyEmpty, operatorApplies } from './operators';

function needsNoValue(condition: FilterValue): boolean {
  return condition.operator === 'isEmpty' || condition.operator === 'isNotEmpty';
}

// A null/undefined cell fails any condition that carries a value (otherwise `String(null)`
// would make a search for "null" match every empty cell) — unless the condition itself has
// nothing to constrain by, in which case it's treated as passing: isEmpty/isNotEmpty decide
// for themselves, and a boolean/date/date-tree condition with no real value is exempt. This
// must run over each RAW condition, independent of `isFilterEffectivelyEmpty` pruning, since
// an effectively-empty value-bearing condition (e.g. text/contains/'') must still fail a null
// cell rather than being silently dropped from consideration.
function nullCellMatchesCondition(condition: FilterValue): boolean {
  if (operatorApplies(condition) && condition.operator === 'isEmpty') return true;
  if (operatorApplies(condition) && condition.operator === 'isNotEmpty') return false;
  if (condition.type === 'boolean' && condition.value === undefined) return true;
  if (condition.type === 'date' && condition.preset === 'all') return true;
  if (condition.type === 'date-tree' && !(condition as DateTreeFilterValue).selected?.length) return true;
  return false;
}

/**
 * Evaluates one column's filter against one cell value: the active conditions are
 * combined under the filter's `link`. Empty conditions are skipped rather than failing
 * the row, so a half-typed second condition never hides every row — but only for a
 * non-null cell; see `nullCellMatchesCondition` for why a null cell must see every raw
 * condition instead.
 */
export function matchesColumnFilter(
  cellValue: unknown,
  entry: ColumnFilter | FilterValue | undefined,
  now: Date,
): boolean {
  const resolved = entry ? asColumnFilter(entry) : undefined;
  if (!resolved) return true;

  const isNullish = cellValue === null || cellValue === undefined;
  if (isNullish) {
    return resolved.link === 'OR'
      ? resolved.conditions.some(nullCellMatchesCondition)
      : resolved.conditions.every(nullCellMatchesCondition);
  }

  const active = resolved.conditions.filter(condition => !isFilterEffectivelyEmpty(condition));
  if (active.length === 0) return true;

  const evaluate = (condition: FilterValue): boolean => matchesFilterValue(cellValue, condition, now);

  return resolved.link === 'OR' ? active.some(evaluate) : active.every(evaluate);
}
