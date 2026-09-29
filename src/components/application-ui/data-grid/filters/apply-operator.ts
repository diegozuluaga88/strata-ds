import { endOfDay, endOfMonth, isValid, startOfDay, startOfMonth, subDays, subMonths } from 'date-fns';
import type { DateFilterValue, DateTreeFilterValue, FilterValue, NumberFilterValue } from '../types';
import { dateTreeKeyOf } from '../lib/gridProcessing';
import { operatorApplies } from './operators';

function isEmptyCell(cellValue: unknown): boolean {
  return cellValue === null || cellValue === undefined || String(cellValue).trim() === '';
}

function matchesText(cellValue: unknown, filter: FilterValue & { type: 'text' }): boolean {
  const operator = filter.operator ?? 'contains';
  if (operator === 'isEmpty') return isEmptyCell(cellValue);
  if (operator === 'isNotEmpty') return !isEmptyCell(cellValue);
  const cell = String(cellValue).toLowerCase();
  const needle = String(filter.value).toLowerCase();
  switch (operator) {
    case 'equals':
      return cell === needle;
    case 'startsWith':
      return cell.startsWith(needle);
    case 'endsWith':
      return cell.endsWith(needle);
    case 'contains':
    default:
      return cell.includes(needle);
  }
}

// Unchanged from lib/gridProcessing.ts's old matchesNumberFilter, plus isEmpty/isNotEmpty.
function matchesNumber(cellValue: unknown, filter: NumberFilterValue): boolean {
  if (filter.operator === 'isEmpty') return isEmptyCell(cellValue);
  if (filter.operator === 'isNotEmpty') return !isEmptyCell(cellValue);
  if (filter.value === undefined && (filter.operator !== 'between' || filter.value2 === undefined)) return true;

  const numCell = parseFloat(String(cellValue));
  if (isNaN(numCell)) return false;

  if (filter.operator === 'between') {
    if (typeof filter.value === 'number' && typeof filter.value2 === 'number') {
      return numCell >= filter.value && numCell <= filter.value2;
    }
    if (typeof filter.value === 'number') return numCell >= filter.value;
    if (typeof filter.value2 === 'number') return numCell <= filter.value2;
    return true;
  }

  if (filter.value === undefined) return true;

  switch (filter.operator) {
    case '=':
      return numCell === filter.value;
    case '!=':
      return numCell !== filter.value;
    case '<':
      return numCell < filter.value;
    case '>':
      return numCell > filter.value;
    case '<=':
      return numCell <= filter.value;
    case '>=':
      return numCell >= filter.value;
    default:
      return true;
  }
}

// Unchanged from lib/gridProcessing.ts's old matchesDateFilter for every preset that
// operatorApplies() says doesn't honour operator; for the preset it does ('custom'), an
// explicit operator now decides the comparison (default 'between', which is exactly what
// 'custom' always did before this operator existed).
function matchesDate(cellValue: unknown, filter: DateFilterValue, now: Date): boolean {
  const cellDate = new Date(String(cellValue));

  if (operatorApplies(filter)) {
    const operator = filter.operator ?? 'between';
    if (operator === 'isEmpty') return isEmptyCell(cellValue);
    if (operator === 'isNotEmpty') return !isEmptyCell(cellValue);
    if (!isValid(cellDate)) return false;
    const cellTime = startOfDay(cellDate).getTime();

    if (operator === 'between') {
      if (!filter.value && !filter.value2) return true;
      // Deliberate asymmetry, not a bug: the cell side always reduces to its own
      // day-start (`cellTime` above), while the upper boundary extends to day-end so a
      // cell timestamped anywhere within `value2`'s date still matches.
      const start = filter.value ? startOfDay(filter.value).getTime() : -Infinity;
      const end = filter.value2 ? endOfDay(filter.value2).getTime() : Infinity;
      return cellTime >= start && cellTime <= end;
    }
    if (!filter.value) return true;
    const boundary = startOfDay(filter.value).getTime();
    switch (operator) {
      case 'is':
        return cellTime === boundary;
      case 'before':
        return cellTime < boundary;
      case 'after':
        return cellTime > boundary;
      case 'onOrBefore':
        return cellTime <= boundary;
      case 'onOrAfter':
        return cellTime >= boundary;
      default:
        return true;
    }
  }

  if (!isValid(cellDate)) return false;
  const cellDateTime = startOfDay(cellDate).getTime();
  if (filter.preset === 'all' || !filter.preset) return true;

  let lowerBound: Date | null = null;
  let upperBound: Date | null = null;
  switch (filter.preset) {
    case 'today':
      lowerBound = startOfDay(now);
      upperBound = endOfDay(now);
      break;
    case 'yesterday':
      lowerBound = startOfDay(subDays(now, 1));
      upperBound = endOfDay(subDays(now, 1));
      break;
    case 'last7days':
      lowerBound = startOfDay(subDays(now, 6));
      upperBound = endOfDay(now);
      break;
    case 'last30days':
      lowerBound = startOfDay(subDays(now, 29));
      upperBound = endOfDay(now);
      break;
    case 'thisMonth':
      lowerBound = startOfMonth(now);
      upperBound = endOfMonth(now);
      break;
    case 'lastMonth':
      lowerBound = startOfMonth(subMonths(now, 1));
      upperBound = endOfMonth(lowerBound);
      break;
  }
  if (lowerBound && upperBound) {
    return cellDateTime >= lowerBound.getTime() && cellDateTime <= upperBound.getTime();
  }
  return true;
}

