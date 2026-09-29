import * as React from 'react';
import type { ColumnDefinition, DataGridState, HierarchicalData, ProcessedRow } from '../../types';
import {
  beginSession,
  discardSession,
  emptySession,
  sessionChanges,
  setSessionCell,
  type EditSessionState,
} from '../../editing/edit-session';
import { cellEditKey, getCellValue, isColumnEditable } from '../../lib/utils';
import { resolveEditorType } from '../../editors/registry';
import { validateEditValue } from '../../editors/validation';
import type { CellChange } from '../../types';
import type { PendingEdit } from '../../internal-types';
import type { CellEditStatus } from '../../editors/types';

type UseEditSessionCellEdit<TData extends HierarchicalData<TData>> = (
  rowId: string | number,
  field: keyof TData & string,
  value: any,
  nextRow: TData,
) => void | Promise<void>;

export interface UseEditSessionArgs<TData extends HierarchicalData<TData>> {
  state: DataGridState<TData>;
  setState: (updater: (prev: DataGridState<TData>) => DataGridState<TData>) => void;
  colDefsMap: Map<keyof TData & string, ColumnDefinition<TData>>;
  processedColumnDefs: ColumnDefinition<TData>[];
  baseRows: ProcessedRow<TData>[];
  editSessionMode?: 'cell' | 'session';
  onCellEdit?: UseEditSessionCellEdit<TData>;
  onSaveEdits?: (changes: CellChange[]) => void | Promise<void>;
  /** From use-cell-commit. */
  clearCellEditStatus: (key: string) => void;
  setCellEditStatus: React.Dispatch<React.SetStateAction<Map<string, CellEditStatus>>>;
  statusTimersRef: React.MutableRefObject<Map<string, number>>;
  coerceValueForCell: (rowId: string | number, field: keyof TData & string, raw: any) => any;
  applyEdits: (edits: PendingEdit<TData>[]) => Promise<void>;
}

