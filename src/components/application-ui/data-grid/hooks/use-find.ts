import * as React from 'react';
import type { ColumnDefinition, DataGridState, HierarchicalData, ProcessedRow } from '../types';
import { findCellMatches } from '../lib/gridProcessing';

export interface UseFindArgs<TData extends HierarchicalData<TData>> {
  enableFind: boolean;
  /** The pre-pagination list — find spans every page, then jumps to the match's page. */
  dataToPaginate: ProcessedRow<TData>[];
  orderedVisibleColumnDefs: ColumnDefinition<TData>[];
  displayRows: { row: ProcessedRow<TData>; isDetail: boolean; dataIndex: number }[];
  virtualized: boolean;
  virtualizedMaxHeight: number;
  /** Prefix-sum row tops; null when not virtualized. */
  rowOffsets: number[] | null;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  tableWrapperRef: React.RefObject<HTMLDivElement | null>;
  setState: (updater: (prev: DataGridState<TData>) => DataGridState<TData>) => void;
}

export function useFind<TData extends HierarchicalData<TData>>(args: UseFindArgs<TData>) {
  const {
    enableFind,
    dataToPaginate,
    orderedVisibleColumnDefs,
    displayRows,
    virtualized,
    virtualizedMaxHeight,
    rowOffsets,
    scrollContainerRef,
    tableWrapperRef,
    setState,
  } = args;

  const [findOpen, setFindOpen] = React.useState(false);
  const [findQuery, setFindQuery] = React.useState('');
  const [findActiveIdx, setFindActiveIdx] = React.useState(0);

  // ---- Find-in-grid ----
  const findMatches = React.useMemo(
    () => (findOpen && enableFind ? findCellMatches(dataToPaginate, orderedVisibleColumnDefs, findQuery) : []),
    [findOpen, enableFind, findQuery, dataToPaginate, orderedVisibleColumnDefs]
  );
  const activeMatch = findMatches.length > 0 ? findMatches[Math.min(findActiveIdx, findMatches.length - 1)] : null;
  const findMatchSet = React.useMemo(
    () => new Set(findMatches.map(m => `${m.rowId}|${m.field}`)),
    [findMatches]
  );

  const goToMatch = (idx: number) => {
    if (findMatches.length === 0) return;
    const wrapped = ((idx % findMatches.length) + findMatches.length) % findMatches.length;
    setFindActiveIdx(wrapped);
    const match = findMatches[wrapped];
    setState(prev => ({
      ...prev,
      currentPage: virtualized ? prev.currentPage : Math.floor(match.rowIndex / prev.pageSize) + 1,
      focusedCell: { rowId: match.rowId, colField: match.field as keyof TData & string },
    }));
    // Virtualization windows unrendered rows out, so scrollIntoView can't reach them —
    // jump the scroll container to the match's computed offset instead.
    if (virtualized && rowOffsets && scrollContainerRef.current) {
      const displayIdx = displayRows.findIndex(d => !d.isDetail && d.dataIndex === match.rowIndex);
      if (displayIdx >= 0) {
        scrollContainerRef.current.scrollTop = Math.max(0, rowOffsets[displayIdx] - virtualizedMaxHeight / 2);
      }
    }
  };

  // First Enter lands on the first match; subsequent ones advance. The ref resets
  // whenever the query changes so a new search starts from the top again.
  const findNavigatedRef = React.useRef(false);
  const handleFindNext = () => {
    if (findMatches.length === 0) return;
    if (!findNavigatedRef.current) {
      findNavigatedRef.current = true;
      goToMatch(findActiveIdx);
    } else {
      goToMatch(findActiveIdx + 1);
    }
  };
  const handleFindPrevious = () => {
    if (findMatches.length === 0) return;
    if (!findNavigatedRef.current) {
      findNavigatedRef.current = true;
      goToMatch(findActiveIdx);
    } else {
      goToMatch(findActiveIdx - 1);
    }
  };

  const handleFindQueryChange = (query: string) => {
    setFindQuery(query);
    setFindActiveIdx(0);
    findNavigatedRef.current = false;
  };

  const closeFindBar = () => {
    setFindOpen(false);
    findNavigatedRef.current = false;
    tableWrapperRef.current?.focus();
  };

  return {
    findOpen,
    setFindOpen,
    findQuery,
    findActiveIdx,
    findMatches,
    findMatchSet,
    activeMatch,
    handleFindNext,
    handleFindPrevious,
    handleFindQueryChange,
    closeFindBar,
  };
}
