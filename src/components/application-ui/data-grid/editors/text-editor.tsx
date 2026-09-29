import type * as React from 'react';
import { Input } from '@/components/forms/input';
import { cn } from '@/utils';
import { editorKeyDown } from './keydown';
import type { EditorProps } from './types';

/** The shell every text-like editor is built from. `type`/`inputMode`/`prefix` are
 * internal knobs for the thin wrappers below (NumberEditor, CurrencyEditor), not
 * part of the public editor contract. */
export interface TextEditorProps extends EditorProps {
  type?: string;
  inputMode?: React.ComponentProps<'input'>['inputMode'];
  prefix?: React.ReactNode;
}

export function TextEditor({
  value,
  column,
  onChange,
  onCommit,
  onCancel,
  autoFocus,
  type = 'text',
  inputMode,
  prefix,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
}: TextEditorProps) {
  return (
    <Input
      type={type}
      inputMode={inputMode}
      prefix={prefix}
      value={value == null ? '' : String(value)}
      onChange={(e) => onChange(e.target.value)}
      onBlur={() => onCommit()}
      onKeyDown={editorKeyDown({ onCommit, onCancel, commitOnEnter: true })}
      autoFocus={autoFocus}
      aria-label={`${column.headerText} cell editor`}
      aria-invalid={ariaInvalid}
      aria-describedby={ariaDescribedBy}
      // With a prefix the `$` is absolutely positioned, so p-1 would sit it on the
      // value. Neither path sets a height: the shared Input's own h-9 is kept so every
      // editor is the same height at every row density (h-full would twMerge it away on
      // the no-prefix path only, making the currency editor visibly shorter).
      className={cn('border-ring', prefix ? 'py-1 pr-1 pl-7' : 'p-1')}
    />
  );
}
