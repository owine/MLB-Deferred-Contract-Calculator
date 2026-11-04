import { describe, expect, it } from 'vitest';
import { classify } from '../classify';
import { build, guaranteed, Y1 } from './helpers';

const at = (input: ReturnType<typeof build>, n: number) => classify(input).find((c) => c.season === Y1 + n - 1)!;

describe('classify (D1, D3–D5, Y1–Y6)', () => {
  it('D1 seasons are identified by the calendar year of the championship season, in order', () => {
    const input = build(guaranteed(3, 20));
    input.seasons.reverse();
    expect(classify(input).map((c) => c.season)).toEqual([Y1, Y1 + 1, Y1 + 2]);
  });

  it('D3/D5 the 50% test reads current pay only: $0 current salary + any buyout → not guaranteed', () => {
    const input = build([...guaranteed(1, 20), { currentSalary: 0, deferred: 35, kind: 'player', buyout: 1 }]);
    expect(at(input, 2).isGuaranteed).toBe(false);
  });

  it('D4 guaranteed rows are Guaranteed Years', () => {
    expect(at(build(guaranteed(2, 20)), 1)).toMatchObject({ effectiveKind: 'guaranteed', isGuaranteed: true });
  });

  it('Y1 club and vesting options are not Guaranteed Years', () => {
    const input = build([...guaranteed(1, 20), { currentSalary: 25, kind: 'club', buyout: 2 }, { currentSalary: 25, kind: 'vesting' }]);
    expect(at(input, 2)).toMatchObject({ effectiveKind: 'club', isGuaranteed: false, buyout: 2 });
    expect(at(input, 3)).toMatchObject({ effectiveKind: 'club', isGuaranteed: false });
  });

  it('Y6 mutual option is treated as a club option', () => {
    expect(at(build([...guaranteed(1, 20), { currentSalary: 25, kind: 'mutual' }]), 2).effectiveKind).toBe('club');
  });

  it('Y2 player option is guaranteed unless buyout > 50% of Base Salary', () => {
    const input = build([...guaranteed(1, 20), { currentSalary: 10, kind: 'player', buyout: 5 }, { currentSalary: 10, kind: 'player', buyout: 6 }]);
    expect(at(input, 2).isGuaranteed).toBe(true); // 5 is exactly 50%: not "more than"
    expect(at(input, 3).isGuaranteed).toBe(false);
  });

  it('Y2 respects guaranteedIfExercised = false (A(8) not met)', () => {
    expect(at(build([...guaranteed(1, 20), { currentSalary: 10, kind: 'player', guaranteedIfExercised: false }]), 2).isGuaranteed).toBe(false);
  });

  it('Y5 dual option is treated as a player option', () => {
    expect(at(build([...guaranteed(1, 20), { currentSalary: 10, kind: 'dual' }]), 2)).toMatchObject({ effectiveKind: 'player', isGuaranteed: true });
  });

  it('Y3/Y4 guaranteed seasons after a passing opt-out are guaranteed Player Option Years', () => {
    const input = build(guaranteed(5, 20), { optOuts: [{ afterSeason: Y1 + 1, payment: 0 }] });
    expect(at(input, 2)).toMatchObject({ effectiveKind: 'guaranteed' });
    expect(at(input, 3)).toMatchObject({ effectiveKind: 'player', viaOptOut: true, isGuaranteed: true });
  });

  it('Y3 failing opt-out (W6): payment 25 > 50% of 40 → non-guaranteed Player Option Years, payment is the buyout', () => {
    const input = build(guaranteed(5, 20), { optOuts: [{ afterSeason: Y1 + 2, payment: 25 }] });
    expect(at(input, 4)).toMatchObject({ effectiveKind: 'player', isGuaranteed: false, buyout: 25 });
    expect(at(input, 5)).toMatchObject({ effectiveKind: 'player', isGuaranteed: false, buyout: 0 });
  });

  it('Y4 an option row after an opt-out keeps its kind', () => {
    const input = build([...guaranteed(3, 20), { currentSalary: 25, kind: 'club', buyout: 3 }], { optOuts: [{ afterSeason: Y1 + 1, payment: 0 }] });
    expect(at(input, 3).effectiveKind).toBe('player');
    expect(at(input, 4).effectiveKind).toBe('club');
  });
});
