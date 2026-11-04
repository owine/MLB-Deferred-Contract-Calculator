import { describe, expect, it } from 'vitest';
import { validateScenario, type ContractInput } from '../cbt';
import { PRESETS } from '../../data/presets';
import {
  equalPayments,
  fillEvenly,
  hasDeferral,
  setLength,
  setOptOutPayment,
  setStartSeason,
  syncScenario,
  toggleOptOut,
  updateRow,
} from '../form';

const standard = () => structuredClone(PRESETS.find((p) => p.id === 'standard')!.input);
const bellinger = () => structuredClone(PRESETS.find((p) => p.id === 'bellinger')!.input);
const ohtani = () => structuredClone(PRESETS.find((p) => p.id === 'ohtani')!.input);

describe('form helpers', () => {
  it('fillEvenly splits the total across every season', () => {
    const r = fillEvenly(standard(), 150_000_000);
    expect(r.seasons.map((s) => s.currentSalary)).toEqual([30e6, 30e6, 30e6, 30e6, 30e6]);
  });

  it('fillEvenly rounds to cents and puts the remainder on the last season', () => {
    const r = fillEvenly(setLength(standard(), 3), 100_000_000);
    expect(r.seasons.map((s) => s.currentSalary)).toEqual([33_333_333.33, 33_333_333.33, 33_333_333.34]);
  });

  it('setLength adds guaranteed seasons copying the last salary, and trims opt-outs when shrinking', () => {
    const grown = setLength(standard(), 7);
    expect(grown.seasons.map((s) => s.season)).toEqual([2027, 2028, 2029, 2030, 2031, 2032, 2033]);
    expect(grown.seasons[6]).toEqual({ season: 2033, currentSalary: 20e6, deferred: 0, kind: 'guaranteed' });
    const shrunk = setLength(bellinger(), 3);
    expect(shrunk.seasons).toHaveLength(3);
    expect(shrunk.optOuts.map((o) => o.afterSeason)).toEqual([2027]);
  });

  it('setLength ignores invalid lengths and returns the same object when nothing changes', () => {
    const input = standard();
    expect(setLength(input, 0)).toBe(input);
    expect(setLength(input, 2.5)).toBe(input);
    expect(setLength(input, input.seasons.length)).toBe(input);
  });

  it('setStartSeason shifts seasons, opt-outs and payments together', () => {
    const r = setStartSeason(ohtani(), 2030);
    expect(r.seasons[0].season).toBe(2030);
    expect(r.deferral.payments[0].year).toBe(2040);
    const b = setStartSeason(bellinger(), 2030);
    expect(b.optOuts.map((o) => o.afterSeason)).toEqual([2031, 2032]);
    expect(b.signingBonus.payments.map((p) => p.year)).toEqual([2030, 2030]);
  });

  it('updateRow drops option-only fields when they no longer apply', () => {
    let r = updateRow(standard(), 2031, { kind: 'player', buyout: 2e6, guaranteedIfExercised: false });
    expect(r.seasons[4]).toMatchObject({ kind: 'player', buyout: 2e6, guaranteedIfExercised: false });
    r = updateRow(r, 2031, { kind: 'club' });
    expect(r.seasons[4]).not.toHaveProperty('guaranteedIfExercised');
    r = updateRow(r, 2031, { kind: 'guaranteed' });
    expect(r.seasons[4]).not.toHaveProperty('buyout');
  });

  it('toggleOptOut adds and removes; setOptOutPayment edits', () => {
    let r = toggleOptOut(standard(), 2028);
    expect(r.optOuts).toEqual([{ afterSeason: 2028, payment: 0 }]);
    r = setOptOutPayment(r, 2028, 5e6);
    expect(r.optOuts).toEqual([{ afterSeason: 2028, payment: 5e6 }]);
    expect(toggleOptOut(r, 2028).optOuts).toEqual([]);
  });

  it('equalPayments splits a total and puts rounding on the last payment', () => {
    expect(equalPayments(2034, 3, 100)).toEqual([
      { year: 2034, amount: 33.33 },
      { year: 2035, amount: 33.33 },
      { year: 2036, amount: 33.34 },
    ]);
    expect(equalPayments(2034, 0, 100)).toEqual([]);
  });

  it('hasDeferral is true for principal, payments, or unattributed mode', () => {
    expect(hasDeferral(standard())).toBe(false);
    expect(hasDeferral(ohtani())).toBe(true);
  });

  it('syncScenario keeps a scenario valid after the contract changes', () => {
    let input: ContractInput = updateRow(standard(), 2031, { kind: 'club', buyout: 1e6 });
    input = toggleOptOut(input, 2028);
    const stale = { options: { 2027: 'exercised' as const, 2031: 'exercised' as const }, optOutTakenAfter: 2029, earnedBonuses: { 2027: 1, 1999: 5 } };
    const synced = syncScenario(input, stale);
    expect(synced).toEqual({ options: { 2031: 'exercised' }, optOutTakenAfter: null, earnedBonuses: { 2027: 1 } });
    expect(validateScenario(input, synced)).toEqual([]);
    // A row that stops being an option loses its decision; a new option row gets the default.
    expect(syncScenario(updateRow(input, 2031, { kind: 'guaranteed' }), synced).options).toEqual({});
    const empty = { options: {}, optOutTakenAfter: null, earnedBonuses: {} };
    expect(syncScenario(updateRow(standard(), 2031, { kind: 'player' }), empty).options).toEqual({ 2031: 'exercised' });
  });
});
