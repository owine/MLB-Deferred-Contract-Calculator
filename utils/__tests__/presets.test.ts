import { describe, expect, it } from 'vitest';
import { calculate, defaultScenario } from '../cbt';
import { PRESETS, type Preset } from '../../data/presets';
import { reconcile } from '../presets';

const cbtBySeason = (p: Preset) => calculate(p.input, defaultScenario(p.input)).perSeason;

describe('reconcile', () => {
  it('returns null when the preset has no reported figure', () => {
    expect(reconcile({ ...PRESETS[0], reported: undefined })).toBeNull();
  });

  it.each(PRESETS.filter((p) => p.reported).map((p) => [p.id, p] as const))('%s is within its published tolerance', (_, p) => {
    const rec = reconcile(p)!;
    expect(rec.reported).toBe(p.reported!.cbt);
    expect(Number.isInteger(rec.delta)).toBe(true);
    expect(Math.abs(rec.engine - rec.reported)).toBeLessThanOrEqual(p.reported!.tolerance);
  });

  // The worst season is listed second, and both directions are checked, so returning the first value, the max,
  // the min, or the season closest to the reported figure each fails at least one case.
  describe.each(['above', 'below'] as const)('reports the season furthest from the reported figure (worst is %s it)', (side) => {
    const p = PRESETS.find((x) => new Set(cbtBySeason(x).map((s) => s.cbt)).size > 1);
    it('has a preset with varying per-season CBT to test against', () => expect(p).toBeDefined());
    if (!p) return;
    const seasons = cbtBySeason(p);
    const low = seasons.reduce((a, b) => (b.cbt < a.cbt ? b : a));
    const high = seasons.reduce((a, b) => (b.cbt > a.cbt ? b : a));
    const [worst, other] = side === 'above' ? [high, low] : [low, high];
    it('picks it', () => {
      const rec = reconcile({ ...p, reported: { seasons: [other.season, worst.season], cbt: other.cbt, tolerance: 0, note: '' } })!;
      expect(rec.engine).toBe(worst.cbt);
      expect(rec.delta).toBe(Math.round(worst.cbt - other.cbt));
    });
  });

  it('never reports a negative zero delta (no "-$0")', () => {
    const p = PRESETS.find((x) => x.reported)!;
    const engine = cbtBySeason(p).find((s) => s.season === p.reported!.seasons[0])!.cbt;
    const rec = reconcile({ ...p, reported: { ...p.reported!, seasons: [p.reported!.seasons[0]], cbt: engine + 0.3 } })!;
    expect(Object.is(rec.delta, -0)).toBe(false);
    expect(rec.delta).toBe(0);
  });
});
