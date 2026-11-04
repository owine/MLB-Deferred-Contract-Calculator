// Spec §8 worked examples W1–W13, W16–W18 ($M; yr 1 = 2026). W14/W15 are in presets.test.ts.
import { describe, expect, it } from 'vitest';
import { build, guaranteed, Y1 } from './helpers';
import { run, yr } from './run';

const close = (actual: number, expected: number) => expect(actual).toBeCloseTo(expected, 6);

describe('worked examples', () => {
  it('W1 A1: 5 × 20 guaranteed', () => {
    const r = run(build(guaranteed(5, 20)));
    close(r.aavAtSigning, 20);
    close(r.totals.cbt, 100);
    close(r.totals.cash, 100);
  });

  it('W2 A1/A2: front-loaded 30, 30, 20 + 6 signing bonus', () => {
    const r = run(build([{ currentSalary: 30 }, { currentSalary: 30 }, { currentSalary: 20 }], { signingBonus: { amount: 6, payments: [] } }));
    close(r.aavAtSigning, 86 / 3);
  });

  describe('W3 A3/O1/O2/O3: club option 25, buyout 2', () => {
    const input = build([...guaranteed(4, 20), { currentSalary: 25, kind: 'club', buyout: 2 }]);
    it('AAV includes the buyout', () => close(run(input).aavAtSigning, 20.5));
    it('exercised: yr 5 = 25 − 2', () => {
      const r = run(input, { options: { [Y1 + 4]: 'exercised' } });
      close(yr(r, 5), 23);
      close(r.totals.cbt, 105);
      close(r.totals.cash, 105);
    });
    it('declined: nothing in yr 5', () => {
      const r = run(input, { options: { [Y1 + 4]: 'declined' } });
      close(yr(r, 5), 0);
      close(r.totals.cbt, 82);
      close(r.totals.cash, 82);
    });
  });

  describe('W4 V4/V7/O7/V8: guaranteed player option 12', () => {
    const input = build([...guaranteed(3, 20), { currentSalary: 12, kind: 'player' }]);
    it('AAV 18; Valley 4 → 19.3333 in yrs 1–3', () => {
      const r = run(input);
      close(r.aavAtSigning, 18);
      close(yr(r, 1), 18 + 4 / 3);
    });
    it('exercised: yr 4 = 18 − 4; total = cash', () => {
      const r = run(input);
      close(yr(r, 4), 14);
      close(r.totals.cbt, 72);
    });
    it('declined: +6 true-up in yr 4; total 64 vs cash 60; O8 not flagged without deferrals', () => {
      const r = run(input, { options: { [Y1 + 3]: 'declined' } });
      close(yr(r, 4), 6);
      close(r.totals.cbt, 64);
      close(r.totals.cash, 60);
      expect(r.flags.map((f) => f.rule)).not.toContain('O8');
    });
  });

  describe('W5 A3/O6/O3/V10: non-guaranteed player option 10, buyout 6', () => {
    const input = build([...guaranteed(3, 20), { currentSalary: 10, kind: 'player', buyout: 6 }]);
    it('AAV 22, no Valley Charge', () => {
      const r = run(input);
      close(r.aavAtSigning, 22);
      close(yr(r, 1), 22);
    });
    it('exercised: yr 4 = 10 − 6 (O6, no O2)', () => {
      const r = run(input);
      close(yr(r, 4), 4);
      close(r.totals.cbt, 70);
    });
    it('declined: total 66 = cash', () => {
      const r = run(input, { options: { [Y1 + 3]: 'declined' } });
      close(r.totals.cbt, 66);
      close(r.totals.cash, 66);
    });
    it('V10 is flagged: the non-guaranteed option year was excluded from the Valley test', () => {
      expect(run(input).flags.map((f) => f.rule)).toContain('V10');
    });
  });

  describe('W6 Y3/O6: failing opt-out (payment 25)', () => {
    const input = build(guaranteed(5, 20), { optOuts: [{ afterSeason: Y1 + 2, payment: 25 }] });
    it('AAV 28.3333', () => close(run(input).aavAtSigning, 85 / 3));
    it('stays: yrs 4–5 = 7.5 each; total 100 = cash', () => {
      const r = run(input);
      close(yr(r, 4), 7.5);
      close(yr(r, 5), 7.5);
      close(r.totals.cbt, 100);
      close(r.totals.cash, 100);
    });
    it('opts out: total 85 = cash', () => {
      const r = run(input, { optOutTakenAfter: Y1 + 2 });
      close(r.totals.cbt, 85);
      close(r.totals.cash, 85);
    });
  });

  describe('W8 A4/O4: club options with buyouts 2 and 3', () => {
    const input = build([...guaranteed(4, 20), { currentSalary: 25, kind: 'club', buyout: 2 }, { currentSalary: 26, kind: 'club', buyout: 3 }]);
    it('only the earliest buyout enters the AAV', () => close(run(input).aavAtSigning, 20.5));
    it('yr 5 exercised, yr 6 declined: yr 6 = 3 (O4); total 108', () => {
      const r = run(input, { options: { [Y1 + 4]: 'exercised', [Y1 + 5]: 'declined' } });
      close(yr(r, 5), 23);
      close(yr(r, 6), 3);
      close(r.totals.cbt, 108);
      close(r.totals.cash, 108);
    });
    it('END: yr 5 declined ends the contract: total 82', () => {
      const r = run(input, { options: { [Y1 + 4]: 'declined' } });
      close(r.totals.cbt, 82);
      close(r.totals.cash, 82);
    });
  });

  it('W9 B1/A6: 0.5 earned in yr 2 is outside the AAV', () => {
    const r = run(build(guaranteed(5, 20)), { earnedBonuses: { [Y1 + 1]: 0.5 } });
    close(r.aavAtSigning, 20);
    close(yr(r, 2), 20.5);
  });

  describe('Bellinger shape (W11–W13): 32.5, 32.5, 25.8, 25.8, 25.9; bonus 20; opt-outs after yrs 2 and 3', () => {
    const input = build([32.5, 32.5, 25.8, 25.8, 25.9].map((c) => ({ currentSalary: c })), {
      signingBonus: { amount: 20, payments: [] },
      optOuts: [
        { afterSeason: Y1 + 1, payment: 0 },
        { afterSeason: Y1 + 2, payment: 0 },
      ],
    });
    it('W12 no opt-out: 44.75, 44.75, then 24.3333 × 3; total 162.5', () => {
      const r = run(input);
      close(yr(r, 1), 44.75);
      close(yr(r, 2), 44.75);
      for (const n of [3, 4, 5]) close(yr(r, n), 32.5 - 24.5 / 3);
      close(r.totals.cbt, 162.5);
    });
    it('W11 opt-out after yr 2: true-up 20 over yrs 3–5; total 109.5 vs cash 85', () => {
      const r = run(input, { optOutTakenAfter: Y1 + 1 });
      for (const n of [3, 4, 5]) close(yr(r, n), 20 / 3);
      close(r.totals.cbt, 109.5);
      close(r.totals.cash, 85);
      expect(r.flags.map((f) => f.rule)).toContain('V8');
    });
    it('W13 V7/V9 opt-out after yr 3: yr 3 = 24.3; true-up 13.3 over yrs 4–5; total 127.1', () => {
      const r = run(input, { optOutTakenAfter: Y1 + 2 });
      close(yr(r, 3), 24.3);
      close(yr(r, 4), 6.65);
      close(r.totals.cbt, 127.1);
      close(r.totals.cash, 110.8);
      expect(r.flags.map((f) => f.rule)).toContain('V9');
    });
  });

  describe('W16 A5/O2/O4b/O6: club option yr 5 buyout 2 + non-guaranteed player option yr 6 buyout 3', () => {
    const input = build([...guaranteed(4, 20), { currentSalary: 25, kind: 'club', buyout: 2 }, { currentSalary: 4, kind: 'player', buyout: 3 }]);
    it('higher buyout is the Signing Bonus; A5 flagged', () => {
      const r = run(input);
      close(r.aavAtSigning, 20.75);
      expect(r.flags.map((f) => f.rule)).toContain('A5');
    });
    it('yr 5 + yr 6 exercised: 109 = cash', () => {
      const r = run(input, { options: { [Y1 + 4]: 'exercised', [Y1 + 5]: 'exercised' } });
      close(yr(r, 5), 25);
      close(yr(r, 6), 1);
      close(r.totals.cbt, 109);
      close(r.totals.cash, 109);
    });
    it('yr 5 exercised, yr 6 declined: 108 = cash', () => {
      const r = run(input, { options: { [Y1 + 4]: 'exercised', [Y1 + 5]: 'declined' } });
      close(yr(r, 6), 0);
      close(r.totals.cbt, 108);
      close(r.totals.cash, 108);
    });
    it('yr 5 declined: +2 (O4b) in yr 5, −3 (O2) in yr 6; 82 = cash', () => {
      const r = run(input, { options: { [Y1 + 4]: 'declined' } });
      close(yr(r, 5), 2);
      close(yr(r, 6), -3);
      close(r.totals.cbt, 82);
      close(r.totals.cash, 82);
    });
  });

  describe('W17 V6/V7: player options 18 (yr 3) and 10 (yr 4)', () => {
    const input = build([...guaranteed(2, 20), { currentSalary: 18, kind: 'player' }, { currentSalary: 10, kind: 'player' }]);
    it('both exercised: yrs 1–3 = 18.5, yr 4 = 12.5', () => {
      const r = run(input);
      close(r.aavAtSigning, 17);
      for (const n of [1, 2, 3]) close(yr(r, n), 18.5);
      close(yr(r, 4), 12.5);
      close(r.totals.cbt, 68);
    });
    it('yr 3 declined: yr 3 = 1.5 + 3, yr 4 = 3; total 44.5 vs cash 40', () => {
      const r = run(input, { options: { [Y1 + 2]: 'declined' } });
      close(yr(r, 3), 4.5);
      close(yr(r, 4), 3);
      close(r.totals.cbt, 44.5);
      close(r.totals.cash, 40);
    });
  });

  describe('W18 O2NS: opt-out after yr 2, then club option yr 4 (buyout 3)', () => {
    const input = build([...guaranteed(3, 20), { currentSalary: 25, kind: 'club', buyout: 3 }], { optOuts: [{ afterSeason: Y1 + 1, payment: 0 }] });
    it('AAV 21, no Valley Charge', () => {
      const r = run(input);
      close(r.aavAtSigning, 21);
      close(yr(r, 1), 21);
    });
    it('opt-out taken: yr 3 = −2 (O7), no O2 in yr 4; 40 = cash; O2NS and END flagged, O8 not', () => {
      const r = run(input, { optOutTakenAfter: Y1 + 1 });
      close(yr(r, 3), -2);
      close(yr(r, 4), 0);
      close(r.totals.cbt, 40);
      close(r.totals.cash, 40);
      const flagged = r.flags.map((f) => f.rule);
      expect(flagged).toEqual(expect.arrayContaining(['O2NS', 'END']));
      expect(flagged).not.toContain('O8');
    });
    it('stays, option declined: 63 = cash', () => {
      const r = run(input);
      close(r.totals.cbt, 63);
      close(r.totals.cash, 63);
    });
    it('stays, option exercised: yr 4 = 22; 85 = cash', () => {
      const r = run(input, { options: { [Y1 + 3]: 'exercised' } });
      close(yr(r, 4), 22);
      close(r.totals.cbt, 85);
      close(r.totals.cash, 85);
    });
  });

  it('F2 an option year’s deferral counts only if the option is exercised', () => {
    const input = build([...guaranteed(1, 10), { currentSalary: 5, deferred: 5, kind: 'club' }], {
      ilirPct: 5,
      deferral: { payments: [{ year: Y1 + 4, amount: 5 }], attribution: 'sequential', statedInterestPct: 0 },
    });
    const ex = run(input, { options: { [Y1 + 1]: 'exercised' } });
    close(yr(ex, 2), 5 + 5 / 1.05 ** 3);
    close(ex.totals.cash, 20);
    const dec = run(input);
    close(yr(dec, 2), 0);
    close(dec.totals.cash, 10);
  });

  it('O8 opt-out true-up values deferred pay at attributed cost', () => {
    const input = build([{ currentSalary: 10, deferred: 10 }, { currentSalary: 20 }], {
      ilirPct: 5,
      optOuts: [{ afterSeason: Y1, payment: 0 }],
      deferral: { payments: [{ year: Y1 + 3, amount: 10 }], attribution: 'sequential', statedInterestPct: 0 },
    });
    const pv = 10 / 1.05 ** 3;
    const r = run(input, { optOutTakenAfter: Y1 });
    close(r.aavAtSigning, (10 + pv + 20) / 2);
    close(yr(r, 2), 10 + pv - (10 + pv + 20) / 2);
    close(r.totals.cbt, r.totals.attributedCost);
    expect(r.flags.map((f) => f.rule)).toContain('O8');
  });

  it('D5 is flagged when a 50% test reads a season with deferred pay', () => {
    const r = run(build([...guaranteed(1, 20), { currentSalary: 0, deferred: 35, kind: 'player', buyout: 1 }], {
      ilirPct: 4,
      deferral: { payments: [{ year: Y1 + 3, amount: 35 }], attribution: 'sequential', statedInterestPct: 0 },
    }));
    expect(r.flags.map((f) => f.rule)).toContain('D5');
  });

  it('F6 is flagged when the stated rate is exactly 1.5 points from the ILIR', () => {
    const r = run(build([{ currentSalary: 5, deferred: 5 }], {
      ilirPct: 1.5,
      deferral: { payments: [{ year: Y1 + 2, amount: 5 }], attribution: 'sequential', statedInterestPct: 0 },
    }));
    expect(r.flags.map((f) => f.rule)).toEqual(expect.arrayContaining(['F6', 'X4', 'X5']));
  });

  it('V11 is flagged when a guaranteed player option buyout becomes Signing Bonus inside the floor hypothetical', () => {
    const r = run(build([...guaranteed(3, 20), { currentSalary: 12, kind: 'player', buyout: 5 }]));
    expect(r.flags.map((f) => f.rule)).toContain('V11');
    expect(run(build([...guaranteed(3, 20), { currentSalary: 12, kind: 'player' }])).flags.map((f) => f.rule)).not.toContain('V11');
  });

  it('O5 vested option is charged like an exercised club option', () => {
    const r = run(build([...guaranteed(2, 20), { currentSalary: 15, kind: 'vesting', buyout: 1 }]), { options: { [Y1 + 2]: 'exercised' } });
    close(yr(r, 3), 14);
    expect(r.flags.map((f) => f.rule)).toContain('O5');
  });
});
