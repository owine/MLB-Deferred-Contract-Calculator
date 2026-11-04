// CBT contract engine entry point. Spec: docs/superpowers/specs/2026-11-04-cbt-contract-engine-design.md
import { computeAav } from './aav';
import { classify, isOptionRow } from './classify';
import { aavDeferralRules, deferralCosts, signingBonusCost } from './deferral';
import { collectFlags } from './flags';
import { computeFunding } from './funding';
import { computeLedger } from './ledger';
import { computeOutcome } from './outcome';
import type { ContractInput, Result, Scenario } from './types';
import { validate, validateScenario } from './validate';
import { computeValley } from './valley';

export * from './types';
export { RULES } from './rules';
export type { RuleId, Tag } from './rules';
export { validate, validateScenario } from './validate';
export type { ValidationIssue } from './validate';

/** Spec §6 defaults: club-type options declined, player-type exercised, no opt-out, no bonuses. */
export function defaultScenario(input: ContractInput): Scenario {
  const options: Scenario['options'] = {};
  for (const c of classify(input)) if (isOptionRow(c)) options[c.season] = c.effectiveKind === 'club' ? 'declined' : 'exercised';
  return { options, optOutTakenAfter: null, earnedBonuses: {} };
}

/** Throws an Error listing every error from `validate(input)` and `validateScenario(input, scenario)`. Warnings do not throw. */
export function calculate(input: ContractInput, scenario: Scenario): Result {
  const errors = [...validate(input), ...validateScenario(input, scenario)].filter((i) => i.severity === 'error');
  if (errors.length > 0) throw new Error(`Invalid contract or scenario: ${errors.map((e) => e.message).join(' ')}`);

  const classes = classify(input);
  const deferral = deferralCosts(input, classes);
  const bonus = signingBonusCost(input, classes);
  const aav = computeAav(input, classes, deferral, bonus.cost);
  const valley = computeValley(input, classes, deferral, bonus.cost);
  const outcome = computeOutcome(input, scenario, classes, deferral, bonus, aav, valley, aavDeferralRules(input, classes, deferral, bonus));
  const ledger = computeLedger(input, scenario, deferral, bonus, outcome);
  const funding = computeFunding([...ledger.deferralPieces, ...bonus.deferredPieces]);

  return {
    classification: classes,
    aavAtSigning: aav.aav,
    charges: outcome.charges,
    perSeason: ledger.perSeason,
    totals: ledger.totals,
    funding,
    flags: collectFlags(input, classes, deferral, valley, outcome, funding),
  };
}
