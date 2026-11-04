// Pure helpers for editing a ContractInput and keeping a Scenario consistent with it.
// The UI components call these; no React here, so they are unit-tested directly.
import { defaultScenario, type ContractInput, type Payment, type Scenario, type SeasonRow } from './cbt';

export const sortRows = (rows: SeasonRow[]) => [...rows].sort((a, b) => a.season - b.season);

/** Set every season's current salary to an equal share of `total`, in cents, the last season taking the remainder. */
export function fillEvenly(input: ContractInput, total: number): ContractInput {
  const shares = equalPayments(0, input.seasons.length, total).map((p) => p.amount);
  const order = sortRows(input.seasons).map((r) => r.season);
  return { ...input, seasons: input.seasons.map((r) => ({ ...r, currentSalary: shares[order.indexOf(r.season)] ?? 0 })) };
}

/** Grow or shrink the contract to `length` seasons. New seasons copy the last season's pay as guaranteed years. */
export function setLength(input: ContractInput, length: number): ContractInput {
  const rows = sortRows(input.seasons);
  if (!Number.isInteger(length) || length < 1 || rows.length === 0 || length === rows.length) return input;
  const last = rows[rows.length - 1];
  const next =
    length <= rows.length
      ? rows.slice(0, length)
      : [
          ...rows,
          ...Array.from({ length: length - rows.length }, (_, i): SeasonRow => ({
            season: last.season + i + 1,
            currentSalary: last.currentSalary,
            deferred: 0,
            kind: 'guaranteed',
          })),
        ];
  const lastSeason = next[next.length - 1].season;
  return { ...input, seasons: next, optOuts: input.optOuts.filter((o) => o.afterSeason < lastSeason) };
}

/** Move the whole contract to start in `year`, shifting seasons, opt-outs and every payment by the same offset. */
export function setStartSeason(input: ContractInput, year: number): ContractInput {
  const rows = sortRows(input.seasons);
  if (!Number.isInteger(year) || rows.length === 0) return input;
  const d = year - rows[0].season;
  if (d === 0) return input;
  const shift = (p: Payment): Payment => ({ ...p, year: p.year + d });
  return {
    ...input,
    seasons: rows.map((r) => ({ ...r, season: r.season + d })),
    optOuts: input.optOuts.map((o) => ({ ...o, afterSeason: o.afterSeason + d })),
    signingBonus: { ...input.signingBonus, payments: input.signingBonus.payments.map(shift) },
    deferral: { ...input.deferral, payments: input.deferral.payments.map(shift) },
  };
}

export function updateRow(input: ContractInput, season: number, patch: Partial<SeasonRow>): ContractInput {
  return {
    ...input,
    seasons: input.seasons.map((r) => {
      if (r.season !== season) return r;
      const next: SeasonRow = { ...r, ...patch };
      // Option-only fields go away when a row becomes guaranteed; guaranteedIfExercised only applies to player/dual.
      if (next.kind === 'guaranteed') delete next.buyout;
      if (next.kind !== 'player' && next.kind !== 'dual') delete next.guaranteedIfExercised;
      return next;
    }),
  };
}

/** Add an opt-out after `afterSeason` (payment 0), or remove it if one is already there. */
export function toggleOptOut(input: ContractInput, afterSeason: number): ContractInput {
  const exists = input.optOuts.some((o) => o.afterSeason === afterSeason);
  return {
    ...input,
    optOuts: exists
      ? input.optOuts.filter((o) => o.afterSeason !== afterSeason)
      : [...input.optOuts, { afterSeason, payment: 0 }].sort((a, b) => a.afterSeason - b.afterSeason),
  };
}

export function setOptOutPayment(input: ContractInput, afterSeason: number, payment: number): ContractInput {
  return { ...input, optOuts: input.optOuts.map((o) => (o.afterSeason === afterSeason ? { ...o, payment } : o)) };
}

/** `count` equal yearly payments of `total`, starting in `firstYear`. The last payment absorbs rounding. */
export function equalPayments(firstYear: number, count: number, total: number): Payment[] {
  if (!(count >= 1) || !Number.isFinite(total)) return [];
  const each = Math.round((total / count) * 100) / 100;
  return Array.from({ length: count }, (_, i) => ({
    year: firstYear + i,
    amount: i === count - 1 ? Math.round((total - each * (count - 1)) * 100) / 100 : each,
  }));
}

export const totalDeferred = (input: ContractInput) => input.seasons.reduce((s, r) => s + (Number.isFinite(r.deferred) ? r.deferred : 0), 0);

export const hasDeferral = (input: ContractInput) =>
  totalDeferred(input) > 0 || input.deferral.payments.length > 0 || input.deferral.attribution === 'unattributed';

/**
 * Keep a Scenario valid for an edited contract: option decisions only for option seasons (defaults filled in),
 * an opt-out only if it still exists, earned bonuses only for contract seasons.
 */
export function syncScenario(input: ContractInput, scenario: Scenario): Scenario {
  const defaults = defaultScenario(input);
  const options: Scenario['options'] = {};
  for (const key of Object.keys(defaults.options)) {
    const season = Number(key);
    options[season] = scenario.options[season] ?? defaults.options[season];
  }
  const seasons = new Set(input.seasons.map((r) => r.season));
  const earnedBonuses: Scenario['earnedBonuses'] = {};
  for (const [key, value] of Object.entries(scenario.earnedBonuses)) if (seasons.has(Number(key))) earnedBonuses[Number(key)] = value;
  const optOutTakenAfter = input.optOuts.some((o) => o.afterSeason === scenario.optOutTakenAfter) ? scenario.optOutTakenAfter : null;
  return { options, optOutTakenAfter, earnedBonuses };
}
