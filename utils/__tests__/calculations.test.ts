// Characterization tests for the existing calculator (replaced by utils/cbt in a later PR).
import { describe, expect, it } from 'vitest';
import { calculateContract, calculatePresentValue } from '../calculations';

describe('existing calculations.ts', () => {
  it('calculatePresentValue discounts FV / (1 + r)^n', () => {
    expect(calculatePresentValue(100, 2, 10)).toBeCloseTo(82.6446281, 6);
  });

  it('Ohtani preset: current app spreads every payment over all seasons → $46,769,026 (spec §2.4.1)', () => {
    const r = calculateContract({ totalValue: 700e6, years: 10, deferralAmount: 680e6, deferralStartYear: 1, payoutDuration: 10, interestRate: 4.43 });
    expect(Math.round(r.cbtAAV)).toBe(46_769_026);
  });
});
