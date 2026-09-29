import * as React from 'react';
import type { ColumnDefinition, DataGridState, HierarchicalData, ProcessedRow } from '../types';
import { computeFillValues, parseClipboardText } from '../lib/gridProcessing';
import { getCellValue, isColumnEditable } from '../lib/utils';
import type { PendingEdit } from '../internal-types';

export interface FillZone {
  top: number;
  bottom: number;
  left: number;
  right: number;
  direction: 'down' | 'up' | 'left' | 'right';
}

export interface RangeBounds {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface UseFillAndPasteArgs<TData extends HierarchicalData<TData>> {
  state: DataGridState<TData>;
  paginatedData: ProcessedRow<TData>[];
  orderedVisibleColumnDefs: ColumnDefinition<TData>[];
  rangeBounds: RangeBounds | null;
  fillZone: FillZone | null;
  isFilling: boolean;
  setIsFilling: (v: boolean) => void;
  setFillEnd: (v: { rowIndex: number; colIndex: number } | null) => void;
  pasteEnabled: boolean;
  canEditCells: boolean;
  coerceValueForCell: (rowId: string | number, field: keyof TData & string, raw: any) => any;
  applyEdits: (edits: PendingEdit<TData>[]) => Promise<void>;
}

/**
 * Split out of `use-range-selection.ts` purely to keep that file under the
 * 300-LOC ceiling — the fill handle and clipboard paste are the two heaviest
 * pieces of that hook and share no state with the pointer/range mechanics.
 */
export function useFillAndPaste<TData extends HierarchicalData<TData>>({
  state,
  paginatedData,
  orderedVisibleColumnDefs,
  rangeBounds,
  fillZone,
  isFilling,
  setIsFilling,
  setFillEnd,
  pasteEnabled,
  canEditCells,
  coerceValueForCell,
  applyEdits,
}: UseFillAndPasteArgs<TData>) {
  const applyFill = () => {
    if (!fillZone || !rangeBounds || !canEditCells) return;
    const edits: PendingEdit<TData>[] = [];
    const cols = orderedVisibleColumnDefs;

    if (fillZone.direction === 'down' || fillZone.direction === 'up') {
      for (let c = fillZone.left; c <= fillZone.right; c++) {
        const colDef = cols[c];
        if (!colDef) continue;
        const sourceRows: ProcessedRow<TData>[] = [];
        for (let r = rangeBounds.top; r <= rangeBounds.bottom; r++) {
          const row = paginatedData[r];
          if (row && !row.isGroupHeader) sourceRows.push(row);
        }
        if (sourceRows.length === 0) continue;
        let source = sourceRows.map(row => getCellValue(row, colDef.field, colDef));
        const targetIndices: number[] = [];
        if (fillZone.direction === 'down') {
          for (let r = fillZone.top; r <= fillZone.bottom; r++) targetIndices.push(r);
        } else {
          for (let r = fillZone.bottom; r >= fillZone.top; r--) targetIndices.push(r);
          source = [...source].reverse();
        }
        const values = computeFillValues(source, targetIndices.length);
        targetIndices.forEach((r, i) => {
          const row = paginatedData[r];
          if (!row || row.isGroupHeader) return;
          if (!isColumnEditable(colDef, row.originalRow)) return;
          const value = coerceValueForCell(row.id, colDef.field, values[i]);
          if (value !== undefined) edits.push({ rowId: row.id, field: colDef.field, value });
        });
      }
    } else {
      for (let r = fillZone.top; r <= fillZone.bottom; r++) {
        const row = paginatedData[r];
        if (!row || row.isGroupHeader) continue;
        let source: any[] = [];
        for (let c = rangeBounds.left; c <= rangeBounds.right; c++) {
          const colDef = cols[c];
          if (colDef) source.push(getCellValue(row, colDef.field, colDef));
        }
        if (source.length === 0) continue;
        const targetCols: number[] = [];
        if (fillZone.direction === 'right') {
          for (let c = fillZone.left; c <= fillZone.right; c++) targetCols.push(c);
        } else {
          for (let c = fillZone.right; c >= fillZone.left; c--) targetCols.push(c);
          source = [...source].reverse();
        }
        const values = computeFillValues(source, targetCols.length);
        targetCols.forEach((c, i) => {
          const colDef = cols[c];
          if (!colDef || !isColumnEditable(colDef, row.originalRow)) return;
          const value = coerceValueForCell(row.id, colDef.field, values[i]);
          if (value !== undefined) edits.push({ rowId: row.id, field: colDef.field, value });
        });
      }
    }
    void applyEdits(edits);
  };

  // Keep the latest applyFill reachable from the one-shot document mouseup listener
  // without re-subscribing on every pointer move.
  const applyFillRef = React.useRef(applyFill);
  applyFillRef.current = applyFill;
  React.useEffect(() => {
    if (!isFilling) return;
    const onMouseUp = () => {
      applyFillRef.current();
      setIsFilling(false);
      setFillEnd(null);
    };
    document.addEventListener('mouseup', onMouseUp);
    return () => document.removeEventListener('mouseup', onMouseUp);
  }, [isFilling]);

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (!pasteEnabled || state.editingCell) return;
    // Pastes aimed at real inputs (global search, filters, editors) stay theirs.
    if ((e.target as HTMLElement).closest('input, textarea, select, [contenteditable="true"]')) return;
    const matrix = parseClipboardText(e.clipboardData.getData('text/plain'));
    if (matrix.length === 0) return;

    let startRow: number;
    let startCol: number;
    if (rangeBounds) {
      startRow = rangeBounds.top;
      startCol = rangeBounds.left;
    } else if (state.focusedCell) {
      startRow = paginatedData.findIndex(r => r.id === state.focusedCell!.rowId);
      startCol = orderedVisibleColumnDefs.findIndex(c => c.field === state.focusedCell!.colField);
    } else {
      return;
    }
    if (startRow < 0 || startCol < 0) return;
    e.preventDefault();

    const edits: PendingEdit<TData>[] = [];
    const isSingleValue = matrix.length === 1 && matrix[0].length === 1;
    if (isSingleValue && rangeBounds) {
      // One copied cell fills the whole selected range (Excel behavior).
      for (let r = rangeBounds.top; r <= rangeBounds.bottom; r++) {
        const row = paginatedData[r];
        if (!row || row.isGroupHeader) continue;
        for (let c = rangeBounds.left; c <= rangeBounds.right; c++) {
          const colDef = orderedVisibleColumnDefs[c];
          if (!colDef || !isColumnEditable(colDef, row.originalRow)) continue;
          const value = coerceValueForCell(row.id, colDef.field, matrix[0][0]);
          if (value !== undefined) edits.push({ rowId: row.id, field: colDef.field, value });
        }
      }
    } else {
      // The matrix maps cell-per-cell from the anchor; group header rows are skipped
      // without consuming a matrix row.
      let matrixRow = 0;
      for (let r = startRow; r < paginatedData.length && matrixRow < matrix.length; r++) {
        const row = paginatedData[r];
        if (!row || row.isGroupHeader) continue;
        const rowValues = matrix[matrixRow++];
        for (let j = 0; j < rowValues.length; j++) {
          const colDef = orderedVisibleColumnDefs[startCol + j];
          if (!colDef || !isColumnEditable(colDef, row.originalRow)) continue;
          const value = coerceValueForCell(row.id, colDef.field, rowValues[j]);
          if (value !== undefined) edits.push({ rowId: row.id, field: colDef.field, value });
        }
      }
    }
    void applyEdits(edits);
  };

  return { handlePaste };
}
