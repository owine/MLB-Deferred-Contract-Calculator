// Scenario outcomes: O1–O8, V7–V9, B1, END (spec §2.5–§2.7).
import type { AavResult } from './aav';
import { isOptionRow, sortedSeasons } from './classify';
import type { BonusResult, DeferralResult } from './deferral';
import type { RuleId } from './rules';
import type { ContractInput, Charge, ChargeKind, Scenario, SeasonClass } from './types';
import type { ValleyResult } from './valley';

export interface OutcomeResult {
  charges: Charge[];
  played: SeasonClass[];
  voided: SeasonClass[];
  /** The buyout or opt-out payment actually paid when the contract ended, and the season it belongs to. */
  received: { season: number; amount: number } | null;
  /** Non-[TEXT] rules that changed the result without producing a charge of their own (END, O2NS). */
  notes: RuleId[];
}

/** UI and engine defaults (spec §6): club-type declined, player-type exercised, no opt-out. */
export function decisionFor(scenario: Scenario, c: SeasonClass): 'exercised' | 'declined' {
  return scenario.options[c.season] ?? (c.effectiveKind === 'club' ? 'declined' : 'exercised');
}

/**
 * Attributed cost of what was actually paid for the played seasons, on the AAV cost basis (`costBySeason`):
 * current salary, earned bonuses and deferred cost per season, plus the signing bonus and any buyout or
 * opt-out payment received. Used for the O7 "paid" amount (O8) and for `totals.attributedCost`.
 */
export function attributedCost(
  input: ContractInput,
  scenario: Scenario,
  played: SeasonClass[],
  deferral: DeferralResult,
  bonus: BonusResult,
  received: OutcomeResult['received'],
): number {
  const rows = new Map(sortedSeasons(input).map((r) => [r.season, r]));
  const perSeason = played.reduce(
    (s, c) => s + rows.get(c.season)!.currentSalary + (scenario.earnedBonuses[c.season] ?? 0) + (deferral.costBySeason.get(c.season) ?? 0),
    0,
  );
  return perSeason + bonus.cost + (received?.amount ?? 0);
}

