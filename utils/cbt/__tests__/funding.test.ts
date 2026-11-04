import { describe, expect, it } from 'vitest';
import { computeFunding, FUNDING_RATE_PCT } from '../funding';

describe('Article XVI funding (X1, X2, X5)', () => {
  it('X3 the funding discount rate is 5%', () => expect(FUNDING_RATE_PCT).toBe(5));

  it('W10 X1/X4/X5: 10 earned in 2024, paid 2030', () => {
    const f = computeFunding([{ season: 2024, year: 2030, cash: 10, cost: 0 }]);
    expect(f.snapshots.map((s) => s.july1)).toEqual([2026, 2027, 2028, 2029, 2030]);
    const req = f.snapshots.map((s) => s.required);
    expect(req[0]).toBeCloseTo(10 / 1.05 ** 4, 9);
    expect(req[1]).toBeCloseTo(10 / 1.05 ** 3, 9);
    expect(req[2]).toBeCloseTo(10 / 1.05 ** 2, 9);
    expect(req[3]).toBeCloseTo(10 / 1.05, 9);
    expect(req[4]).toBe(0);
    expect(f.peak).toBeCloseTo(10 / 1.05, 9);
  });

  it('X1 nothing is required before the second July 1', () => {
    const f = computeFunding([{ season: 2030, year: 2040, cash: 10, cost: 0 }]);
    expect(f.snapshots[0].july1).toBe(2032);
  });
});
