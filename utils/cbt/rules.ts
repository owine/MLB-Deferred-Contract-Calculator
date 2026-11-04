// Single source of truth for rule ids, CBA citations and evidence tags (spec §1, §5).
// Every id here matches a row in the spec (§2–§3). Tags:
//   TEXT     — stated directly in the CBA
//   PRACTICE — CBA ambiguous/silent; matches the figure MLB actually charged
//   INTERP   — CBA ambiguous; engine's reading (`alternative` names the other reading)
//   CONV     — CBA silent; modeling convention
// Pages are the printed pages of the 2022–2026 Basic Agreement.
export type Tag = 'TEXT' | 'PRACTICE' | 'INTERP' | 'CONV';

export interface Rule {
  cite: string;
  tag: Tag;
  summary: string;
  alternative?: string;
}

export const RULES = {
  D1: { cite: 'XXIII(A)(1), p.115–116', tag: 'TEXT', summary: 'Contract Year runs Dec 2 – Dec 1, named for its championship season' },
  D2: { cite: 'XXIII(A)(4), p.116; E(6)(b)(ii), p.136–137', tag: 'TEXT', summary: 'ILIR = Federal mid-term rate for the October before the first Contract Year' },
  D3: { cite: 'XXIII(A)(7), p.116', tag: 'TEXT', summary: 'Base Salary = the UPC ¶2 amount for a season' },
  D4: { cite: 'XXIII(A)(8), p.116', tag: 'TEXT', summary: 'Guaranteed Year: >50% of Base Salary guaranteed on termination' },
  D5: {
    cite: 'E(2), p.131; E(5)(d)(ii), p.136',
    tag: 'INTERP',
    summary: 'Base Salary = current (non-deferred) pay; deferrals enter only via E(6)',
    alternative: 'Base Salary includes nominal deferred pay (changes the 50% guarantee tests)',
  },
  Y1: { cite: 'E(5)(a)(i), p.133', tag: 'TEXT', summary: 'Club (incl. vesting) option years are not Guaranteed Years' },
  Y2: { cite: 'E(5)(a)(ii), p.133', tag: 'TEXT', summary: 'Player option year is guaranteed unless buyout > 50% of Base Salary' },
  Y3: { cite: 'E(5)(a)(ii), p.133', tag: 'TEXT', summary: 'Years after an opt-out are guaranteed unless payment > 50% of following Base Salaries' },
  Y4: { cite: 'E(5)(a)(ii)(B), p.133', tag: 'TEXT', summary: 'Guaranteed seasons after an opt-out are Player Option Years' },
  Y5: { cite: 'E(5)(a)(iii), p.133', tag: 'TEXT', summary: 'Dual option = Player Option Year' },
  Y6: { cite: 'E(5)(a)(iv), p.133–134', tag: 'TEXT', summary: 'Mutual option = Club Option Year' },
  A1: { cite: 'E(2), p.131', tag: 'TEXT', summary: 'AAV = (Base Salary + Signing Bonus + deferred cost) / Guaranteed Years' },
  A2: { cite: 'E(3), p.132', tag: 'TEXT', summary: 'Signing Bonus attributed pro rata over Guaranteed Years' },
  A3: { cite: 'E(5)(b)(i)(A), p.134', tag: 'TEXT', summary: 'Buyout on a non-guaranteed option year is deemed a Signing Bonus' },
  A4: { cite: 'E(5)(b)(i)(B), p.134', tag: 'TEXT', summary: 'Only the earliest option year buyout is deemed a Signing Bonus' },
  A5: {
    cite: 'E(5)(b)(i)(A)–(B), p.134',
    tag: 'INTERP',
    summary: 'Club + player buyouts both present: the higher is the Signing Bonus',
    alternative: 'Always use the earliest option year buyout (B)',
  },
  A6: { cite: 'E(4)(a), p.132', tag: 'TEXT', summary: 'Potential (unearned) bonuses are not in the AAV' },
  A7: {
    cite: 'E(1), p.131; E(3), p.132; E(6)(a), p.136',
    tag: 'INTERP',
    summary: 'Signing-bonus installments after the term are discounted as deferred compensation',
    alternative: 'Signing bonuses are never discounted',
  },
  F1: { cite: 'E(6)(a), p.136', tag: 'TEXT', summary: 'Deferred Compensation = Salary payable after the last season' },
  F2: { cite: 'E(6)(b)(i), p.136', tag: 'TEXT', summary: 'Deferred comp counts in the season the contract attributes it to' },
  F3: { cite: 'E(6)(b)(ii), p.136–137', tag: 'TEXT', summary: 'Stated interest within 1.5 pp of ILIR → stated value; else discounted at ILIR' },
  F4a: { cite: 'E(6)(b)(i), p.136', tag: 'PRACTICE', summary: 'Sequential attribution: first-earned principal paid first' },
  F4c: {
    cite: 'E(6)(b)(i), p.136',
    tag: 'TEXT',
    summary: 'Pro-rata: the contract spreads each season’s deferral across every payment',
  },
  F4b: { cite: 'E(6)(b)(i), p.136', tag: 'TEXT', summary: 'Unattributed: equally to each Guaranteed Year (payment split is a convention)' },
  F5: { cite: 'silent', tag: 'PRACTICE', summary: 'Whole-year, annually compounded discounting' },
  F6: { cite: 'silent', tag: 'CONV', summary: '"Within 1.5 percentage points" is inclusive' },
  F7: { cite: 'E(6)(b)(ii), p.136–137', tag: 'CONV', summary: 'Payments are cash incl. interest; principal = cash / (1+stated)^years' },
  B1: { cite: 'E(4)(a), p.132', tag: 'TEXT', summary: 'Earned bonuses count in the season earned, outside the AAV' },
  O1: { cite: 'E(5)(c), p.135', tag: 'TEXT', summary: 'Exercised club option year = Base Salary + bonuses' },
  O2: { cite: 'E(5)(b)(ii), p.134–135', tag: 'TEXT', summary: 'Buyout not received → deduction of the buyout previously included' },
  O2NS: {
    cite: 'E(5)(b)(ii), p.134–135',
    tag: 'INTERP',
    summary: 'O2 not stacked on O6 or on an O7 true-up',
    alternative: 'Apply O2 as well (deducts the buyout twice)',
  },
  O3: { cite: 'E(5)(b)(i), p.134', tag: 'TEXT', summary: 'Declined; deemed buyout already charged' },
  O4: { cite: 'E(5)(b)(i)(B), p.134', tag: 'TEXT', summary: 'Paid buyout that was not the deemed Signing Bonus is charged in its option year' },
  O4b: {
    cite: 'E(5)(b)(i)(B), p.134',
    tag: 'INTERP',
    summary: 'O4 extended to the lower buyout left out under A5',
    alternative: 'The text covers only non-earliest option years',
  },
  O5: {
    cite: 'E(5)(a)(i), (c), p.133, 135',
    tag: 'INTERP',
    summary: 'Vested option treated as exercised club option',
    alternative: 'Vesting is not "exercise"; no rule given',
  },
  O6: { cite: 'E(5)(d)(i) ¶2, p.135', tag: 'TEXT', summary: 'Exercised non-guaranteed player option: salary − buyout attributed' },
  O7: { cite: 'E(5)(d)(i) ¶1, p.135', tag: 'TEXT', summary: 'Nullified guaranteed player option: true-up of paid − attributed (excl. Valley)' },
  O8: {
    cite: 'E(5)(d)(i), p.135; E(6)(b)(i), p.136',
    tag: 'INTERP',
    summary: 'O7 values deferred pay at attributed cost',
    alternative: 'Value deferred pay at nominal (adds the discount back)',
  },
  V1: { cite: 'E(5)(d)(ii), p.136', tag: 'TEXT', summary: 'Player Option Year Value = Base Salary + deferred cost − buyout' },
  V2: { cite: 'E(5)(d)(ii), p.136', tag: 'TEXT', summary: '80% Figure from the smallest preceding Guaranteed Year' },
  V3: { cite: 'E(5)(d)(ii), p.136', tag: 'TEXT', summary: 'Floor: 75% of AAV as if the option year were not guaranteed' },
  V4: { cite: 'E(5)(d)(ii), p.136', tag: 'TEXT', summary: 'Valley shortfall allocated pro rata over preceding Guaranteed Years' },
  V5: { cite: 'E(5)(d)(ii), p.136', tag: 'PRACTICE', summary: 'Signing Bonus attributed over pre-option years for the 80% Figure' },
  V6: {
    cite: 'E(5)(d)(ii), p.136',
    tag: 'INTERP',
    summary: '"Such" resolved by testing option years in order; shares stay charged',
    alternative: 'Shares on a later-nullified year are dropped',
  },
  V7: {
    cite: 'E(5)(d)(ii), p.136',
    tag: 'INTERP',
    summary: 'Exercised "such" years credited their averaged shortfalls',
    alternative: 'Recompute AAV over option years only (Bellinger $17.67M)',
  },
  V8: { cite: 'E(5)(d)(i) ¶1, p.135', tag: 'TEXT', summary: 'Valley Charge not refunded on opt-out' },
  V9: {
    cite: 'E(5)(d)(i) ¶1, p.135',
    tag: 'INTERP',
    summary: 'O7 exclusion also covers V7 credits',
    alternative: 'Count V7 credits as attributed (Bellinger W13 $135.3M)',
  },
  V10: {
    cite: 'E(5)(d)(ii), p.136; G(3)(e), p.143',
    tag: 'INTERP',
    summary: 'Valley applies only to guaranteed player option years',
    alternative: 'Apply to all player option years',
  },
  V11: {
    cite: 'E(5)(d)(ii), p.136; E(5)(b)(i)(A), p.134',
    tag: 'INTERP',
    summary: 'In the floor hypothetical, option-year buyouts become deemed Signing Bonus',
    alternative: 'Ignore buyouts in the hypothetical',
  },
  X1: { cite: 'Art. XVI, p.89', tag: 'TEXT', summary: 'Fund by the second July 1 after the season earned' },
  X2: { cite: 'Art. XVI, p.89', tag: 'TEXT', summary: 'Maintain PV of outstanding payments at 5%' },
  X3: { cite: 'Art. XVI, p.89', tag: 'TEXT', summary: '5% may change only by agreement after a prime rate ≥ 7%' },
  X4: {
    cite: 'Art. XVI, p.89; XXIII(A), p.115',
    tag: 'INTERP',
    summary: '"Earned" season = Art. XXIII attributed season',
    alternative: 'Art. XVI "earned" defined independently',
  },
  X5: { cite: '—', tag: 'CONV', summary: 'July 1 snapshots, whole years; same-day payments count as paid' },
  END: { cite: '—', tag: 'CONV', summary: 'Declining an option or taking an opt-out ends the contract' },
} as const satisfies Record<string, Rule>;

export type RuleId = keyof typeof RULES;