/** `aavRules`: rules behind the deferred part of the AAV (F-rules, A7), added to every AAV charge. */
export function computeOutcome(
  input: ContractInput,
  scenario: Scenario,
  classes: SeasonClass[],
  deferral: DeferralResult,
  bonus: BonusResult,
  aav: AavResult,
  valley: ValleyResult,
  aavRules: RuleId[],
): OutcomeResult {
  const rows = new Map(sortedSeasons(input).map((r) => [r.season, r]));
  const cost = (season: number) => deferral.costBySeason.get(season) ?? 0;
  const charges: Charge[] = [];
  const add = (season: number, amount: number, label: string, kind: ChargeKind, rules: RuleId[]) =>
    charges.push({ season, amount, label, kind, rules });

  // END [CONV]: a declined option or a taken opt-out ends the contract; later seasons are void.
  const played: SeasonClass[] = [];
  const voided: SeasonClass[] = [];
  let end: { type: 'optout' | 'decline'; season: number } | null = null;
  for (const c of classes) {
    if (!end && scenario.optOutTakenAfter !== null && c.season > scenario.optOutTakenAfter) end = { type: 'optout', season: c.season };
    if (!end && isOptionRow(c) && decisionFor(scenario, c) === 'declined') end = { type: 'decline', season: c.season };
    (end ? voided : played).push(c);
  }
  const playedSet = new Set(played.map((c) => c.season));
  const included = (season: number) => (aav.deemed.season === season ? aav.deemed.amount : 0);

  // Guaranteed seasons played: AAV (A1), less the V7 credit on exercised "such" years.
  const exercisedSuch = [...valley.shortfalls.keys()].filter((s) => playedSet.has(s));
  const credit = exercisedSuch.length
    ? exercisedSuch.reduce((s, season) => s + valley.shortfalls.get(season)!, 0) / exercisedSuch.length
    : 0;
  for (const c of played.filter((c) => c.isGuaranteed)) {
    add(c.season, aav.aav, 'AAV', 'aav', ['A1', 'A2', ...aav.deemed.rules, ...aavRules]);
    if (valley.shortfalls.has(c.season)) add(c.season, -credit, 'Valley Charge credit', 'valleyCredit', ['V7']);
  }

  // V4: Valley Charge allocations stay charged even if the season is later nullified (V6).
  for (const [season, amount] of valley.allocation) add(season, amount, 'Valley Charge', 'valley', ['V1', 'V2', 'V3', 'V4', 'V5', 'V6']);

  // Club-type option exercised or vested (O1, O5) less the buyout previously included (O2).
  for (const c of played.filter((c) => c.effectiveKind === 'club')) {
    const vesting = rows.get(c.season)!.kind === 'vesting';
    add(c.season, rows.get(c.season)!.currentSalary + cost(c.season), vesting ? 'Vested option' : 'Exercised option', 'option', vesting ? ['O1', 'O5'] : ['O1']);
    if (included(c.season) > 0) add(c.season, -included(c.season), 'Buyout not received', 'option', ['O2']);
  }

  // Non-guaranteed Player Option Years exercised (O6): AAV of their salaries less prorated attributed buyout.
  const ngPlayer = played.filter((c) => c.effectiveKind === 'player' && !c.isGuaranteed);
  if (ngPlayer.length > 0) {
    const avg = ngPlayer.reduce((s, c) => s + rows.get(c.season)!.currentSalary + cost(c.season), 0) / ngPlayer.length;
    const buyoutShare = ngPlayer.reduce((s, c) => s + included(c.season), 0) / ngPlayer.length;
    for (const c of ngPlayer) add(c.season, avg - buyoutShare, 'Exercised player option', 'option', buyoutShare > 0 ? ['O6', 'O2NS'] : ['O6']);
  }

  // B1: earned bonuses in the season earned (played seasons only).
  for (const c of played) {
    const b = scenario.earnedBonuses[c.season] ?? 0;
    if (b !== 0) add(c.season, b, 'Earned bonus', 'bonus', ['B1']);
  }

  // Contract end: the buyout or opt-out payment actually received.
  let received: OutcomeResult['received'] = null;
  if (end?.type === 'decline') {
    const c = classes.find((x) => x.season === end!.season)!;
    if (c.buyout > 0) received = { season: c.season, amount: c.buyout };
  } else if (end?.type === 'optout') {
    const o = input.optOuts.find((x) => x.afterSeason === scenario.optOutTakenAfter);
    if (o && o.payment > 0) received = { season: end.season, amount: o.payment };
  }

  // O7: nullified guaranteed Player Option Years → true-up of paid − attributed (excl. Valley amounts, V9).
  const nullified = voided.filter((c) => c.effectiveKind === 'player' && c.isGuaranteed);
  if (nullified.length > 0) {
    const paid = attributedCost(input, scenario, played, deferral, bonus, received); // O8: deferrals and A7 bonus at attributed cost
    const attributed = charges
      .filter((ch) => playedSet.has(ch.season) && ch.kind !== 'valley' && ch.kind !== 'valleyCredit')
      .reduce((s, ch) => s + ch.amount, 0);
    const per = (paid - attributed) / nullified.length;
    const deferredPaid = played.some((c) => cost(c.season) > 0) || bonus.deferredPieces.length > 0;
    const rules: RuleId[] = deferredPaid ? ['O7', 'O8'] : ['O7'];
    if (credit !== 0) rules.push('V9');
    if (valley.allocation.size > 0) rules.push('V8');
    for (const c of nullified) add(c.season, per, 'Opt-out true-up', 'trueUp', [...rules]);
  } else if (received) {
    // O3: the received buyout was already charged as the deemed Signing Bonus; otherwise O4.
    if (aav.deemed.season !== received.season) {
      add(received.season, received.amount, 'Buyout paid', 'buyout', aav.deemed.a5 ? ['O4', 'O4b'] : ['O4']);
    }
  }

  // O2: a deemed buyout never received (contract ended first) is deducted in its option year,
  // unless an O7 true-up already netted it (O2NS).
  const notes: RuleId[] = end ? ['END'] : [];
  for (const c of voided) {
    const inc = included(c.season);
    if (inc <= 0 || received?.season === c.season) continue;
    if (nullified.length === 0) add(c.season, -inc, 'Buyout not received', 'buyout', ['O2']);
    else if (!notes.includes('O2NS')) notes.push('O2NS');
  }

  return { charges, played, voided, received, notes };
}
