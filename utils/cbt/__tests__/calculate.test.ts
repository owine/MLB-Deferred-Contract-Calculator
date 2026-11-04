// calculate(): totals, guards and Result assembly.
import { describe, expect, it } from 'vitest';
import { validate } from '..';
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
});
