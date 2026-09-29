import * as React from 'react';
import { DatePicker } from '@/components/forms/date-picker';
import { Input } from '@/components/forms/input';
import { toDateValue } from './date-editor';
import { editorKeyDown } from './keydown';
import { toTimeValue } from './time-editor';
import type { EditorProps } from './types';

/** Splits `YYYY-MM-DDThh:mm[:ss[.mmm]][Z|±hh:mm]` into the two halves the controls
 * understand plus the untouched tail, so re-joining preserves both the UTC offset and
 * the original seconds (editing `10:30:45` to 11:45 yields `11:45:45`) — dropping
 * either would silently shift the instant by the viewer's offset.
 * A `Date`/epoch value has no text tail to preserve and is read in local parts, same
 * convention as `toDateValue`/`toTimeValue`. */
function splitIso(value: unknown): { date: string; time: string; rest: string } {
  if (value instanceof Date || typeof value === 'number') {
    const date = toDateValue(value);
    return { date, time: date ? toTimeValue(value) : '', rest: '' };
  }
  const str = typeof value === 'string' ? value : '';
  const t = str.indexOf('T');
  if (t < 0) return { date: str.slice(0, 10), time: '', rest: '' };
  return { date: str.slice(0, t), time: str.slice(t + 1, t + 6), rest: str.slice(t + 6) };
}

/** The design system has no datetime primitive, so this composes two of its own: the
 * `DatePicker` for the date half and `Input` in `type="time"` for the time half. */
export function DateTimeEditor({
  value,
  column,
  onChange,
  onCommit,
  onCancel,
  autoFocus,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
}: EditorProps) {
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const { date, time, rest } = splitIso(value);
  const emit = (nextDate: string, nextTime: string) => {
    // Accepted by design: a date with no time commits as `…T00:00` (see the date half
    // below), and clearing the time input drops the preserved `rest` along with it.
    const next = nextDate && nextTime ? `${nextDate}T${nextTime}${rest}` : nextDate || '';
    onChange(next);
    return next;
  };
  return (
    // aria-invalid sits on the wrapper: DatePicker exposes aria-label/aria-describedby
    // but no aria-invalid prop, and src/components/forms/ is out of scope here.
    <div
      ref={wrapperRef}
      className="flex h-full items-center gap-1"
      aria-invalid={ariaInvalid}
      onKeyDown={editorKeyDown({ onCancel })}
    >
      {/* The date half shrinks (its trigger is w-full min-w-0) so both halves stay
          usable in a normal-width column; the time half keeps a fixed floor instead. */}
      <div className="min-w-0 flex-1">
      <DatePicker
        // truncate: the trigger label is not clipped by default, so at a narrow column
        // the date text runs over the time half.
        className="truncate"
        value={date}
        onChange={(nextDate) => {
          // The time input may never be touched, so the date half commits too —
          // with the joined value, since onChange has not flushed yet.
          onCommit(emit(nextDate, time || '00:00'));
        }}
        aria-label={`${column.headerText} date cell editor`}
        aria-describedby={ariaDescribedBy}
      />
      </div>
      <Input
        type="time"
        value={time}
        onChange={(e) => emit(date, e.target.value)}
        // Only a blur that leaves the editor is the end of the edit. Moving to the date
        // half is still inside it, and committing there tears the editor down between the
        // trigger's mousedown and mouseup — no click ever reaches it, so the calendar
        // never opens. relatedTarget is null when focus leaves the document entirely,
        // which counts as leaving.
        onBlur={(e) => {
          if (wrapperRef.current?.contains(e.relatedTarget)) return;
          onCommit();
        }}
        onKeyDown={editorKeyDown({ onCommit, onCancel, commitOnEnter: true })}
        autoFocus={autoFocus}
        aria-label={`${column.headerText} time cell editor`}
        aria-describedby={ariaDescribedBy}
        // w-28 shrink-0: hh:mm plus Chrome's clock affordance does not fit in w-24, and
        // shrinking is the date half's job, not the time half's.
        className="h-9 w-28 shrink-0"
      />
    </div>
  );
}
