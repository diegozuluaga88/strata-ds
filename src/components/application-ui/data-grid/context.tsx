"use client";
import * as React from 'react';
import type { HierarchicalData } from './types';
import type { useDataGrid } from './hooks/use-data-grid';

/**
 * Stable-identity grid configuration: column geometry, flags, and every handler.
 * Changes only when props, columns, or layout-level state (sort/filter/pin/resize)
 * change — never on a per-keystroke edit or a hover, which is what lets the
 * memoised rows in view/grid-row.tsx and view/grid-cell.tsx stay mounted. See the
 * design doc, §5.1.
 */
export type GridConfig<TData extends HierarchicalData<TData>> = ReturnType<typeof useDataGrid<TData>>['config'];

/** Derived row data: changes on page, filter, or sort. See the design doc, §5.1. */
export type GridData<TData extends HierarchicalData<TData>> = ReturnType<typeof useDataGrid<TData>>['data'];

const ConfigContext = React.createContext<GridConfig<any> | null>(null);
const DataContext = React.createContext<GridData<any> | null>(null);

export function GridProvider<TData extends HierarchicalData<TData>>({
  config,
  data,
  children,
}: {
  config: GridConfig<TData>;
  data: GridData<TData>;
  children: React.ReactNode;
}) {
  return (
    <ConfigContext.Provider value={config}>
      <DataContext.Provider value={data}>{children}</DataContext.Provider>
    </ConfigContext.Provider>
  );
}

export function useGridConfig<TData extends HierarchicalData<TData>>(): GridConfig<TData> {
  const value = React.useContext(ConfigContext);
  if (!value) throw new Error('useGridConfig must be used inside a DataGrid');
  return value as GridConfig<TData>;
}

export function useGridDataContext<TData extends HierarchicalData<TData>>(): GridData<TData> {
  const value = React.useContext(DataContext);
  if (!value) throw new Error('useGridDataContext must be used inside a DataGrid');
  return value as GridData<TData>;
}
