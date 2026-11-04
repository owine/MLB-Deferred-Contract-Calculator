import { describe, expect, it } from 'vitest';
import { classify } from '../classify';
import { deferralCosts, signingBonusCost } from '../deferral';
import type { ContractInput } from '../types';
import { computeValley } from '../valley';
import { build, guaranteed, Y1 } from './helpers';

function valleyOf(input: ContractInput) {
  const classes = classify(input);
  return computeValley(input, classes, deferralCosts(input, classes), signingBonusCost(input, classes).cost);
}

describe('Valley Charge (V1–V6, V10, V11)', () => {
  it('V2/V3/V4 W4: shortfall 4 allocated 1.3333 over yrs 1–3', () => {
    const v = valleyOf(build([...guaranteed(3, 20), { currentSalary: 12, kind: 'player' }]));
    expect(v.figure).toBeCloseTo(16, 9);
    expect(v.shortfalls.get(Y1 + 3)).toBeCloseTo(4, 9);
    expect([...v.allocation.values()].map((x) => +x.toFixed(6))).toEqual([1.333333, 1.333333, 1.333333]);
  });

  it('V5 Bellinger: bonus over the pre-option years → figure 34, shortfalls 8.2/8.2/8.1, 12.25 per year', () => {
    const v = valleyOf(
      build([32.5, 32.5, 25.8, 25.8, 25.9].map((c) => ({ currentSalary: c })), {
        signingBonus: { amount: 20, payments: [] },
        optOuts: [{ afterSeason: Y1 + 1, payment: 0 }, { afterSeason: Y1 + 2, payment: 0 }],
      }),
    );
    expect(v.figure).toBeCloseTo(34, 9);
    expect([...v.shortfalls.values()].map((x) => +x.toFixed(6))).toEqual([8.2, 8.2, 8.1]);
    expect(v.allocation.get(Y1)).toBeCloseTo(12.25, 9);
    expect(v.allocation.get(Y1 + 1)).toBeCloseTo(12.25, 9);
  });

  it('V6 W17: yr 3 is not "such"; yr 4 is, with floor 14.5 → 1.5 over yrs 1–3', () => {
    const v = valleyOf(build([...guaranteed(2, 20), { currentSalary: 18, kind: 'player' }, { currentSalary: 10, kind: 'player' }]));
    expect(v.firstSuch).toBe(Y1 + 3);
    expect(v.figure).toBeCloseTo(14.5, 9);
    expect([...v.allocation.keys()]).toEqual([Y1, Y1 + 1, Y1 + 2]);
    expect(v.allocation.get(Y1 + 2)).toBeCloseTo(1.5, 9);
  });

  it('V10 W5: a non-guaranteed player option never triggers a Valley Charge', () => {
    expect(valleyOf(build([...guaranteed(3, 20), { currentSalary: 10, kind: 'player', buyout: 6 }])).firstSuch).toBeNull();
  });

  it('V11 W18: club buyout becomes Signing Bonus in the hypothetical; no Valley Charge', () => {
    const v = valleyOf(build([...guaranteed(3, 20), { currentSalary: 25, kind: 'club', buyout: 3 }], { optOuts: [{ afterSeason: Y1 + 1, payment: 0 }] }));
    expect(v.firstSuch).toBeNull();
  });
});
