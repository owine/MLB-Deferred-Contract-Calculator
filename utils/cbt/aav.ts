// AAV at signing: A1–A7 (spec §2.3).
import type { RuleId } from './rules';
import type { DeferralResult } from './deferral';
import { sortedSeasons } from './classify';
import type { ContractInput, SeasonClass } from './types';

export interface DeemedBuyout {
  /** Season whose buyout is deemed a Signing Bonus, or null. */
  season: number | null;
  amount: number;
  /** True when A5 (higher of club + player buyouts) chose it. */
  a5: boolean;
  rules: RuleId[];
}

/** A3–A5: which option buyout, if any, is deemed a Signing Bonus. */
export function selectDeemedBuyout(classes: SeasonClass[]): DeemedBuyout {
  const candidates = classes.filter((c) => !c.isGuaranteed && c.buyout > 0);
  if (candidates.length === 0) return { season: null, amount: 0, a5: false, rules: [] };
  const hasClub = candidates.some((c) => c.effectiveKind === 'club');
  const hasPlayer = candidates.some((c) => c.effectiveKind === 'player');
  if (hasClub && hasPlayer) {
    // A5: the higher buyout; ties go to the earlier season.
    const pick = candidates.reduce((best, c) => (c.buyout > best.buyout ? c : best));
    return { season: pick.season, amount: pick.buyout, a5: true, rules: ['A3', 'A5'] };
  }
  // A4: earliest option year's buyout only.
  const pick = candidates[0]; // classes are season-sorted
  return { season: pick.season, amount: pick.buyout, a5: false, rules: candidates.length > 1 ? ['A3', 'A4'] : ['A3'] };
}

export interface AavResult {
  aav: number;
  guaranteedSeasons: number[];
  deemed: DeemedBuyout;
}

export function computeAav(
  input: ContractInput,
  classes: SeasonClass[],
  deferral: DeferralResult,
  bonusCost: number,
): AavResult {
  const rows = new Map(sortedSeasons(input).map((r) => [r.season, r]));
  const g = classes.filter((c) => c.isGuaranteed).map((c) => c.season);
  const deemed = selectDeemedBuyout(classes);
  if (g.length === 0) return { aav: 0, guaranteedSeasons: g, deemed };
  const base = g.reduce((s, season) => s + rows.get(season)!.currentSalary, 0);
  const deferred = g.reduce((s, season) => s + (deferral.costBySeason.get(season) ?? 0), 0);
  // A1: (Base Salary + Signing Bonus incl. deemed buyout + deferred cost) / Guaranteed Years.
  return { aav: (base + bonusCost + deemed.amount + deferred) / g.length, guaranteedSeasons: g, deemed };
}
