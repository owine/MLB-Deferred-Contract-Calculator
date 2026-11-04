// Article XVI funding: X1, X2, X4, X5 (spec §3).
import type { Piece } from './deferral';

export const FUNDING_RATE_PCT = 5; // X2 (X3: may change only by agreement after a prime rate ≥ 7%)

export function computeFunding(pieces: Piece[]): { snapshots: { july1: number; required: number }[]; peak: number } {
  if (pieces.length === 0) return { snapshots: [], peak: 0 };
  // X1 + X4: a piece must be funded from the second July 1 after its attributed season.
  const start = Math.min(...pieces.map((p) => p.season + 2));
  const end = Math.max(...pieces.map((p) => p.year));
  const snapshots: { july1: number; required: number }[] = [];
  for (let y = start; y <= end; y++) {
    // X5: whole years; a payment due on the snapshot date counts as already paid.
    const required = pieces
      .filter((p) => p.season + 2 <= y && p.year > y)
      .reduce((s, p) => s + p.cash / Math.pow(1 + FUNDING_RATE_PCT / 100, p.year - y), 0);
    snapshots.push({ july1: y, required });
  }
  return { snapshots, peak: snapshots.length ? Math.max(...snapshots.map((s) => s.required)) : 0 };
}
