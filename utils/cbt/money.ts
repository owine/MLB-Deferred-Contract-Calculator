// Money tolerance shared by comparisons that decide whether an amount exists.
/**
 * Engine amounts are in dollars, so MONEY_EPS is half a cent. The test fixtures in utils/cbt/__tests__ use $M
 * units, so there it acts as $5,000.
 */
export const MONEY_EPS = 0.005;
