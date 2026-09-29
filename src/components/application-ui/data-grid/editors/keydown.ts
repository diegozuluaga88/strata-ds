import type * as React from 'react';

/** The one keydown handler every editor uses — the six copies it replaced were
 * identical apart from whether Enter commits. */
export function editorKeyDown({
  onCommit,
  onCancel,
  commitOnEnter,
}: {
  onCommit?: (value?: unknown) => void;
  onCancel: () => void;
  commitOnEnter?: boolean;
}) {
  return (e: React.KeyboardEvent) => {
    // The grid's own key handling (undo/redo, paste, arrow navigation) must not
    // see keystrokes aimed at the editor. preventDefault alone does not stop it.
    e.stopPropagation();
    if (commitOnEnter && e.key === 'Enter') {
      e.preventDefault();
      onCommit?.();
    } else if (e.key === 'Escape') {
      // Escape inside an open Radix popover (the DatePicker's calendar) belongs to
      // the popover: Radix's own document listener is registered with capture:true, so
      // it has already started closing the popover by the time this handler runs;
      // cancelling here too would kill the whole edit on the same keystroke.
      if ((e.target as HTMLElement).closest?.('[data-radix-popper-content-wrapper]')) return;
      e.preventDefault();
      onCancel();
    }
  };
}
