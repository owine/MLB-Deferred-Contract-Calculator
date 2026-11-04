// Number formatting for the UI (moved from the former utils/calculations.ts).

export const formatMoney = (amount: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);

export const formatMillions = (amount: number): string => {
  const millions = amount / 1_000_000;
  return `${millions < 0 ? '−' : ''}$${Math.abs(millions).toLocaleString('en-US', { maximumFractionDigits: 2 })}M`;
};

const SHORTHAND: Record<string, number> = { k: 1e3, m: 1e6, b: 1e9 };

/**
 * Parse a user-typed money string into a number; empty or unreadable → NaN. Accepts "1,250,000", "$5,000", and
 * k/m/b shorthand ("100k" → 100,000, "2.5m" → 2,500,000, case-insensitive). Shorthand amounts are rounded to the
 * cent, because 1.15 × 1e6 is 1149999.9999999998 in floating point.
 */
export const parseMoney = (text: string): number => {
  const cleaned = text.replace(/[$,\s]/g, '');
  if (cleaned === '') return NaN;
  const multiplier = SHORTHAND[cleaned.slice(-1).toLowerCase()];
  if (multiplier === undefined) return Number(cleaned);
  const base = cleaned.slice(0, -1);
  return base === '' ? NaN : Math.round(Number(base) * multiplier * 100) / 100;
};

/** Show a number in an input: thousands separators, empty string for NaN. */
export const moneyInputValue = (n: number): string => (Number.isFinite(n) ? n.toLocaleString('en-US') : '');
