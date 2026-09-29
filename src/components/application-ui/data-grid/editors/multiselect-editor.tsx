import * as React from 'react';
import { Combobox, ComboboxOption } from '@/components/forms/combobox';
import { editorKeyDown } from './keydown';
import type { EditorProps } from './types';

/** The design system's `Combobox` in `multiple` mode. It replaced a native
 * `<select multiple>`, whose four-row listbox was unusable in a normal-width column and
 * carried none of the design system's styling.
 *
 * Commit timing differs from the single-value editor: several picks make one edit, so
 * the value is committed when the dropdown closes (`onClose`) or when focus leaves the
 * editor, never on each pick — committing per pick would tear the editor down after the
 * first one. */
export function MultiSelectEditor({
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
  // The committed value is read from a ref rather than the `value` prop: onClose fires in
  // the same tick as the last onChange, so the prop the parent re-renders with has not
  // arrived yet and committing it would drop that pick.
  const selected = React.useMemo(() => (Array.isArray(value) ? value.map(String) : []), [value]);
  const latest = React.useRef(selected);
  latest.current = selected;
  return (
    <div
      ref={wrapperRef}
      className="h-full"
      // aria-invalid and aria-describedby sit on the wrapper: the design system's
      // Combobox forwards aria-label to its input but neither of these, and
      // src/components/forms/ is out of scope here.
      aria-invalid={ariaInvalid}
      aria-describedby={ariaDescribedBy}
      onKeyDown={editorKeyDown({ onCancel })}
      // Only a blur that leaves the editor ends the edit — moving between the input and
      // the dropdown is still inside it. relatedTarget is null when focus leaves the
      // document entirely, which counts as leaving.
      onBlur={(event) => {
        if (wrapperRef.current?.contains(event.relatedTarget)) return;
        onCommit(latest.current);
      }}
    >
      <Combobox<string>
        multiple
        value={selected}
        onChange={(next) => {
          const list = Array.isArray(next) ? next : next == null ? [] : [next];
          latest.current = list;
          onChange(list);
        }}
        onClose={() => onCommit(latest.current)}
        autoFocus={autoFocus}
        aria-label={`${column.headerText} cell editor`}
        displayValue={(item) =>
          options.find((opt) => String(opt.value) === item)?.label ?? String(item)
        }
      >
        {options.map((opt) => (
          <ComboboxOption key={String(opt.value)} value={String(opt.value)}>
            {opt.label}
          </ComboboxOption>
        ))}
      </Combobox>
    </div>
  );
}
