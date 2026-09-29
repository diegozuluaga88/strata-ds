import { Checkbox } from '@/components/forms/checkbox';
import { editorKeyDown } from './keydown';
import type { EditorProps } from './types';

/** Toggling *is* the edit, so there is no blur commit: it would re-commit an
 * unchanged value every time the user tabs away. The new value goes to `onCommit`
 * directly — `onChange` only schedules the buffer update. */
export function CheckboxEditor({
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
    <div className="flex h-full items-center justify-center">
      <Checkbox
        checked={!!value}
        onCheckedChange={(checked) => {
          onChange(!!checked);
          onCommit(!!checked);
        }}
        onKeyDown={editorKeyDown({ onCancel })}
        autoFocus={autoFocus}
        aria-label={`${column.headerText} cell editor`}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
      />
    </div>
  );
}
