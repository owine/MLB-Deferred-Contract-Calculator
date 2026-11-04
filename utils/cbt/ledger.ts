// Cash and CBT ledgers: perSeason and totals (spec §5.1 Result, §5.2).
import { sortedSeasons } from './classify';
import { bonusSchedule, type BonusResult, type DeferralResult, type Piece } from './deferral';
import { attributedCost, type OutcomeResult } from './outcome';
import type { ContractInput, Result, Scenario } from './types';

export interface Ledger {
  perSeason: Result['perSeason'];
  totals: Result['totals'];
  /** Deferral pieces of the played seasons (the cash actually owed). */
  deferralPieces: Piece[];
}

export function computeLedger(
  input: ContractInput,
  scenario: Scenario,
  deferral: DeferralResult,
  bonus: BonusResult,
  outcome: OutcomeResult,
): Ledger {
  const rows = new Map(sortedSeasons(input).map((r) => [r.season, r]));
  const playedSet = new Set(outcome.played.map((c) => c.season));
  const deferralPieces = deferral.pieces.filter((p) => playedSet.has(p.season));

  // Cash by calendar year (nominal).
  const cash = new Map<number, number>();
  const addCash = (year: number, v: number) => cash.set(year, (cash.get(year) ?? 0) + v);
  for (const c of outcome.played) addCash(c.season, rows.get(c.season)!.currentSalary + (scenario.earnedBonuses[c.season] ?? 0));
  for (const p of bonusSchedule(input)) addCash(p.year, p.amount);
  for (const p of deferralPieces) addCash(p.year, p.cash);
  if (outcome.received) addCash(outcome.received.season, outcome.received.amount);

  const cbt = new Map<number, number>();
  for (const ch of outcome.charges) cbt.set(ch.season, (cbt.get(ch.season) ?? 0) + ch.amount);
  const years = [...new Set([...cash.keys(), ...cbt.keys()])].sort((a, b) => a - b);
  const perSeason = years.map((season) => ({ season, cbt: cbt.get(season) ?? 0, cash: cash.get(season) ?? 0 }));

  return {
    perSeason,
    totals: {
      cbt: outcome.charges.reduce((s, ch) => s + ch.amount, 0),
      cash: [...cash.values()].reduce((s, v) => s + v, 0),
      attributedCost: attributedCost(input, scenario, outcome.played, deferral, bonus, outcome.received),
    },
    deferralPieces,
  };
}
