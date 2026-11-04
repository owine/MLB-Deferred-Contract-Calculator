// Types for the CBT contract engine.
// Spec: docs/superpowers/specs/2026-11-04-cbt-contract-engine-design.md (§5.1)
import type { RuleId } from './rules';

export type YearKind = 'guaranteed' | 'club' | 'mutual' | 'vesting' | 'player' | 'dual';

export interface SeasonRow {
  /** Calendar year of the championship season (D1). */
  season: number;
  /** Pay for this season paid during the term. This is "Base Salary" for all Art. XXIII tests (D5). */
  currentSalary: number;
  /** Principal attributed to this season as Deferred Compensation (F2, F7). Ignored in 'unattributed' mode. */
  deferred: number;
  /** 'guaranteed' rows after an opt-out become Player Option Years in classify (Y4). */
  kind: YearKind;
  /** Option rows only: paid if the option is not exercised. One payment, at the decision. */
  buyout?: number;
  /** player/dual rows: A(8) condition for Y2. Default true. */
  guaranteedIfExercised?: boolean;
}

export interface OptOut {
  /** The player may opt out after this season. */
  afterSeason: number;
  /** Paid to the player if he opts out (Y3). */
  payment: number;
}

export interface Payment {
  year: number;
  amount: number;
}

export interface DeferralSchedule {
  /** Actual cash paid, interest included (F7). Every year must be after the maximum term (F1). */
  payments: Payment[];
  /** F4(a) sequential (contract attributes) or F4(b) unattributed (CBA default). */
  attribution: 'sequential' | 'unattributed';
  /** F3. Default 0. */
  statedInterestPct: number;
  /** F4(b) only: total principal at stated value. */
  unattributedPrincipal?: number;
}

export interface ContractInput {
  seasons: SeasonRow[];
  signingBonus: { amount: number; payments: Payment[] };
  optOuts: OptOut[];
  deferral: DeferralSchedule;
  /** Imputed Loan Interest Rate, percent (D2). */
  ilirPct: number;
}

export interface Scenario {
  /** Keyed by season. Vesting rows: 'exercised' means vested (O5). [CONV] Declining ends the contract. */
  options: Record<number, 'exercised' | 'declined'>;
  /** Must equal an OptOut.afterSeason, or null. [CONV] Taking an opt-out ends the contract. */
  optOutTakenAfter: number | null;
  /** B1: bonuses actually earned, keyed by season. */
  earnedBonuses: Record<number, number>;
}

export type EffectiveKind = 'guaranteed' | 'club' | 'player';

export interface SeasonClass {
  season: number;
  /** Treatment kind: mutual/vesting → club (Y1, Y6); dual → player (Y5); opt-out rows → player (Y4). */
  effectiveKind: EffectiveKind;
  isGuaranteed: boolean;
  /** True when this season is a Player Option Year because it follows an opt-out (Y4). */
  viaOptOut: boolean;
  /** Buyout attached to this season. For the first season after a failing opt-out, the opt-out payment (Y3). */
  buyout: number;
  rules: RuleId[];
}

/**
 * What a charge is: 'aav' (A1), 'valley' (V4 allocation), 'valleyCredit' (V7), 'option' (O1/O5, O2 on an
 * exercised option, O6), 'trueUp' (O7), 'buyout' (O4 paid, O2 on a void season), 'bonus' (B1).
 */
export type ChargeKind = 'aav' | 'valley' | 'valleyCredit' | 'option' | 'trueUp' | 'buyout' | 'bonus';

export interface Charge {
  season: number;
  amount: number;
  label: string;
  kind: ChargeKind;
  /** Every rule that determined the amount (spec §6). */
  rules: RuleId[];
}

export interface Flag {
  rule: RuleId;
  message: string;
}

export interface Result {
  classification: SeasonClass[];
  aavAtSigning: number;
  charges: Charge[];
  perSeason: { season: number; cbt: number; cash: number }[];
  totals: { cbt: number; cash: number; attributedCost: number };
  funding: { snapshots: { july1: number; required: number }[]; peak: number };
  flags: Flag[];
}
