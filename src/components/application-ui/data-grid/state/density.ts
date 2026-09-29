export const DENSITIES = ['compact', 'standard', 'comfortable'] as const;

export type GridDensity = (typeof DENSITIES)[number];

/**
 * Row heights in px. `standard` is 44 to match upstream's default `rowHeight`,
 * so switching a grid to density-driven heights changes nothing by default.
 */
const ROW_HEIGHTS: Record<GridDensity, number> = {
  compact: 36,
  standard: 44,
  comfortable: 60,
};

const CELL_PADDING: Record<GridDensity, string> = {
  compact: 'px-2 py-1',
  standard: 'px-3 py-2',
  comfortable: 'px-4 py-3',
};

/** Orderbahn persists density as a number; these are the three points we render. */
const FACTORS: Record<GridDensity, number> = {
  compact: 0.7,
  standard: 1,
  comfortable: 1.3,
};

export function densityRowHeight(density: GridDensity): number {
  return ROW_HEIGHTS[density];
}

export function densityCellPadding(density: GridDensity): string {
  return CELL_PADDING[density];
}

export function densityToFactor(density: GridDensity): number {
  return FACTORS[density];
}

export function factorToDensity(factor: number | null | undefined): GridDensity {
  if (factor == null || !Number.isFinite(factor)) return 'standard';
  return DENSITIES.reduce<GridDensity>(
    (best, density) =>
      Math.abs(FACTORS[density] - factor) < Math.abs(FACTORS[best] - factor) ? density : best,
    'standard',
  );
}
