import { describe, expect, it } from 'vitest';
import { moneyInputValue, parseMoney } from '../format';

describe('parseMoney', () => {
  it.each([
    ['1,250,000', 1_250_000],
    ['$5,000', 5_000],
    [' 42 ', 42],
    ['1234.56', 1234.56],
    ['-500', -500],
  ])('plain amount %j → %d', (text, n) => expect(parseMoney(text)).toBe(n));

  it.each([
    ['100k', 100_000],
    ['100K', 100_000],
    ['100m', 100_000_000],
    ['100M', 100_000_000],
    ['1b', 1_000_000_000],
    ['$2.5m', 2_500_000],
    ['1.15m', 1_150_000], // 1.15 * 1e6 is 1149999.9999999998 in floating point
    ['0.1k', 100],
    ['.5m', 500_000],
    ['1,500k', 1_500_000],
    ['25 m', 25_000_000],
    ['-2m', -2_000_000],
    ['1.234567k', 1234.57], // rounds to the cent
  ])('shorthand %j → %d', (text, n) => expect(parseMoney(text)).toBe(n));

  it.each(['', '   ', '$', 'k', 'm', '5mm', '5km', 'm5', '5x', 'abc', '1.2.3m'])('rejects %j as NaN', (text) =>
    expect(parseMoney(text)).toBeNaN(),
  );

  it('expands to the separator form the field shows on blur', () => {
    expect(moneyInputValue(parseMoney('100k'))).toBe('100,000');
    expect(moneyInputValue(parseMoney('100m'))).toBe('100,000,000');
  });
});
