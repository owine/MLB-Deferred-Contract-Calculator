// Scenario helpers for tests that need the full engine (added with index.ts).
import { calculate, defaultScenario, type ContractInput, type Result, type Scenario } from '..';
import { Y1 } from './helpers';

export function run(input: ContractInput, overrides: Partial<Scenario> = {}): Result {
  const base = defaultScenario(input);
  return calculate(input, { ...base, ...overrides, options: { ...base.options, ...overrides.options } });
}

/** CBT charged in contract year `n` (1-based). */
export const yr = (res: Result, n: number) => res.perSeason.find((p) => p.season === Y1 + n - 1)?.cbt ?? 0;
