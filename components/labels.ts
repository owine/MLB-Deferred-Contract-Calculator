// Display text shared by several components. Kept out of the component files so each .tsx exports only components (React Fast Refresh).
import type { Tag, YearKind } from '../utils/cbt';

export const KIND_LABELS: Record<YearKind, string> = {
  guaranteed: 'Guaranteed',
  club: 'Club option',
  mutual: 'Mutual option',
  vesting: 'Vesting option',
  player: 'Player option',
  dual: 'Dual option',
};

export const TAG_HELP: Record<Tag, string> = {
  TEXT: 'stated directly in the CBA',
  PRACTICE: 'CBA ambiguous; matches what MLB actually charged',
  INTERP: 'CBA ambiguous; this calculator’s reading',
  CONV: 'CBA silent; modeling convention',
};
