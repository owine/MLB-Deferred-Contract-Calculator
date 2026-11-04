// Input validation (spec §5.3). Errors block calculate(); warnings are shown alongside results.
import { classify, sortedSeasons } from './classify';
import { deferralCosts } from './deferral';
import type { RuleId } from './rules';
import type { ContractInput } from './types';

export interface ValidationIssue {
  severity: 'error' | 'warning';
  field: string;
  message: string;
  rule?: RuleId;
}

const OPTION_KINDS = new Set(['club', 'mutual', 'vesting', 'player', 'dual']);

export function validate(input: ContractInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const err = (field: string, message: string, rule?: RuleId) => issues.push({ severity: 'error', field, message, rule });
  const rows = sortedSeasons(input);

  if (rows.length === 0) {
    err('seasons', 'Add at least one season.');
    return issues;
  }
  rows.forEach((r, i) => {
    if (i > 0 && r.season !== rows[i - 1].season + 1) err(`seasons.${r.season}`, 'Seasons must be consecutive.');
    if (r.currentSalary < 0 || r.deferred < 0) err(`seasons.${r.season}`, 'Salary amounts cannot be negative.');
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
  for (const o of input.optOuts) {
    if (o.afterSeason < first || o.afterSeason >= last) err('optOuts', `Opt-out after ${o.afterSeason} must be followed by at least one season.`, 'Y3');
    if (o.payment < 0) err('optOuts', 'Opt-out payment cannot be negative.', 'Y3');
    const next = rows.find((r) => r.season === o.afterSeason + 1);
    if (next && next.kind !== 'guaranteed') err('optOuts', `The season after an opt-out (${next.season}) must be a guaranteed row.`, 'Y4');
  }

  const classes = classify(input);
  const g = classes.filter((c) => c.isGuaranteed).map((c) => c.season);
  if (g.length === 0) err('seasons', 'At least one Guaranteed season is required.');
  const lastG = g.length ? Math.max(...g) : last;

  const hasDeferral = input.deferral.payments.length > 0 || rows.some((r) => r.deferred > 0);
  for (const p of input.deferral.payments) {
    if (p.year <= last) err('deferral.payments', `Deferred payment in ${p.year} must fall after ${last}, the last season of the maximum term.`, 'F1');
  }
  const bonusPayments = input.signingBonus.payments;
  if (bonusPayments.length > 0) {
    const sum = bonusPayments.reduce((s, p) => s + p.amount, 0);
    if (Math.abs(sum - input.signingBonus.amount) > 0.5) err('signingBonus', 'Signing-bonus payments must add up to the bonus.', 'A2');
    for (const p of bonusPayments) {
      if (p.year > lastG && p.year <= last)
        err('signingBonus', `Signing-bonus installment in ${p.year} falls inside a possible option year; not supported.`, 'F1');
    }
  }
  const hasA7 = bonusPayments.some((p) => p.year > last);
  if ((hasDeferral || hasA7) && !(input.ilirPct > 0 && input.ilirPct <= 25)) err('ilirPct', 'Enter the Imputed Loan Interest Rate (0–25%).', 'D2');
  if (input.deferral.statedInterestPct < 0) err('deferral.statedInterestPct', 'Stated interest cannot be negative.', 'F3');

  // F7: at 0% stated interest, payments must equal the principal (blocking). With interest, a mismatch only warns.
  const zeroInterest = input.deferral.statedInterestPct === 0;
  const mismatch = (message: string) =>
    issues.push({ severity: zeroInterest ? 'error' : 'warning', field: 'deferral.payments', message, rule: 'F7' });
  const paymentTotal = input.deferral.payments.reduce((s, p) => s + p.amount, 0);
  if (input.deferral.attribution === 'unattributed') {
    const principal = input.deferral.unattributedPrincipal ?? 0;
    if (input.deferral.payments.length > 0 && !(principal > 0))
      err('deferral.unattributedPrincipal', 'Enter the total deferred principal.', 'F4b');
    else if (zeroInterest && Math.abs(paymentTotal - principal) > 0.5)
      mismatch(`Payments (${Math.round(paymentTotal)}) must equal the deferred principal (${Math.round(principal)}) at 0% interest.`);
  } else if (input.deferral.payments.length > 0) {
    const d = deferralCosts(input, classes);
    if (d.unpaidPrincipal > 0.5 || d.excessCash > 0.5)
      mismatch(`Payments don't match the deferred principal (unpaid principal ${Math.round(d.unpaidPrincipal)}, excess cash ${Math.round(d.excessCash)}).`);
  }
  return issues;
}
