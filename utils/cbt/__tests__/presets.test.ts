// W14 (preset regressions) and W15 (unattributed mode), spec §7–§8.
import { describe, expect, it } from 'vitest';
import { PRESETS } from '../../../data/presets';
import { calculate, defaultScenario, validate } from '..';

const preset = (id: string) => PRESETS.find((p) => p.id === id)!;

describe('presets', () => {
  it.each(PRESETS.map((p) => [p.id]))('%s passes validation', (id) => {
    expect(validate(preset(id).input).filter((i) => i.severity === 'error')).toEqual([]);
  });

  it.each(PRESETS.filter((p) => p.reported).map((p) => [p.id]))('W14 %s matches the reported CBT figure', (id) => {
    const p = preset(id);
    const r = calculate(p.input, defaultScenario(p.input));
    for (const season of p.reported!.seasons) {
      const cbt = r.perSeason.find((s) => s.season === season)!.cbt;
      expect(Math.abs(cbt - p.reported!.cbt)).toBeLessThanOrEqual(p.reported!.tolerance);
    }
  });

  it('Ohtani engine value is $46,081,476.50 (sequential)', () => {
    const p = preset('ohtani');
    expect(calculate(p.input, defaultScenario(p.input)).aavAtSigning).toBeCloseTo(46_081_476.5, 1);
  });

  it('Scherzer engine value is $28,690,024 (documented $648 residual)', () => {
    const p = preset('scherzer');
    expect(Math.round(calculate(p.input, defaultScenario(p.input)).aavAtSigning)).toBe(28_690_024);
  });

  it('W15 Scherzer in unattributed mode spreads over all 7 Guaranteed Years', () => {
    const p = preset('scherzer');
    const input = { ...p.input, deferral: { ...p.input.deferral, attribution: 'unattributed' as const, unattributedPrincipal: 105_000_000 } };
    expect(Math.abs(calculate(input, defaultScenario(input)).aavAtSigning - 28_211_365)).toBeLessThanOrEqual(1);
  });

  it('Ohtani in unattributed mode reproduces the current app value (~$46.77M)', () => {
    const p = preset('ohtani');
    const input = { ...p.input, deferral: { ...p.input.deferral, attribution: 'unattributed' as const, unattributedPrincipal: 680_000_000 } };
    expect(Math.round(calculate(input, defaultScenario(input)).aavAtSigning)).toBe(46_769_026);
  });

  it.each([['soto'], ['alonso']])('V4 %s sits exactly at the 80% boundary: no Valley Charge', (id) => {
    const p = preset(id);
    const r = calculate(p.input, defaultScenario(p.input));
    expect(r.charges.filter((c) => c.kind === 'valley')).toEqual([]);
  });

  it('F4c Tucker: pro-rata attribution reproduces Cot’s $57,195,945 with no Valley Charge', () => {
    const p = preset('tucker');
    const r = calculate(p.input, defaultScenario(p.input));
    expect(Math.round(r.aavAtSigning)).toBe(57_195_945);
    expect(r.charges.filter((c) => c.kind === 'valley')).toEqual([]);
  });
});
