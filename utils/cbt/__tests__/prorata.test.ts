// F4(c): each payment split across the deferral seasons in proportion to their deferred principal.
import { describe, expect, it } from 'vitest';
import { classify } from '../classify';
import { deferralCosts } from '../deferral';
import { validate } from '../validate';
import { calculate, defaultScenario } from '..';
import { build, Y1 } from './helpers';

const M = 1_000_000;

describe('F4c pro-rata attribution', () => {
  it('splits every payment across deferral seasons by principal (two seasons, 1:3)', () => {
    const input = build([{ currentSalary: 0, deferred: 10 }, { currentSalary: 0, deferred: 30 }], {
      ilirPct: 5,
      deferral: { payments: [{ year: Y1 + 3, amount: 20 }, { year: Y1 + 4, amount: 20 }], attribution: 'prorata', statedInterestPct: 0 },
    });
    const d = deferralCosts(input, classify(input));
    expect(d.costBySeason.get(Y1)).toBeCloseTo(5 / 1.05 ** 3 + 5 / 1.05 ** 4, 9);
    expect(d.costBySeason.get(Y1 + 1)).toBeCloseTo(15 / 1.05 ** 2 + 15 / 1.05 ** 3, 9);
    expect(d.unpaidPrincipal).toBeCloseTo(0, 9);
    expect(d.excessCash).toBeCloseTo(0, 9);
  });

  it('reproduces Bregman (CHC) $30,893,902 — MLBTR NPV / 5, Spotrac', () => {
    const def = [15, 10, 10, 15, 20];
    const input = build(def.map((d) => ({ currentSalary: (35 - d) * M, deferred: d * M })), {
      ilirPct: 3.87,
      deferral: { payments: Array.from({ length: 8 }, (_, i) => ({ year: 2034 + i, amount: 8.75 * M })), attribution: 'prorata', statedInterestPct: 0 },
    });
    const d = deferralCosts(input, classify(input));
    const total = 105 * M + [...d.costBySeason.values()].reduce((s, v) => s + v, 0);
    expect(Math.round(total / 5)).toBe(30_893_902);
  });

  it('at 0% interest, payments must equal the deferred principal (F7)', () => {
    const input = build([{ currentSalary: 5, deferred: 5 }], {
      ilirPct: 4,
      deferral: { payments: [{ year: 2030, amount: 4 }], attribution: 'prorata', statedInterestPct: 0 },
    });
    expect(validate(input).some((i) => i.severity === 'error' && i.rule === 'F7')).toBe(true);
  });

  it('D5 is flagged in pro-rata mode when a 50% test reads a season with deferred pay', () => {
    const input = build([{ currentSalary: 20 }, { currentSalary: 10, deferred: 5 }], {
      ilirPct: 4,
      optOuts: [{ afterSeason: Y1, payment: 0 }],
      deferral: { payments: [{ year: Y1 + 4, amount: 5 }], attribution: 'prorata', statedInterestPct: 0 },
    });
    expect(calculate(input, defaultScenario(input)).flags.map((f) => f.rule)).toContain('D5');
  });
});
