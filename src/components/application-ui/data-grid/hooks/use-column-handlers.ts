import type { AggregateFunction, ColumnDefinition, DataGridState, HierarchicalData } from '../types';

export interface UseColumnHandlersArgs<TData extends HierarchicalData<TData>> {
  columnDefs: ColumnDefinition<TData>[];
  state: DataGridState<TData>;
  setState: (updater: (prev: DataGridState<TData>) => DataGridState<TData>) => void;
}

/**
 * The column-mutation handlers (visibility, width, drag-reorder, pin, group/ungroup).
 * Split out of `use-grid-layout.ts` purely to keep that file under the 300-LOC ceiling —
 * these are plain `setState` updaters with no layout-memo dependencies of their own.
 */
export function useColumnHandlers<TData extends HierarchicalData<TData>>({
  columnDefs,
  state,
  setState,
}: UseColumnHandlersArgs<TData>) {
  const handleColumnVisibilityChange = (field: keyof TData & string, isVisible: boolean) => {
    setState((prevState) => {
      const newVisibleColumns = isVisible
        ? [...prevState.visibleColumns, field]
        : prevState.visibleColumns.filter((vc) => vc !== field);
      return { ...prevState, visibleColumns: newVisibleColumns };
    });
  };

  const handleColumnWidthChange = (field: keyof TData & string, newWidth: number) => {
    setState(prevState => ({
      ...prevState,
      columnWidths: {
        ...prevState.columnWidths,
        [field]: `${newWidth}px`,
      }
    }));
  };

  const handleDragStartColumn = (field: keyof TData & string, event: React.DragEvent) => {
    event.dataTransfer.setData('text/plain', field);
    document.body.classList.add('dragging-column');
    setState(prevState => ({ ...prevState, draggedColumn: field }));
  };


  const handleDragOverReorder = (event: React.DragEvent, targetField: keyof TData & string) => {
    event.preventDefault();
    if (state.draggedColumn && state.draggedColumn !== targetField) {
       const isTargetPinned = state.pinnedColumns.left.includes(targetField) || state.pinnedColumns.right.includes(targetField);
       if (!isTargetPinned) {
         setState(prevState => ({ ...prevState, draggedOverColumn: targetField }));
       }
    }
  };

  const handleDragLeaveReorder = () => {
    setState(prevState => ({ ...prevState, draggedOverColumn: null }));
  };

  const handleDropReorder = (targetField: keyof TData & string, event: React.DragEvent) => {
    event.preventDefault();
    document.body.classList.remove('dragging-column');
    const sourceField = state.draggedColumn;

    const isSourcePinned = state.pinnedColumns.left.includes(sourceField!) || state.pinnedColumns.right.includes(sourceField!);
    const isTargetPinned = state.pinnedColumns.left.includes(targetField) || state.pinnedColumns.right.includes(targetField);

    if (sourceField && sourceField !== targetField && !isSourcePinned && !isTargetPinned) {
      setState(prevState => {
        const newColumnOrder = [...prevState.columnOrder];
        const sourceIndex = newColumnOrder.indexOf(sourceField);
        const targetIndex = newColumnOrder.indexOf(targetField);

        if (sourceIndex > -1 && targetIndex > -1) {
          const [removed] = newColumnOrder.splice(sourceIndex, 1);
          newColumnOrder.splice(targetIndex, 0, removed);
        }
        return { ...prevState, columnOrder: newColumnOrder, draggedColumn: null, draggedOverColumn: null };
      });
    } else {
       setState(prevState => ({ ...prevState, draggedColumn: null, draggedOverColumn: null }));
    }
  };

  const handleDragEndColumn = () => {
    document.body.classList.remove('dragging-column');
    setState(prevState => ({ ...prevState, draggedColumn: null, draggedOverColumn: null }));
  };


  const handlePinColumn = (fieldToPin: keyof TData & string, position: 'left' | 'right' | null) => {
    setState(prevState => {
      let newPinnedLeft = [...prevState.pinnedColumns.left.filter(f => f !== fieldToPin)];
      let newPinnedRight = [...prevState.pinnedColumns.right.filter(f => f !== fieldToPin)];
      let newColumnOrder = [...prevState.columnOrder.filter(f => f !== fieldToPin)];

      if (position === 'left') {
        newPinnedRight = newPinnedRight.filter(f => f !== fieldToPin);
        if (!newPinnedLeft.includes(fieldToPin)) newPinnedLeft.push(fieldToPin);
      } else if (position === 'right') {
        newPinnedLeft = newPinnedLeft.filter(f => f !== fieldToPin);
        if (!newPinnedRight.includes(fieldToPin)) newPinnedRight.push(fieldToPin);
      } else {
        if (!newColumnOrder.includes(fieldToPin)) {
            const originalDefIndex = columnDefs.findIndex(c => c.field === fieldToPin);
            let insertAtIndex = newColumnOrder.length;
            for (let i = 0; i < newColumnOrder.length; i++) {
                const currentFieldInOrder = newColumnOrder[i];
                const originalIndexOfCurrent = columnDefs.findIndex(c => c.field === currentFieldInOrder);
                if (originalDefIndex < originalIndexOfCurrent) {
                    insertAtIndex = i;
                    break;
                }
            }
            newColumnOrder.splice(insertAtIndex, 0, fieldToPin);
        }
      }
      return {
        ...prevState,
        pinnedColumns: { left: newPinnedLeft, right: newPinnedRight },
        columnOrder: newColumnOrder,
      };
    });
  };

  const handleGroupColumn = (field: keyof TData & string) => {
    setState(prevState => {
      if (prevState.groupedBy.includes(field)) return prevState;
      const newGroupedBy = [...prevState.groupedBy, field];
      return { ...prevState, groupedBy: newGroupedBy, currentPage: 1, expandedGroups: new Set() };
    });
  };

  const handleUngroupColumn = (field: keyof TData & string) => {
    setState(prevState => {
      const newGroupedBy = prevState.groupedBy.filter(f => f !== field);
      return {
        ...prevState,
        groupedBy: newGroupedBy,
        groupAggregations: Object.fromEntries(
          Object.entries(prevState.groupAggregations).filter(([f]) => newGroupedBy.includes(f)),
        ),
        currentPage: 1,
        expandedGroups: new Set(),
      };
    });
  };

  const handleAggregateChange = (field: keyof TData & string, aggregate: AggregateFunction) => {
    setState(prevState => ({
      ...prevState,
      groupAggregations: { ...prevState.groupAggregations, [field]: aggregate },
    }));
  };

  return {
    handleColumnVisibilityChange,
    handleColumnWidthChange,
    handleDragStartColumn,
    handleDragOverReorder,
    handleDragLeaveReorder,
    handleDropReorder,
    handleDragEndColumn,
    handlePinColumn,
    handleGroupColumn,
    handleUngroupColumn,
    handleAggregateChange,
  };
}
