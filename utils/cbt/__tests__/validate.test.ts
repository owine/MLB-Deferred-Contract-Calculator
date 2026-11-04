import { describe, expect, it } from 'vitest';
import { defaultScenario } from '..';
import type { Scenario } from '../types';
import { validate, validateScenario } from '../validate';
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

  it('F7: sequential deferred principal with no payment schedule is an error', () => {
    const input = build([{ currentSalary: 10, deferred: 5 }], { ilirPct: 4 });
    expect(errors(input)).toEqual([expect.objectContaining({ rule: 'F7', message: 'Deferred principal needs a payment schedule.' })]);
  });

  it('rejects a non-finite salary', () => {
    const input = build([{ currentSalary: NaN }]);
    expect(errors(input).length).toBeGreaterThan(0);
  });

  it('rejects a negative option buyout', () => {
    const input = build([...guaranteed(2, 20), { currentSalary: 10, kind: 'player', buyout: -5 }]);
    expect(errors(input).map((e) => e.field)).toContain(`seasons.${Y1 + 2}.buyout`);
  });

  it('rejects a negative signing-bonus payment, even when the payments add up', () => {
    const input = build(guaranteed(2, 20), { signingBonus: { amount: 5, payments: [{ year: Y1, amount: 10 }, { year: Y1 + 1, amount: -5 }] } });
    expect(errors(input).map((e) => e.field)).toContain('signingBonus.payments');
  });

  it('rejects non-integer payment years and seasons', () => {
    const input = build([{ currentSalary: 5, deferred: 5 }], {
      ilirPct: 4,
      deferral: { payments: [{ year: Y1 + 3.5, amount: 5 }], attribution: 'sequential', statedInterestPct: 0 },
    });
    expect(errors(input).map((e) => e.field)).toContain('deferral.payments');
    const seasons = build(guaranteed(1, 5));
    seasons.seasons[0].season = Y1 + 0.5;
    expect(errors(seasons).length).toBeGreaterThan(0);
  });

  it('rejects non-finite or negative amounts across the input', () => {
    const input = build(guaranteed(3, 20), {
      ilirPct: NaN,
      signingBonus: { amount: -1, payments: [] },
      optOuts: [{ afterSeason: Y1, payment: Infinity }],
      deferral: { payments: [{ year: Y1 + 5, amount: -2 }], attribution: 'unattributed', statedInterestPct: NaN, unattributedPrincipal: -3 },
    });
    const fields = errors(input).map((e) => e.field);
    for (const f of ['ilirPct', 'signingBonus', 'optOuts', 'deferral.payments', 'deferral.statedInterestPct', 'deferral.unattributedPrincipal'])
      expect(fields).toContain(f);
  });

  it('rejects duplicate opt-outs', () => {
    const input = build(guaranteed(3, 20), { optOuts: [{ afterSeason: Y1, payment: 0 }, { afterSeason: Y1, payment: 1 }] });
    expect(errors(input).some((e) => e.field === 'optOuts' && /more than once/.test(e.message))).toBe(true);
  });

  it('F4b: per-season deferred amounts in unattributed mode are ignored (warning)', () => {
    const input = build([{ currentSalary: 5, deferred: 4 }, { currentSalary: 5 }], {
      ilirPct: 4,
      deferral: { payments: [{ year: 2030, amount: 4 }], attribution: 'unattributed', statedInterestPct: 0, unattributedPrincipal: 4 },
    });
    expect(validate(input)).toEqual([expect.objectContaining({ severity: 'warning', rule: 'F4b' })]);
  });

  it('F7: unattributed principal with no payment schedule is an error, even inside the F3 band', () => {
    const input = build(guaranteed(2, 10), {
      ilirPct: 4,
      deferral: { payments: [], attribution: 'unattributed', statedInterestPct: 3, unattributedPrincipal: 10 },
    });
    expect(errors(input)).toEqual([expect.objectContaining({ rule: 'F7', message: 'Deferred principal needs a payment schedule.' })]);
  });
});

describe('validateScenario', () => {
  const contract = build([...guaranteed(3, 20), { currentSalary: 15, kind: 'club', buyout: 1 }]);
  const scenario = (over: Partial<Scenario>): Scenario => ({ ...defaultScenario(contract), ...over });
  const messages = (sc: Scenario) => validateScenario(contract, sc).filter((i) => i.severity === 'error');

  it('accepts the default scenario', () => {
    expect(validateScenario(contract, defaultScenario(contract))).toEqual([]);
  });

  it('optOutTakenAfter must match an opt-out', () => {
    const three = build(guaranteed(3, 20));
    expect(validateScenario(three, { ...defaultScenario(three), optOutTakenAfter: Y1 })).toEqual([
      expect.objectContaining({ severity: 'error', field: 'scenario.optOutTakenAfter' }),
    ]);
  });

  it('options must name option rows, with exercised or declined', () => {
    expect(messages(scenario({ options: { [Y1]: 'exercised' } })).map((e) => e.field)).toEqual([`scenario.options.${Y1}`]);
    expect(messages(scenario({ options: { [Y1 + 3]: 'maybe' as 'exercised' } })).map((e) => e.field)).toEqual([`scenario.options.${Y1 + 3}`]);
  });

  it('earned bonuses must be in a contract season, finite and non-negative', () => {
    expect(messages(scenario({ earnedBonuses: { [Y1 + 9]: 1 } })).map((e) => e.field)).toEqual([`scenario.earnedBonuses.${Y1 + 9}`]);
    expect(messages(scenario({ earnedBonuses: { [Y1]: -1 } })).map((e) => e.field)).toEqual([`scenario.earnedBonuses.${Y1}`]);
    expect(messages(scenario({ earnedBonuses: { [Y1]: NaN } })).map((e) => e.field)).toEqual([`scenario.earnedBonuses.${Y1}`]);
  });
});
