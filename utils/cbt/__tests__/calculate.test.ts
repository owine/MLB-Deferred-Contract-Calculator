// calculate(): totals, guards and Result assembly.
import { describe, expect, it } from 'vitest';
import { calculate, defaultScenario, validate } from '..';
import { build, guaranteed, Y1 } from './helpers';
import { run } from './run';

describe('calculate', () => {
  it('attributedCost uses the AAV cost basis (unattributed, F3 band: principal / Guaranteed Years)', () => {
    const input = build(guaranteed(2, 10), {
      ilirPct: 4,
      deferral: { payments: [{ year: Y1 + 5, amount: 12 }], attribution: 'unattributed', statedInterestPct: 3, unattributedPrincipal: 10 },
    });
    expect(validate(input).filter((i) => i.severity === 'error')).toEqual([]);
    const r = run(input);
    expect(r.totals.cbt).toBeCloseTo(30, 9);
    expect(r.totals.attributedCost).toBeCloseTo(r.totals.cbt, 9);
  });

  it('throws on input errors, listing their messages', () => {
    const input = build([{ currentSalary: 10, deferred: 5 }], { ilirPct: 4 });
    expect(() => calculate(input, defaultScenario(input))).toThrow(/Deferred principal needs a payment schedule/);
  });

  it('throws on scenario errors', () => {
    const input = build(guaranteed(3, 20));
    expect(() => calculate(input, { ...defaultScenario(input), optOutTakenAfter: Y1 })).toThrow(/opt-out/i);
  });

  it('does not throw on warnings', () => {
    const input = build([{ currentSalary: 5, deferred: 5 }], {
      ilirPct: 6,
      deferral: { payments: [{ year: 2030, amount: 4 }], attribution: 'sequential', statedInterestPct: 3 },
    });
    expect(validate(input).map((i) => i.severity)).toEqual(['warning']);
    expect(() => calculate(input, defaultScenario(input))).not.toThrow();
  });
});
