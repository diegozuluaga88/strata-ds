import type {
  BooleanFilterOperator,
  DateFilterOperator,
  DateTreeFilterOperator,
  FilterType,
  FilterValue,
  NumberFilterOperator,
  SelectFilterOperator,
  TextFilterOperator,
} from '../types';
import {
  booleanFilterOperators,
  dateFilterOperators,
  dateTreeFilterOperators,
  numberFilterOperators,
  selectFilterOperators,
  textFilterOperators,
} from '../types';

type AnyOperator =
  | TextFilterOperator
  | NumberFilterOperator
  | DateFilterOperator
  | SelectFilterOperator
  | BooleanFilterOperator
  | DateTreeFilterOperator;

const OPERATORS_BY_TYPE: Record<FilterType, readonly AnyOperator[]> = {
  text: textFilterOperators,
  number: numberFilterOperators,
  date: dateFilterOperators,
  select: selectFilterOperators,
  boolean: booleanFilterOperators,
  'date-tree': dateTreeFilterOperators,
};

// The operator that reproduces each type's pre-sub-project-2 behaviour. Load-bearing:
// any saved filter written before `operator` existed must keep filtering the same way.
const DEFAULT_OPERATOR: Record<FilterType, AnyOperator> = {
  text: 'contains',
  number: '=',
  date: 'between',
  select: 'isAnyOf',
  boolean: 'isChecked',
  'date-tree': 'inBucket',
};

// Not exported: nothing in production calls it — the popover imports each type's operator
// array straight from `types.ts` instead. Kept (not deleted) alongside OPERATORS_BY_TYPE,
// which `isValidOperator` below still needs.
function operatorsForType(filterType: FilterType): readonly AnyOperator[] {
  return OPERATORS_BY_TYPE[filterType];
}

export function defaultOperatorFor(filterType: FilterType): AnyOperator {
  return DEFAULT_OPERATOR[filterType];
}

export function isValidOperator(filterType: FilterType, operator: unknown): boolean {
  return OPERATORS_BY_TYPE[filterType].includes(operator as AnyOperator);
}

/**
 * Whether a filter's `operator` is honoured at all. A date filter with a preset other
 * than 'custom' filters by that preset alone — its operator is carried in the value but
 * means nothing, so no code path may act on it. Every other type always honours its operator.
 */
export function operatorApplies(filter: FilterValue | undefined): boolean {
  if (!filter) return false;
  if (filter.type === 'date') return filter.preset === 'custom';
  return true;
}

/**
 * Whether an active-filters entry has nothing left to filter by and should be
 * dropped from `columnFilters` (same rule `DataGrid.tsx`'s `handleColumnFilterChange`
 * and the popover's "Clear Filter" button both need — this is their one shared copy).
 * `isEmpty`/`isNotEmpty` need no value at all, so they are never "empty" themselves.
 */
export function isFilterEffectivelyEmpty(filter: FilterValue | undefined): boolean {
  if (!filter) return true;
  if (filter.operator === 'isEmpty' || filter.operator === 'isNotEmpty') return false;

  switch (filter.type) {
    case 'text':
      return filter.value === '';
    case 'number':
      return filter.value === undefined && (filter.operator !== 'between' || filter.value2 === undefined);
    case 'date':
      return filter.preset === 'all' || !filter.preset;
    case 'date-tree':
      return !filter.selected || filter.selected.length === 0;
    case 'select':
      // A single value of '' is a real constraint (match empty cells), matching
      // `matchesSelect`'s own rule — only a missing value or an empty array means
      // "no selection".
      return Array.isArray(filter.value) ? filter.value.length === 0 : filter.value == null;
    case 'boolean':
      return filter.value === undefined;
    default:
      return true;
  }
}
