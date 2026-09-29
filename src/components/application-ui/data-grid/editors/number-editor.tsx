import { TextEditor } from './text-editor';
import type { EditorProps } from './types';

/** `type="text"` on purpose: a native number input reports '' for intermediate text
 * ('-', '1.', '1e'), which would empty the edit buffer and commit a blank cell.
 * Numeric coercion happens in the grid's commit path. */
export const NumberEditor = (p: EditorProps) => <TextEditor {...p} type="text" inputMode="decimal" />;
