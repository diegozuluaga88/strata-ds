import * as React from 'react';
import type { DataGridState, HierarchicalData } from '../types';

export interface UseRowReorderArgs<TData extends HierarchicalData<TData>> {
  /** enableRowReorder && !!onRowsReordered && !isTreeData */
  rowReorderEnabled: boolean;
  sortConfig: DataGridState<TData>['sortConfig'];
  groupedBy: (keyof TData & string)[];
  data: TData[] | undefined;
  onRowsReordered?: (rows: TData[]) => void;
}

export function useRowReorder<TData extends HierarchicalData<TData>>({
  rowReorderEnabled,
  sortConfig,
  groupedBy,
  data,
  onRowsReordered,
}: UseRowReorderArgs<TData>) {
  const [draggedRowId, setDraggedRowId] = React.useState<string | number | null>(null);
  const [rowDropTarget, setRowDropTarget] = React.useState<{ rowId: string | number; position: 'above' | 'below' } | null>(null);

  // Reordering only means something in the data's own order: sorting or grouping
  // would immediately re-sort whatever the user dropped, so the handle deactivates.
  const rowReorderActive = rowReorderEnabled && !sortConfig && groupedBy.length === 0;

  const handleRowDragStart = (e: React.DragEvent, rowId: string | number) => {
    e.dataTransfer.setData('text/plain', String(rowId));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedRowId(rowId);
  };

  const handleRowDragOver = (e: React.DragEvent, targetRowId: string | number) => {
    if (draggedRowId === null || draggedRowId === targetRowId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const rect = e.currentTarget.getBoundingClientRect();
    const position = e.clientY < rect.top + rect.height / 2 ? 'above' : 'below';
    setRowDropTarget(prev =>
      prev?.rowId === targetRowId && prev.position === position ? prev : { rowId: targetRowId, position }
    );
  };

  const handleRowDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedRowId !== null && rowDropTarget && onRowsReordered && draggedRowId !== rowDropTarget.rowId) {
      const items = [...(data || [])];
      const fromIdx = items.findIndex(item => item.id === draggedRowId);
      if (fromIdx >= 0) {
        const [moved] = items.splice(fromIdx, 1);
        const targetIdx = items.findIndex(item => item.id === rowDropTarget.rowId);
        if (targetIdx >= 0) {
          items.splice(rowDropTarget.position === 'above' ? targetIdx : targetIdx + 1, 0, moved);
          onRowsReordered(items);
        }
      }
    }
    setDraggedRowId(null);
    setRowDropTarget(null);
  };

  const handleRowDragEnd = () => {
    setDraggedRowId(null);
    setRowDropTarget(null);
  };

  return {
    rowReorderActive,
    draggedRowId,
    rowDropTarget,
    handleRowDragStart,
    handleRowDragOver,
    handleRowDrop,
    handleRowDragEnd,
  };
}
