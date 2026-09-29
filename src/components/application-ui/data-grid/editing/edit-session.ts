/**
 * The batch edit session: Orderbahn's grid-wide Edit toggle collects every changed cell
 * and saves them together (`findCellsEdited` / `generateUpdatedList`). This is that
 * buffer, as a pure value — nothing here knows about React or the grid.
 */

export interface DirtyCell {
  rowId: string | number;
  field: string;
  previous: unknown;
  next: unknown;
}

export type CellChange = DirtyCell;

export interface EditSessionState {
  active: boolean;
  /** Keyed `${rowId}::${field}` so one cell can only be dirty once. */
  dirty: Record<string, DirtyCell>;
}

export const emptySession: EditSessionState = { active: false, dirty: {} };

// Same scheme as `lib/utils.ts`'s `cellEditKey` (the transient per-cell edit-status map) —
// duplicated rather than imported so this module stays dependency-free. If the separator
// ever changes, change it in both places.
function keyOf(rowId: string | number, field: string): string {
  return `${rowId}::${field}`;
}

export function beginSession(session: EditSessionState): EditSessionState {
  return { ...session, active: true };
}

/**
 * Records an edit. Editing the same cell twice keeps the FIRST `previous` value — that is
 * what a rollback has to restore, and what the server needs to detect a stale write.
 * Editing a cell back to its original value removes it from the buffer entirely.
 */
export function setSessionCell(session: EditSessionState, cell: DirtyCell): EditSessionState {
  const key = keyOf(cell.rowId, cell.field);
  const existing = session.dirty[key];
  const previous = existing ? existing.previous : cell.previous;

  const dirty = { ...session.dirty };
  if (previous === cell.next) delete dirty[key];
  else dirty[key] = { ...cell, previous };

  return { ...session, dirty };
}

export function discardSession(_session: EditSessionState): EditSessionState {
  return emptySession;
}

export function sessionChanges(session: EditSessionState): CellChange[] {
  return Object.values(session.dirty);
}

export function dirtyCount(session: EditSessionState): number {
  return Object.keys(session.dirty).length;
}

/** The value the grid should render for a cell: the buffered one when dirty. */
export function sessionValue(
  session: EditSessionState,
  rowId: string | number,
  field: string,
): { has: boolean; value: unknown } {
  const cell = session.dirty[keyOf(rowId, field)];
  return cell ? { has: true, value: cell.next } : { has: false, value: undefined };
}
