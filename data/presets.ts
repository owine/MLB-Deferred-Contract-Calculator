// Real-contract presets (spec §7). Every term comes from a named public source; no estimates.
import type { ContractInput } from '../utils/cbt';

export interface Source {
  url: string;
  confirms: string;
}

export interface Preset {
  id: 'ohtani' | 'scherzer' | 'bellinger' | 'standard';
  name: string;
  note?: string;
  input: ContractInput;
  sources: Source[];
  /** Officially reported CBT figure per season, when one exists, with its published precision. */
  reported?: { seasons: number[]; cbt: number; tolerance: number; note: string };
}

const M = 1_000_000;
const range = (from: number, count: number) => Array.from({ length: count }, (_, i) => from + i);

export const PRESETS: Preset[] = [
  {
    id: 'ohtani',
    name: 'Shohei Ohtani (LAD, 2024–33)',
    input: {
      seasons: range(2024, 10).map((season) => ({ season, currentSalary: 2 * M, deferred: 68 * M, kind: 'guaranteed' })),
      signingBonus: { amount: 0, payments: [] },
      optOuts: [],
      deferral: {
        payments: range(2034, 10).map((year) => ({ year, amount: 68 * M })),
        attribution: 'sequential',
        statedInterestPct: 0,
      },
      ilirPct: 4.43, // October 2023 annual mid-term AFR (PBGC historical table)
    },
    sources: [
      { url: 'https://sports.yahoo.com/much-shohei-ohtani-contract-cost-204524279.html', confirms: '$68M/yr deferred, paid July 1 2034–43, no interest' },
      { url: 'https://pivotal180.com/what-ohtanis-contract-can-teach-us-about-discount-rates/', confirms: '$46.08M CBT AAV; deferrals discounted 10 years' },
      { url: 'https://www.pbgc.gov/employers-practitioners/interest-rates/historical-applicable-mid-term', confirms: 'October 2023 mid-term AFR 4.43%' },
    ],
    reported: { seasons: range(2024, 10), cbt: 46.08 * M, tolerance: 5_000, note: 'Published to $10K' },
  },
  {
    id: 'scherzer',
    name: 'Max Scherzer (WSH, 2015–21)',
    note: 'Signed under the 2012–16 CBA; 2022–26 rules applied.',
    input: {
      seasons: [10, 15, 15, 15, 0, 0, 0].map((cur, i) => ({
        season: 2015 + i,
        currentSalary: cur * M,
        deferred: i >= 4 ? 35 * M : 0,
        kind: 'guaranteed',
      })),
      signingBonus: {
        amount: 50 * M,
        payments: [
          { year: 2015, amount: 5 * M },
          { year: 2019, amount: 15 * M },
          { year: 2020, amount: 15 * M },
          { year: 2021, amount: 15 * M },
        ],
      },
      optOuts: [],
      deferral: { payments: range(2022, 7).map((year) => ({ year, amount: 15 * M })), attribution: 'sequential', statedInterestPct: 0 },
      ilirPct: 1.85, // October 2014 annual mid-term AFR (Rev. Rul. 2014-26)
    },
    sources: [
      { url: 'https://www.si.com/mlb/2015/01/22/ap-bbn-nationals-scherzer-contract-explainer', confirms: 'Salaries, $50M bonus schedule, $105M deferred paid 2022–28, $28,689,376 CBT' },
      { url: 'https://www.tsn.ca/mlb/scherzer-s-contract-with-nationals-has-present-day-value-of-191-4m-by-mlb-s-calculation-1.188837', confirms: 'MLB present-day value (a different calculation from CBT)' },
      { url: 'https://www.irs.gov/pub/irs-drop/rr-14-26.pdf', confirms: 'October 2014 mid-term AFR 1.85%' },
    ],
    reported: { seasons: range(2015, 7), cbt: 28_689_376, tolerance: 1_000, note: 'Unexplained $648/yr residual (spec §2.4.1)' },
  },
  {
    id: 'bellinger',
    name: 'Cody Bellinger (NYY, 2026–30)',
    input: {
      seasons: [32.5, 32.5, 25.8, 25.8, 25.9].map((cur, i) => ({ season: 2026 + i, currentSalary: cur * M, deferred: 0, kind: 'guaranteed' })),
      signingBonus: { amount: 20 * M, payments: [{ year: 2026, amount: 10 * M }, { year: 2026, amount: 10 * M }] },
      optOuts: [
        { afterSeason: 2027, payment: 0 },
        { afterSeason: 2028, payment: 0 },
      ],
      deferral: { payments: [], attribution: 'sequential', statedInterestPct: 0 },
      ilirPct: 0, // not used: no deferred compensation
    },
    sources: [
      { url: 'https://www.mlbtraderumors.com/2026/01/cody-bellinger-contract-comes-with-higher-luxury-tax-hit-for-yankees-in-first-two-seasons.html', confirms: 'Salaries, bonus, opt-outs after the 2nd and 3rd seasons, $44.75M' },
      { url: 'https://www.forbes.com/sites/danfreedman/2026/02/06/yankees-re-sign-cody-bellinger-at-an-exceedingly-high-cost/', confirms: '$44.75M CBT' },
      { url: 'https://x.com/GaryHPhillips/status/2016963278056886294', confirms: '$48.55M 2026 total incl. $3.8M prior-contract true-up' },
    ],
    reported: { seasons: [2026, 2027], cbt: 44.75 * M, tolerance: 0.01, note: 'Exact' },
  },
  {
    id: 'standard',
    name: 'Standard (5 × $20M)',
    input: {
      seasons: range(2027, 5).map((season) => ({ season, currentSalary: 20 * M, deferred: 0, kind: 'guaranteed' })),
      signingBonus: { amount: 0, payments: [] },
      optOuts: [],
      deferral: { payments: [], attribution: 'sequential', statedInterestPct: 0 },
      ilirPct: 0,
    },
    sources: [],
    reported: { seasons: range(2027, 5), cbt: 20 * M, tolerance: 0.01, note: 'Identity: no options, bonus or deferrals' },
  },
];
