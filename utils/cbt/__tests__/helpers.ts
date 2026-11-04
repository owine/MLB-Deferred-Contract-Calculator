// Test helpers. Worked examples (spec §8) are in $M; season 1 = 2026.
import type { ContractInput, SeasonRow } from '../types';

export const Y1 = 2026;

type Row = Partial<SeasonRow> & { currentSalary: number };

export function build(rows: Row[], opts: Partial<ContractInput> = {}): ContractInput {
  return {
    seasons: rows.map((r, i) => ({ season: Y1 + i, deferred: 0, kind: 'guaranteed', ...r })),
    signingBonus: { amount: 0, payments: [] },
    optOuts: [],
    deferral: { payments: [], attribution: 'sequential', statedInterestPct: 0 },
    ilirPct: 0,
    ...opts,
  };
}

/** n guaranteed seasons at `salary`. */
export const guaranteed = (n: number, salary: number): Row[] => Array.from({ length: n }, () => ({ currentSalary: salary }));
