import { TextEditor } from './text-editor';
import type { EditorProps } from './types';

export const EmailEditor = (p: EditorProps) => <TextEditor {...p} type="email" />;
