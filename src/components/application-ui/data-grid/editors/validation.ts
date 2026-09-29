import { toStrictNumber } from '../lib/gridProcessing';
import type { ColumnDefinition } from '../types';
import type { EditorType } from './types';

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** Digit count only: separators, parens and extensions vary too much to pattern-match,
 * and 7-15 digits is the E.164 range. */
export function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

/** Built-in per-type check, then the column's own `editValidator`. Returns `null` when valid. */
export function validateEditValue<TData>(
  editorType: EditorType,
  value: unknown,
  row: TData,
  column: ColumnDefinition<TData>
): string | null {
  if (typeof value === 'string' && value.length > 0) {
    if (editorType === 'email' && !isValidEmail(value)) return 'Enter a valid email address';
    if (editorType === 'phone' && !isValidPhone(value)) return 'Enter a valid phone number';
    if ((editorType === 'number' || editorType === 'currency') && toStrictNumber(value) === null) {
      return 'Enter a valid number';
    }
  }
  return column.editValidator?.(value, row) ?? null;
}
