// Flags (spec §5.1, §6): every [PRACTICE]/[INTERP]/[CONV] rule that moved a number, plus the V8 callout.
import { sortedSeasons } from './classify';
import type { DeferralResult } from './deferral';
import type { OutcomeResult } from './outcome';
import { RULES, type RuleId } from './rules';
import type { ContractInput, Flag, Result, SeasonClass } from './types';
import type { ValleyResult } from './valley';

export function collectFlags(
  input: ContractInput,
  classes: SeasonClass[],
  deferral: DeferralResult,
  valley: ValleyResult,
  outcome: OutcomeResult,
  funding: Result['funding'],
): Flag[] {
  const rows = new Map(sortedSeasons(input).map((r) => [r.season, r]));
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
  if (input.deferral.attribution === 'sequential' && classes.some((c) => c.rules.includes('D5') && (rows.get(c.season)?.deferred ?? 0) > 0))
    flag('D5');
  // F6: the 1.5-point band edge decided stated value vs discounting.
  if (deferral.pieces.length > 0 && Math.abs(Math.abs(input.deferral.statedInterestPct - input.ilirPct) - 1.5) < 1e-9) flag('F6');
  // V10: a non-guaranteed player option year was excluded from the Valley test.
  if (classes.some((c) => c.effectiveKind === 'player' && !c.isGuaranteed)) flag('V10');
  if (valley.usedV11) flag('V11');
  if (funding.snapshots.length > 0) {
    flag('X4');
    flag('X5');
  }
  return flags;
}
