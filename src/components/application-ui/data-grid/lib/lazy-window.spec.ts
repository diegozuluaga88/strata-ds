import { describe, it, expect } from 'vitest';
import { computeLazyWindow, findMissingRange } from './lazy-window';

describe('computeLazyWindow', () => {
  const base = { rowHeight: 40, viewportHeight: 400, totalRowCount: 1000, overscan: 5 };

  it('starts at index 0 when scrolled to the top', () => {
    const w = computeLazyWindow({ ...base, scrollTop: 0 });
    expect(w.startIndex).toBe(0);
    expect(w.topSpacer).toBe(0);
  });

  it('covers the viewport plus overscan on both sides', () => {
    const w = computeLazyWindow({ ...base, scrollTop: 4000 });
    // 4000/40 = row 100 at the top; 400/40 = 10 rows visible.
    expect(w.startIndex).toBe(95);
    expect(w.endIndex).toBe(115);
  });

  it('resolves an arbitrary scrollbar jump directly, without walking intermediate rows', () => {
    const w = computeLazyWindow({ ...base, scrollTop: 39960 });
    expect(w.startIndex).toBe(994);
    expect(w.endIndex).toBe(1000);
  });

  it('clamps to the dataset bounds', () => {
    const top = computeLazyWindow({ ...base, scrollTop: 0 });
    expect(top.startIndex).toBeGreaterThanOrEqual(0);
    const bottom = computeLazyWindow({ ...base, scrollTop: 999999 });
    expect(bottom.endIndex).toBeLessThanOrEqual(base.totalRowCount);
    expect(bottom.startIndex).toBeLessThanOrEqual(bottom.endIndex);
    expect(bottom.startIndex).toBeLessThanOrEqual(base.totalRowCount);
  });

  it('treats a negative overscan as zero rather than inverting the window', () => {
    const w = computeLazyWindow({ ...base, overscan: -20, scrollTop: 0 });
    expect(w.startIndex).toBe(0);
    expect(w.endIndex).toBeGreaterThanOrEqual(w.startIndex);
  });

  it('spacers plus rendered rows always equal the full scroll height', () => {
    const w = computeLazyWindow({ ...base, scrollTop: 4000 });
    const rendered = (w.endIndex - w.startIndex) * base.rowHeight;
    expect(w.topSpacer + rendered + w.bottomSpacer).toBe(base.totalRowCount * base.rowHeight);
  });

  it('renders nothing for an empty dataset', () => {
    const w = computeLazyWindow({ ...base, totalRowCount: 0, scrollTop: 0 });
    expect(w.startIndex).toBe(0);
    expect(w.endIndex).toBe(0);
    expect(w.topSpacer).toBe(0);
    expect(w.bottomSpacer).toBe(0);
  });

  it('treats a non-positive rowHeight as an empty window rather than dividing by zero', () => {
    const w = computeLazyWindow({ ...base, rowHeight: 0, scrollTop: 100 });
    expect(w.startIndex).toBe(0);
    expect(w.endIndex).toBe(0);
  });
});

describe('findMissingRange', () => {
  it('returns null when every index in the window is loaded', () => {
    expect(findMissingRange(10, 15, () => ({}))).toBeNull();
  });

  it('returns the first and last missing index when nothing is loaded', () => {
    expect(findMissingRange(10, 15, () => undefined)).toEqual({ startIndex: 10, lastIndex: 14 });
  });

  it('spans the gap when the hole sits in the middle', () => {
    const loaded = new Set([10, 11, 14]);
    expect(findMissingRange(10, 15, i => (loaded.has(i) ? {} : undefined))).toEqual({
      startIndex: 12,
      lastIndex: 13,
    });
  });

  it('re-requests loaded rows caught inside a gap rather than splitting the request', () => {
    // 12 is loaded but sits between two holes. One request spanning 11..14 is cheaper than
    // two requests either side of it, so the returned range deliberately includes it. This
    // is the trade-off the doc comment describes -- pinned here so it cannot be "corrected"
    // into several requests by accident.
    const loaded = new Set([10, 12, 15]);
    expect(findMissingRange(10, 16, i => (loaded.has(i) ? {} : undefined))).toEqual({
      startIndex: 11,
      lastIndex: 14,
    });
  });

  it('returns null for an empty window', () => {
    expect(findMissingRange(5, 5, () => undefined)).toBeNull();
  });
});
