// Number formatting for the UI (moved from the former utils/calculations.ts).

export const formatMoney = (amount: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);

export const formatMillions = (amount: number): string => {
  const millions = amount / 1_000_000;
  return `${millions < 0 ? '−' : ''}$${Math.abs(millions).toLocaleString('en-US', { maximumFractionDigits: 2 })}M`;
};

/** Parse a user-typed money string ("1,250,000", "$5M" is not supported) into a number; empty → NaN. */
export const parseMoney = (text: string): number => {
  const cleaned = text.replace(/[$,\s]/g, '');
  return cleaned === '' ? NaN : Number(cleaned);
};

/** Show a number in an input: thousands separators, empty string for NaN. */
export const moneyInputValue = (n: number): string => (Number.isFinite(n) ? n.toLocaleString('en-US') : '');
