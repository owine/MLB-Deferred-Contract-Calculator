// Spec §8 invariants on generated contracts (seeded, deterministic; no extra dependency).
import { describe, expect, it } from 'vitest';
import { calculate, defaultScenario, validate, type ContractInput, type Payment, type Scenario, type SeasonRow } from '..';
import { classify, isOptionRow } from '../classify';
import { build, Y1 } from './helpers';

function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32);
}

type GenRow = Partial<SeasonRow> & { currentSalary: number; deferred: number };

/**
 * Deferral schedule and signing bonus for generated rows (season j = Y1 + j). Attribution is sequential or
 * unattributed (principal = Σ deferred). Stated interest is 0, random, or exactly ILIR − 1.5 (the F3 band edge).
 * With interest, each row's principal is paid grown at the stated rate, in season order (so F4(a) retires it
 * exactly); at 0% the total is split over 1–3 yearly payments. Sometimes half the bonus is paid after the term (A7).
 */
function withMoney(rand: () => number, rows: GenRow[]): ContractInput {
  const last = Y1 + rows.length - 1;
  const ilirPct = 1 + rand() * 5;
  const pick = rand();
  const statedInterestPct = pick < 0.4 ? 0 : pick < 0.7 ? rand() * 8 : ilirPct >= 1.5 ? ilirPct - 1.5 : ilirPct + 1.5;
  const attribution = rand() < 0.5 ? ('sequential' as const) : ('unattributed' as const);
  const principal = rows.reduce((t, r) => t + r.deferred, 0);
  let payments: Payment[] = [];
  if (principal > 0 && statedInterestPct > 0) {
    let year = last;
    payments = rows.flatMap((r, j) => {
      if (r.deferred === 0) return [];
      year += 1 + Math.floor(rand() * 3);
      return [{ year, amount: r.deferred * (1 + statedInterestPct / 100) ** (year - (Y1 + j)) }];
    });
  } else if (principal > 0) {
    const k = 1 + Math.floor(rand() * 3);
    const start = last + 1 + Math.floor(rand() * 3);
    payments = Array.from({ length: k }, (_, i) => ({ year: start + i, amount: principal / k }));
  }
  const bonus = Math.round(rand() * 10);
  const a7 = bonus > 0 && rand() < 0.3;
  return build(attribution === 'unattributed' ? rows.map((r) => ({ ...r, deferred: 0 })) : rows, {
    ilirPct,
    signingBonus: {
      amount: bonus,
      payments: a7 ? [{ year: Y1, amount: bonus / 2 }, { year: last + 1 + Math.floor(rand() * 4), amount: bonus / 2 }] : [],
    },
    deferral: attribution === 'unattributed' ? { payments, attribution, statedInterestPct, unattributedPrincipal: principal } : { payments, attribution, statedInterestPct },
  });
}

/** Guaranteed years, then club options and non-guaranteed player options (no Valley Charge, V10). */
function noValleyContract(rand: () => number): ContractInput {
  const n = 2 + Math.floor(rand() * 4);
  const rows: GenRow[] = Array.from({ length: n }, () => ({ currentSalary: Math.round(5 + rand() * 30), deferred: rand() < 0.3 ? Math.round(rand() * 10) : 0 }));
  const opts: GenRow[] = Array.from({ length: Math.floor(rand() * 3) }, () => {
    const salary = Math.round(5 + rand() * 30);
    const deferred = rand() < 0.3 ? Math.round(rand() * 10) : 0;
    return rand() < 0.5
      ? { currentSalary: salary, deferred, kind: 'club' as const, buyout: Math.round(rand() * 5) }
      : { currentSalary: salary, deferred, kind: 'player' as const, buyout: Math.round(salary * 0.5) + 1 }; // > 50% → not guaranteed
  });
  return withMoney(rand, [...rows, ...opts]);
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
      // Small deferrals on the pre-opt-out years only, so the post years stay below the Valley figure.
      const rows: GenRow[] = [
        ...Array.from({ length: pre }, () => ({ currentSalary: high, deferred: rand() < 0.4 ? Math.round(rand() * 3) : 0 })),
        ...Array.from({ length: post }, () => ({ currentSalary: high * (0.3 + rand() * 0.4), deferred: 0 })),
      ];
      const input = { ...withMoney(rand, rows), optOuts: [{ afterSeason: Y1 + pre - 1, payment: 0 }] };
      expect(validate(input).filter((v) => v.severity === 'error')).toEqual([]);
      const stays = calculate(input, defaultScenario(input));
      expect(stays.totals.cbt).toBeCloseTo(stays.totals.attributedCost, 6);
      const leaves = calculate(input, { ...defaultScenario(input), optOutTakenAfter: Y1 + pre - 1 });
      const valley = leaves.charges.filter((c) => c.kind === 'valley').reduce((s, c) => s + c.amount, 0);
      expect(valley).toBeGreaterThan(0);
      expect(leaves.totals.cbt - leaves.totals.attributedCost).toBeCloseTo(valley, 6);
    }
  });

  it('general: CBT − attributed cost = Valley charges (V4) + Valley credits (V7), across opt-outs, deferrals and player options', () => {
    const rand = rng(7);
    let checked = 0;
    for (let i = 0; i < 300; i++) {
      // Guaranteed rows first, then trailing player and club options (END validation); an opt-out sits inside the guaranteed rows.
      const g = 2 + Math.floor(rand() * 4);
      const p = Math.floor(rand() * 3);
      const n = g + p;
      const rows: GenRow[] = Array.from({ length: n }, (_, j) => {
        const salary = Math.round(5 + rand() * 30);
        const deferred = rand() < 0.3 ? Math.round(rand() * 10) : 0;
        if (j >= g && rand() < 0.4) return { currentSalary: salary, deferred, kind: 'club' as const, buyout: rand() < 0.5 ? Math.round(rand() * 5) : 0 };
        if (j >= g) return { currentSalary: salary, deferred, kind: 'player' as const, buyout: rand() < 0.5 ? Math.round(rand() * salary) : 0 };
        return { currentSalary: salary, deferred };
      });
      const optOutAfter = g >= 2 && rand() < 0.6 ? Y1 + Math.floor(rand() * (g - 1)) : null;
      const input = {
        ...withMoney(rand, rows),
        optOuts: optOutAfter === null ? [] : [{ afterSeason: optOutAfter, payment: Math.round(rand() * 5) }],
      };
      expect(validate(input).filter((v) => v.severity === 'error')).toEqual([]);
      for (const sc of scenarios(input)) {
        for (const optOutTakenAfter of optOutAfter === null ? [null] : [null, optOutAfter]) {
          const r = calculate(input, { ...sc, optOutTakenAfter });
          const valley = r.charges.filter((c) => c.kind === 'valley' || c.kind === 'valleyCredit').reduce((s, c) => s + c.amount, 0);
          expect(r.totals.cbt - r.totals.attributedCost).toBeCloseTo(valley, 6);
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(500);
  });
});
