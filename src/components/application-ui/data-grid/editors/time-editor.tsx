import { Input } from '@/components/forms/input';
import { editorKeyDown } from './keydown';
import type { EditorProps } from './types';

const pad = (n: number) => String(n).padStart(2, '0');

/** `<input type="time">` wants `hh:mm`, but a time column may hold a `Date`, an epoch
 * number or a full ISO datetime — narrow instead of blanking it. Local parts, never
 * `toISOString()`: a UTC read shifts the displayed (and then committed) time by the
 * viewer's offset. Local is the convention for every editor in this sub-project. */
export function toTimeValue(value: unknown): string {
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? '' : `${pad(value.getHours())}:${pad(value.getMinutes())}`;
  }
  if (typeof value === 'number') return toTimeValue(new Date(value));
  if (typeof value !== 'string') return '';
  const t = value.indexOf('T');
  const s = t < 0 ? value : value.slice(t + 1);
  // A date-only string ('2026-01-15') would slice to '2026-', which type="time" rejects.
  return /^\d{2}:\d{2}/.test(s) ? s.slice(0, 5) : '';
}

/** The design system has no time primitive, so this is its `Input` in `type="time"`:
 * the browser's own time control, wearing the design system's field styling. */
export function TimeEditor({
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
    <Input
      type="time"
      value={toTimeValue(value)}
      onChange={(e) => onChange(e.target.value)}
      onBlur={() => onCommit()}
      onKeyDown={editorKeyDown({ onCommit, onCancel, commitOnEnter: true })}
      autoFocus={autoFocus}
      aria-label={`${column.headerText} cell editor`}
      aria-invalid={ariaInvalid}
      aria-describedby={ariaDescribedBy}
      className="h-9 w-full"
    />
  );
}
