import * as React from 'react';
import { DatePicker } from '@/components/forms/date-picker';
import { editorKeyDown } from './keydown';
import type { EditorProps } from './types';

const pad = (n: number) => String(n).padStart(2, '0');

/** DatePicker only understands a bare `YYYY-MM-DD`, but a date column may hold a
 * `Date`, an epoch number or a full ISO datetime — narrow instead of blanking it.
 * Local parts, never `toISOString()`: the design-system DatePicker parses
 * `YYYY-MM-DD` at *local* noon (`forms/date-picker.tsx`), so reading a Date in UTC
 * would render (and then commit) the wrong day for anyone east/west of UTC. Local is
 * the convention for every editor in this sub-project — do not flip it back. */
export function toDateValue(value: unknown): string {
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return '';
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }
  if (typeof value === 'number') return toDateValue(new Date(value));
  return typeof value === 'string' ? value.slice(0, 10) : '';
}

export function DateEditor({
  value,
  column,
  onChange,
  onCommit,
  onCancel,
  autoFocus,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
}: EditorProps) {
  return (
    // aria-invalid sits on the wrapper: DatePicker exposes aria-label/aria-describedby
    // but no aria-invalid prop, and src/components/forms/ is out of scope here.
    <div
      className="h-full"
      aria-invalid={ariaInvalid}
      onKeyDown={editorKeyDown({ onCancel })}
    >
      <DatePicker
        value={toDateValue(value)}
        onChange={(next) => {
          onChange(next);
          onCommit(next);
        }}
        aria-label={`${column.headerText} cell editor`}
        aria-describedby={ariaDescribedBy}
        autoFocus={autoFocus}
      />
    </div>
  );
}
