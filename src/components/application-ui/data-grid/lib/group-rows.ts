import type { HierarchicalData, ProcessedRow } from '../types';
import { getCellValue } from './utils';

export interface GroupRowsArgs<TData extends HierarchicalData<TData>> {
  rows: ProcessedRow<TData>[];
  groupedBy: (keyof TData & string)[];
  expandedGroups: Set<string>;
}

/**
 * Interleaves synthetic group-header rows into an already-sorted row list. A collapsed
 * group contributes only its header; an expanded one contributes its header plus the
 * result of grouping its items by the next field.
 */
export function groupRows<TData extends HierarchicalData<TData>>({
  rows,
  groupedBy,
  expandedGroups,
}: GroupRowsArgs<TData>): ProcessedRow<TData>[] {
  const build = (
    input: ProcessedRow<TData>[],
    groupIndex: number,
    parentGroupKey: string,
    currentLevel: number,
  ): ProcessedRow<TData>[] => {
    if (groupIndex >= groupedBy.length) {
      return input;
    }

    const groupField = groupedBy[groupIndex];
    const result: ProcessedRow<TData>[] = [];

    let currentVal: any = undefined;
    let currentItems: ProcessedRow<TData>[] = [];

    const addGroup = (val: any, items: ProcessedRow<TData>[]) => {
      const groupValueStr = String(val);
      const groupKey = parentGroupKey ? `${parentGroupKey}|${String(groupField)}:${groupValueStr}` : `${String(groupField)}:${groupValueStr}`;

      const subGroupedItems = build(items, groupIndex + 1, groupKey, currentLevel + 1);

      const groupHeaderRow: ProcessedRow<TData> = {
        id: `group-header-${groupKey}`,
        originalRow: {} as TData,
        level: currentLevel,
        hasChildren: true,
        isGroupHeader: true,
        groupField: groupField,
        groupValue: val,
        groupKey: groupKey,
        groupItems: items,
        isExpanded: expandedGroups.has(groupKey),
      } as ProcessedRow<TData>;

      result.push(groupHeaderRow);

      if (expandedGroups.has(groupKey)) {
        result.push(...subGroupedItems);
      }
    };

    input.forEach((row, index) => {
      const rowVal = getCellValue(row, groupField);
      if (index === 0 || rowVal !== currentVal) {
        if (currentItems.length > 0) {
          addGroup(currentVal, currentItems);
        }
        currentVal = rowVal;
        currentItems = [row];
      } else {
        currentItems.push(row);
      }
    });

    if (currentItems.length > 0) {
      addGroup(currentVal, currentItems);
    }

    return result;
  };
  return build(rows, 0, "", 0);
}
