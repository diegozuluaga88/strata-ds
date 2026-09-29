import type { ColumnDefinition, HierarchicalData } from '../types';
import type { EditorType, EditRenderer } from './types';
import { TextEditor } from './text-editor';
import { NumberEditor } from './number-editor';
import { CurrencyEditor } from './currency-editor';
import { CheckboxEditor } from './checkbox-editor';
import { DateEditor } from './date-editor';
import { DateTimeEditor } from './datetime-editor';
import { TimeEditor } from './time-editor';
import { PhoneEditor } from './phone-editor';
import { EmailEditor } from './email-editor';
import { SelectEditor } from './select-editor';
import { MultiSelectEditor } from './multiselect-editor';

export const editorRegistry: Record<EditorType, EditRenderer<any>> = {
  text: TextEditor,
  number: NumberEditor,
  currency: CurrencyEditor,
  date: DateEditor,
  datetime: DateTimeEditor,
  time: TimeEditor,
  phone: PhoneEditor,
  email: EmailEditor,
  select: SelectEditor,
  multiselect: MultiSelectEditor,
  checkbox: CheckboxEditor,
};

/** Picks an EditorType for a column: explicit `editorType` wins, then `filterType`
 * gives a reasonable default, then the sample value's own JS type, else `text`. */
export function resolveEditorType<TData extends HierarchicalData<TData>>(
  column: ColumnDefinition<TData>,
  sampleValue: unknown
): EditorType {
  if (column.editorType) return column.editorType;
  if (column.filterType === 'number') return 'number';
  if (column.filterType === 'boolean') return 'checkbox';
  if (column.filterType === 'select') return 'select';
  if (column.filterType === 'date' || column.filterType === 'date-tree') return 'date';
  if (typeof sampleValue === 'boolean') return 'checkbox';
  if (typeof sampleValue === 'number') return 'number';
  return 'text';
}

/** `column.editRenderer` (the domain-editor slot) always wins over the built-in registry. */
export function getEditRenderer<TData extends HierarchicalData<TData>>(
  column: ColumnDefinition<TData>,
  sampleValue: unknown
): EditRenderer<TData> {
  if (column.editRenderer) return column.editRenderer;
  return editorRegistry[resolveEditorType(column, sampleValue)];
}
