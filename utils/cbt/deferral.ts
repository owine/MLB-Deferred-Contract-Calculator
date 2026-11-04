// Deferred compensation cost (F1–F7) and signing-bonus cost (A2, A7). Spec §2.3–§2.4.
import { sortedSeasons } from './classify';
import type { RuleId } from './rules';
import type { ContractInput, Payment, SeasonClass } from './types';

const EPS = 1e-9;

/** A slice of one cash payment attributed to one season. */
export interface Piece {
  season: number;
  year: number;
  cash: number;
  /** Attributed cost: stated value (F3 band) or PV at the ILIR (F3, F5). */
  cost: number;
}

export interface DeferralResult {
  costBySeason: Map<number, number>;
  pieces: Piece[];
  /** Sequential mode: principal never paid, and cash with no principal left to pay (F7 consistency). */
  unpaidPrincipal: number;
  excessCash: number;
}

/** F3 + F6: stated interest within 1.5 percentage points of the ILIR (inclusive) → stated value. */
export function withinStatedBand(statedPct: number, ilirPct: number): boolean {
  return Math.abs(statedPct - ilirPct) <= 1.5 + EPS;
}

function discount(cash: number, years: number, ratePct: number) {
  return cash / Math.pow(1 + ratePct / 100, years); // F5: whole years, annual compounding
}

function sumInto(map: Map<number, number>, key: number, v: number) {
  map.set(key, (map.get(key) ?? 0) + v);
}

export function deferralCosts(input: ContractInput, classes: SeasonClass[]): DeferralResult {
  const { payments, attribution, statedInterestPct: s } = input.deferral;
  const band = withinStatedBand(s, input.ilirPct);
  const pieces: Piece[] = [];
  const costBySeason = new Map<number, number>();
  const sortedPayments = [...payments].sort((a, b) => a.year - b.year);
  let unpaidPrincipal = 0;
  let excessCash = 0;

  if (attribution === 'sequential') {
    // F4(a) + F7: first-earned principal is paid first. Cash c paid n years after season t
    // retires principal c / (1+s)^n; its cost is that principal (band) or c / (1+ILIR)^n.
    const queue = sortedSeasons(input)
      .filter((r) => r.deferred > 0)
      .map((r) => ({ season: r.season, remaining: r.deferred }));
    for (const p of sortedPayments) {
      let cashLeft = p.amount;
      while (cashLeft > EPS && queue.length > 0) {
        const t = queue[0];
        const n = p.year - t.season;
        const growth = Math.pow(1 + s / 100, n);
        const principal = Math.min(t.remaining, cashLeft / growth);
        const cash = principal * growth;
        const cost = band ? principal : discount(cash, n, input.ilirPct);
        pieces.push({ season: t.season, year: p.year, cash, cost });
        t.remaining -= principal;
        cashLeft -= cash;
        if (t.remaining <= EPS) queue.shift();
      }
      excessCash += Math.max(0, cashLeft);
    }
    unpaidPrincipal = queue.reduce((sum, t) => sum + t.remaining, 0);
    for (const pc of pieces) sumInto(costBySeason, pc.season, pc.cost);
  } else {
    // F4(b): attributed equally to each Guaranteed Year; each payment split equally (payment split: [CONV]).
    const g = classes.filter((c) => c.isGuaranteed).map((c) => c.season);
    if (g.length > 0) {
      for (const p of sortedPayments) {
        for (const season of g) {
          const cash = p.amount / g.length;
          const n = p.year - season;
          pieces.push({ season, year: p.year, cash, cost: band ? cash / Math.pow(1 + s / 100, n) : discount(cash, n, input.ilirPct) });
        }
      }
      const principal = input.deferral.unattributedPrincipal ?? 0;
      for (const season of g) {
        const fromPieces = pieces.filter((pc) => pc.season === season).reduce((sum, pc) => sum + pc.cost, 0);
        // F3 band: stated value is the principal itself (F4(b) takes it from unattributedPrincipal).
        costBySeason.set(season, band ? principal / g.length : fromPieces);
      }
    }
  }
  return { costBySeason, pieces, unpaidPrincipal, excessCash };
}

export interface BonusResult {
  /** Total attributed cost: in-term installments at nominal, after-term installments discounted (A7). */
  cost: number;
  nominal: number;
  /** A7 pieces (installments after the last Guaranteed season), split over the Guaranteed Years. */
  deferredPieces: Piece[];
}

/** Signing-bonus cash schedule. With no installments, the whole bonus is paid in the first season (in term: nominal, A2). */
export function bonusSchedule(input: ContractInput): Payment[] {
  const { amount, payments } = input.signingBonus;
  if (payments.length > 0) return payments;
  return [{ year: sortedSeasons(input)[0]?.season ?? -Infinity, amount }];
}

export function signingBonusCost(input: ContractInput, classes: SeasonClass[]): BonusResult {
  const { amount } = input.signingBonus;
  const g = classes.filter((c) => c.isGuaranteed).map((c) => c.season);
  const lastG = g.length ? Math.max(...g) : -Infinity;
  const band = withinStatedBand(0, input.ilirPct); // signing bonuses carry no stated interest
  const deferredPieces: Piece[] = [];
  let cost = 0;
  for (const p of bonusSchedule(input)) {
    if (p.year <= lastG || g.length === 0) {
      cost += p.amount; // A2: in-term installments count at nominal
      continue;
    }
    for (const season of g) {
      const cash = p.amount / g.length;
      const pieceCost = band ? cash : discount(cash, p.year - season, input.ilirPct);
      deferredPieces.push({ season, year: p.year, cash, cost: pieceCost });
      cost += pieceCost;
    }
  }
  return { cost, nominal: amount, deferredPieces };
}

/** Rules behind a charge that includes deferred cost (F2, F3, F4a|F4b, F5, F7). */
export function deferralRuleIds(input: ContractInput): RuleId[] {
  return ['F2', 'F3', input.deferral.attribution === 'sequential' ? 'F4a' : 'F4b', 'F5', 'F7'];
}

/** Rules behind the deferred part of the AAV: F2–F7 when a Guaranteed season has deferred cost, A7 when a bonus installment is discounted. */
export function aavDeferralRules(input: ContractInput, classes: SeasonClass[], deferral: DeferralResult, bonus: BonusResult): RuleId[] {
  const rules: RuleId[] = [];
  if (classes.some((c) => c.isGuaranteed && (deferral.costBySeason.get(c.season) ?? 0) > 0)) rules.push(...deferralRuleIds(input));
  if (bonus.deferredPieces.length > 0) rules.push('A7');
  return rules;
}
