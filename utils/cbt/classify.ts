// Year classification: D4, D5, Y1–Y6 (spec §2.1–§2.2).
import type { RuleId } from './rules';
import type { ContractInput, SeasonClass } from './types';

export function sortedSeasons(input: ContractInput) {
  return [...input.seasons].sort((a, b) => a.season - b.season);
}

export function classify(input: ContractInput): SeasonClass[] {
  const rows = sortedSeasons(input);
  // Y3: each opt-out's 50% test, against the Base Salaries (D5: current pay) of every following Contract Year.
  const optOutPasses = new Map<number, boolean>();
  for (const o of input.optOuts) {
    const following = rows.filter((r) => r.season > o.afterSeason).reduce((s, r) => s + r.currentSalary, 0);
    optOutPasses.set(o.afterSeason, !(o.payment > 0.5 * following));
  }

  return rows.map((row): SeasonClass => {
    const preceding = input.optOuts.filter((o) => row.season > o.afterSeason);

    if (row.kind === 'guaranteed' && preceding.length > 0) {
      // Y4: a guaranteed season after an opt-out can be nullified → Player Option Year.
      // Y3: guaranteed only if every opt-out covering it passes its 50% test.
      const isGuaranteed = preceding.every((o) => optOutPasses.get(o.afterSeason));
      // The opt-out payment is the Option Buyout for the first season it nullifies (used by A3/V1).
      const buyout = input.optOuts
        .filter((o) => rows.find((r) => r.season > o.afterSeason)?.season === row.season)
        .reduce((s, o) => s + o.payment, 0);
      return { season: row.season, effectiveKind: 'player', isGuaranteed, viaOptOut: true, buyout, rules: ['Y4', 'Y3', 'D5'] };
    }

    if (row.kind === 'guaranteed') {
      return { season: row.season, effectiveKind: 'guaranteed', isGuaranteed: true, viaOptOut: false, buyout: 0, rules: ['D4'] };
    }

    const buyout = row.buyout ?? 0;
    if (row.kind === 'club' || row.kind === 'mutual' || row.kind === 'vesting') {
      const rules: RuleId[] = row.kind === 'mutual' ? ['Y1', 'Y6'] : ['Y1'];
      return { season: row.season, effectiveKind: 'club', isGuaranteed: false, viaOptOut: false, buyout, rules };
    }

    // player | dual (Y2, Y5)
    const meetsA8 = row.guaranteedIfExercised ?? true;
    const isGuaranteed = meetsA8 && !(buyout > 0.5 * row.currentSalary);
    const rules: RuleId[] = row.kind === 'dual' ? ['Y2', 'Y5', 'D5'] : ['Y2', 'D5'];
    return { season: row.season, effectiveKind: 'player', isGuaranteed, viaOptOut: false, buyout, rules };
  });
}

/** Option rows a Scenario decides on: club-type rows and explicit player/dual rows (not opt-out-derived years). */
export function isOptionRow(c: SeasonClass): boolean {
  return c.effectiveKind === 'club' || (c.effectiveKind === 'player' && !c.viaOptOut);
}
