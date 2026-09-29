import type * as React from 'react';
import type { ColumnDefinition } from '../types';

export type EditorType =
  | 'text'
  | 'number'
  | 'currency'
  | 'date'
  | 'datetime'
  | 'time'
  | 'phone'
  | 'email'
  | 'select'
  | 'multiselect'
  | 'checkbox';

export interface EditorProps<TData = any> {
  /** Current edit-buffer value (not yet committed). */
  value: unknown;
  /** The row being edited, unwrapped from ProcessedRow. */
  row: TData;
  column: ColumnDefinition<TData>;
  onChange: (value: unknown) => void;
  /** Commits `value` when given, otherwise the grid's current edit buffer. Editors
   * that toggle/select in one handler must pass it: `onChange` only schedules the
   * state update, so the buffer is still the pre-change value at commit time. */
  onCommit: (value?: unknown) => void;
  /** Discards the edit-buffer value and exits edit mode. */
  onCancel: () => void;
  autoFocus?: boolean;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

/** A component, so an app can pass `React.memo(MyRoleEditor)` as well as a plain function. */
export type EditRenderer<TData = any> = React.ComponentType<EditorProps<TData>>;

/** Transient per-cell status while a commit is in flight or just failed. Keyed by `cellEditKey`. */
export interface CellEditStatus {
  status: 'pending' | 'error';
  /** What to render instead of the row's real value: the optimistic value while pending, the rolled-back prior value on error. */
  value: unknown;
  message?: string;
}
