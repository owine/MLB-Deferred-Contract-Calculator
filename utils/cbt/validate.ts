// Input validation (spec §5.3). Errors block calculate(); warnings are shown alongside results.
import { classify, sortedSeasons } from './classify';
import { deferralCosts } from './deferral';
import type { RuleId } from './rules';
import type { ContractInput, Scenario } from './types';

export interface ValidationIssue {
  severity: 'error' | 'warning';
  field: string;
  message: string;
  rule?: RuleId;
}

const OPTION_KINDS = new Set(['club', 'mutual', 'vesting', 'player', 'dual']);

/** A usable money amount: a finite number, zero or more. */
export function isFiniteNonNeg(x: number): boolean {
  return Number.isFinite(x) && x >= 0;
}

export function validate(input: ContractInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const err = (field: string, message: string, rule?: RuleId) => issues.push({ severity: 'error', field, message, rule });
  const rows = sortedSeasons(input);
  const amount = (field: string, x: number, what: string, rule?: RuleId) => {
    if (!isFiniteNonNeg(x)) err(field, Number.isFinite(x) ? `${what} cannot be negative.` : `${what} must be a number.`, rule);
  };
  const wholeYear = (field: string, year: number) => {
    if (!Number.isInteger(year)) err(field, `Payment year ${year} must be a whole year.`);
  };

  if (rows.length === 0) {
    err('seasons', 'Add at least one season.');
    return issues;
  }
  rows.forEach((r, i) => {
    if (!Number.isInteger(r.season)) err(`seasons.${r.season}`, `Season ${r.season} must be a whole year.`);
    if (i > 0 && r.season !== rows[i - 1].season + 1) err(`seasons.${r.season}`, 'Seasons must be consecutive.');
    const salary = [r.currentSalary, r.deferred];
    if (!salary.every(isFiniteNonNeg))
      err(`seasons.${r.season}`, salary.every(Number.isFinite) ? 'Salary amounts cannot be negative.' : 'Salary amounts must be numbers.');
    if (r.buyout !== undefined) amount(`seasons.${r.season}.buyout`, r.buyout, 'Buyout');
    if ((r.buyout ?? 0) > 0 && !OPTION_KINDS.has(r.kind)) err(`seasons.${r.season}.buyout`, 'Only option years can have a buyout.');
    if (r.guaranteedIfExercised !== undefined && r.kind !== 'player' && r.kind !== 'dual')
      err(`seasons.${r.season}.guaranteedIfExercised`, 'Only player or dual option years use this setting.', 'Y2');
  });

  // END [CONV]: declining an option ends the contract, so no guaranteed row may follow an option row.
  const firstOption = rows.find((r) => OPTION_KINDS.has(r.kind));
  if (firstOption && rows.some((r) => r.season > firstOption.season && r.kind === 'guaranteed'))
    err('seasons', `Guaranteed seasons must come before the first option year (${firstOption.season}).`, 'END');

  const first = rows[0].season;
  const last = rows[rows.length - 1].season; // last season of the maximum term
  input.optOuts.forEach((o, i) => {
    if (o.afterSeason < first || o.afterSeason >= last) err('optOuts', `Opt-out after ${o.afterSeason} must be followed by at least one season.`, 'Y3');
    if (input.optOuts.findIndex((x) => x.afterSeason === o.afterSeason) < i)
      err('optOuts', `Opt-out after ${o.afterSeason} is listed more than once.`, 'Y3');
    amount('optOuts', o.payment, 'Opt-out payment', 'Y3');
    const next = rows.find((r) => r.season === o.afterSeason + 1);
    if (next && next.kind !== 'guaranteed') err('optOuts', `The season after an opt-out (${next.season}) must be a guaranteed row.`, 'Y4');
  });

  const classes = classify(input);
  const g = classes.filter((c) => c.isGuaranteed).map((c) => c.season);
  if (g.length === 0) err('seasons', 'At least one Guaranteed season is required.');
  const lastG = g.length ? Math.max(...g) : last;

  const hasPrincipal = rows.some((r) => r.deferred > 0);
  const hasDeferral = input.deferral.payments.length > 0 || hasPrincipal;
  for (const p of input.deferral.payments) {
    amount('deferral.payments', p.amount, 'Deferred payment', 'F7');
    wholeYear('deferral.payments', p.year);
    if (p.year <= last) err('deferral.payments', `Deferred payment in ${p.year} must fall after ${last}, the last season of the maximum term.`, 'F1');
  }
  const bonusPayments = input.signingBonus.payments;
  amount('signingBonus', input.signingBonus.amount, 'Signing bonus', 'A2');
  for (const p of bonusPayments) {
    amount('signingBonus.payments', p.amount, 'Signing-bonus payment', 'A2');
    wholeYear('signingBonus.payments', p.year);
  }
  if (bonusPayments.length > 0) {
    const sum = bonusPayments.reduce((s, p) => s + p.amount, 0);
    if (Math.abs(sum - input.signingBonus.amount) > 0.5) err('signingBonus', 'Signing-bonus payments must add up to the bonus.', 'A2');
    for (const p of bonusPayments) {
      if (p.year > lastG && p.year <= last)
        err('signingBonus', `Signing-bonus installment in ${p.year} falls inside a possible option year; not supported.`, 'F1');
    }
  }
  const hasA7 = bonusPayments.some((p) => p.year > last);
  if (!Number.isFinite(input.ilirPct)) err('ilirPct', 'The Imputed Loan Interest Rate must be a number.', 'D2');
  else if ((hasDeferral || hasA7) && !(input.ilirPct > 0 && input.ilirPct <= 25)) err('ilirPct', 'Enter the Imputed Loan Interest Rate (0–25%).', 'D2');
  amount('deferral.statedInterestPct', input.deferral.statedInterestPct, 'Stated interest', 'F3');
  if (input.deferral.unattributedPrincipal !== undefined)
    amount('deferral.unattributedPrincipal', input.deferral.unattributedPrincipal, 'Deferred principal', 'F4b');

  // F7: at 0% stated interest, payments must equal the principal (blocking). With interest, a mismatch only warns.
  const zeroInterest = input.deferral.statedInterestPct === 0;
  const mismatch = (message: string) =>
    issues.push({ severity: zeroInterest ? 'error' : 'warning', field: 'deferral.payments', message, rule: 'F7' });
  const paymentTotal = input.deferral.payments.reduce((s, p) => s + p.amount, 0);
  if (input.deferral.attribution === 'unattributed') {
    if (hasPrincipal)
      issues.push({
        severity: 'warning',
        field: 'seasons',
        message: 'Per-season deferred amounts are ignored in unattributed mode; enter the total as the deferred principal.',
        rule: 'F4b',
      });
    const principal = input.deferral.unattributedPrincipal ?? 0;
    if (input.deferral.payments.length > 0 && !(principal > 0))
      err('deferral.unattributedPrincipal', 'Enter the total deferred principal.', 'F4b');
    else if (zeroInterest && Math.abs(paymentTotal - principal) > 0.5)
      mismatch(`Payments (${Math.round(paymentTotal)}) must equal the deferred principal (${Math.round(principal)}) at 0% interest.`);
  } else if (hasPrincipal && input.deferral.payments.length === 0) {
    err('deferral.payments', 'Deferred principal needs a payment schedule.', 'F7');
  } else if (hasPrincipal || input.deferral.payments.length > 0) {
    const d = deferralCosts(input, classes);
    if (d.unpaidPrincipal > 0.5 || d.excessCash > 0.5)
      mismatch(`Payments don't match the deferred principal (unpaid principal ${Math.round(d.unpaidPrincipal)}, excess cash ${Math.round(d.excessCash)}).`);
  }
  return issues;
}

