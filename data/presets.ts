// Real-contract presets (spec §7). Every term comes from a named public source; no estimates.
import type { ContractInput } from '../utils/cbt';

export interface Source {
  url: string;
  confirms: string;
}

export type PresetGroup = 'Deferred money' | 'Signing bonus' | 'Opt-outs' | 'Club options' | 'Basic';

export interface Preset {
  id: string;
  name: string;
  /** Which rule family the contract illustrates (groups the preset picker). */
  group: PresetGroup;
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
    group: 'Deferred money',
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
    group: 'Deferred money',
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
    group: 'Opt-outs',
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
    id: 'snell',
    group: 'Deferred money',
    name: 'Blake Snell (LAD, 2025–29)',
    note:
      'Spotrac’s luxury-tax figure matches sequential attribution to the dollar. The AP’s “about $31.4M” (and FanGraphs’ $31,357,257) match the CBA-default unattributed mode — switch Attribution to see it. The 2030 club option only exists if he spends 90+ straight days on the IL for a specific injury; whether that was triggered is disputed. No buyout reported.',
    input: {
      seasons: [
        ...range(2025, 5).map((season) => ({ season, currentSalary: 12.8 * M, deferred: 13.2 * M, kind: 'guaranteed' as const })),
        { season: 2030, currentSalary: 10 * M, deferred: 0, kind: 'club' as const },
      ],
      signingBonus: { amount: 52 * M, payments: [{ year: 2025, amount: 52 * M }] },
      optOuts: [],
      deferral: { payments: range(2035, 12).map((year) => ({ year, amount: 5.5 * M })), attribution: 'sequential', statedInterestPct: 0 },
      ilirPct: 3.7, // October 2024 annual mid-term AFR (Rev. Rul. 2024-21)
    },
    sources: [
      { url: 'https://www.espn.com/mlb/story/_/id/42760649/dodgers-deferred-payments-top-1-billion-7-players', confirms: 'AP: $52M bonus, $26M salaries with $13.2M deferred, $66M paid July 1 2035–46, “about $31.4 million” for the tax' },
      { url: 'https://www.mlbtraderumors.com/2024/12/blake-snells-deal-with-dodgers-includes-conditional-club-option.html', confirms: '$10M conditional 2030 club option, deferrals without interest' },
      { url: 'https://www.spotrac.com/mlb/player/_/id/18356/blake-snell', confirms: 'Luxury tax $31,306,185 per season 2025–29' },
      { url: 'https://www.irs.gov/pub/irs-drop/rr-24-21.pdf', confirms: 'October 2024 mid-term AFR 3.70%' },
    ],
    reported: { seasons: range(2025, 5), cbt: 31_306_185, tolerance: 1, note: 'Spotrac, to the dollar' },
  },
  {
    id: 'bregman-chc',
    group: 'Deferred money',
    name: 'Alex Bregman (CHC, 2026–30)',
    note:
      'Each season’s deferral is spread across all eight installments (pro-rata). The AP’s per-season installment for 2027–28 is misprinted as $1.875M; $10M over 8 payments is $1.25M. No interest reported.',
    input: {
      seasons: [15, 10, 10, 15, 20].map((d, i) => ({ season: 2026 + i, currentSalary: (35 - d) * M, deferred: d * M, kind: 'guaranteed' as const })),
      signingBonus: { amount: 0, payments: [] },
      optOuts: [],
      deferral: { payments: range(2034, 8).map((year) => ({ year, amount: 8.75 * M })), attribution: 'prorata', statedInterestPct: 0 },
      ilirPct: 3.87, // October 2025 annual mid-term AFR (Rev. Rul. 2025-19)
    },
    sources: [
      { url: 'https://capitolcitynow.com/news/248842-chicago-cubs-finalize-contract-with-all-star-third-baseman-alex-bregman/', confirms: 'AP: $35M a year, deferrals 15/10/10/15/20, paid in 8 installments 2034–41' },
      { url: 'https://www.mlbtraderumors.com/2026/03/offseason-in-review-chicago-cubs-18.html', confirms: 'Net present value $154,469,510 (÷ 5 = $30,893,902)' },
      { url: 'http://cubsinsider.com/2026/01/15/alex-bregmans-deferrals-lower-aav-to-30-9-million-maybe-less/', confirms: 'Correct per-season installments; RosterResource “nearly $30.9 million”' },
    ],
    reported: { seasons: range(2026, 5), cbt: 30_893_902, tolerance: 1, note: 'MLBTR present value ÷ 5 (also Spotrac)' },
  },
  {
    id: 'vlad',
    group: 'Signing bonus',
    name: 'Vladimir Guerrero Jr. (TOR, 2026–39)',
    note:
      'A $325M signing bonus paid in 15 installments (from 2025) and spread evenly over the 14 Guaranteed Years. The 2025 season ($28.5M) was a separate deal. The reported figure is the AAV; with no deferrals, A1 makes the CBT charge the same.',
    input: {
      seasons: [17, 17, 16, 15, 14.5, 14.5, 14.5, 12.5, 12.5, 11.5, 10.5, 7, 6.5, 6].map((s, i) => ({ season: 2026 + i, currentSalary: s * M, deferred: 0, kind: 'guaranteed' as const })),
      signingBonus: {
        amount: 325 * M,
        payments: [20, 13, 14, 16, 18, 20, 20, 20, 22, 22, 23, 24, 29, 31, 33].map((a, i) => ({ year: 2025 + i, amount: a * M })),
      },
      optOuts: [],
      deferral: { payments: [], attribution: 'sequential', statedInterestPct: 0 },
      ilirPct: 0, // not used: no deferred compensation
    },
    sources: [
      { url: 'https://www.foxsports.com/articles/mlb/vladimir-guerrero-jr-salaries-frontloaded-in-500-million-14year-contract-with-blue-jays', confirms: 'AP: salaries and bonus installments by year' },
      { url: 'https://www.mlbtraderumors.com/2025/04/blue-jays-vladimir-guerrero-jr-reportedly-making-progress-towards-extension.html', confirms: 'No deferrals or opt-outs; $35.714MM AAV' },
      { url: 'https://www.theglobeandmail.com/sports/baseball/article-blue-jays-confirm-us500-million-14-year-extension-for-slugger-vladimir/', confirms: 'Official announcement; “$35.71-million average annual value”' },
    ],
    reported: { seasons: range(2026, 14), cbt: 35_714_000, tolerance: 1_000, note: 'MLBTR “$35.714MM”, published to $1K' },
  },
  {
    id: 'soto',
    group: 'Signing bonus',
    name: 'Juan Soto (NYM, 2025–39)',
    note:
      'The 2030–39 salary ($46M) is exactly 80% of the smallest pre-opt-out year (2027: $42.5M + $15M of bonus), so no Valley Charge — it applies only below 80%. The Mets can negate his post-2029 opt-out by raising 2030–39 salaries to $50M; neither the CBA nor any outlet says how that election is charged, so it isn’t modeled (Gerrit Cole’s 2024 equivalent was rescinded, not exercised, and his CBT stayed $36M). Award bonuses add on top in the year earned.',
    input: {
      seasons: [46.875, 46.875, 42.5, 46.875, 46.875, ...Array(10).fill(46)].map((s, i) => ({ season: 2025 + i, currentSalary: s * M, deferred: 0, kind: 'guaranteed' as const })),
      signingBonus: { amount: 75 * M, payments: [] },
      optOuts: [{ afterSeason: 2029, payment: 0 }],
      deferral: { payments: [], attribution: 'sequential', statedInterestPct: 0 },
      ilirPct: 0, // not used: no deferred compensation
    },
    sources: [
      { url: 'https://www.thescore.com/mlb/news/3157210', confirms: 'AP: salaries by year, $75M bonus, opt-out and negate terms' },
      { url: 'https://legacy.baseballprospectus.com/compensation/cots/national-league/new-york-mets/', confirms: 'Cot’s: terms; CBT $51,000,000 per year' },
      { url: 'https://www.mlbtraderumors.com/2024/12/mets-to-sign-juan-soto.html', confirms: 'Salaries, dates, $51MM AAV' },
    ],
    reported: { seasons: range(2025, 15), cbt: 51_000_000, tolerance: 0.01, note: 'Cot’s, before award bonuses' },
  },
  {
    id: 'tucker',
    group: 'Opt-outs',
    name: 'Kyle Tucker (LAD, 2026–29)',
    note:
      'Opt-outs after 2027 and 2028, plus $10M deferred from each of 2027–29, with each season’s $10M paid $1M a year 2036–45 (pro-rata). No Valley Charge: the post-opt-out years stay above the 80% Figure. Spotrac shows $57,195,000 (rounded); ESPN and MLBTR $57.1M (truncated).',
    input: {
      seasons: [
        { season: 2026, currentSalary: 1 * M, deferred: 0, kind: 'guaranteed' as const },
        { season: 2027, currentSalary: 45 * M, deferred: 10 * M, kind: 'guaranteed' as const },
        { season: 2028, currentSalary: 50 * M, deferred: 10 * M, kind: 'guaranteed' as const },
        { season: 2029, currentSalary: 50 * M, deferred: 10 * M, kind: 'guaranteed' as const },
      ],
      signingBonus: { amount: 64 * M, payments: [{ year: 2026, amount: 54 * M }, { year: 2027, amount: 10 * M }] },
      optOuts: [
        { afterSeason: 2027, payment: 0 },
        { afterSeason: 2028, payment: 0 },
      ],
      deferral: { payments: range(2036, 10).map((year) => ({ year, amount: 3 * M })), attribution: 'prorata', statedInterestPct: 0 },
      ilirPct: 3.87, // October 2025 annual mid-term AFR (Rev. Rul. 2025-19)
    },
    sources: [
      { url: 'https://www.foxsports.com/stories/mlb/kyle-tucker-joins-dodgers-with-240m-deal-eyes-las-third-straight-world-series-championship', confirms: 'AP: bonus $54M + $10M, salaries, 10 equal installments 2036–45' },
      { url: 'https://legacy.baseballprospectus.com/compensation/cots/nl-west/los-angeles-dodgers/', confirms: 'Cot’s: terms; CBT $57,195,945 (present value $228,783,778 at 3.87%)' },
      { url: 'https://www.spotrac.com/mlb/player/_/id/17620/kyle-tucker', confirms: 'Base salary by year, $3M × 10 deferred payments, luxury tax $57,195,000' },
      { url: 'https://www.irs.gov/pub/irs-drop/rr-25-19.pdf', confirms: 'October 2025 mid-term AFR 3.87%' },
    ],
    reported: { seasons: range(2026, 4), cbt: 57_195_945, tolerance: 1, note: 'Cot’s and AP, to the dollar' },
  },
  {
    id: 'alonso',
    group: 'Opt-outs',
    name: 'Pete Alonso (NYM, 2025–26)',
    note:
      '2026 ($24M) is exactly 80% of 2025 ($20M salary + $10M bonus), so no Valley Charge — the test is “less than 80%”. He opted out after 2025 (MLBTR, Nov 3, 2025): choose it under What Happens? to see the true-up. Bonus payment date unconfirmed.',
    input: {
      seasons: [
        { season: 2025, currentSalary: 20 * M, deferred: 0, kind: 'guaranteed' as const },
        { season: 2026, currentSalary: 24 * M, deferred: 0, kind: 'guaranteed' as const },
      ],
      signingBonus: { amount: 10 * M, payments: [] },
      optOuts: [{ afterSeason: 2025, payment: 0 }],
      deferral: { payments: [], attribution: 'sequential', statedInterestPct: 0 },
      ilirPct: 0, // not used: no deferred compensation
    },
    sources: [
      { url: 'https://www.mlbtraderumors.com/2025/02/mets-to-re-sign-pete-alonso.html', confirms: '“$27MM average annual value for luxury tax purposes”' },
      { url: 'https://www.mlb.com/news/pete-alonso-mets-free-agent-contract', confirms: '$10M bonus, $20M for 2025, $24M for 2026' },
      { url: 'https://www.mlbtraderumors.com/2025/11/pete-alonso-opts-out-of-mets-contract.html', confirms: 'Opted out after 2025' },
    ],
    reported: { seasons: [2025, 2026], cbt: 27_000_000, tolerance: 0.01, note: 'MLBTR, at signing' },
  },
  {
    id: 'bichette',
    group: 'Opt-outs',
    name: 'Bo Bichette (NYM, 2026–28)',
    note:
      'Opt-outs after 2026 and 2027 each pay a $5M buyout. Whether that buyout is deferred is disputed (Spotrac: $1M a year 2036–40, unverified); it is modeled as paid at the opt-out. He chose to stay for 2027 (MLB.com, Oct 29, 2026). The CBT figure is implied rather than stated: MLBTR applied tax rates to “$42MM of his annual value”. Bonus payment date unconfirmed.',
    input: {
      seasons: [
        { season: 2026, currentSalary: 2 * M, deferred: 0, kind: 'guaranteed' as const },
        { season: 2027, currentSalary: 42 * M, deferred: 0, kind: 'guaranteed' as const },
        { season: 2028, currentSalary: 42 * M, deferred: 0, kind: 'guaranteed' as const },
      ],
      signingBonus: { amount: 40 * M, payments: [] },
      optOuts: [
        { afterSeason: 2026, payment: 5 * M },
        { afterSeason: 2027, payment: 5 * M },
      ],
      deferral: { payments: [], attribution: 'sequential', statedInterestPct: 0 },
      ilirPct: 0, // not used: no deferred compensation
    },
    sources: [
      { url: 'https://www.cbsnews.com/amp/newyork/news/bo-bichette-new-york-mets-deal', confirms: 'AP: $40M bonus, $2M 2026, $42M player years, $5M buyout' },
      { url: 'https://www.mlbtraderumors.com/2026/01/mets-sign-bo-bichette.html', confirms: 'Tax math on “$42MM of his annual value”' },
      { url: 'https://www.mlb.com/news/bo-bichette-player-option-mets', confirms: 'Stayed for 2027 (Oct 29, 2026)' },
    ],
    reported: { seasons: [2026, 2027, 2028], cbt: 42_000_000, tolerance: 0.01, note: 'implied by MLBTR, not stated outright' },
  },
  {
    id: 'jansen',
    group: 'Club options',
    name: 'Kenley Jansen (DET, 2026)',
    note: 'The $2M buyout counts as signing bonus in 2026. The Tigers declined the $12M 2027 option and paid the buyout (MLBTR, Nov 2026). Signing bonus: none reported.',
    input: {
      seasons: [
        { season: 2026, currentSalary: 9 * M, deferred: 0, kind: 'guaranteed' as const },
        { season: 2027, currentSalary: 12 * M, deferred: 0, kind: 'club' as const, buyout: 2 * M },
      ],
      signingBonus: { amount: 0, payments: [] },
      optOuts: [],
      deferral: { payments: [], attribution: 'sequential', statedInterestPct: 0 },
      ilirPct: 0, // not used: no deferred compensation
    },
    sources: [
      { url: 'https://www.fox17online.com/sports/detroit-tigers-closer-kenley-jansen-finalize-11-million-1-year-contract-with-2027-club-option', confirms: 'AP: $9M 2026, $12M 2027 club option, $2M buyout' },
      { url: 'https://www.mlbtraderumors.com/2026/07/tigers-trade-rumors-tarik-skubal-luxury-tax-compensation-pick.html', confirms: '“$11MM for Jansen” luxury tax hit' },
      { url: 'https://www.mlbtraderumors.com/2026/11/tigers-exercise-option-on-drew-anderson-decline-option-on-kenley-jansen.html', confirms: 'Option declined' },
    ],
    reported: { seasons: [2026], cbt: 11_000_000, tolerance: 0.01, note: 'MLBTR' },
  },
  {
    id: 'kim',
    group: 'Club options',
    name: 'Hyeseong Kim (LAD, 2025–27)',
    note:
      'The 2028 and 2029 club options must be exercised together, with a single $1.5M buyout; the calculator treats them as separate options, so exercise both or neither. Each option year adds a $500K bonus for 500 plate appearances. Bonus payment date unconfirmed.',
    input: {
      seasons: [
        { season: 2025, currentSalary: 2.5 * M, deferred: 0, kind: 'guaranteed' as const },
        { season: 2026, currentSalary: 3.75 * M, deferred: 0, kind: 'guaranteed' as const },
        { season: 2027, currentSalary: 3.75 * M, deferred: 0, kind: 'guaranteed' as const },
        { season: 2028, currentSalary: 5 * M, deferred: 0, kind: 'club' as const, buyout: 1.5 * M },
        { season: 2029, currentSalary: 5 * M, deferred: 0, kind: 'club' as const },
      ],
      signingBonus: { amount: 1 * M, payments: [] },
      optOuts: [],
      deferral: { payments: [], attribution: 'sequential', statedInterestPct: 0 },
      ilirPct: 0, // not used: no deferred compensation
    },
    sources: [
      { url: 'https://www.mlb.com/press-release/press-release-dodgers-sign-hyeseong-kim', confirms: 'Dodgers press release' },
      { url: 'https://www.truebluela.com/2025/1/6/24337282/hyeseong-kim-dodgers-contract-details', confirms: 'AP details; “$4,166,667 for competitive balance tax purposes”' },
    ],
    reported: { seasons: [2025, 2026, 2027], cbt: 4_166_667, tolerance: 1, note: 'AP via True Blue LA' },
  },
  {
    id: 'standard',
    group: 'Basic',
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
