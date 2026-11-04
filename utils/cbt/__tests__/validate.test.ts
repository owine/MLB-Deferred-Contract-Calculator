import { describe, expect, it } from 'vitest';
import { validate } from '../validate';
import { build, guaranteed, Y1 } from './helpers';

const errors = (input: ReturnType<typeof build>) => validate(input).filter((i) => i.severity === 'error');

describe('validate (§5.3)', () => {
  it('accepts a plain guaranteed contract', () => {
    expect(validate(build(guaranteed(3, 20)))).toEqual([]);
  });

  it('rejects non-consecutive seasons and negative amounts', () => {
    const input = build(guaranteed(2, 20));
    input.seasons[1].season = Y1 + 2;
    input.seasons[0].currentSalary = -1;
    expect(errors(input).map((e) => e.message)).toEqual(['Salary amounts cannot be negative.', 'Seasons must be consecutive.']);
  });

  it('requires at least one Guaranteed season', () => {
    expect(errors(build([{ currentSalary: 10, kind: 'club' }]))[0].message).toMatch(/Guaranteed season/);
  });

  it('F1: deferral payments must fall after the maximum term (option years included)', () => {
    const input = build([...guaranteed(2, 10), { currentSalary: 10, kind: 'club' }], {
      ilirPct: 4,
      deferral: { payments: [{ year: Y1 + 2, amount: 1 }], attribution: 'sequential', statedInterestPct: 0 },
    });
    expect(errors(input).some((e) => e.rule === 'F1')).toBe(true);
  });

  it('F1 scope: a signing-bonus installment inside a possible option year is rejected', () => {
    const input = build([...guaranteed(2, 10), { currentSalary: 10, kind: 'club' }], {
      signingBonus: { amount: 4, payments: [{ year: Y1, amount: 2 }, { year: Y1 + 2, amount: 2 }] },
    });
    expect(errors(input).some((e) => e.rule === 'F1')).toBe(true);
  });

  it('D2: ILIR required when there is deferred compensation', () => {
    const input = build([{ currentSalary: 5, deferred: 5 }], { deferral: { payments: [{ year: 2030, amount: 5 }], attribution: 'sequential', statedInterestPct: 0 } });
    expect(errors(input).some((e) => e.rule === 'D2')).toBe(true);
  });

  it('F7: at 0% interest, sequential payments that do not match the principal are an error', () => {
    const input = build([{ currentSalary: 5, deferred: 5 }], {
      ilirPct: 4,
      deferral: { payments: [{ year: 2030, amount: 4 }], attribution: 'sequential', statedInterestPct: 0 },
    });
    expect(validate(input)).toEqual([expect.objectContaining({ severity: 'error', rule: 'F7' })]);
  });

  it('F7: with stated interest, a mismatch is only a warning', () => {
    const input = build([{ currentSalary: 5, deferred: 5 }], {
      ilirPct: 6,
      deferral: { payments: [{ year: 2030, amount: 4 }], attribution: 'sequential', statedInterestPct: 3 },
    });
    expect(validate(input)).toEqual([expect.objectContaining({ severity: 'warning', rule: 'F7' })]);
  });

  it('F7: unattributed mode at 0% requires payments to equal the principal', () => {
    const input = build(guaranteed(2, 5), {
      ilirPct: 4,
      deferral: { payments: [{ year: 2030, amount: 10 }], attribution: 'unattributed', statedInterestPct: 0, unattributedPrincipal: 6 },
    });
    expect(errors(input).some((e) => e.rule === 'F7')).toBe(true);
  });

  it('Y4: the season right after an opt-out must be a guaranteed row', () => {
    const input = build([...guaranteed(2, 20), { currentSalary: 25, kind: 'club' }], { optOuts: [{ afterSeason: Y1 + 1, payment: 0 }] });
    expect(errors(input).some((e) => e.rule === 'Y4')).toBe(true);
  });

  it('END: a guaranteed row may not follow an option row', () => {
    const input = build([{ currentSalary: 20 }, { currentSalary: 15, kind: 'player', buyout: 14 }, { currentSalary: 20 }]);
    expect(errors(input).some((e) => e.rule === 'END')).toBe(true);
  });

  it('D2: ILIR is not required without deferred compensation', () => {
    expect(validate(build(guaranteed(2, 20), { ilirPct: 0 }))).toEqual([]);
  });

  it('F4b: unattributed mode requires the total principal', () => {
    const input = build(guaranteed(2, 5), { ilirPct: 4, deferral: { payments: [{ year: 2030, amount: 4 }], attribution: 'unattributed', statedInterestPct: 0 } });
    expect(errors(input).some((e) => e.rule === 'F4b')).toBe(true);
  });

  it('Y3: an opt-out must be followed by at least one season', () => {
    expect(errors(build(guaranteed(2, 20), { optOuts: [{ afterSeason: Y1 + 1, payment: 0 }] })).some((e) => e.rule === 'Y3')).toBe(true);
  });
});
