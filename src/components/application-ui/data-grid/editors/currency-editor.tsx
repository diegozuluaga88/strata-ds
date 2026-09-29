import { TextEditor } from './text-editor';
import type { EditorProps } from './types';

export const CurrencyEditor = (p: EditorProps) => (
  <TextEditor {...p} type="text" inputMode="decimal" prefix="$" />
);
