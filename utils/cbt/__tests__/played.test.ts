// Result.playedSeasons: the seasons actually played under a scenario (END convention).
import { describe, expect, it } from 'vitest';
import { build, guaranteed, Y1 } from './helpers';
import { run } from './run';

describe('playedSeasons', () => {
  it('lists every season when nothing ends the contract early', () => {
    expect(run(build(guaranteed(3, 20))).playedSeasons).toEqual([Y1, Y1 + 1, Y1 + 2]);
  });

  it('END: stops before a declined option and after a taken opt-out', () => {
    const club = build([...guaranteed(2, 20), { currentSalary: 25, kind: 'club', buyout: 2 }]);
    expect(run(club).playedSeasons).toEqual([Y1, Y1 + 1]);
    expect(run(club, { options: { [Y1 + 2]: 'exercised' } }).playedSeasons).toEqual([Y1, Y1 + 1, Y1 + 2]);
    const optOut = build(guaranteed(4, 20), { optOuts: [{ afterSeason: Y1 + 1, payment: 0 }] });
    expect(run(optOut, { optOutTakenAfter: Y1 + 1 }).playedSeasons).toEqual([Y1, Y1 + 1]);
  });
});

describe('END flag', () => {
  const flagged = (r: ReturnType<typeof run>) => r.flags.map((f) => f.rule);
  const twoOptions = build([...guaranteed(2, 20), { currentSalary: 5, kind: 'club', buyout: 1 }, { currentSalary: 5, kind: 'club' }]);

  it('is not flagged when the contract simply ends at a declined trailing option', () => {
    expect(flagged(run(twoOptions))).not.toContain('END');
  });

  it('is flagged when ending the contract voids a season that would otherwise count', () => {
    expect(flagged(run(twoOptions, { options: { [Y1 + 2]: 'declined', [Y1 + 3]: 'exercised' } }))).toContain('END');
    const optOut = build(guaranteed(4, 20), { optOuts: [{ afterSeason: Y1 + 1, payment: 0 }] });
    expect(flagged(run(optOut, { optOutTakenAfter: Y1 + 1 }))).toContain('END');
  });
});
