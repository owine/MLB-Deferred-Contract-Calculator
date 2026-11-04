// Valley Charge: V1–V6, V10, V11 (spec §2.7).
import { selectDeemedBuyout } from './aav';
import { sortedSeasons } from './classify';
import type { DeferralResult } from './deferral';
import { MONEY_EPS } from './money';
import type { ContractInput, SeasonClass } from './types';

export interface ValleyResult {
  /** First "such" Player Option Year (V6), or null when there is no Valley Charge. */
  firstSuch: number | null;
  figure: number;
  /** V4 shortfall per "such" Player Option Year. */
  shortfalls: Map<number, number>;
  /** V4 allocation per Guaranteed Year preceding the first such year. */
  allocation: Map<number, number>;
  /** True when V11 (buyouts deemed Signing Bonus inside the hypothetical) changed an evaluated figure. */
  usedV11: boolean;
}

export function computeValley(
  input: ContractInput,
  classes: SeasonClass[],
  deferral: DeferralResult,
  bonusCost: number,
): ValleyResult {
  const rows = new Map(sortedSeasons(input).map((r) => [r.season, r]));
  const cost = (season: number) => deferral.costBySeason.get(season) ?? 0;
  // V10: only guaranteed Player Option Years can carry a Valley Charge.
  const po = classes.filter((c) => c.effectiveKind === 'player' && c.isGuaranteed);
  // V1: Base Salary (D5) + deferred cost − Option Buyout.
  const value = (c: SeasonClass) => rows.get(c.season)!.currentSalary + cost(c.season) - c.buyout;
  const actualBuyout = selectDeemedBuyout(classes).amount;
  let usedV11 = false;

  for (let k = 0; k < po.length; k++) {
    const candidate = po[k];
    const later = new Set(po.slice(k).map((c) => c.season));
    // V3/V5/V11 hypothetical: the candidate and later Player Option Years are not Guaranteed.
    const hyp = classes.map((c) => (later.has(c.season) ? { ...c, isGuaranteed: false } : c));
    const hypG = hyp.filter((c) => c.isGuaranteed);
    const priorG = hypG.filter((c) => c.season < candidate.season);
    if (priorG.length === 0) continue;
    const hypBuyout = selectDeemedBuyout(hyp).amount; // V11
    if (hypBuyout !== actualBuyout) usedV11 = true;
    const signingBonus = bonusCost + hypBuyout;
    const hypAav =
      (hypG.reduce((s, c) => s + rows.get(c.season)!.currentSalary + cost(c.season), 0) + signingBonus) / hypG.length;
    // V2 with V5: Signing Bonus attributed over the Guaranteed Years before the candidate.
    const smallest = Math.min(
      ...priorG.map((c) => rows.get(c.season)!.currentSalary + signingBonus / priorG.length + cost(c.season)),
    );
    const figure = Math.max(0.8 * smallest, 0.75 * hypAav); // V3 floor
    // A year is "such" only if its shortfall exceeds MONEY_EPS.
    const short = (c: SeasonClass) => figure - value(c) > MONEY_EPS;
    if (!short(candidate)) continue; // V6: not "such"; try the next option year

    const shortfalls = new Map<number, number>();
    for (const c of po.slice(k)) if (short(c)) shortfalls.set(c.season, figure - value(c));
    const total = [...shortfalls.values()].reduce((s, v) => s + v, 0);
    const allocation = new Map(priorG.map((c) => [c.season, total / priorG.length] as [number, number]));
    return { firstSuch: candidate.season, figure, shortfalls, allocation, usedV11 };
  }
  return { firstSuch: null, figure: 0, shortfalls: new Map(), allocation: new Map(), usedV11 };
}