export function useEditSession<TData extends HierarchicalData<TData>>({
  state,
  setState,
  colDefsMap,
  processedColumnDefs,
  baseRows,
  editSessionMode,
  onCellEdit,
  onSaveEdits,
  clearCellEditStatus,
  setCellEditStatus,
  statusTimersRef,
  coerceValueForCell,
  applyEdits,
}: UseEditSessionArgs<TData>) {
  const startEditingCell = (rowId: string | number, field: keyof TData & string) => {
    // A session save wipes the ENTIRE dirty map on success — a new edit started while
    // it's in flight would be silently lost with it. Block cell interaction until it settles.
    if (sessionMode === 'session' && isSaving) return;
    const columnDef = processedColumnDefs.find(col => col.field === field);
    const row = baseRows.find(r => r.id === rowId);
    if (columnDef && row && isColumnEditable(columnDef, row.originalRow)) {
      setState(prevState => ({
        ...prevState,
        editingCell: { rowId, field },
        editInputValue: getCellValue(row, field, columnDef),
        focusedCell: { rowId, colField: field },
      }));
    }
  };

  const handleCellClick = (rowId: string | number, field: keyof TData & string) => {
    // navigable: false opts a column (e.g. Actions) out of focus-on-click -- see
    // ColumnDefinition.navigable in types.ts for the full rationale.
    const columnDef = processedColumnDefs.find(col => col.field === field);
    if (columnDef?.navigable === false) return;
    setState(prevState => ({ ...prevState, focusedCell: { rowId, colField: field }}));
  };

  // Opt-in batch edit session (Orderbahn's grid-wide Edit toggle). Inert in the default
  // 'cell' mode — every existing per-cell commit path below is untouched by it.
  const [editSession, setEditSession] = React.useState<EditSessionState>(emptySession);
  const [sessionError, setSessionError] = React.useState<string | null>(null);
  // Guards handleSessionSaveAll against a double-click re-send and handleEditCommit/
  // startEditingCell against a new edit landing in the dirty map while a save that will
  // wipe that map wholesale is in flight. State (not a ref) because the toolbar's Save
  // button needs to re-render disabled while this is true.
  const [isSaving, setIsSaving] = React.useState(false);
  const sessionMode = editSessionMode ?? 'cell';

  const handleSessionBegin = () => {
    setSessionError(null);
    setEditSession(prev => beginSession(prev));
  };

  const handleSessionDiscard = () => {
    setSessionError(null);
    setEditSession(discardSession);
  };

  const handleSessionSaveAll = async () => {
    if (isSaving) return; // already in flight — ignore the double-click re-send
    const changes = sessionChanges(editSession);
    if (changes.length === 0 || !onSaveEdits) return;
    setSessionError(null);
    setIsSaving(true);
    try {
      await Promise.resolve(onSaveEdits(changes));
      setEditSession(discardSession);
    } catch (error) {
      console.error('[DataGrid] session save failed:', error);
      // Every buffered cell rolls back at once: a partial apply would leave the grid
      // showing values the server never accepted. The session itself stays open (the
      // dirty map is untouched) so Save can be retried — only the on-screen value of
      // each cell reverts, via the same transient error/timer machinery `commitCellEdit`
      // uses for a single-cell rollback.
      setSessionError('Save failed — no changes were applied');
      changes.forEach(change => {
        const key = cellEditKey(change.rowId, change.field);
        // No `message` here: the toolbar's `sessionError` already reports the failure
        // once for the whole batch — a per-cell message would duplicate it.
        setCellEditStatus(prev => new Map(prev).set(key, { status: 'error', value: change.previous }));
        const timer = window.setTimeout(() => {
          statusTimersRef.current.delete(key);
          clearCellEditStatus(key);
        }, 3000);
        statusTimersRef.current.set(key, timer);
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditInputChange = (value: unknown) => {
    setState(prevState => ({ ...prevState, editInputValue: value }));
    // Typing clears a stale validation message immediately.
    if (state.editingCell) clearCellEditStatus(cellEditKey(state.editingCell.rowId, state.editingCell.field));
  };

  // Editors that change and commit in the same handler (checkbox, date) pass their
  // value, because `onChange` only schedules the state update and the edit buffer is
  // still the pre-change value here. Everyone else commits the buffer. `undefined` is
  // a legitimate committed value, so the argument's presence — not its value — decides.
  const handleEditCommit = (...args: [value?: unknown]) => {
    if (!state.editingCell) return;
    // Belt-and-suspenders alongside startEditingCell's guard: a save started after this
    // cell was already in edit mode must not let the commit add a new dirty entry that
    // discardSession is about to wipe on success.
    if (sessionMode === 'session' && isSaving) return;
    const { rowId, field } = state.editingCell;
    const key = cellEditKey(rowId, field);
    const columnDef = colDefsMap.get(field);
    const row = baseRows.find(r => r.id === rowId);

    let valueToCommit: unknown;
    let shouldCommit = false;
    if (onCellEdit && columnDef && row) {
      const raw = args.length > 0 ? args[0] : state.editInputValue;
      const coerced = coerceValueForCell(rowId, field, raw);
      // An uncoercible numeric string still has to be validated (and reported) rather
      // than silently dropped, so validation sees the raw value in that case.
      const value = coerced === undefined ? raw : coerced;
      const editorType = resolveEditorType(columnDef, getCellValue(row, field, columnDef));
      const message = validateEditValue(editorType, value, row.originalRow, columnDef);
      if (message) {
        // Stays in edit mode with the buffer intact so the user can fix it.
        setCellEditStatus(prev => new Map(prev).set(key, { status: 'error', value, message }));
        return;
      }
      if (coerced !== undefined) {
        valueToCommit = coerced;
        shouldCommit = true;
      } else if (args.length > 0 && raw === undefined) {
        // A deliberate clear (a date editor emptied, an editRenderer nulling a field) —
        // `undefined` here is the committed value, not "nothing to commit".
        shouldCommit = true;
      }
    }

    clearCellEditStatus(key);
    setState(prevState => ({ ...prevState, editingCell: null, editInputValue: '' }));
    // The clear above drops a leftover validation message (which has no timer of its own)
    // and covers the paths that never reach commitCellEdit — a no-op or a non-commit close.
    // Ordering no longer protects the pending status; commitCellEdit cancels the timer itself.
    if (!shouldCommit) return;
    if (sessionMode === 'session' && editSession.active) {
      setEditSession(prev =>
        setSessionCell(prev, {
          rowId,
          field,
          previous: row ? getCellValue(row, field, columnDef) : undefined,
          next: valueToCommit,
        }),
      );
    } else {
      void applyEdits([{ rowId, field, value: valueToCommit }]);
    }
  };

  const handleEditCancel = () => {
    if (state.editingCell) clearCellEditStatus(cellEditKey(state.editingCell.rowId, state.editingCell.field));
    setState(prevState => ({ ...prevState, editingCell: null, editInputValue: '' }));
  };

  return {
    sessionMode,
    editSession,
    sessionError,
    isSaving,
    handleSessionBegin,
    handleSessionDiscard,
    handleSessionSaveAll,
    startEditingCell,
    handleCellClick,
    handleEditInputChange,
    handleEditCommit,
    handleEditCancel,
  };
}
