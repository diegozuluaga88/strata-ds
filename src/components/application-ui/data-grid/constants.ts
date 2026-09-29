/** Fallback column width (px) when neither state nor the column def supplies one. */
export const DEFAULT_COL_WIDTH = 150;

/** localStorage key used when the caller passes no `storageKey`. */
export const LOCAL_STORAGE_KEY = 'ngxMatDataGridState';

/**
 * Gutter columns. These are CSS width strings because they are written straight
 * into `style`; the numeric `*_LEFT` offsets below are the same values as numbers,
 * used for sticky positioning arithmetic.
 */
export const CHECKBOX_COLUMN_WIDTH = '50px';
export const DETAIL_COLUMN_WIDTH = '40px';
export const REORDER_COLUMN_WIDTH = '32px';
export const CHECKBOX_COLUMN_PX = 50;
export const DETAIL_COLUMN_PX = 40;
export const REORDER_COLUMN_PX = 32;

/**
 * Floor for an interactive resize when the column declares no `minWidth`.
 *
 * Derived, not guessed: a header cell spends ~136px on chrome before any text -- 24px of
 * cell padding, a 16px drag grip, a 52px sort/filter/menu cluster, and 44px of button
 * padding plus the sort arrow. A floor below that renders the label at zero width, which
 * reads as an empty column rather than a truncated one. 176 leaves ~40px, enough for a
 * couple of characters and the ellipsis, and keeps the resize handle grabbable.
 *
 * A column that genuinely needs to go narrower sets its own `colDef.minWidth`, which
 * always wins over this value.
 */
export const MIN_RESIZE_COL_WIDTH = 176;
