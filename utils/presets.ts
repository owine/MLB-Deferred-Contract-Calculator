import type { Preset } from '../data/presets';
import { calculate, defaultScenario } from './cbt';

export interface Reconciliation {
  engine: number;
  reported: number;
  delta: number;
}

/** Reported CBT vs engine CBT for a preset's reported seasons, under its default scenario (spec §6). Reports the worst season. */
export function reconcile(preset: Preset): Reconciliation | null {
  const { reported } = preset;
  if (!reported) return null;
  const r = calculate(preset.input, defaultScenario(preset.input));
  const values = reported.seasons.map((s) => r.perSeason.find((p) => p.season === s)?.cbt ?? 0);
  const worst = values.reduce((w, v) => (Math.abs(v - reported.cbt) > Math.abs(w - reported.cbt) ? v : w), values[0]);
  const delta = Math.round(worst - reported.cbt);
  return { engine: worst, reported: reported.cbt, delta: delta === 0 ? 0 : delta }; // no "-$0"
}
