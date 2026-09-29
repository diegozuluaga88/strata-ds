import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/forms/select';
import { editorKeyDown } from './keydown';
import type { EditorProps } from './types';

/** The design system's Radix-based Select. It replaced a native `<select>`, which the
 * port had used because Radix keeps its options in a portal — reachable in tests only
 * once the listbox is open, which is exactly how a user reaches them too.
 *
 * Radix commits differently from a native select, and better: a closed native select
 * fires `change` on every arrow key and typeahead keystroke, so committing on change
 * would have closed the editor on a neighbouring option. Radix only emits a value when
 * the user picks one (click, or Enter inside the open listbox), so that IS the commit —
 * the same change-and-commit-together shape the checkbox and date editors use, which is
 * why the value is passed to `onCommit`. */
export function SelectEditor({
  value,
  column,
  onChange,
  onCommit,
  onCancel,
  autoFocus,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
}: EditorProps) {
  const options = column.editOptions ?? column.filterOptions ?? [];
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    // SelectTrigger forwards no ref, so the wrapper focuses it by slot — the same shape
    // date-editor.tsx uses for the DatePicker trigger. The trigger has to hold focus for
    // Escape to reach the wrapper's key handler.
    if (autoFocus) {
      wrapperRef.current?.querySelector<HTMLElement>('[data-slot="select-trigger"]')?.focus();
    }
  }, [autoFocus]);
  return (
    // Escape is handled here rather than on the trigger: Radix stops the keydown at the
    // content while the listbox is open, so only a wrapper sees the second Escape that
    // means "abandon the edit".
    <div ref={wrapperRef} className="h-full" onKeyDown={editorKeyDown({ onCancel })}>
      <Select
        value={value == null ? '' : String(value)}
        onValueChange={(next) => {
          onChange(next);
          onCommit(next);
        }}
      >
        <SelectTrigger
          className="h-9 w-full"
          aria-label={`${column.headerText} cell editor`}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
          // A pick commits and unmounts the editor, so a blur that follows one would
          // fire into a torn-down cell. Only a blur with nothing selected ends the edit.
          onBlur={(event) => {
            if (event.relatedTarget) return;
            onCommit();
          }}
        >
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={String(opt.value)} value={String(opt.value)}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
