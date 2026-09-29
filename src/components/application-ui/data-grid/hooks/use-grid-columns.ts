import * as React from 'react';
import type { ColumnDefinition, HierarchicalData, ProcessedRow } from '../types';
import { getCellValue } from '../lib/utils';
import { dateTreeKeyOf } from '../lib/gridProcessing';
import { computeColumnBounds, type DerivedColumnBounds } from '../lib/conditionalFormatting';

export interface UseGridColumnsArgs<TData extends HierarchicalData<TData>> {
  columnDefs: ColumnDefinition<TData>[];
  data: TData[] | undefined;
  isTreeData: boolean;
  expandedRows: Set<string | number>;
}

export function useGridColumns<TData extends HierarchicalData<TData>>({
  columnDefs,
  data,
  isTreeData,
  expandedRows,
}: UseGridColumnsArgs<TData>) {
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    const seen = new Set<string>();
    for (const col of columnDefs) {
      if (seen.has(col.field)) {
        console.error(`[DataGrid] duplicate column field "${col.field}" — columns must be unique.`);
      }
      seen.add(col.field);
    }
  }, [columnDefs]);

  const getUniqueColumnValues = React.useCallback((field: keyof TData & string): string[] => {
    if (!data) return [];
    const uniqueValues = new Set<string>();
    const traverse = (items: TData[]) => {
      items.forEach(row => {
        const value = getCellValue({originalRow: row} as ProcessedRow<TData>, field); // Adjusted to pass ProcessedRow-like structure
        if (value !== undefined && value !== null) {
          uniqueValues.add(String(value));
        }
        if (isTreeData && row.children) {
          traverse(row.children);
        }
      });
    };
    traverse(data);
    return Array.from(uniqueValues).sort();
  }, [data, isTreeData]);

  const getDateTreeBuckets = React.useCallback((field: keyof TData & string) => {
    const monthsByYear = new Map<string, Set<string>>();
    (data || []).forEach(row => {
      const parts = dateTreeKeyOf(getCellValue({ originalRow: row } as ProcessedRow<TData>, field));
      if (!parts) return;
      if (!monthsByYear.has(parts.year)) monthsByYear.set(parts.year, new Set());
      monthsByYear.get(parts.year)!.add(parts.month);
    });
    return Array.from(monthsByYear.entries())
      .sort((a, b) => Number(b[0]) - Number(a[0]))
      .map(([year, months]) => ({ year, months: Array.from(months).sort() }));
  }, [data]);

  const processedColumnDefs = React.useMemo(() => {
    return columnDefs.map(colDef => {
      if (colDef.filterable && colDef.filterType === 'select' && !colDef.filterOptions) {
        return {
          ...colDef,
          filterOptions: getUniqueColumnValues(colDef.field).map(val => ({ label: val, value: val }))
        };
      }
      if (colDef.filterable && colDef.filterType === 'date-tree' && !colDef.dateTreeBuckets) {
        return { ...colDef, dateTreeBuckets: getDateTreeBuckets(colDef.field) };
      }
      return colDef;
    });
  }, [columnDefs, getUniqueColumnValues, getDateTreeBuckets]);

  // A computed column can't be written back by assigning row[field]; without a
  // valueSetter the parent silently loses the edit. Warn once per column, dev only.
  const warnedNoValueSetterRef = React.useRef(new Set<string>());
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    columnDefs.forEach(col => {
      if (!col.editable || !col.valueGetter || col.valueSetter) return;
      if (warnedNoValueSetterRef.current.has(col.field)) return;
      warnedNoValueSetterRef.current.add(col.field);
      console.error(
        `[DataGrid] Column "${col.field}" is editable and has a valueGetter but no ` +
          `valueSetter — an edit cannot be written back to a computed field by assigning ` +
          `row[field]. Add a valueSetter.`
      );
    });
  }, [columnDefs]);

  const colDefsMap = React.useMemo(() => new Map(processedColumnDefs.map(col => [col.field, col])), [processedColumnDefs]);

  const flattenTreeData = React.useCallback((
    treeData: TData[],
    expanded: Set<string | number>,
    level = 0
  ): ProcessedRow<TData>[] => {
    let flatList: ProcessedRow<TData>[] = [];
    treeData.forEach(item => {
      const hasChildren = !!(item.children && item.children.length > 0);
      const isExpanded = expanded.has(item.id);
      flatList.push({
        originalRow: item,
        id: item.id,
        level,
        hasChildren,
        isExpanded,
        // Do not spread item here to avoid ProcessedRow specific props being overwritten by originalRow
      });
      if (hasChildren && isExpanded && item.children) {
        flatList = flatList.concat(flattenTreeData(item.children, expanded, level + 1));
      }
    });
    return flatList;
  }, []);

  const baseDataForProcessing = React.useMemo<ProcessedRow<TData>[]>(() => {
    if (isTreeData) {
      return flattenTreeData(data || [], expandedRows);
    }
    return (data || []).map(item => ({
      originalRow: item,
      id: item.id,
      level: 0,
      hasChildren: false,
      isExpanded: false,
       // Do not spread item here
    }));
  }, [data, isTreeData, flattenTreeData, expandedRows]);

  const columnBoundsMap = React.useMemo(() => {
    const bounds: Record<string, DerivedColumnBounds> = {};
    processedColumnDefs.forEach(col => {
      bounds[col.field] = computeColumnBounds(baseDataForProcessing, col.field);
    });
    return bounds;
  }, [processedColumnDefs, baseDataForProcessing]);

  return { processedColumnDefs, colDefsMap, columnBoundsMap, baseDataForProcessing };
}