/** Scenario checks against its contract (spec §5.1 Scenario). Errors block calculate(). */
export function validateScenario(input: ContractInput, scenario: Scenario): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const err = (field: string, message: string, rule?: RuleId) => issues.push({ severity: 'error', field, message, rule });
  const rows = sortedSeasons(input);
  const seasons = new Set(rows.map((r) => r.season));
  const optionSeasons = new Set(rows.filter((r) => OPTION_KINDS.has(r.kind)).map((r) => r.season));

  const taken = scenario.optOutTakenAfter;
  if (taken != null && !input.optOuts.some((o) => o.afterSeason === taken))
    err('scenario.optOutTakenAfter', `There is no opt-out after ${taken}.`, 'Y3');
  for (const [key, decision] of Object.entries(scenario.options)) {
    if (!optionSeasons.has(Number(key))) err(`scenario.options.${key}`, `${key} is not an option year.`);
    if (decision !== 'exercised' && decision !== 'declined')
      err(`scenario.options.${key}`, `The ${key} option must be exercised or declined.`);
  }
  for (const [key, bonus] of Object.entries(scenario.earnedBonuses)) {
    if (!seasons.has(Number(key))) err(`scenario.earnedBonuses.${key}`, `${key} is not a contract season.`, 'B1');
    if (!isFiniteNonNeg(bonus))
      err(`scenario.earnedBonuses.${key}`, Number.isFinite(bonus) ? 'Earned bonuses cannot be negative.' : 'Earned bonuses must be numbers.', 'B1');
  }
  return issues;
}