function matchesSelect(cellValue: unknown, filter: FilterValue & { type: 'select' }): boolean {
  const operator = filter.operator ?? 'isAnyOf';
  if (operator === 'isEmpty') return isEmptyCell(cellValue);
  if (operator === 'isNotEmpty') return !isEmptyCell(cellValue);

  // A single value of '' is a real constraint (match empty cells), not "no constraint":
  // upstream compared `String(cellValue) === filter.value` exactly. Only a missing value
  // or an empty array means unconstrained.
  const raw = filter.value;
  const selected = Array.isArray(raw) ? raw : raw === undefined || raw === null ? [] : [String(raw)];
  const isAny = selected.length === 0 || selected.includes(String(cellValue));
  return operator === 'isNoneOf' ? !isAny : isAny;
}

function matchesBoolean(cellValue: unknown, filter: FilterValue & { type: 'boolean' }): boolean {
  // Neither operator nor value: the filter carries no constraint and matches every
  // row. This is upstream's `if (filter.value === undefined) return true` and it is
  // load-bearing — without it an unset boolean filter silently hides every row whose
  // cell is false.
  if (!filter.operator && filter.value === undefined) return true;
  // `operator` is authoritative when present; `value` (legacy/no-operator) is the fallback.
  const operator = filter.operator ?? (filter.value === false ? 'isNotChecked' : 'isChecked');
  const wantsChecked = operator === 'isChecked';
  return Boolean(cellValue) === wantsChecked;
}

function matchesDateTree(cellValue: unknown, filter: DateTreeFilterValue): boolean {
  const operator = filter.operator ?? 'inBucket';
  if (operator === 'isEmpty') return isEmptyCell(cellValue);
  if (operator === 'isNotEmpty') return !isEmptyCell(cellValue);
  if (!filter.selected || filter.selected.length === 0) return true;
  const parts = dateTreeKeyOf(cellValue);
  if (!parts) return false;
  return filter.selected.includes(`${parts.year}-${parts.month}`);
}

/** The single dispatcher every FilterValue variant's operator routes through. */
export function matchesFilterValue(cellValue: unknown, filter: FilterValue, now: Date): boolean {
  switch (filter.type) {
    case 'text':
      return matchesText(cellValue, filter);
    case 'number':
      return matchesNumber(cellValue, filter);
    case 'date':
      return matchesDate(cellValue, filter, now);
    case 'select':
      return matchesSelect(cellValue, filter);
    case 'boolean':
      return matchesBoolean(cellValue, filter);
    case 'date-tree':
      return matchesDateTree(cellValue, filter);
    default:
      return true;
  }
}
