// Spec §8 invariants on generated contracts (seeded, deterministic; no extra dependency).
import { describe, expect, it } from 'vitest';
import { calculate, defaultScenario, validate, type ContractInput, type Scenario } from '..';
import { classify, isOptionRow } from '../classify';
import { build, Y1 } from './helpers';

function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32);
}

/** Guaranteed years, then club options and non-guaranteed player options (no Valley Charge, V10). */
function noValleyContract(rand: () => number): ContractInput {
  const n = 2 + Math.floor(rand() * 4);
  const rows = Array.from({ length: n }, () => ({ currentSalary: Math.round(5 + rand() * 30), deferred: rand() < 0.3 ? Math.round(rand() * 10) : 0 }));
  const opts = Array.from({ length: Math.floor(rand() * 3) }, () => {
    const salary = Math.round(5 + rand() * 30);
    return rand() < 0.5
      ? { currentSalary: salary, kind: 'club' as const, buyout: Math.round(rand() * 5) }
      : { currentSalary: salary, kind: 'player' as const, buyout: Math.round(salary * 0.5) + 1 }; // > 50% → not guaranteed
  });
  const deferredTotal = rows.reduce((s, r) => s + r.deferred, 0);
  const last = Y1 + n + opts.length - 1;
  return build([...rows, ...opts], {
    ilirPct: 1 + rand() * 5,
    signingBonus: { amount: Math.round(rand() * 10), payments: [] },
    deferral: { payments: deferredTotal > 0 ? [{ year: last + 3, amount: deferredTotal }] : [], attribution: 'sequential', statedInterestPct: 0 },
  });
}

/** Every combination of option decisions. */
function scenarios(input: ContractInput): Scenario[] {
  const optionSeasons = classify(input).filter(isOptionRow).map((c) => c.season);
  return Array.from({ length: 2 ** optionSeasons.length }, (_, mask) => ({
    ...defaultScenario(input),
    options: Object.fromEntries(optionSeasons.map((s, i) => [s, mask & (1 << i) ? 'exercised' : 'declined'])),
  }));
}

describe('invariants', () => {
  it('without a Valley Charge, total CBT equals total attributed cost in every scenario', () => {
    const rand = rng(20261104);
    for (let i = 0; i < 300; i++) {
      const input = noValleyContract(rand);
      expect(validate(input).filter((v) => v.severity === 'error')).toEqual([]);
      for (const sc of scenarios(input)) {
        const r = calculate(input, sc);
        expect(r.totals.cbt).toBeCloseTo(r.totals.attributedCost, 6);
      }
    }
  });

  it('with a Valley Charge: zero difference if the player stays (V7), the full Valley amount if he opts out (V8)', () => {
    const rand = rng(42);
    for (let i = 0; i < 200; i++) {
      const pre = 1 + Math.floor(rand() * 3);
      const post = 1 + Math.floor(rand() * 3);
      const high = 20 + rand() * 20;
      const rows = [
        ...Array.from({ length: pre }, () => ({ currentSalary: high })),
        ...Array.from({ length: post }, () => ({ currentSalary: high * (0.3 + rand() * 0.4) })),
      ];
      const input = build(rows, { signingBonus: { amount: Math.round(rand() * 20), payments: [] }, optOuts: [{ afterSeason: Y1 + pre - 1, payment: 0 }] });
      const stays = calculate(input, defaultScenario(input));
      expect(stays.totals.cbt).toBeCloseTo(stays.totals.attributedCost, 6);
      const leaves = calculate(input, { ...defaultScenario(input), optOutTakenAfter: Y1 + pre - 1 });
      const valley = leaves.charges.filter((c) => c.rules.includes('V4')).reduce((s, c) => s + c.amount, 0);
      expect(valley).toBeGreaterThan(0);
      expect(leaves.totals.cbt - leaves.totals.attributedCost).toBeCloseTo(valley, 6);
    }
  });

  it('general: CBT − attributed cost = Valley charges (V4) + Valley credits (V7), across opt-outs, deferrals and player options', () => {
    const rand = rng(7);
    let checked = 0;
    for (let i = 0; i < 300; i++) {
      // Guaranteed rows first, then trailing player options (END validation); an opt-out sits inside the guaranteed rows.
      const g = 2 + Math.floor(rand() * 4);
      const p = Math.floor(rand() * 3);
      const n = g + p;
      const rows = Array.from({ length: n }, (_, j) => {
        const salary = Math.round(5 + rand() * 30);
        const deferred = rand() < 0.3 ? Math.round(rand() * 10) : 0;
        if (j >= g) return { currentSalary: salary, deferred, kind: 'player' as const, buyout: rand() < 0.5 ? Math.round(rand() * salary) : 0 };
        return { currentSalary: salary, deferred };
      });
      const optOutAfter = g >= 2 && rand() < 0.6 ? Y1 + Math.floor(rand() * (g - 1)) : null;
      const deferredTotal = rows.reduce((s, r) => s + r.deferred, 0);
      const input = build(rows, {
        ilirPct: 1 + rand() * 5,
        signingBonus: { amount: Math.round(rand() * 10), payments: [] },
        optOuts: optOutAfter === null ? [] : [{ afterSeason: optOutAfter, payment: Math.round(rand() * 5) }],
        deferral: { payments: deferredTotal > 0 ? [{ year: Y1 + n + 2, amount: deferredTotal }] : [], attribution: 'sequential', statedInterestPct: 0 },
      });
      expect(validate(input).filter((v) => v.severity === 'error')).toEqual([]);
      for (const sc of scenarios(input)) {
        for (const optOutTakenAfter of optOutAfter === null ? [null] : [null, optOutAfter]) {
          const r = calculate(input, { ...sc, optOutTakenAfter });
          const valley = r.charges.filter((c) => c.rules.includes('V4') || c.rules.includes('V7')).reduce((s, c) => s + c.amount, 0);
          expect(r.totals.cbt - r.totals.attributedCost).toBeCloseTo(valley, 6);
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(500);
  });
});
