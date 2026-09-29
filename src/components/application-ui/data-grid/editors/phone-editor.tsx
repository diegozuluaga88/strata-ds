import { TextEditor } from './text-editor';
import type { EditorProps } from './types';

export const PhoneEditor = (p: EditorProps) => <TextEditor {...p} type="tel" />;
