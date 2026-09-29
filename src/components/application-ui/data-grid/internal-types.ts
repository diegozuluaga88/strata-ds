import type { buildHeaderGroupSpans, CellMatch } from './lib/gridProcessing';
import type { HierarchicalData, ProcessedRow, DataGridState } from './types';
import type { CellEditStatus } from './editors/types';
import type { EditSessionState } from './editing/edit-session';

type SpanList<TData extends HierarchicalData<TData>> =
  ReturnType<typeof buildHeaderGroupSpans<TData>>;

/** Header group spans, built per sticky region so a group never straddles a pin boundary. */
export type HeaderGroupSpans<TData extends HierarchicalData<TData>> = {
  left: SpanList<TData>;
  middle: SpanList<TData>;
  right: SpanList<TData>;
};

/** What a right-click recorded: where, and on which cell. */
export type ContextMenuTarget<TData> = {
  x: number;
  y: number;
  rowId: string | number;
  colField: keyof TData & string;
};

/**
 * The display list interleaves a synthetic detail entry after each expanded master
 * row. `dataIndex` always points back at the row's position in `paginatedData`, so
 * range selection and keyboard navigation are unaffected by open detail panels.
 */
export type DisplayRow<TData extends HierarchicalData<TData>> = {
  row: ProcessedRow<TData>;
  isDetail: boolean;
  dataIndex: number;
  /**
   * A lazy-mode row whose data has not loaded yet. `row` carries only a synthetic id for
   * React keying — its `originalRow` is an empty object and must never be read. Every
   * consumer checks this flag BEFORE touching `row`, the same way `isDetail` is checked
   * first today.
   */
  isPlaceholder?: boolean;
};

/** One queued cell write, before it reaches `onCellEdit`. */
export type PendingEdit<TData> = {
  rowId: string | number;
  field: keyof TData & string;
  value: any;
};

/** One committed cell write, as recorded on the undo stack. */
export type EditRecord<TData> = {
  rowId: string | number;
  field: keyof TData & string;
  prevValue: any;
  nextValue: any;
};

/**
 * Per-keystroke state. Deliberately NOT carried in a context: a context value that
 * changes on every keystroke re-renders every consumer, which is exactly what the
 * memoised rows exist to prevent. GridBody receives this and derives per-row
 * primitives from it. See the design doc, §5.2.
 */
export type GridVolatileState<TData extends HierarchicalData<TData>> = {
  selectedRows: Set<string | number>;
  focusedCell: DataGridState<TData>['focusedCell'];
  editingCell: DataGridState<TData>['editingCell'];
  editInputValue: unknown;
  expandedDetails: Set<string | number>;
  rangeBounds: { top: number; bottom: number; left: number; right: number } | null;
  isDraggingRange: boolean;
  isFilling: boolean;
  isCellInRange: (dataIndex: number, colIndex: number) => boolean;
  isCellInFillZone: (dataIndex: number, colIndex: number) => boolean;
  cellEditStatus: Map<string, CellEditStatus>;
  editSession: EditSessionState;
  findOpen: boolean;
  findMatchSet: Set<string>;
  activeMatch: CellMatch | null;
  draggedRowId: string | number | null;
  rowDropTarget: { rowId: string | number; position: 'above' | 'below' } | null;
};
