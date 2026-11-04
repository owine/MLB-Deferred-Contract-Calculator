import { describe, expect, it } from 'vitest';
import { classify } from '../classify';
import { deferralCosts, signingBonusCost, withinStatedBand } from '../deferral';
import { build, guaranteed, Y1 } from './helpers';

const w7 = (ilirPct: number) =>
  build(
    [
      { currentSalary: 5, deferred: 5 },
      { currentSalary: 5, deferred: 5 },
    ],
    { ilirPct, deferral: { payments: [{ year: 2029, amount: 5 }, { year: 2030, amount: 5 }], attribution: 'sequential', statedInterestPct: 0 } },
  );

describe('deferral cost (F3–F7)', () => {
  it('F6 the 1.5-point band is inclusive', () => {
    expect(withinStatedBand(0, 1.5)).toBe(true);
    expect(withinStatedBand(0, 1.51)).toBe(false);
  });

  it('F3 W7: 0% deferral with ILIR 1.2% counts at stated value', () => {
    const input = w7(1.2);
    const d = deferralCosts(input, classify(input));
    expect(d.costBySeason.get(Y1)).toBeCloseTo(5, 9);
    expect(d.costBySeason.get(Y1 + 1)).toBeCloseTo(5, 9);
  });

  it('F3/F5 W7: ILIR 2.0% discounts each payment 3 whole years', () => {
    const input = w7(2.0);
    const d = deferralCosts(input, classify(input));
    expect(d.costBySeason.get(Y1)).toBeCloseTo(5 / 1.02 ** 3, 9);
    expect(d.costBySeason.get(Y1 + 1)).toBeCloseTo(5 / 1.02 ** 3, 9);
  });

  it('F4a sequential: first-earned principal is paid first, splitting payments (Scherzer shape)', () => {
    const input = build([{ currentSalary: 0, deferred: 35 }, { currentSalary: 0, deferred: 35 }], {
      ilirPct: 1.85,
      deferral: { payments: [0, 1, 2, 3, 4].map((i) => ({ year: 2030 + i, amount: 14 })), attribution: 'sequential', statedInterestPct: 0 },
    });
    const d = deferralCosts(input, classify(input));
    const first = d.pieces.filter((p) => p.season === Y1).map((p) => [p.year, p.cash]);
    expect(first).toEqual([[2030, 14], [2031, 14], [2032, 7]]);
    expect(d.unpaidPrincipal).toBeCloseTo(0, 9);
  });

  it('F7 stated interest outside the band: principal grows at the stated rate, cash is discounted at the ILIR', () => {
    const input = build([{ currentSalary: 0, deferred: 100 }], {
      ilirPct: 6,
      deferral: { payments: [{ year: 2030, amount: 100 * 1.03 ** 4 }], attribution: 'sequential', statedInterestPct: 3 },
    });
    const d = deferralCosts(input, classify(input));
    expect(d.costBySeason.get(Y1)).toBeCloseTo((100 * 1.03 ** 4) / 1.06 ** 4, 9);
    expect(d.unpaidPrincipal).toBeCloseTo(0, 9);
    expect(d.excessCash).toBeCloseTo(0, 9);
  });

  it('F4b unattributed: principal spread equally over Guaranteed Years, payments split equally', () => {
    const input = build(guaranteed(2, 0), {
      ilirPct: 4,
      deferral: { payments: [{ year: 2030, amount: 10 }], attribution: 'unattributed', statedInterestPct: 0, unattributedPrincipal: 10 },
    });
    const d = deferralCosts(input, classify(input));
    expect(d.costBySeason.get(Y1)).toBeCloseTo(5 / 1.04 ** 4, 9);
    expect(d.costBySeason.get(Y1 + 1)).toBeCloseTo(5 / 1.04 ** 3, 9);
  });

  it('A2 in-term signing-bonus installments count at nominal; A7 after-term installments are discounted', () => {
    const input = build(guaranteed(2, 10), {
      ilirPct: 5,
      signingBonus: { amount: 6, payments: [{ year: Y1, amount: 2 }, { year: 2030, amount: 4 }] },
    });
    const b = signingBonusCost(input, classify(input));
    expect(b.cost).toBeCloseTo(2 + 2 / 1.05 ** 4 + 2 / 1.05 ** 3, 9);
    expect(b.deferredPieces).toHaveLength(2);
  });
});
