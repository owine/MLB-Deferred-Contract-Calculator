// CBT contract engine entry point. Spec: docs/superpowers/specs/2026-11-04-cbt-contract-engine-design.md
import { computeAav } from './aav';
import { classify, isOptionRow, sortedSeasons } from './classify';
import { deferralCosts, signingBonusCost } from './deferral';
import { computeFunding } from './funding';
import { computeOutcome } from './outcome';
import { RULES, type RuleId } from './rules';
import type { ContractInput, Flag, Result, Scenario } from './types';
import { computeValley } from './valley';

export * from './types';
export { RULES } from './rules';
export type { RuleId, Tag } from './rules';
export { validate } from './validate';
export type { ValidationIssue } from './validate';

/** Spec §6 defaults: club-type options declined, player-type exercised, no opt-out, no bonuses. */
export function defaultScenario(input: ContractInput): Scenario {
  const options: Scenario['options'] = {};
  for (const c of classify(input)) if (isOptionRow(c)) options[c.season] = c.effectiveKind === 'club' ? 'declined' : 'exercised';
  return { options, optOutTakenAfter: null, earnedBonuses: {} };
}

/** Assumes `validate(input)` returned no errors. */
export function calculate(input: ContractInput, scenario: Scenario): Result {
  const classes = classify(input);
  const deferral = deferralCosts(input, classes);
  const bonus = signingBonusCost(input, classes);
  const aav = computeAav(input, classes, deferral, bonus.cost);
  const valley = computeValley(input, classes, deferral, bonus.cost);
  const outcome = computeOutcome(input, scenario, classes, deferral, bonus, aav, valley);

  const playedSet = new Set(outcome.played.map((c) => c.season));
  const rows = sortedSeasons(input);
  const deferralPieces = deferral.pieces.filter((p) => playedSet.has(p.season));
  const deferredRules: RuleId[] = ['F2', 'F3', input.deferral.attribution === 'sequential' ? 'F4a' : 'F4b', 'F5', 'F7'];
  if (deferralPieces.length > 0) for (const ch of outcome.charges) if (ch.rules.includes('A1')) ch.rules.push(...deferredRules);
  if (bonus.deferredPieces.length > 0) for (const ch of outcome.charges) if (ch.rules.includes('A1')) ch.rules.push('A7');

  // Cash by calendar year (nominal) and attributed cost.
  const cash = new Map<number, number>();
  const addCash = (year: number, v: number) => cash.set(year, (cash.get(year) ?? 0) + v);
  for (const c of outcome.played) addCash(c.season, rows.find((r) => r.season === c.season)!.currentSalary + (scenario.earnedBonuses[c.season] ?? 0));
  const bonusPayments = input.signingBonus.payments.length > 0 ? input.signingBonus.payments : [{ year: rows[0].season, amount: input.signingBonus.amount }];
  for (const p of bonusPayments) addCash(p.year, p.amount);
  for (const p of deferralPieces) addCash(p.year, p.cash);
  if (outcome.received) addCash(outcome.received.season, outcome.received.amount);

  const cbt = new Map<number, number>();
  for (const ch of outcome.charges) cbt.set(ch.season, (cbt.get(ch.season) ?? 0) + ch.amount);
  const years = [...new Set([...cash.keys(), ...cbt.keys()])].sort((a, b) => a - b);
  const perSeason = years.map((season) => ({ season, cbt: cbt.get(season) ?? 0, cash: cash.get(season) ?? 0 }));

  const attributedCost =
    outcome.played.reduce(
      (s, c) => s + rows.find((r) => r.season === c.season)!.currentSalary + (scenario.earnedBonuses[c.season] ?? 0),
      0,
    ) +
    bonus.cost +
    deferralPieces.reduce((s, p) => s + p.cost, 0) +
    (outcome.received?.amount ?? 0);

  // Flags (spec §5.1, §6): every [PRACTICE]/[INTERP]/[CONV] rule that moved a number, plus the V8 callout.
  const flags: Flag[] = [];
  const flag = (r: RuleId) => {
    if (!flags.some((f) => f.rule === r)) flags.push({ rule: r, message: RULES[r].summary });
  };
  for (const ch of outcome.charges) {
    if (Math.abs(ch.amount) < 1e-9) continue;
    for (const r of ch.rules) if (RULES[r].tag !== 'TEXT' || r === 'V8') flag(r);
  }
  outcome.notes.forEach(flag); // END, O2NS: changed the result without a charge of their own
  // D5: a 50% test or Valley value read a season that has deferred pay (per-season `deferred` is used only in sequential mode).
  if (
    input.deferral.attribution === 'sequential' &&
    classes.some((c) => c.rules.includes('D5') && (rows.find((r) => r.season === c.season)?.deferred ?? 0) > 0)
  )
    flag('D5');
  // F6: the 1.5-point band edge decided stated value vs discounting.
  if (deferral.pieces.length > 0 && Math.abs(Math.abs(input.deferral.statedInterestPct - input.ilirPct) - 1.5) < 1e-9) flag('F6');
  // V10: a non-guaranteed player option year was excluded from the Valley test.
  if (classes.some((c) => c.effectiveKind === 'player' && !c.isGuaranteed)) flag('V10');
  if (valley.usedV11) flag('V11');

  const funding = computeFunding([...deferralPieces, ...bonus.deferredPieces]);
  if (funding.snapshots.length > 0) {
    flag('X4');
    flag('X5');
  }

  return {
    classification: classes,
    aavAtSigning: aav.aav,
    charges: outcome.charges,
    perSeason,
    totals: {
      cbt: outcome.charges.reduce((s, ch) => s + ch.amount, 0),
      cash: [...cash.values()].reduce((s, v) => s + v, 0),
      attributedCost,
    },
    funding,
    flags,
  };
}
