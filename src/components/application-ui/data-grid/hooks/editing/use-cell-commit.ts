import * as React from 'react';
import type { ColumnDefinition, HierarchicalData, ProcessedRow } from '../../types';
import { cellEditKey, getCellValue, isSameCellValue } from '../../lib/utils';
import { resolveEditorType } from '../../editors/registry';
import { toStrictNumber } from '../../lib/gridProcessing';
import type { CellEditStatus } from '../../editors/types';

import type { EditRecord, PendingEdit } from '../../internal-types';

export type { EditRecord, PendingEdit } from '../../internal-types';

export interface UseCellCommitArgs<TData extends HierarchicalData<TData>> {
  colDefsMap: Map<keyof TData & string, ColumnDefinition<TData>>;
  baseRows: ProcessedRow<TData>[];
  undoRedoEnabled: boolean;
  onCellEdit?: (
    rowId: string | number,
    field: keyof TData & string,
    value: any,
    nextRow: TData,
  ) => void | Promise<void>;
}

export function useCellCommit<TData extends HierarchicalData<TData>>({
  colDefsMap,
  baseRows,
  undoRedoEnabled,
  onCellEdit,
}: UseCellCommitArgs<TData>) {
  // Undo/redo over grid-driven cell edits. Refs, not state: the stacks never drive a
  // render on their own — the parent's data change does.
  const undoStackRef = React.useRef<EditRecord<TData>[][]>([]);
  const redoStackRef = React.useRef<EditRecord<TData>[][]>([]);
  // One undo/redo at a time: two fast Ctrl+Z's would otherwise pop different batches
  // and finish out of order, inverting redo.
  const undoBusyRef = React.useRef(false);
  // The value last handed to onCellEdit per cell, until that call settles. The parent's
  // data is a generation behind while a save is in flight, so it can't be the baseline
  // for the no-op check, nor decide which of two overlapping commits owns the cell.
  const inFlightRef = React.useRef(new Map<string, unknown>());
  // Auto-clear timers for rolled-back statuses, keyed by cell so a newer status can
  // cancel an older cell's timer instead of being wiped by it.
  const statusTimersRef = React.useRef(new Map<string, number>());
  React.useEffect(() => () => statusTimersRef.current.forEach(window.clearTimeout), []);

  // Transient per-cell edit status (validation error, or async commit pending/rollback).
  // Never persisted — same category as editingCell/editInputValue. The map identity only
  // changes when an entry does, so renderCellContent isn't re-run for nothing.
  const [cellEditStatus, setCellEditStatus] = React.useState<Map<string, CellEditStatus>>(() => new Map());

  const clearCellEditStatus = (key: string) => {
    const timer = statusTimersRef.current.get(key);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      statusTimersRef.current.delete(key);
    }
    setCellEditStatus(prev => {
      if (!prev.has(key)) return prev;
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  };

  // Central async commit for a single cell. Every grid-driven edit path (inline, fill,
  // paste, undo, redo) routes through this — the one place pending/rollback lives, and
  // the one place the next row is built. Returns the record only once the parent
  // confirmed, so an unconfirmed edit never reaches the undo stack.
  const commitCellEdit = async (
    rowId: string | number,
    field: keyof TData & string,
    value: any,
  ): Promise<EditRecord<TData> | null> => {
    if (!onCellEdit) return null;
    const columnDef = colDefsMap.get(field);
    const row = baseRows.find(r => r.id === rowId);
    if (!columnDef || !row) return null;

    const key = cellEditKey(rowId, field);
    const prevValue = getCellValue(row, field, columnDef);
    // Compare against what's already in flight for this cell, not the parent's data:
    // re-editing back to the pre-edit value mid-save is a real edit, not a no-op.
    const baseline = inFlightRef.current.has(key) ? inFlightRef.current.get(key) : prevValue;
    // Equal-by-value dates and arrays count as no-ops too (see isSameCellValue): without
    // that, a multiselect or Date cell would flash a pending dot and push an undo entry on
    // every close. No deep object comparison — nested/plain-object values still use `===`.
    if (isSameCellValue(baseline, value)) return null; // no-ops don't pollute undo history or flash a pending dot
    inFlightRef.current.set(key, value);

    // Cancel a still-armed expiry timer from an earlier failure on this cell: it would
    // otherwise fire mid-flight and clear this pending status. Guarding here rather than
    // at the call sites makes every path (inline, fill, paste, undo, redo) safe.
    const armedTimer = statusTimersRef.current.get(key);
    if (armedTimer !== undefined) {
      window.clearTimeout(armedTimer);
      statusTimersRef.current.delete(key);
    }
    setCellEditStatus(prev => new Map(prev).set(key, { status: 'pending', value }));

    try {
      // valueSetter is user code: inside the try, so a throw rolls back like any other
      // failed save instead of rejecting the whole batch.
      const nextRow = columnDef.valueSetter
        ? (columnDef.valueSetter(value, row.originalRow) as TData)
        : ({ ...row.originalRow, [field]: value } as TData);
      await Promise.resolve(onCellEdit(rowId, field, value, nextRow));
      // A newer commit on this cell owns the status now — don't touch it.
      if (inFlightRef.current.get(key) !== value) return null;
      inFlightRef.current.delete(key);
      clearCellEditStatus(key);
      return { rowId, field, prevValue, nextValue: value };
    } catch (error) {
      console.error('[DataGrid] cell commit failed:', error);
      if (inFlightRef.current.get(key) !== value) return null;
      inFlightRef.current.delete(key);
      // Roll back visually to prevValue; the parent owns the data and never applied it.
      setCellEditStatus(prev => new Map(prev).set(key, { status: 'error', value: prevValue, message: 'Save failed — reverted' }));
      const timer = window.setTimeout(() => {
        statusTimersRef.current.delete(key);
        clearCellEditStatus(key);
      }, 3000);
      statusTimersRef.current.set(key, timer);
      return null;
    }
  };

  const applyEdits = async (edits: PendingEdit<TData>[]) => {
    if (!onCellEdit || edits.length === 0) return;
    const results = await Promise.all(edits.map(edit => commitCellEdit(edit.rowId, edit.field, edit.value)));
    const batch = results.filter((r): r is EditRecord<TData> => r !== null);
    if (batch.length === 0) return;
    if (undoRedoEnabled) {
      undoStackRef.current.push(batch);
      if (undoStackRef.current.length > 100) undoStackRef.current.shift();
      redoStackRef.current = [];
    }
  };

  const handleUndo = async () => {
    if (undoBusyRef.current) return;
    const batch = undoStackRef.current.pop();
    if (!batch) return;
    undoBusyRef.current = true;
    try {
      const results = await Promise.all(
        [...batch].reverse().map(e => commitCellEdit(e.rowId, e.field, e.prevValue))
      );
      // Nothing was actually reverted (every save rejected) — keep the batch where it
      // was so the user can retry, instead of dropping it from both stacks.
      if (results.some(r => r !== null)) redoStackRef.current.push(batch);
      else undoStackRef.current.push(batch);
    } finally {
      undoBusyRef.current = false;
    }
  };

  const handleRedo = async () => {
    if (undoBusyRef.current) return;
    const batch = redoStackRef.current.pop();
    if (!batch) return;
    undoBusyRef.current = true;
    try {
      const results = await Promise.all(batch.map(e => commitCellEdit(e.rowId, e.field, e.nextValue)));
      if (results.some(r => r !== null)) undoStackRef.current.push(batch);
      else redoStackRef.current.push(batch);
    } finally {
      undoBusyRef.current = false;
    }
  };

  // A numeric cell takes numbers only. Returns undefined when the raw value can't be
  // coerced — callers skip that cell.
  //
  // "Numeric" is decided by the resolved EDITOR type, not by the column's filterType or
  // the stored value's JS type on their own. Those two are what resolveEditorType
  // already infers from, so the numeric cases behave as before — but a boolean stored
  // as 0/1, or a multi-value field over numeric ids, no longer drags a checkbox or a
  // multiselect through toStrictNumber: `true` coerced to null and the commit was
  // dropped, and String(['3','4']) lost its comma and committed as 34.
  const coerceValueForCell = (rowId: string | number, field: keyof TData & string, raw: any): any => {
    const columnDef = colDefsMap.get(field);
    const originalRowData = baseRows.find(r => r.id === rowId)?.originalRow;
    if (!columnDef) return raw;
    const editorType = resolveEditorType(columnDef, originalRowData?.[field]);
    if (editorType === 'number' || editorType === 'currency') {
      const num = toStrictNumber(raw);
      return num === null ? undefined : num;
    }
    return raw;
  };

  return {
    cellEditStatus,
    setCellEditStatus,
    statusTimersRef,
    clearCellEditStatus,
    commitCellEdit,
    applyEdits,
    coerceValueForCell,
    handleUndo,
    handleRedo,
  };
}
