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

  describe('charge kinds', () => {
    const kinds = (r: ReturnType<typeof run>) => r.charges.map((c) => c.kind);
    it('aav, option (O1 and its O2 deduction)', () => {
      const input = build([...guaranteed(2, 20), { currentSalary: 25, kind: 'club', buyout: 2 }]);
      expect(kinds(run(input, { options: { [Y1 + 2]: 'exercised' } }))).toEqual(['aav', 'aav', 'option', 'option']);
    });
    it('valley, valleyCredit, trueUp', () => {
      const input = build([...guaranteed(3, 20), { currentSalary: 12, kind: 'player' }]);
      expect(kinds(run(input))).toEqual(['aav', 'aav', 'aav', 'aav', 'valleyCredit', 'valley', 'valley', 'valley']);
      expect(kinds(run(input, { options: { [Y1 + 3]: 'declined' } }))).toEqual(['aav', 'aav', 'aav', 'valley', 'valley', 'valley', 'trueUp']);
    });
    it('O6 is option; O4 paid and O2 on a void season are buyout; B1 is bonus', () => {
      const w16 = build([...guaranteed(4, 20), { currentSalary: 25, kind: 'club', buyout: 2 }, { currentSalary: 4, kind: 'player', buyout: 3 }]);
      const ex = run(w16, { options: { [Y1 + 4]: 'exercised', [Y1 + 5]: 'exercised' } });
      expect(ex.charges.filter((c) => c.season === Y1 + 5).map((c) => c.kind)).toEqual(['option']);
      const dec = run(w16, { options: { [Y1 + 4]: 'declined' } });
      expect(dec.charges.filter((c) => c.season >= Y1 + 4).map((c) => [c.kind, c.amount])).toEqual([
        ['buyout', 2],
        ['buyout', -3],
      ]);
      expect(kinds(run(build(guaranteed(1, 20)), { earnedBonuses: { [Y1]: 1 } }))).toEqual(['aav', 'bonus']);
    });
  });

  it('O7 true-ups each get their own rules array', () => {
    const input = build(guaranteed(4, 20), { optOuts: [{ afterSeason: Y1 + 1, payment: 0 }] });
    const ups = run(input, { optOutTakenAfter: Y1 + 1 }).charges.filter((c) => c.kind === 'trueUp');
    expect(ups).toHaveLength(2);
    expect(ups[0].rules).toEqual(ups[1].rules);
    expect(ups[0].rules).not.toBe(ups[1].rules);
  });

  describe('AAV charge rules', () => {
    const aavRules = (r: ReturnType<typeof run>) => r.charges.find((c) => c.kind === 'aav')!.rules;
    const F = ['F2', 'F3', 'F4a', 'F5', 'F7'];
    it('carry the F-rules when a Guaranteed season has deferred cost', () => {
      const input = build([{ currentSalary: 5, deferred: 5 }], {
        ilirPct: 4,
        deferral: { payments: [{ year: Y1 + 3, amount: 5 }], attribution: 'sequential', statedInterestPct: 0 },
      });
      expect(aavRules(run(input))).toEqual(['A1', 'A2', ...F]);
    });
    it('carry no F-rules when only an option year has deferred cost', () => {
      const input = build([...guaranteed(1, 10), { currentSalary: 5, deferred: 5, kind: 'club' }], {
        ilirPct: 5,
        deferral: { payments: [{ year: Y1 + 4, amount: 5 }], attribution: 'sequential', statedInterestPct: 0 },
      });
      expect(aavRules(run(input, { options: { [Y1 + 1]: 'exercised' } }))).toEqual(['A1', 'A2']);
    });
    it('carry A7 when a signing-bonus installment falls after the term', () => {
      const input = build(guaranteed(2, 10), { ilirPct: 4, signingBonus: { amount: 4, payments: [{ year: Y1 + 4, amount: 4 }] } });
      expect(aavRules(run(input))).toEqual(['A1', 'A2', 'A7']);
    });
  });

  describe('option charge rules', () => {
    const F = ['F2', 'F3', 'F4a', 'F5', 'F7'];
    const flagged = (r: ReturnType<typeof run>) => r.flags.map((f) => f.rule);
    it('an exercised club option with the only deferral carries the F-rules and flags them; declined does not', () => {
      const input = build([...guaranteed(1, 10), { currentSalary: 5, deferred: 5, kind: 'club' }], {
        ilirPct: 5,
        deferral: { payments: [{ year: Y1 + 4, amount: 5 }], attribution: 'sequential', statedInterestPct: 0 },
      });
      const ex = run(input, { options: { [Y1 + 1]: 'exercised' } });
      expect(ex.charges.find((c) => c.kind === 'option')!.rules).toEqual(['O1', ...F]);
      expect(flagged(ex)).toEqual(expect.arrayContaining(['F4a', 'F5', 'F7']));
      const dec = run(input, { options: { [Y1 + 1]: 'declined' } });
      for (const r of ['F4a', 'F5', 'F7']) expect(flagged(dec)).not.toContain(r);
    });
    it('O6 player-option charges carry the F-rules when a season in the group has deferred cost', () => {
      const input = build([...guaranteed(1, 20), { currentSalary: 10, deferred: 4, kind: 'player', buyout: 6 }, { currentSalary: 10, kind: 'player', buyout: 6 }], {
        ilirPct: 5,
        deferral: { payments: [{ year: Y1 + 5, amount: 4 }], attribution: 'sequential', statedInterestPct: 0 },
      });
      const o6 = run(input).charges.filter((c) => c.kind === 'option' && c.label === 'Exercised player option');
      expect(o6).toHaveLength(2);
      for (const c of o6) expect(c.rules).toEqual(expect.arrayContaining(F));
      expect(run(build([...guaranteed(1, 20), { currentSalary: 10, kind: 'player', buyout: 6 }])).charges.find((c) => c.kind === 'option' && c.label === 'Exercised player option')!.rules).not.toContain('F2');
    });
  });
});
