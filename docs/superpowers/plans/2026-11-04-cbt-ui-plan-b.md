# MLB Contract Calculator — Plan B (UI + Copy, 1.0.0) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the deferred-money-only UI with an any-contract UI wired to the merged CBT engine (`utils/cbt/`). Rename the app to "MLB Contract Calculator", add nine verified real-contract presets, and fix the Article XVI copy. This ships as **1.0.0**.

**Architecture:** `App.tsx` holds a `ContractInput` and a `Scenario` and does nothing else. It validates (`validate`/`validateScenario`), calls `calculate()`, and lays out focused components. Pure editing logic lives in `utils/form.ts`, which is unit-tested, so components stay thin. There are three small engine changes:
- `Result.playedSeasons`, with the END flag narrowed to fire only when it voids a season that would count;
- F4(c) pro-rata deferral attribution;
- a V11 scope fix.

Each is test-first, and the spec records it.

**Tech Stack:** React 19.3, TypeScript 7.0.2, Vite 8.3.5, Recharts 3.10, Tailwind 4.3, Vitest 5.0.5, `@types/react` and `@types/react-dom` 19.3.0 (new, exact pins), pnpm 12.16.1, Node 26.13.0.

**Spec:** `docs/superpowers/specs/2026-11-04-cbt-contract-engine-design.md`. Task 10 updates it (F4(c), §2.4.1 evidence, V11 scope, §6 UI, §7 presets, §10 decisions).

---

## How this plan was verified

Every code block was generated from a prototype worktree branched from `main` at `c510ee5`; none was retyped. In the prototype:
- **Tests:** `pnpm test` passed **173 tests in 13 files**. Both `pnpm run typecheck` (whole project) and `pnpm run typecheck:engine` (strict) gave **0 errors**. `pnpm run build` succeeded.
- **Browser (Playwright, 1440px and 400px):**
  - All 13 presets load, and the displayed "Reported CBT · Engine · Δ" lines are within each source's precision. Nine are exact; Ohtani Δ $1,476 against a figure published to $10K; Scherzer Δ $648, documented; Vlad Jr. Δ $286 against a figure published to $1K.
  - Bellinger opting out after 2027 shows $109.5M CBT against $85M cash, plus the V8 quote.
  - Clearing a salary shows a validation error, highlights the row and hides results without crashing.
  - Switching Snell to the CBA-default attribution shows the AP's $31,357,257.
  - At 400px there is no horizontal page overflow.
- **Real input, after review (actual typing, Tab and Enter, not scripted DOM events):**
  - Typing "12" into Length keeps 5 seasons until Tab, then shows 12 with the originals and opt-outs intact.
  - An invalid earned bonus keeps the scenario panel and field mounted while it shows the error, and fixing it restores results.
  - Enter on a year-table row button sets `aria-expanded="true"` and shows every rule, TEXT included, with its cite.
  - Shift+Tab onto an info icon shows its tooltip.
  - The deferred column is disabled in unattributed mode.
  - Errors read "2027: …" with `aria-invalid`.
- **Second review pass, re-checked with real input:**
  - Tabbing through First Season and Length keeps a loaded preset (no-op commits are skipped, and `setLength` returns the same object).
  - One click or tap opens a tooltip.
  - Input names no longer include "More information".
  - Length "2026" reverts, and "12" applies.
- **Engine changes, each test-first:**
  - **F4(c) pro-rata** reproduces Cot's and the AP's Tucker figure ($57,195,945) and MLBTR's Bregman/Cubs figure ($30,893,902) to the dollar.
  - **The V11 scope fix** came from the Bichette preset. The first implementation gave him a spurious $1.2M Valley Charge; the spec text scopes V11 to the V3 floor.
  - **Narrowing the END flag** removed noise on trailing club options.

If an actual output differs from the expected output, stop and report. Don't edit a test to make it pass.

## Ground rules for the executor

- **Never push to `main`.** Open one PR per phase, with a conventional-commit title, and squash-merge. **PR 3's title must be `feat!: …`.** That `!` drafts **1.0.0**.
- Commits are signed through 1Password. If signing fails with `1Password: agent returned an error`, stop and ask the user to unlock it. **Never** use `--no-gpg-sign`.
- Install only with `pnpm add -D <pkg>@<exact>`. `save-exact` is on, so confirm there's no caret.
- **Don't publish the draft release** until both PRs here have merged. Then ask the user. Release notes must call out Ohtani's change from $46.77M to $46.08M.
- **Sourcery:** the reviewer's 7-day budget may be spent. If its check shows `skipped`, use the code-reviewer subagent's review and **ask the user before merging**.
- Units in tests: worked-example tests use $M with season 1 = 2026. Presets use dollars.
- Until Task 9 rewrites `App.tsx`, `pnpm run typecheck` reports exactly the two existing Recharts errors in the old `App.tsx`, `App.tsx(530,25)` and `App.tsx(535,25)`. That is expected mid-PR, and no other errors are acceptable.

## File structure

| File | Responsibility |
|---|---|
| `utils/cbt/types.ts`, `index.ts`, `outcome.ts` | `Result.playedSeasons`; END flag only when it voids a counting season |
| `utils/cbt/deferral.ts`, `rules.ts`, `flags.ts` | F4(c) `'prorata'` attribution, the `F4c` rule, and D5 flagged in pro-rata mode |
| `utils/cbt/valley.ts` | V11 scope: deemed buyouts only in the V3 floor |
| `data/presets.ts` | `group` field; nine new sourced presets (13 in total) |
| `utils/format.ts` | Money formatting and parsing (replaces the former `utils/calculations.ts` helpers) |
| `utils/form.ts` | Pure contract-editing helpers and `syncScenario` |
| `components/fields.tsx` | Shared `Label`, `MoneyInput`, `NumberInput`, `CommitNumberInput` (commits on blur or Enter), style constants |
| `components/InfoTooltip.tsx` | Accessible tooltip: a focusable button that opens on hover, focus or tap |
| `components/PaymentsEditor.tsx` | `{year, amount}` list editor with an equal-payments generator |
| `components/PresetBar.tsx` | Grouped preset select, note, sources, reconciliation |
| `components/ContractTerms.tsx` | First season, length, fill evenly, ILIR, signing bonus |
| `components/ScheduleEditor.tsx` | Season-by-season table: salary, deferred, type, buyout, opt-outs |
| `components/DeferralEditor.tsx` | Attribution, stated interest, principal, payments |
| `components/IssuesList.tsx` | Validation errors and warnings |
| `components/ScenarioPanel.tsx` | Opt-out, option decisions, earned bonuses |
| `components/ResultCards.tsx` | AAV at signing, scenario totals |
| `components/FlagsCallout.tsx` | Flags with tag, cite, alternative; V8 quote; `TagBadge` |
| `components/CbtChart.tsx` | CBT vs cash by year, last-season-played line |
| `components/YearTable.tsx` | Per-season CBT and cash, expandable charge line items |
| `components/FundingSchedule.tsx` | Article XVI balance by July 1 |
| `components/FundingRules.tsx` | Static Article XVI copy (moved verbatim in PR 3, corrected in PR 4) |
| `App.tsx` | State and layout only |
| `vite-env.d.ts` | Vite client types (CSS side-effect import) |

Removed: `utils/calculations.ts` and `utils/__tests__/calculations.test.ts`.

---

## Phase 3 — PR 3: `feat!: generalize to any contract — new UI, real-contract presets, MLB Contract Calculator`

### Task 1: React types and the whole-project type-check

**Files:** Modify `package.json` and `pnpm-lock.yaml`; create `vite-env.d.ts`; commit this plan.

- [ ] **Step 1: Check out the branch.** `feat/contract-ui` already exists, and this plan is committed on it as its first commit(s).

```bash
git checkout feat/contract-ui && git log --oneline main..HEAD   # expect only "docs: … plan B" commit(s)
```

- [ ] **Step 2: Install the React type definitions (exact pins)**

Run: `pnpm add -D @types/react@19.3.0 @types/react-dom@19.3.0`
Expected: both are listed under devDependencies with no caret.

- [ ] **Step 3: Add the `typecheck` script.** In `package.json` `"scripts"`, the block must end up exactly:

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "typecheck:engine": "tsc --noEmit -p tsconfig.engine.json",
  "typecheck": "tsc --noEmit -p ."
}
```

- [ ] **Step 4: Create `vite-env.d.ts`**

```ts
/// <reference types="vite/client" />
```

- [ ] **Step 5: Run it**

Run: `pnpm run typecheck`
Expected: exactly 2 errors, `App.tsx(530,25): error TS2322` and `App.tsx(535,25): error TS2322`. Before this task there were ~319.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml vite-env.d.ts
git commit -m "build: add React type definitions and a whole-project type-check"
```

### Task 2: Engine — `playedSeasons` and the END flag

**Files:** Create `utils/cbt/__tests__/played.test.ts`; replace `utils/cbt/types.ts`, `utils/cbt/index.ts` and `utils/cbt/outcome.ts`.

- [ ] **Step 1: Write the failing test.** `utils/cbt/__tests__/played.test.ts`:

```ts
// Result.playedSeasons: the seasons actually played under a scenario (END convention).
import { describe, expect, it } from 'vitest';
import { build, guaranteed, Y1 } from './helpers';
import { run } from './run';

describe('playedSeasons', () => {
  it('lists every season when nothing ends the contract early', () => {
    expect(run(build(guaranteed(3, 20))).playedSeasons).toEqual([Y1, Y1 + 1, Y1 + 2]);
  });

  it('END: stops before a declined option and after a taken opt-out', () => {
    const club = build([...guaranteed(2, 20), { currentSalary: 25, kind: 'club', buyout: 2 }]);
    expect(run(club).playedSeasons).toEqual([Y1, Y1 + 1]);
    expect(run(club, { options: { [Y1 + 2]: 'exercised' } }).playedSeasons).toEqual([Y1, Y1 + 1, Y1 + 2]);
    const optOut = build(guaranteed(4, 20), { optOuts: [{ afterSeason: Y1 + 1, payment: 0 }] });
    expect(run(optOut, { optOutTakenAfter: Y1 + 1 }).playedSeasons).toEqual([Y1, Y1 + 1]);
  });
});

describe('END flag', () => {
  const flagged = (r: ReturnType<typeof run>) => r.flags.map((f) => f.rule);
  const twoOptions = build([...guaranteed(2, 20), { currentSalary: 5, kind: 'club', buyout: 1 }, { currentSalary: 5, kind: 'club' }]);

  it('is not flagged when the contract simply ends at a declined trailing option', () => {
    expect(flagged(run(twoOptions))).not.toContain('END');
  });

  it('is flagged when ending the contract voids a season that would otherwise count', () => {
    expect(flagged(run(twoOptions, { options: { [Y1 + 2]: 'declined', [Y1 + 3]: 'exercised' } }))).toContain('END');
    const optOut = build(guaranteed(4, 20), { optOuts: [{ afterSeason: Y1 + 1, payment: 0 }] });
    expect(flagged(run(optOut, { optOutTakenAfter: Y1 + 1 }))).toContain('END');
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm exec vitest run utils/cbt/__tests__/played.test.ts`
Expected: FAIL. The `playedSeasons` tests report `expected undefined to deeply equal [ 2026, … ]`, and "is not flagged when the contract simply ends at a declined trailing option" fails.

- [ ] **Step 3: Replace `utils/cbt/types.ts`.** This also widens `attribution` for Task 3.

```ts
// Types for the CBT contract engine.
// Spec: docs/superpowers/specs/2026-11-04-cbt-contract-engine-design.md (§5.1)
import type { RuleId } from './rules';

export type YearKind = 'guaranteed' | 'club' | 'mutual' | 'vesting' | 'player' | 'dual';

export interface SeasonRow {
  /** Calendar year of the championship season (D1). */
  season: number;
  /** Pay for this season paid during the term. This is "Base Salary" for all Art. XXIII tests (D5). */
  currentSalary: number;
  /** Principal attributed to this season as Deferred Compensation (F2, F7). Ignored in 'unattributed' mode. */
  deferred: number;
  /** 'guaranteed' rows after an opt-out become Player Option Years in classify (Y4). */
  kind: YearKind;
  /** Option rows only: paid if the option is not exercised. One payment, at the decision. */
  buyout?: number;
  /** player/dual rows: A(8) condition for Y2. Default true. */
  guaranteedIfExercised?: boolean;
}

export interface OptOut {
  /** The player may opt out after this season. */
  afterSeason: number;
  /** Paid to the player if he opts out (Y3). */
  payment: number;
}

export interface Payment {
  year: number;
  amount: number;
}

export interface DeferralSchedule {
  /** Actual cash paid, interest included (F7). Every year must be after the maximum term (F1). */
  payments: Payment[];
  /** F4(a) sequential (contract attributes) or F4(b) unattributed (CBA default). */
  attribution: 'sequential' | 'prorata' | 'unattributed';
  /** F3. Default 0. */
  statedInterestPct: number;
  /** F4(b) only: total principal at stated value. */
  unattributedPrincipal?: number;
}

export interface ContractInput {
  seasons: SeasonRow[];
  signingBonus: { amount: number; payments: Payment[] };
  optOuts: OptOut[];
  deferral: DeferralSchedule;
  /** Imputed Loan Interest Rate, percent (D2). */
  ilirPct: number;
}

export interface Scenario {
  /** Keyed by season. Vesting rows: 'exercised' means vested (O5). [CONV] Declining ends the contract. */
  options: Record<number, 'exercised' | 'declined'>;
  /** Must equal an OptOut.afterSeason, or null. [CONV] Taking an opt-out ends the contract. */
  optOutTakenAfter: number | null;
  /** B1: bonuses actually earned, keyed by season. */
  earnedBonuses: Record<number, number>;
}

export type EffectiveKind = 'guaranteed' | 'club' | 'player';

export interface SeasonClass {
  season: number;
  /** Treatment kind: mutual/vesting → club (Y1, Y6); dual → player (Y5); opt-out rows → player (Y4). */
  effectiveKind: EffectiveKind;
  isGuaranteed: boolean;
  /** True when this season is a Player Option Year because it follows an opt-out (Y4). */
  viaOptOut: boolean;
  /** Buyout attached to this season. For the first season after a failing opt-out, the opt-out payment (Y3). */
  buyout: number;
  rules: RuleId[];
}

/**
 * What a charge is: 'aav' (A1), 'valley' (V4 allocation), 'valleyCredit' (V7), 'option' (O1/O5, O2 on an
 * exercised option, O6), 'trueUp' (O7), 'buyout' (O4 paid, O2 on a void season), 'bonus' (B1).
 */
export type ChargeKind = 'aav' | 'valley' | 'valleyCredit' | 'option' | 'trueUp' | 'buyout' | 'bonus';

export interface Charge {
  season: number;
  amount: number;
  label: string;
  kind: ChargeKind;
  /** Every rule that determined the amount (spec §6). */
  rules: RuleId[];
}

export interface Flag {
  rule: RuleId;
  message: string;
}

export interface Result {
  classification: SeasonClass[];
  /** Seasons actually played under the scenario: later seasons are void after a declined option or taken opt-out (END). */
  playedSeasons: number[];
  aavAtSigning: number;
  charges: Charge[];
  perSeason: { season: number; cbt: number; cash: number }[];
  totals: { cbt: number; cash: number; attributedCost: number };
  funding: { snapshots: { july1: number; required: number }[]; peak: number };
  flags: Flag[];
}
```

- [ ] **Step 4: Replace `utils/cbt/index.ts`**

```ts
// CBT contract engine entry point. Spec: docs/superpowers/specs/2026-11-04-cbt-contract-engine-design.md
import { computeAav } from './aav';
import { classify, isOptionRow } from './classify';
import { aavDeferralRules, deferralCosts, signingBonusCost } from './deferral';
import { collectFlags } from './flags';
import { computeFunding } from './funding';
import { computeLedger } from './ledger';
import { computeOutcome } from './outcome';
import type { ContractInput, Result, Scenario } from './types';
import { validate, validateScenario } from './validate';
import { computeValley } from './valley';

export * from './types';
export { RULES } from './rules';
export type { RuleId, Tag } from './rules';
export { validate, validateScenario } from './validate';
export type { ValidationIssue } from './validate';

/** Spec §6 defaults: club-type options declined, player-type exercised, no opt-out, no bonuses. */
export function defaultScenario(input: ContractInput): Scenario {
  const options: Scenario['options'] = {};
  for (const c of classify(input)) if (isOptionRow(c)) options[c.season] = c.effectiveKind === 'club' ? 'declined' : 'exercised';
  return { options, optOutTakenAfter: null, earnedBonuses: {} };
}

/** Throws an Error listing every error from `validate(input)` and `validateScenario(input, scenario)`. Warnings do not throw. */
export function calculate(input: ContractInput, scenario: Scenario): Result {
  const errors = [...validate(input), ...validateScenario(input, scenario)].filter((i) => i.severity === 'error');
  if (errors.length > 0) throw new Error(`Invalid contract or scenario: ${errors.map((e) => e.message).join(' ')}`);

  const classes = classify(input);
  const deferral = deferralCosts(input, classes);
  const bonus = signingBonusCost(input, classes);
  const aav = computeAav(input, classes, deferral, bonus.cost);
  const valley = computeValley(input, classes, deferral, bonus.cost);
  const outcome = computeOutcome(input, scenario, classes, deferral, bonus, aav, valley, aavDeferralRules(input, classes, deferral, bonus));
  const ledger = computeLedger(input, scenario, deferral, bonus, outcome);
  const funding = computeFunding([...ledger.deferralPieces, ...bonus.deferredPieces]);

  return {
    classification: classes,
    playedSeasons: outcome.played.map((c) => c.season),
    aavAtSigning: aav.aav,
    charges: outcome.charges,
    perSeason: ledger.perSeason,
    totals: ledger.totals,
    funding,
    flags: collectFlags(input, classes, deferral, valley, outcome, funding),
  };
}
```

- [ ] **Step 5: Replace `utils/cbt/outcome.ts`**

```ts
// Scenario outcomes: O1–O8, V7–V9, B1, END (spec §2.5–§2.7).
import type { AavResult } from './aav';
import { isOptionRow, sortedSeasons } from './classify';
import { deferralRuleIds, type BonusResult, type DeferralResult } from './deferral';
import type { RuleId } from './rules';
import type { ContractInput, Charge, ChargeKind, Scenario, SeasonClass } from './types';
import type { ValleyResult } from './valley';

export interface OutcomeResult {
  charges: Charge[];
  played: SeasonClass[];
  voided: SeasonClass[];
  /** The buyout or opt-out payment actually paid when the contract ended, and the season it belongs to. */
  received: { season: number; amount: number } | null;
  /** Non-[TEXT] rules that changed the result without producing a charge of their own (END, O2NS). */
  notes: RuleId[];
}

/** UI and engine defaults (spec §6): club-type declined, player-type exercised, no opt-out. */
export function decisionFor(scenario: Scenario, c: SeasonClass): 'exercised' | 'declined' {
  return scenario.options[c.season] ?? (c.effectiveKind === 'club' ? 'declined' : 'exercised');
}

/**
 * Attributed cost of what was actually paid for the played seasons, on the AAV cost basis (`costBySeason`):
 * current salary, earned bonuses and deferred cost per season, plus the signing bonus and any buyout or
 * opt-out payment received. Used for the O7 "paid" amount (O8) and for `totals.attributedCost`.
 */
export function attributedCost(
  input: ContractInput,
  scenario: Scenario,
  played: SeasonClass[],
  deferral: DeferralResult,
  bonus: BonusResult,
  received: OutcomeResult['received'],
): number {
  const rows = new Map(sortedSeasons(input).map((r) => [r.season, r]));
  const perSeason = played.reduce(
    (s, c) => s + rows.get(c.season)!.currentSalary + (scenario.earnedBonuses[c.season] ?? 0) + (deferral.costBySeason.get(c.season) ?? 0),
    0,
  );
  return perSeason + bonus.cost + (received?.amount ?? 0);
}

/** `aavRules`: rules behind the deferred part of the AAV (F-rules, A7), added to every AAV charge. */
export function computeOutcome(
  input: ContractInput,
  scenario: Scenario,
  classes: SeasonClass[],
  deferral: DeferralResult,
  bonus: BonusResult,
  aav: AavResult,
  valley: ValleyResult,
  aavRules: RuleId[],
): OutcomeResult {
  const rows = new Map(sortedSeasons(input).map((r) => [r.season, r]));
  const cost = (season: number) => deferral.costBySeason.get(season) ?? 0;
  // F-rules for an option charge whose amount includes deferred cost.
  const fRules = (seasons: SeasonClass[]): RuleId[] => (seasons.some((c) => cost(c.season) > 0) ? deferralRuleIds(input) : []);
  const charges: Charge[] = [];
  const add = (season: number, amount: number, label: string, kind: ChargeKind, rules: RuleId[]) =>
    charges.push({ season, amount, label, kind, rules });

  // END [CONV]: a declined option or a taken opt-out ends the contract; later seasons are void.
  const played: SeasonClass[] = [];
  const voided: SeasonClass[] = [];
  let end: { type: 'optout' | 'decline'; season: number } | null = null;
  for (const c of classes) {
    if (!end && scenario.optOutTakenAfter !== null && c.season > scenario.optOutTakenAfter) end = { type: 'optout', season: c.season };
    if (!end && isOptionRow(c) && decisionFor(scenario, c) === 'declined') end = { type: 'decline', season: c.season };
    (end ? voided : played).push(c);
  }
  const playedSet = new Set(played.map((c) => c.season));
  const included = (season: number) => (aav.deemed.season === season ? aav.deemed.amount : 0);

  // Guaranteed seasons played: AAV (A1), less the V7 credit on exercised "such" years.
  const exercisedSuch = [...valley.shortfalls.keys()].filter((s) => playedSet.has(s));
  const credit = exercisedSuch.length
    ? exercisedSuch.reduce((s, season) => s + valley.shortfalls.get(season)!, 0) / exercisedSuch.length
    : 0;
  for (const c of played.filter((c) => c.isGuaranteed)) {
    add(c.season, aav.aav, 'AAV', 'aav', ['A1', 'A2', ...aav.deemed.rules, ...aavRules]);
    if (valley.shortfalls.has(c.season)) add(c.season, -credit, 'Valley Charge credit', 'valleyCredit', ['V7']);
  }

  // V4: Valley Charge allocations stay charged even if the season is later nullified (V6).
  for (const [season, amount] of valley.allocation) add(season, amount, 'Valley Charge', 'valley', ['V1', 'V2', 'V3', 'V4', 'V5', 'V6']);

  // Club-type option exercised or vested (O1, O5) less the buyout previously included (O2).
  for (const c of played.filter((c) => c.effectiveKind === 'club')) {
    const vesting = rows.get(c.season)!.kind === 'vesting';
    add(c.season, rows.get(c.season)!.currentSalary + cost(c.season), vesting ? 'Vested option' : 'Exercised option', 'option', [...(vesting ? ['O1', 'O5'] as RuleId[] : ['O1'] as RuleId[]), ...fRules([c])]);
    if (included(c.season) > 0) add(c.season, -included(c.season), 'Buyout not received', 'option', ['O2']);
  }

  // Non-guaranteed Player Option Years exercised (O6): AAV of their salaries less prorated attributed buyout.
  const ngPlayer = played.filter((c) => c.effectiveKind === 'player' && !c.isGuaranteed);
  if (ngPlayer.length > 0) {
    const avg = ngPlayer.reduce((s, c) => s + rows.get(c.season)!.currentSalary + cost(c.season), 0) / ngPlayer.length;
    const buyoutShare = ngPlayer.reduce((s, c) => s + included(c.season), 0) / ngPlayer.length;
    const o6Rules: RuleId[] = [...(buyoutShare > 0 ? ['O6', 'O2NS'] as RuleId[] : ['O6'] as RuleId[]), ...fRules(ngPlayer)];
    for (const c of ngPlayer) add(c.season, avg - buyoutShare, 'Exercised player option', 'option', [...o6Rules]);
  }

  // B1: earned bonuses in the season earned (played seasons only).
  for (const c of played) {
    const b = scenario.earnedBonuses[c.season] ?? 0;
    if (b !== 0) add(c.season, b, 'Earned bonus', 'bonus', ['B1']);
  }

  // Contract end: the buyout or opt-out payment actually received.
  let received: OutcomeResult['received'] = null;
  if (end?.type === 'decline') {
    const c = classes.find((x) => x.season === end!.season)!;
    if (c.buyout > 0) received = { season: c.season, amount: c.buyout };
  } else if (end?.type === 'optout') {
    const o = input.optOuts.find((x) => x.afterSeason === scenario.optOutTakenAfter);
    if (o && o.payment > 0) received = { season: end.season, amount: o.payment };
  }

  // O7: nullified guaranteed Player Option Years → true-up of paid − attributed (excl. Valley amounts, V9).
  const nullified = voided.filter((c) => c.effectiveKind === 'player' && c.isGuaranteed);
  if (nullified.length > 0) {
    const paid = attributedCost(input, scenario, played, deferral, bonus, received); // O8: deferrals and A7 bonus at attributed cost
    const attributed = charges
      .filter((ch) => playedSet.has(ch.season) && ch.kind !== 'valley' && ch.kind !== 'valleyCredit')
      .reduce((s, ch) => s + ch.amount, 0);
    const per = (paid - attributed) / nullified.length;
    const deferredPaid = played.some((c) => cost(c.season) > 0) || bonus.deferredPieces.length > 0;
    const rules: RuleId[] = deferredPaid ? ['O7', 'O8'] : ['O7'];
    if (credit !== 0) rules.push('V9');
    if (valley.allocation.size > 0) rules.push('V8');
    for (const c of nullified) add(c.season, per, 'Opt-out true-up', 'trueUp', [...rules]);
  } else if (received) {
    // O3: the received buyout was already charged as the deemed Signing Bonus; otherwise O4.
    if (aav.deemed.season !== received.season) {
      add(received.season, received.amount, 'Buyout paid', 'buyout', aav.deemed.a5 ? ['O4', 'O4b'] : ['O4']);
    }
  }

  // O2: a deemed buyout never received (contract ended first) is deducted in its option year,
  // unless an O7 true-up already netted it (O2NS).
  // END moved a number only if it voided a season that would otherwise count (not just declined trailing options).
  const notes: RuleId[] = voided.some((c) => !(isOptionRow(c) && decisionFor(scenario, c) === 'declined')) ? ['END'] : [];
  for (const c of voided) {
    const inc = included(c.season);
    if (inc <= 0 || received?.season === c.season) continue;
    if (nullified.length === 0) add(c.season, -inc, 'Buyout not received', 'buyout', ['O2']);
    else if (!notes.includes('O2NS')) notes.push('O2NS');
  }

  return { charges, played, voided, received, notes };
}
```

- [ ] **Step 6: Run it to confirm it passes**

Run: `pnpm exec vitest run utils/cbt/__tests__/played.test.ts && pnpm run typecheck:engine && pnpm test`
Expected: `Tests  4 passed (4)`, the type-check exits 0, and the full suite reports `Tests  140 passed (140)`.

- [ ] **Step 7: Commit**

```bash
git add utils/cbt/__tests__/played.test.ts utils/cbt/types.ts utils/cbt/index.ts utils/cbt/outcome.ts
git commit -m "feat: expose played seasons; flag END only when it voids a counting season"
```

### Task 3: Engine — F4(c) pro-rata attribution

**Files:** Create `utils/cbt/__tests__/prorata.test.ts`; replace `utils/cbt/deferral.ts`, `utils/cbt/rules.ts` and `utils/cbt/flags.ts`.

- [ ] **Step 1: Write the failing test.** `utils/cbt/__tests__/prorata.test.ts`:

```ts
// F4(c): each payment split across the deferral seasons in proportion to their deferred principal.
import { describe, expect, it } from 'vitest';
import { classify } from '../classify';
import { deferralCosts } from '../deferral';
import { validate } from '../validate';
import { calculate, defaultScenario } from '..';
import { build, Y1 } from './helpers';

const M = 1_000_000;

describe('F4c pro-rata attribution', () => {
  it('splits every payment across deferral seasons by principal (two seasons, 1:3)', () => {
    const input = build([{ currentSalary: 0, deferred: 10 }, { currentSalary: 0, deferred: 30 }], {
      ilirPct: 5,
      deferral: { payments: [{ year: Y1 + 3, amount: 20 }, { year: Y1 + 4, amount: 20 }], attribution: 'prorata', statedInterestPct: 0 },
    });
    const d = deferralCosts(input, classify(input));
    expect(d.costBySeason.get(Y1)).toBeCloseTo(5 / 1.05 ** 3 + 5 / 1.05 ** 4, 9);
    expect(d.costBySeason.get(Y1 + 1)).toBeCloseTo(15 / 1.05 ** 2 + 15 / 1.05 ** 3, 9);
    expect(d.unpaidPrincipal).toBeCloseTo(0, 9);
    expect(d.excessCash).toBeCloseTo(0, 9);
  });

  it('reproduces Bregman (CHC) $30,893,902 — MLBTR NPV / 5, Spotrac', () => {
    const def = [15, 10, 10, 15, 20];
    const input = build(def.map((d) => ({ currentSalary: (35 - d) * M, deferred: d * M })), {
      ilirPct: 3.87,
      deferral: { payments: Array.from({ length: 8 }, (_, i) => ({ year: 2034 + i, amount: 8.75 * M })), attribution: 'prorata', statedInterestPct: 0 },
    });
    const d = deferralCosts(input, classify(input));
    const total = 105 * M + [...d.costBySeason.values()].reduce((s, v) => s + v, 0);
    expect(Math.round(total / 5)).toBe(30_893_902);
  });

  it('at 0% interest, payments must equal the deferred principal (F7)', () => {
    const input = build([{ currentSalary: 5, deferred: 5 }], {
      ilirPct: 4,
      deferral: { payments: [{ year: 2030, amount: 4 }], attribution: 'prorata', statedInterestPct: 0 },
    });
    expect(validate(input).some((i) => i.severity === 'error' && i.rule === 'F7')).toBe(true);
  });

  it('D5 is flagged in pro-rata mode when a 50% test reads a season with deferred pay', () => {
    const input = build([{ currentSalary: 20 }, { currentSalary: 10, deferred: 5 }], {
      ilirPct: 4,
      optOuts: [{ afterSeason: Y1, payment: 0 }],
      deferral: { payments: [{ year: Y1 + 4, amount: 5 }], attribution: 'prorata', statedInterestPct: 0 },
    });
    expect(calculate(input, defaultScenario(input)).flags.map((f) => f.rule)).toContain('D5');
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm exec vitest run utils/cbt/__tests__/prorata.test.ts`
Expected: FAIL. `'prorata'` falls through to the unattributed branch, giving `AssertionError: expected 16.865400733233578 to be close to 8.432700366616789`; the Bregman figure misses; and D5 isn't flagged in pro-rata mode.

- [ ] **Step 3: Replace `utils/cbt/deferral.ts`**

```ts
// Deferred compensation cost (F1–F7) and signing-bonus cost (A2, A7). Spec §2.3–§2.4.
import { sortedSeasons } from './classify';
import type { RuleId } from './rules';
import type { ContractInput, Payment, SeasonClass } from './types';

const EPS = 1e-9;

/** A slice of one cash payment attributed to one season. */
export interface Piece {
  season: number;
  year: number;
  cash: number;
  /** Attributed cost: stated value (F3 band) or PV at the ILIR (F3, F5). */
  cost: number;
}

export interface DeferralResult {
  costBySeason: Map<number, number>;
  pieces: Piece[];
  /** Sequential mode: principal never paid, and cash with no principal left to pay (F7 consistency). */
  unpaidPrincipal: number;
  excessCash: number;
}

/** F3 + F6: stated interest within 1.5 percentage points of the ILIR (inclusive) → stated value. */
export function withinStatedBand(statedPct: number, ilirPct: number): boolean {
  return Math.abs(statedPct - ilirPct) <= 1.5 + EPS;
}

function discount(cash: number, years: number, ratePct: number) {
  return cash / Math.pow(1 + ratePct / 100, years); // F5: whole years, annual compounding
}

function sumInto(map: Map<number, number>, key: number, v: number) {
  map.set(key, (map.get(key) ?? 0) + v);
}

export function deferralCosts(input: ContractInput, classes: SeasonClass[]): DeferralResult {
  const { payments, attribution, statedInterestPct: s } = input.deferral;
  const band = withinStatedBand(s, input.ilirPct);
  const pieces: Piece[] = [];
  const costBySeason = new Map<number, number>();
  const sortedPayments = [...payments].sort((a, b) => a.year - b.year);
  let unpaidPrincipal = 0;
  let excessCash = 0;

  if (attribution === 'sequential') {
    // F4(a) + F7: first-earned principal is paid first. Cash c paid n years after season t
    // retires principal c / (1+s)^n; its cost is that principal (band) or c / (1+ILIR)^n.
    const queue = sortedSeasons(input)
      .filter((r) => r.deferred > 0)
      .map((r) => ({ season: r.season, remaining: r.deferred }));
    for (const p of sortedPayments) {
      let cashLeft = p.amount;
      while (cashLeft > EPS && queue.length > 0) {
        const t = queue[0];
        const n = p.year - t.season;
        const growth = Math.pow(1 + s / 100, n);
        const principal = Math.min(t.remaining, cashLeft / growth);
        const cash = principal * growth;
        const cost = band ? principal : discount(cash, n, input.ilirPct);
        pieces.push({ season: t.season, year: p.year, cash, cost });
        t.remaining -= principal;
        cashLeft -= cash;
        if (t.remaining <= EPS) queue.shift();
      }
      excessCash += Math.max(0, cashLeft);
    }
    unpaidPrincipal = queue.reduce((sum, t) => sum + t.remaining, 0);
    for (const pc of pieces) sumInto(costBySeason, pc.season, pc.cost);
  } else if (attribution === 'prorata') {
    // F4(c): the contract spreads each season's deferral across every payment, so each payment is split across
    // the deferral seasons in proportion to their principal. Principal retired = cash / (1+s)^n (F7).
    const owed = sortedSeasons(input).filter((r) => r.deferred > 0);
    const total = owed.reduce((sum, r) => sum + r.deferred, 0);
    let retired = 0;
    if (total > 0) {
      for (const p of sortedPayments) {
        for (const r of owed) {
          const cash = (p.amount * r.deferred) / total;
          const n = p.year - r.season;
          const principal = cash / Math.pow(1 + s / 100, n);
          retired += principal;
          pieces.push({ season: r.season, year: p.year, cash, cost: band ? principal : discount(cash, n, input.ilirPct) });
        }
      }
    }
    unpaidPrincipal = Math.max(0, total - retired);
    excessCash = Math.max(0, retired - total);
    for (const pc of pieces) sumInto(costBySeason, pc.season, pc.cost);
  } else {
    // F4(b): attributed equally to each Guaranteed Year; each payment split equally (payment split: [CONV]).
    const g = classes.filter((c) => c.isGuaranteed).map((c) => c.season);
    if (g.length > 0) {
      for (const p of sortedPayments) {
        for (const season of g) {
          const cash = p.amount / g.length;
          const n = p.year - season;
          pieces.push({ season, year: p.year, cash, cost: band ? cash / Math.pow(1 + s / 100, n) : discount(cash, n, input.ilirPct) });
        }
      }
      const principal = input.deferral.unattributedPrincipal ?? 0;
      for (const season of g) {
        const fromPieces = pieces.filter((pc) => pc.season === season).reduce((sum, pc) => sum + pc.cost, 0);
        // F3 band: stated value is the principal itself (F4(b) takes it from unattributedPrincipal).
        costBySeason.set(season, band ? principal / g.length : fromPieces);
      }
    }
  }
  return { costBySeason, pieces, unpaidPrincipal, excessCash };
}

export interface BonusResult {
  /** Total attributed cost: in-term installments at nominal, after-term installments discounted (A7). */
  cost: number;
  nominal: number;
  /** A7 pieces (installments after the last Guaranteed season), split over the Guaranteed Years. */
  deferredPieces: Piece[];
}

/** Signing-bonus cash schedule. With no installments, the whole bonus is paid in the first season (in term: nominal, A2). */
export function bonusSchedule(input: ContractInput): Payment[] {
  const { amount, payments } = input.signingBonus;
  if (payments.length > 0) return payments;
  return [{ year: sortedSeasons(input)[0]?.season ?? -Infinity, amount }];
}

export function signingBonusCost(input: ContractInput, classes: SeasonClass[]): BonusResult {
  const { amount } = input.signingBonus;
  const g = classes.filter((c) => c.isGuaranteed).map((c) => c.season);
  const lastG = g.length ? Math.max(...g) : -Infinity;
  const band = withinStatedBand(0, input.ilirPct); // signing bonuses carry no stated interest
  const deferredPieces: Piece[] = [];
  let cost = 0;
  for (const p of bonusSchedule(input)) {
    if (p.year <= lastG || g.length === 0) {
      cost += p.amount; // A2: in-term installments count at nominal
      continue;
    }
    for (const season of g) {
      const cash = p.amount / g.length;
      const pieceCost = band ? cash : discount(cash, p.year - season, input.ilirPct);
      deferredPieces.push({ season, year: p.year, cash, cost: pieceCost });
      cost += pieceCost;
    }
  }
  return { cost, nominal: amount, deferredPieces };
}

/** Rules behind a charge that includes deferred cost (F2, F3, F4a|F4b|F4c, F5, F7). */
export function deferralRuleIds(input: ContractInput): RuleId[] {
  const mode: RuleId = input.deferral.attribution === 'sequential' ? 'F4a' : input.deferral.attribution === 'prorata' ? 'F4c' : 'F4b';
  return ['F2', 'F3', mode, 'F5', 'F7'];
}

/** Rules behind the deferred part of the AAV: F2–F7 when a Guaranteed season has deferred cost, A7 when a bonus installment is discounted. */
export function aavDeferralRules(input: ContractInput, classes: SeasonClass[], deferral: DeferralResult, bonus: BonusResult): RuleId[] {
  const rules: RuleId[] = [];
  if (classes.some((c) => c.isGuaranteed && (deferral.costBySeason.get(c.season) ?? 0) > 0)) rules.push(...deferralRuleIds(input));
  if (bonus.deferredPieces.length > 0) rules.push('A7');
  return rules;
}
```

- [ ] **Step 4: Replace `utils/cbt/rules.ts`**

```ts
// Single source of truth for rule ids, CBA citations and evidence tags (spec §1, §5).
// Every id here matches a row in the spec (§2–§3). Tags:
//   TEXT     — stated directly in the CBA
//   PRACTICE — CBA ambiguous/silent; matches the figure MLB actually charged
//   INTERP   — CBA ambiguous; engine's reading (`alternative` names the other reading)
//   CONV     — CBA silent; modeling convention
// Pages are the printed pages of the 2022–2026 Basic Agreement.
export type Tag = 'TEXT' | 'PRACTICE' | 'INTERP' | 'CONV';

export interface Rule {
  cite: string;
  tag: Tag;
  summary: string;
  alternative?: string;
}

export const RULES = {
  D1: { cite: 'XXIII(A)(1), p.115–116', tag: 'TEXT', summary: 'Contract Year runs Dec 2 – Dec 1, named for its championship season' },
  D2: { cite: 'XXIII(A)(4), p.116; E(6)(b)(ii), p.136–137', tag: 'TEXT', summary: 'ILIR = Federal mid-term rate for the October before the first Contract Year' },
  D3: { cite: 'XXIII(A)(7), p.116', tag: 'TEXT', summary: 'Base Salary = the UPC ¶2 amount for a season' },
  D4: { cite: 'XXIII(A)(8), p.116', tag: 'TEXT', summary: 'Guaranteed Year: >50% of Base Salary guaranteed on termination' },
  D5: {
    cite: 'E(2), p.131; E(5)(d)(ii), p.136',
    tag: 'INTERP',
    summary: 'Base Salary = current (non-deferred) pay; deferrals enter only via E(6)',
    alternative: 'Base Salary includes nominal deferred pay (changes the 50% guarantee tests)',
  },
  Y1: { cite: 'E(5)(a)(i), p.133', tag: 'TEXT', summary: 'Club (incl. vesting) option years are not Guaranteed Years' },
  Y2: { cite: 'E(5)(a)(ii), p.133', tag: 'TEXT', summary: 'Player option year is guaranteed unless buyout > 50% of Base Salary' },
  Y3: { cite: 'E(5)(a)(ii), p.133', tag: 'TEXT', summary: 'Years after an opt-out are guaranteed unless payment > 50% of following Base Salaries' },
  Y4: { cite: 'E(5)(a)(ii)(B), p.133', tag: 'TEXT', summary: 'Guaranteed seasons after an opt-out are Player Option Years' },
  Y5: { cite: 'E(5)(a)(iii), p.133', tag: 'TEXT', summary: 'Dual option = Player Option Year' },
  Y6: { cite: 'E(5)(a)(iv), p.133–134', tag: 'TEXT', summary: 'Mutual option = Club Option Year' },
  A1: { cite: 'E(2), p.131', tag: 'TEXT', summary: 'AAV = (Base Salary + Signing Bonus + deferred cost) / Guaranteed Years' },
  A2: { cite: 'E(3), p.132', tag: 'TEXT', summary: 'Signing Bonus attributed pro rata over Guaranteed Years' },
  A3: { cite: 'E(5)(b)(i)(A), p.134', tag: 'TEXT', summary: 'Buyout on a non-guaranteed option year is deemed a Signing Bonus' },
  A4: { cite: 'E(5)(b)(i)(B), p.134', tag: 'TEXT', summary: 'Only the earliest option year buyout is deemed a Signing Bonus' },
  A5: {
    cite: 'E(5)(b)(i)(A)–(B), p.134',
    tag: 'INTERP',
    summary: 'Club + player buyouts both present: the higher is the Signing Bonus',
    alternative: 'Always use the earliest option year buyout (B)',
  },
  A6: { cite: 'E(4)(a), p.132', tag: 'TEXT', summary: 'Potential (unearned) bonuses are not in the AAV' },
  A7: {
    cite: 'E(1), p.131; E(3), p.132; E(6)(a), p.136',
    tag: 'INTERP',
    summary: 'Signing-bonus installments after the term are discounted as deferred compensation',
    alternative: 'Signing bonuses are never discounted',
  },
  F1: { cite: 'E(6)(a), p.136', tag: 'TEXT', summary: 'Deferred Compensation = Salary payable after the last season' },
  F2: { cite: 'E(6)(b)(i), p.136', tag: 'TEXT', summary: 'Deferred comp counts in the season the contract attributes it to' },
  F3: { cite: 'E(6)(b)(ii), p.136–137', tag: 'TEXT', summary: 'Stated interest within 1.5 pp of ILIR → stated value; else discounted at ILIR' },
  F4a: { cite: 'E(6)(b)(i), p.136', tag: 'PRACTICE', summary: 'Sequential attribution: first-earned principal paid first' },
  F4c: {
    cite: 'E(6)(b)(i), p.136',
    tag: 'TEXT',
    summary: 'Pro-rata: the contract spreads each season’s deferral across every payment',
  },
  F4b: { cite: 'E(6)(b)(i), p.136', tag: 'TEXT', summary: 'Unattributed: equally to each Guaranteed Year (payment split is a convention)' },
  F5: { cite: 'silent', tag: 'PRACTICE', summary: 'Whole-year, annually compounded discounting' },
  F6: { cite: 'silent', tag: 'CONV', summary: '"Within 1.5 percentage points" is inclusive' },
  F7: { cite: 'E(6)(b)(ii), p.136–137', tag: 'CONV', summary: 'Payments are cash incl. interest; principal = cash / (1+stated)^years' },
  B1: { cite: 'E(4)(a), p.132', tag: 'TEXT', summary: 'Earned bonuses count in the season earned, outside the AAV' },
  O1: { cite: 'E(5)(c), p.135', tag: 'TEXT', summary: 'Exercised club option year = Base Salary + bonuses' },
  O2: { cite: 'E(5)(b)(ii), p.134–135', tag: 'TEXT', summary: 'Buyout not received → deduction of the buyout previously included' },
  O2NS: {
    cite: 'E(5)(b)(ii), p.134–135',
    tag: 'INTERP',
    summary: 'O2 not stacked on O6 or on an O7 true-up',
    alternative: 'Apply O2 as well (deducts the buyout twice)',
  },
  O3: { cite: 'E(5)(b)(i), p.134', tag: 'TEXT', summary: 'Declined; deemed buyout already charged' },
  O4: { cite: 'E(5)(b)(i)(B), p.134', tag: 'TEXT', summary: 'Paid buyout that was not the deemed Signing Bonus is charged in its option year' },
  O4b: {
    cite: 'E(5)(b)(i)(B), p.134',
    tag: 'INTERP',
    summary: 'O4 extended to the lower buyout left out under A5',
    alternative: 'The text covers only non-earliest option years',
  },
  O5: {
    cite: 'E(5)(a)(i), (c), p.133, 135',
    tag: 'INTERP',
    summary: 'Vested option treated as exercised club option',
    alternative: 'Vesting is not "exercise"; no rule given',
  },
  O6: { cite: 'E(5)(d)(i) ¶2, p.135', tag: 'TEXT', summary: 'Exercised non-guaranteed player option: salary − buyout attributed' },
  O7: { cite: 'E(5)(d)(i) ¶1, p.135', tag: 'TEXT', summary: 'Nullified guaranteed player option: true-up of paid − attributed (excl. Valley)' },
  O8: {
    cite: 'E(5)(d)(i), p.135; E(6)(b)(i), p.136',
    tag: 'INTERP',
    summary: 'O7 values deferred pay at attributed cost',
    alternative: 'Value deferred pay at nominal (adds the discount back)',
  },
  V1: { cite: 'E(5)(d)(ii), p.136', tag: 'TEXT', summary: 'Player Option Year Value = Base Salary + deferred cost − buyout' },
  V2: { cite: 'E(5)(d)(ii), p.136', tag: 'TEXT', summary: '80% Figure from the smallest preceding Guaranteed Year' },
  V3: { cite: 'E(5)(d)(ii), p.136', tag: 'TEXT', summary: 'Floor: 75% of AAV as if the option year were not guaranteed' },
  V4: { cite: 'E(5)(d)(ii), p.136', tag: 'TEXT', summary: 'Valley shortfall allocated pro rata over preceding Guaranteed Years' },
  V5: { cite: 'E(5)(d)(ii), p.136', tag: 'PRACTICE', summary: 'Signing Bonus attributed over pre-option years for the 80% Figure' },
  V6: {
    cite: 'E(5)(d)(ii), p.136',
    tag: 'INTERP',
    summary: '"Such" resolved by testing option years in order; shares stay charged',
    alternative: 'Shares on a later-nullified year are dropped',
  },
  V7: {
    cite: 'E(5)(d)(ii), p.136',
    tag: 'INTERP',
    summary: 'Exercised "such" years credited their averaged shortfalls',
    alternative: 'Recompute AAV over option years only (Bellinger $17.67M)',
  },
  V8: { cite: 'E(5)(d)(i) ¶1, p.135', tag: 'TEXT', summary: 'Valley Charge not refunded on opt-out' },
  V9: {
    cite: 'E(5)(d)(i) ¶1, p.135',
    tag: 'INTERP',
    summary: 'O7 exclusion also covers V7 credits',
    alternative: 'Count V7 credits as attributed (Bellinger W13 $135.3M)',
  },
  V10: {
    cite: 'E(5)(d)(ii), p.136; G(3)(e), p.143',
    tag: 'INTERP',
    summary: 'Valley applies only to guaranteed player option years',
    alternative: 'Apply to all player option years',
  },
  V11: {
    cite: 'E(5)(d)(ii), p.136; E(5)(b)(i)(A), p.134',
    tag: 'INTERP',
    summary: 'In the floor hypothetical, option-year buyouts become deemed Signing Bonus',
    alternative: 'Ignore buyouts in the hypothetical',
  },
  X1: { cite: 'Art. XVI, p.89', tag: 'TEXT', summary: 'Fund by the second July 1 after the season earned' },
  X2: { cite: 'Art. XVI, p.89', tag: 'TEXT', summary: 'Maintain PV of outstanding payments at 5%' },
  X3: { cite: 'Art. XVI, p.89', tag: 'TEXT', summary: '5% may change only by agreement after a prime rate ≥ 7%' },
  X4: {
    cite: 'Art. XVI, p.89; XXIII(A), p.115',
    tag: 'INTERP',
    summary: '"Earned" season = Art. XXIII attributed season',
    alternative: 'Art. XVI "earned" defined independently',
  },
  X5: { cite: '—', tag: 'CONV', summary: 'July 1 snapshots, whole years; same-day payments count as paid' },
  END: { cite: '—', tag: 'CONV', summary: 'Declining an option or taking an opt-out ends the contract' },
} as const satisfies Record<string, Rule>;

export type RuleId = keyof typeof RULES;
```

- [ ] **Step 5: Replace `utils/cbt/flags.ts`.** D5 now applies in pro-rata mode as well as sequential, because both read the per-season `deferred` values.

```ts
// Flags (spec §5.1, §6): every [PRACTICE]/[INTERP]/[CONV] rule that moved a number, plus the V8 callout.
import { sortedSeasons } from './classify';
import type { DeferralResult } from './deferral';
import { MONEY_EPS } from './money';
import type { OutcomeResult } from './outcome';
import { RULES, type RuleId } from './rules';
import type { ContractInput, Flag, Result, SeasonClass } from './types';
import type { ValleyResult } from './valley';

export function collectFlags(
  input: ContractInput,
  classes: SeasonClass[],
  deferral: DeferralResult,
  valley: ValleyResult,
  outcome: OutcomeResult,
  funding: Result['funding'],
): Flag[] {
  const rows = new Map(sortedSeasons(input).map((r) => [r.season, r]));
  const flags: Flag[] = [];
  const flag = (r: RuleId) => {
    if (!flags.some((f) => f.rule === r)) flags.push({ rule: r, message: RULES[r].summary });
  };
  for (const ch of outcome.charges) {
    if (Math.abs(ch.amount) <= MONEY_EPS) continue; // a zero charge moved nothing
    for (const r of ch.rules) if (RULES[r].tag !== 'TEXT' || r === 'V8') flag(r);
  }
  outcome.notes.forEach(flag); // END, O2NS: changed the result without a charge of their own
  // D5: a 50% test or Valley value read a season that has deferred pay (per-season `deferred` is used in sequential and pro-rata modes).
  if (input.deferral.attribution !== 'unattributed' && classes.some((c) => c.rules.includes('D5') && (rows.get(c.season)?.deferred ?? 0) > 0))
    flag('D5');
  // F6: the 1.5-point band edge decided stated value vs discounting.
  if (deferral.pieces.length > 0 && Math.abs(Math.abs(input.deferral.statedInterestPct - input.ilirPct) - 1.5) < 1e-9) flag('F6');
  // V10: a non-guaranteed player option year was excluded from the Valley test.
  if (classes.some((c) => c.effectiveKind === 'player' && !c.isGuaranteed)) flag('V10');
  if (valley.usedV11) flag('V11');
  if (funding.snapshots.length > 0) {
    flag('X4');
    flag('X5');
  }
  return flags;
}
```

- [ ] **Step 6: Run it to confirm it passes**

Run: `pnpm exec vitest run utils/cbt/__tests__/prorata.test.ts && pnpm run typecheck:engine && pnpm test`
Expected: `Tests  4 passed (4)`, the type-check exits 0, and the full suite reports `Tests  144 passed (144)`.

- [ ] **Step 7: Commit**

```bash
git add utils/cbt/__tests__/prorata.test.ts utils/cbt/deferral.ts utils/cbt/rules.ts utils/cbt/flags.ts
git commit -m "feat: add pro-rata deferral attribution (F4c)"
```

### Task 4: Engine — V11 applies only in the V3 floor

**Files:** Replace `utils/cbt/__tests__/valley.test.ts` (adds one test) and `utils/cbt/valley.ts`.

- [ ] **Step 1: Write the failing test.** Replace `utils/cbt/__tests__/valley.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { classify } from '../classify';
import { deferralCosts, signingBonusCost } from '../deferral';
import type { ContractInput } from '../types';
import { computeValley } from '../valley';
import { build, guaranteed, Y1 } from './helpers';

function valleyOf(input: ContractInput) {
  const classes = classify(input);
  return computeValley(input, classes, deferralCosts(input, classes), signingBonusCost(input, classes).cost);
}

describe('Valley Charge (V1–V6, V10, V11)', () => {
  it('V2/V3/V4 W4: shortfall 4 allocated 1.3333 over yrs 1–3', () => {
    const v = valleyOf(build([...guaranteed(3, 20), { currentSalary: 12, kind: 'player' }]));
    expect(v.figure).toBeCloseTo(16, 9);
    expect(v.shortfalls.get(Y1 + 3)).toBeCloseTo(4, 9);
    expect([...v.allocation.values()].map((x) => +x.toFixed(6))).toEqual([1.333333, 1.333333, 1.333333]);
  });

  it('V5 Bellinger: bonus over the pre-option years → figure 34, shortfalls 8.2/8.2/8.1, 12.25 per year', () => {
    const v = valleyOf(
      build([32.5, 32.5, 25.8, 25.8, 25.9].map((c) => ({ currentSalary: c })), {
        signingBonus: { amount: 20, payments: [] },
        optOuts: [{ afterSeason: Y1 + 1, payment: 0 }, { afterSeason: Y1 + 2, payment: 0 }],
      }),
    );
    expect(v.figure).toBeCloseTo(34, 9);
    expect([...v.shortfalls.values()].map((x) => +x.toFixed(6))).toEqual([8.2, 8.2, 8.1]);
    expect(v.allocation.get(Y1)).toBeCloseTo(12.25, 9);
    expect(v.allocation.get(Y1 + 1)).toBeCloseTo(12.25, 9);
  });

  it('V6 W17: yr 3 is not "such"; yr 4 is, with floor 14.5 → 1.5 over yrs 1–3', () => {
    const v = valleyOf(build([...guaranteed(2, 20), { currentSalary: 18, kind: 'player' }, { currentSalary: 10, kind: 'player' }]));
    expect(v.firstSuch).toBe(Y1 + 3);
    expect(v.figure).toBeCloseTo(14.5, 9);
    expect([...v.allocation.keys()]).toEqual([Y1, Y1 + 1, Y1 + 2]);
    expect(v.allocation.get(Y1 + 2)).toBeCloseTo(1.5, 9);
  });

  it('V2/V11: the 80% Figure uses the contract’s real signing bonus; a deemed buyout only enters the V3 floor (Bichette shape)', () => {
    const v = valleyOf(
      build([{ currentSalary: 2 }, { currentSalary: 42 }, { currentSalary: 42 }], {
        signingBonus: { amount: 40, payments: [] },
        optOuts: [{ afterSeason: Y1, payment: 5 }, { afterSeason: Y1 + 1, payment: 5 }],
      }),
    );
    // V2: 0.8 × (2 + 40) = 33.6; V3 floor with the buyout as deemed bonus: 0.75 × (2 + 40 + 5) = 35.25. Values 42 − 5 = 37 > 35.25.
    expect(v.firstSuch).toBeNull();
  });

  it('V10 W5: a non-guaranteed player option never triggers a Valley Charge', () => {
    expect(valleyOf(build([...guaranteed(3, 20), { currentSalary: 10, kind: 'player', buyout: 6 }])).firstSuch).toBeNull();
  });

  it('V11 W18: club buyout becomes Signing Bonus in the hypothetical; no Valley Charge', () => {
    const v = valleyOf(build([...guaranteed(3, 20), { currentSalary: 25, kind: 'club', buyout: 3 }], { optOuts: [{ afterSeason: Y1 + 1, payment: 0 }] }));
    expect(v.firstSuch).toBeNull();
  });

  it('a shortfall within MONEY_EPS (half a cent) is not a Valley Charge', () => {
    expect(valleyOf(build([...guaranteed(3, 20), { currentSalary: 15.999, kind: 'player' }])).firstSuch).toBeNull();
    const v = valleyOf(build([...guaranteed(3, 20), { currentSalary: 15.99, kind: 'player' }]));
    expect(v.firstSuch).toBe(Y1 + 3);
    expect(v.shortfalls.get(Y1 + 3)).toBeCloseTo(0.01, 9);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm exec vitest run utils/cbt/__tests__/valley.test.ts`
Expected: FAIL, with only "V2/V11: the 80% Figure uses the contract’s real signing bonus…" failing.

- [ ] **Step 3: Replace `utils/cbt/valley.ts`**

```ts
// Valley Charge: V1–V6, V10, V11 (spec §2.7).
import { selectDeemedBuyout } from './aav';
import { sortedSeasons } from './classify';
import type { DeferralResult } from './deferral';
import { MONEY_EPS } from './money';
import type { ContractInput, SeasonClass } from './types';

export interface ValleyResult {
  /** First "such" Player Option Year (V6), or null when there is no Valley Charge. */
  firstSuch: number | null;
  figure: number;
  /** V4 shortfall per "such" Player Option Year. */
  shortfalls: Map<number, number>;
  /** V4 allocation per Guaranteed Year preceding the first such year. */
  allocation: Map<number, number>;
  /** True when V11 (buyouts deemed Signing Bonus inside the hypothetical) changed an evaluated figure. */
  usedV11: boolean;
}

export function computeValley(
  input: ContractInput,
  classes: SeasonClass[],
  deferral: DeferralResult,
  bonusCost: number,
): ValleyResult {
  const rows = new Map(sortedSeasons(input).map((r) => [r.season, r]));
  const cost = (season: number) => deferral.costBySeason.get(season) ?? 0;
  // V10: only guaranteed Player Option Years can carry a Valley Charge.
  const po = classes.filter((c) => c.effectiveKind === 'player' && c.isGuaranteed);
  // V1: Base Salary (D5) + deferred cost − Option Buyout.
  const value = (c: SeasonClass) => rows.get(c.season)!.currentSalary + cost(c.season) - c.buyout;
  const actualBuyout = selectDeemedBuyout(classes).amount;
  let usedV11 = false;

  for (let k = 0; k < po.length; k++) {
    const candidate = po[k];
    const later = new Set(po.slice(k).map((c) => c.season));
    // V3/V5/V11 hypothetical: the candidate and later Player Option Years are not Guaranteed.
    const hyp = classes.map((c) => (later.has(c.season) ? { ...c, isGuaranteed: false } : c));
    const hypG = hyp.filter((c) => c.isGuaranteed);
    const priorG = hypG.filter((c) => c.season < candidate.season);
    if (priorG.length === 0) continue;
    // V11 applies only inside the V3 floor: there, option-year buyouts become deemed Signing Bonus.
    const hypBuyout = selectDeemedBuyout(hyp).amount;
    if (hypBuyout !== actualBuyout) usedV11 = true;
    const hypAav =
      (hypG.reduce((s, c) => s + rows.get(c.season)!.currentSalary + cost(c.season), 0) + bonusCost + hypBuyout) / hypG.length;
    // V2 with V5: the contract's actual Signing Bonus (incl. buyouts actually deemed, A3–A5), attributed over the
    // Guaranteed Years before the candidate.
    const signingBonus = bonusCost + actualBuyout;
    const smallest = Math.min(
      ...priorG.map((c) => rows.get(c.season)!.currentSalary + signingBonus / priorG.length + cost(c.season)),
    );
    const figure = Math.max(0.8 * smallest, 0.75 * hypAav); // V3 floor
    // A year is "such" only if its shortfall exceeds MONEY_EPS.
    const short = (c: SeasonClass) => figure - value(c) > MONEY_EPS;
    if (!short(candidate)) continue; // V6: not "such"; try the next option year

    const shortfalls = new Map<number, number>();
    for (const c of po.slice(k)) if (short(c)) shortfalls.set(c.season, figure - value(c));
    const total = [...shortfalls.values()].reduce((s, v) => s + v, 0);
    const allocation = new Map(priorG.map((c) => [c.season, total / priorG.length] as [number, number]));
    return { firstSuch: candidate.season, figure, shortfalls, allocation, usedV11 };
  }
  return { firstSuch: null, figure: 0, shortfalls: new Map(), allocation: new Map(), usedV11 };
}
```

- [ ] **Step 4: Run it to confirm it passes**

Run: `pnpm exec vitest run utils/cbt/__tests__/valley.test.ts && pnpm run typecheck:engine && pnpm test`
Expected: `Tests  7 passed (7)`, the type-check exits 0, and the full suite reports `Tests  145 passed (145)`. Every earlier worked example is unchanged.

- [ ] **Step 5: Commit**

```bash
git add utils/cbt/__tests__/valley.test.ts utils/cbt/valley.ts
git commit -m "fix: scope V11 deemed buyouts to the V3 floor"
```

### Task 5: Nine verified presets

**Files:** Replace `utils/cbt/__tests__/presets.test.ts` and `data/presets.ts`.

- [ ] **Step 1: Write the failing test.** Replace `utils/cbt/__tests__/presets.test.ts`:

```ts
// W14 (preset regressions) and W15 (unattributed mode), spec §7–§8.
import { describe, expect, it } from 'vitest';
import { PRESETS } from '../../../data/presets';
import { calculate, defaultScenario, validate } from '..';

const preset = (id: string) => PRESETS.find((p) => p.id === id)!;

describe('presets', () => {
  it.each(PRESETS.map((p) => [p.id]))('%s passes validation', (id) => {
    expect(validate(preset(id).input).filter((i) => i.severity === 'error')).toEqual([]);
  });

  it.each(PRESETS.filter((p) => p.reported).map((p) => [p.id]))('W14 %s matches the reported CBT figure', (id) => {
    const p = preset(id);
    const r = calculate(p.input, defaultScenario(p.input));
    for (const season of p.reported!.seasons) {
      const cbt = r.perSeason.find((s) => s.season === season)!.cbt;
      expect(Math.abs(cbt - p.reported!.cbt)).toBeLessThanOrEqual(p.reported!.tolerance);
    }
  });

  it('Ohtani engine value is $46,081,476.50 (sequential)', () => {
    const p = preset('ohtani');
    expect(calculate(p.input, defaultScenario(p.input)).aavAtSigning).toBeCloseTo(46_081_476.5, 1);
  });

  it('Scherzer engine value is $28,690,024 (documented $648 residual)', () => {
    const p = preset('scherzer');
    expect(Math.round(calculate(p.input, defaultScenario(p.input)).aavAtSigning)).toBe(28_690_024);
  });

  it('W15 Scherzer in unattributed mode spreads over all 7 Guaranteed Years', () => {
    const p = preset('scherzer');
    const input = { ...p.input, deferral: { ...p.input.deferral, attribution: 'unattributed' as const, unattributedPrincipal: 105_000_000 } };
    expect(Math.abs(calculate(input, defaultScenario(input)).aavAtSigning - 28_211_365)).toBeLessThanOrEqual(1);
  });

  it('Ohtani in unattributed mode reproduces the current app value (~$46.77M)', () => {
    const p = preset('ohtani');
    const input = { ...p.input, deferral: { ...p.input.deferral, attribution: 'unattributed' as const, unattributedPrincipal: 680_000_000 } };
    expect(Math.round(calculate(input, defaultScenario(input)).aavAtSigning)).toBe(46_769_026);
  });

  it.each([['soto'], ['alonso']])('V4 %s sits exactly at the 80% boundary: no Valley Charge', (id) => {
    const p = preset(id);
    const r = calculate(p.input, defaultScenario(p.input));
    expect(r.charges.filter((c) => c.kind === 'valley')).toEqual([]);
  });

  it('F4c Tucker: pro-rata attribution reproduces Cot’s $57,195,945 with no Valley Charge', () => {
    const p = preset('tucker');
    const r = calculate(p.input, defaultScenario(p.input));
    expect(Math.round(r.aavAtSigning)).toBe(57_195_945);
    expect(r.charges.filter((c) => c.kind === 'valley')).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm exec vitest run utils/cbt/__tests__/presets.test.ts`
Expected: FAIL. The Soto, Alonso and Tucker tests can't find their presets, e.g. `Cannot read properties of undefined (reading 'input')`.

- [ ] **Step 3: Replace `data/presets.ts`.** Every term and figure is sourced; don't change a number without a new source.

```ts
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
```

- [ ] **Step 4: Run it to confirm it passes**

Run: `pnpm exec vitest run utils/cbt/__tests__/presets.test.ts && pnpm run typecheck:engine && pnpm test`
Expected: `Tests  33 passed (33)`, the type-check exits 0, and the full suite reports `Tests  166 passed (166)`.

- [ ] **Step 5: Commit**

```bash
git add utils/cbt/__tests__/presets.test.ts data/presets.ts
git commit -m "feat: add Snell, Bregman, Guerrero Jr., Soto, Tucker, Alonso, Bichette, Jansen and Kim presets"
```

### Task 6: Formatting and form helpers

**Files:** Create `utils/__tests__/form.test.ts`, `utils/format.ts` and `utils/form.ts`.

- [ ] **Step 1: Write the failing test.** `utils/__tests__/form.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { validateScenario, type ContractInput } from '../cbt';
import { PRESETS } from '../../data/presets';
import {
  equalPayments,
  fillEvenly,
  hasDeferral,
  setLength,
  setOptOutPayment,
  setStartSeason,
  syncScenario,
  toggleOptOut,
  updateRow,
} from '../form';

const standard = () => structuredClone(PRESETS.find((p) => p.id === 'standard')!.input);
const bellinger = () => structuredClone(PRESETS.find((p) => p.id === 'bellinger')!.input);
const ohtani = () => structuredClone(PRESETS.find((p) => p.id === 'ohtani')!.input);

describe('form helpers', () => {
  it('fillEvenly splits the total across every season', () => {
    const r = fillEvenly(standard(), 150_000_000);
    expect(r.seasons.map((s) => s.currentSalary)).toEqual([30e6, 30e6, 30e6, 30e6, 30e6]);
  });

  it('setLength adds guaranteed seasons copying the last salary, and trims opt-outs when shrinking', () => {
    const grown = setLength(standard(), 7);
    expect(grown.seasons.map((s) => s.season)).toEqual([2027, 2028, 2029, 2030, 2031, 2032, 2033]);
    expect(grown.seasons[6]).toEqual({ season: 2033, currentSalary: 20e6, deferred: 0, kind: 'guaranteed' });
    const shrunk = setLength(bellinger(), 3);
    expect(shrunk.seasons).toHaveLength(3);
    expect(shrunk.optOuts.map((o) => o.afterSeason)).toEqual([2027]);
  });

  it('setLength ignores invalid lengths and returns the same object when nothing changes', () => {
    const input = standard();
    expect(setLength(input, 0)).toBe(input);
    expect(setLength(input, 2.5)).toBe(input);
    expect(setLength(input, input.seasons.length)).toBe(input);
  });

  it('setStartSeason shifts seasons, opt-outs and payments together', () => {
    const r = setStartSeason(ohtani(), 2030);
    expect(r.seasons[0].season).toBe(2030);
    expect(r.deferral.payments[0].year).toBe(2040);
    const b = setStartSeason(bellinger(), 2030);
    expect(b.optOuts.map((o) => o.afterSeason)).toEqual([2031, 2032]);
    expect(b.signingBonus.payments.map((p) => p.year)).toEqual([2030, 2030]);
  });

  it('updateRow drops option-only fields when they no longer apply', () => {
    let r = updateRow(standard(), 2031, { kind: 'player', buyout: 2e6, guaranteedIfExercised: false });
    expect(r.seasons[4]).toMatchObject({ kind: 'player', buyout: 2e6, guaranteedIfExercised: false });
    r = updateRow(r, 2031, { kind: 'club' });
    expect(r.seasons[4]).not.toHaveProperty('guaranteedIfExercised');
    r = updateRow(r, 2031, { kind: 'guaranteed' });
    expect(r.seasons[4]).not.toHaveProperty('buyout');
  });

  it('toggleOptOut adds and removes; setOptOutPayment edits', () => {
    let r = toggleOptOut(standard(), 2028);
    expect(r.optOuts).toEqual([{ afterSeason: 2028, payment: 0 }]);
    r = setOptOutPayment(r, 2028, 5e6);
    expect(r.optOuts).toEqual([{ afterSeason: 2028, payment: 5e6 }]);
    expect(toggleOptOut(r, 2028).optOuts).toEqual([]);
  });

  it('equalPayments splits a total and puts rounding on the last payment', () => {
    expect(equalPayments(2034, 3, 100)).toEqual([
      { year: 2034, amount: 33.33 },
      { year: 2035, amount: 33.33 },
      { year: 2036, amount: 33.34 },
    ]);
    expect(equalPayments(2034, 0, 100)).toEqual([]);
  });

  it('hasDeferral is true for principal, payments, or unattributed mode', () => {
    expect(hasDeferral(standard())).toBe(false);
    expect(hasDeferral(ohtani())).toBe(true);
  });

  it('syncScenario keeps a scenario valid after the contract changes', () => {
    let input: ContractInput = updateRow(standard(), 2031, { kind: 'club', buyout: 1e6 });
    input = toggleOptOut(input, 2028);
    const stale = { options: { 2027: 'exercised' as const, 2031: 'exercised' as const }, optOutTakenAfter: 2029, earnedBonuses: { 2027: 1, 1999: 5 } };
    const synced = syncScenario(input, stale);
    expect(synced).toEqual({ options: { 2031: 'exercised' }, optOutTakenAfter: null, earnedBonuses: { 2027: 1 } });
    expect(validateScenario(input, synced)).toEqual([]);
    // A row that stops being an option loses its decision; a new option row gets the default.
    expect(syncScenario(updateRow(input, 2031, { kind: 'guaranteed' }), synced).options).toEqual({});
    const empty = { options: {}, optOutTakenAfter: null, earnedBonuses: {} };
    expect(syncScenario(updateRow(standard(), 2031, { kind: 'player' }), empty).options).toEqual({ 2031: 'exercised' });
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm exec vitest run utils/__tests__/form.test.ts`
Expected: FAIL with `Error: Cannot find module '../form'`.

- [ ] **Step 3: Create `utils/format.ts`**

```ts
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
```

- [ ] **Step 4: Create `utils/form.ts`**

```ts
// Pure helpers for editing a ContractInput and keeping a Scenario consistent with it.
// The UI components call these; no React here, so they are unit-tested directly.
import { defaultScenario, type ContractInput, type Payment, type Scenario, type SeasonRow } from './cbt';

export const sortRows = (rows: SeasonRow[]) => [...rows].sort((a, b) => a.season - b.season);

/** Set every season's current salary to an equal share of `total` (deferred amounts are left alone). */
export function fillEvenly(input: ContractInput, total: number): ContractInput {
  const n = input.seasons.length;
  return { ...input, seasons: input.seasons.map((r) => ({ ...r, currentSalary: n > 0 ? total / n : 0 })) };
}

/** Grow or shrink the contract to `length` seasons. New seasons copy the last season's pay as guaranteed years. */
export function setLength(input: ContractInput, length: number): ContractInput {
  const rows = sortRows(input.seasons);
  if (!Number.isInteger(length) || length < 1 || rows.length === 0 || length === rows.length) return input;
  const last = rows[rows.length - 1];
  const next =
    length <= rows.length
      ? rows.slice(0, length)
      : [
          ...rows,
          ...Array.from({ length: length - rows.length }, (_, i): SeasonRow => ({
            season: last.season + i + 1,
            currentSalary: last.currentSalary,
            deferred: 0,
            kind: 'guaranteed',
          })),
        ];
  const lastSeason = next[next.length - 1].season;
  return { ...input, seasons: next, optOuts: input.optOuts.filter((o) => o.afterSeason < lastSeason) };
}

/** Move the whole contract to start in `year`, shifting seasons, opt-outs and every payment by the same offset. */
export function setStartSeason(input: ContractInput, year: number): ContractInput {
  const rows = sortRows(input.seasons);
  if (!Number.isInteger(year) || rows.length === 0) return input;
  const d = year - rows[0].season;
  if (d === 0) return input;
  const shift = (p: Payment): Payment => ({ ...p, year: p.year + d });
  return {
    ...input,
    seasons: rows.map((r) => ({ ...r, season: r.season + d })),
    optOuts: input.optOuts.map((o) => ({ ...o, afterSeason: o.afterSeason + d })),
    signingBonus: { ...input.signingBonus, payments: input.signingBonus.payments.map(shift) },
    deferral: { ...input.deferral, payments: input.deferral.payments.map(shift) },
  };
}

export function updateRow(input: ContractInput, season: number, patch: Partial<SeasonRow>): ContractInput {
  return {
    ...input,
    seasons: input.seasons.map((r) => {
      if (r.season !== season) return r;
      const next: SeasonRow = { ...r, ...patch };
      // Option-only fields go away when a row becomes guaranteed; guaranteedIfExercised only applies to player/dual.
      if (next.kind === 'guaranteed') delete next.buyout;
      if (next.kind !== 'player' && next.kind !== 'dual') delete next.guaranteedIfExercised;
      return next;
    }),
  };
}

/** Add an opt-out after `afterSeason` (payment 0), or remove it if one is already there. */
export function toggleOptOut(input: ContractInput, afterSeason: number): ContractInput {
  const exists = input.optOuts.some((o) => o.afterSeason === afterSeason);
  return {
    ...input,
    optOuts: exists
      ? input.optOuts.filter((o) => o.afterSeason !== afterSeason)
      : [...input.optOuts, { afterSeason, payment: 0 }].sort((a, b) => a.afterSeason - b.afterSeason),
  };
}

export function setOptOutPayment(input: ContractInput, afterSeason: number, payment: number): ContractInput {
  return { ...input, optOuts: input.optOuts.map((o) => (o.afterSeason === afterSeason ? { ...o, payment } : o)) };
}

/** `count` equal yearly payments of `total`, starting in `firstYear`. The last payment absorbs rounding. */
export function equalPayments(firstYear: number, count: number, total: number): Payment[] {
  if (!(count >= 1) || !Number.isFinite(total)) return [];
  const each = Math.round((total / count) * 100) / 100;
  return Array.from({ length: count }, (_, i) => ({
    year: firstYear + i,
    amount: i === count - 1 ? Math.round((total - each * (count - 1)) * 100) / 100 : each,
  }));
}

export const totalDeferred = (input: ContractInput) => input.seasons.reduce((s, r) => s + (Number.isFinite(r.deferred) ? r.deferred : 0), 0);

export const hasDeferral = (input: ContractInput) =>
  totalDeferred(input) > 0 || input.deferral.payments.length > 0 || input.deferral.attribution === 'unattributed';

/**
 * Keep a Scenario valid for an edited contract: option decisions only for option seasons (defaults filled in),
 * an opt-out only if it still exists, earned bonuses only for contract seasons.
 */
export function syncScenario(input: ContractInput, scenario: Scenario): Scenario {
  const defaults = defaultScenario(input);
  const options: Scenario['options'] = {};
  for (const key of Object.keys(defaults.options)) {
    const season = Number(key);
    options[season] = scenario.options[season] ?? defaults.options[season];
  }
  const seasons = new Set(input.seasons.map((r) => r.season));
  const earnedBonuses: Scenario['earnedBonuses'] = {};
  for (const [key, value] of Object.entries(scenario.earnedBonuses)) if (seasons.has(Number(key))) earnedBonuses[Number(key)] = value;
  const optOutTakenAfter = input.optOuts.some((o) => o.afterSeason === scenario.optOutTakenAfter) ? scenario.optOutTakenAfter : null;
  return { options, optOutTakenAfter, earnedBonuses };
}
```

- [ ] **Step 5: Run it to confirm it passes**

Run: `pnpm exec vitest run utils/__tests__/form.test.ts && pnpm test`
Expected: `Tests  9 passed (9)`, and the full suite reports `Tests  175 passed (175)`.

- [ ] **Step 6: Commit**

```bash
git add utils/__tests__/form.test.ts utils/format.ts utils/form.ts
git commit -m "feat: add contract-editing and formatting helpers"
```

### Task 7: Input components

**Files:** Create `components/fields.tsx`, `components/PaymentsEditor.tsx`, `components/PresetBar.tsx`, `components/ContractTerms.tsx`, `components/ScheduleEditor.tsx`, `components/DeferralEditor.tsx` and `components/IssuesList.tsx`; replace `components/InfoTooltip.tsx`.

- [ ] **Step 1: Create `components/fields.tsx`**

```tsx
import React, { useEffect, useState } from 'react';
import { InfoTooltip } from './InfoTooltip';
import { moneyInputValue, parseMoney } from '../utils/format';

export const inputClass =
  'w-full border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium bg-slate-700 text-white placeholder-slate-400';
export const errorRing = 'border-red-500 focus:ring-red-500';
export const cardClass = 'bg-white rounded-xl shadow-sm border border-slate-200';

/** Field label. The tooltip button sits beside the <label>, not inside it, so the input's accessible name stays clean. */
export const Label: React.FC<{ text: string; tip?: string; htmlFor?: string }> = ({ text, tip, htmlFor }) => (
  <div className="mb-1 flex items-center">
    <label htmlFor={htmlFor} className="text-sm font-medium text-slate-600">
      {text}
    </label>
    {tip && <InfoTooltip text={tip} />}
  </div>
);

/** Dollar input: keeps the typed text while focused, shows thousands separators otherwise. Empty → NaN. */
export const MoneyInput: React.FC<{
  value: number;
  onChange: (n: number) => void;
  id?: string;
  invalid?: boolean;
  compact?: boolean;
  ariaLabel?: string;
  disabled?: boolean;
}> = ({ value, onChange, id, invalid, compact, ariaLabel, disabled }) => {
  const [text, setText] = useState(moneyInputValue(value));
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setText(moneyInputValue(value));
  }, [value, focused]);
  return (
    <div className="relative">
      <span className={`absolute left-2 top-1/2 -translate-y-1/2 text-slate-300 font-semibold ${compact ? 'text-sm' : 'text-lg left-3'}`}>$</span>
      <input
        id={id}
        aria-label={ariaLabel}
        inputMode="decimal"
        type="text"
        value={text}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          setText(e.target.value);
          onChange(parseMoney(e.target.value));
        }}
        className={`${inputClass} font-mono ${compact ? 'pl-5 pr-2 py-1 text-sm' : 'pl-8 pr-3 py-2 text-lg'} ${invalid ? errorRing : ''} disabled:opacity-40 disabled:cursor-not-allowed`}
      />
    </div>
  );
};

/** Plain number input (years, percentages). Empty → NaN. */
export const NumberInput: React.FC<{
  value: number;
  onChange: (n: number) => void;
  id?: string;
  step?: string;
  min?: string;
  invalid?: boolean;
  compact?: boolean;
  ariaLabel?: string;
}> = ({ value, onChange, id, step, min, invalid, compact, ariaLabel }) => (
  <input
    id={id}
    aria-label={ariaLabel}
    type="number"
    step={step}
    min={min}
    value={Number.isFinite(value) ? value : ''}
    aria-invalid={invalid || undefined}
    onChange={(e) => onChange(e.target.value === '' ? NaN : Number(e.target.value))}
    className={`${inputClass} ${compact ? 'px-2 py-1 text-sm' : 'px-3 py-2 text-lg'} ${invalid ? errorRing : ''}`}
  />
);

/**
 * Whole-number input for structural values (first season, length): edits a local draft and commits only on
 * blur or Enter, so intermediate keystrokes ("1" on the way to "12") never reshape the contract. Invalid → revert.
 */
export const CommitNumberInput: React.FC<{
  value: number;
  onCommit: (n: number) => void;
  id?: string;
  min?: number;
  max?: number;
}> = ({ value, onCommit, id, min, max }) => {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    const n = Number(draft);
    const valid = draft.trim() !== '' && Number.isInteger(n) && (min === undefined || n >= min) && (max === undefined || n <= max);
    if (valid && n !== value) onCommit(n); // unchanged → no edit (keeps a loaded preset loaded)
    else if (!valid) setDraft(String(value));
  };
  return (
    <input
      id={id}
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') setDraft(String(value));
      }}
      className={`${inputClass} px-3 py-2 text-lg`}
    />
  );
};
```

- [ ] **Step 2: Create `components/PaymentsEditor.tsx`**

```tsx
import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { Payment } from '../utils/cbt';
import { equalPayments } from '../utils/form';
import { MoneyInput, NumberInput } from './fields';

/** Edits a list of {year, amount} payments, with an optional "N equal payments" generator. */
export const PaymentsEditor: React.FC<{
  payments: Payment[];
  onChange: (p: Payment[]) => void;
  defaultYear: number;
  /** Total to split when generating equal payments; omit to hide the generator. */
  generateTotal?: number;
  label: string;
}> = ({ payments, onChange, defaultYear, generateTotal, label }) => {
  const [count, setCount] = useState(5);
  const [firstYear, setFirstYear] = useState(defaultYear);
  useEffect(() => setFirstYear(defaultYear), [defaultYear]); // follow the contract when its seasons move
  const canGenerate = Number.isInteger(count) && count >= 1 && Number.isInteger(firstYear) && firstYear >= 1900 && generateTotal !== undefined && generateTotal > 0;
  const set = (i: number, patch: Partial<Payment>) => onChange(payments.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  return (
    <div className="space-y-2">
      {payments.map((p, i) => (
        <div key={i} className="grid grid-cols-[5.5rem_1fr_auto] gap-2 items-center">
          <NumberInput compact value={p.year} onChange={(year) => set(i, { year })} ariaLabel={`${label} payment ${i + 1} year`} />
          <MoneyInput compact value={p.amount} onChange={(amount) => set(i, { amount })} ariaLabel={`${label} payment ${i + 1} amount`} />
          <button
            type="button"
            onClick={() => onChange(payments.filter((_, j) => j !== i))}
            className="p-1 text-slate-400 hover:text-red-600"
            aria-label={`Remove ${label} payment ${i + 1}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button
          type="button"
          onClick={() => onChange([...payments, { year: payments.length ? payments[payments.length - 1].year + 1 : defaultYear, amount: 0 }])}
          className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded"
        >
          <Plus size={12} /> Add payment
        </button>
        {generateTotal !== undefined && (
          <span className="flex items-center gap-1 text-slate-500">
            or
            <input aria-label="Number of equal payments" type="number" min="1" value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-12 border border-slate-300 rounded px-1 py-0.5" />
            equal payments from
            <input aria-label="First payment year" type="number" value={firstYear} onChange={(e) => setFirstYear(Number(e.target.value))} className="w-16 border border-slate-300 rounded px-1 py-0.5" />
            <button
              type="button"
              disabled={!canGenerate}
              onClick={() => canGenerate && onChange(equalPayments(firstYear, count, generateTotal))}
              className="bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded disabled:opacity-50"
            >
              Generate
            </button>
          </span>
        )}
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Create `components/PresetBar.tsx`**

```tsx
import React from 'react';
import { ExternalLink } from 'lucide-react';
import type { Preset, PresetGroup } from '../data/presets';
import { calculate, defaultScenario } from '../utils/cbt';
import { formatMoney } from '../utils/format';

/** Reported CBT vs engine CBT for a preset's reported seasons, under its default scenario (spec §6). */
export function reconcile(preset: Preset): { engine: number; reported: number; delta: number } | null {
  if (!preset.reported) return null;
  const r = calculate(preset.input, defaultScenario(preset.input));
  const values = preset.reported.seasons.map((s) => r.perSeason.find((p) => p.season === s)?.cbt ?? 0);
  const worst = values.reduce((w, v) => (Math.abs(v - preset.reported!.cbt) > Math.abs(w - preset.reported!.cbt) ? v : w), values[0]);
  const delta = Math.round(worst - preset.reported.cbt);
  return { engine: worst, reported: preset.reported.cbt, delta: delta === 0 ? 0 : delta }; // no "-$0"
}

const GROUPS: PresetGroup[] = ['Deferred money', 'Signing bonus', 'Opt-outs', 'Club options', 'Basic'];

export const PresetBar: React.FC<{ presets: Preset[]; activeId: string | null; onLoad: (p: Preset) => void }> = ({ presets, activeId, onLoad }) => {
  const active = presets.find((p) => p.id === activeId) ?? null;
  const rec = active ? reconcile(active) : null;
  return (
    <div className="space-y-3">
      <label htmlFor="preset" className="text-sm font-medium text-slate-600 mb-1 block">Load a Real Contract</label>
      <select
        id="preset"
        value={activeId ?? ''}
        onChange={(e) => {
          const p = presets.find((x) => x.id === e.target.value);
          if (p) onLoad(p);
        }}
        className="w-full border border-blue-200 bg-blue-50 text-blue-700 rounded-lg px-2 py-2 text-sm"
      >
        <option value="" disabled>{activeId ? '' : 'Custom contract — pick one to load…'}</option>
        {GROUPS.map((g) => (
          <optgroup key={g} label={g}>
            {presets.filter((p) => p.group === g).map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </optgroup>
        ))}
      </select>
      {active && (
        <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
          {active.note && <p className="text-amber-700">{active.note}</p>}
          {rec && (
            <p className="font-mono">
              Reported CBT {formatMoney(rec.reported)} · Engine {formatMoney(rec.engine)} · Δ {formatMoney(rec.delta)}
              {active.reported && <span className="font-sans text-slate-500"> ({active.reported.note})</span>}
            </p>
          )}
          {active.sources.length > 0 && (
            <ul className="space-y-1">
              {active.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                    {new URL(s.url).hostname.replace(/^www\./, '')} <ExternalLink size={10} />
                  </a>{' '}
                  — {s.confirms}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 4: Create `components/ContractTerms.tsx`**

```tsx
import React, { useState } from 'react';
import type { ContractInput } from '../utils/cbt';
import { fillEvenly, setLength, setStartSeason, sortRows } from '../utils/form';
import { CommitNumberInput, Label, MoneyInput, NumberInput } from './fields';
import { PaymentsEditor } from './PaymentsEditor';

const ILIR_TIP =
  'Imputed Loan Interest Rate (Art. XXIII(A)(4), E(6)(b)(ii)): the annual Federal mid-term rate for the October before the first Contract Year the contract covers (or the month before terms are confirmed, if earlier). Only used when the contract has deferred money.';
const BONUS_TIP =
  'Spread evenly over the Guaranteed Years whenever it is paid (E(3)). Installments paid after the contract ends are discounted as deferred compensation. With no schedule, the bonus is treated as paid in the first season.';

export const ContractTerms: React.FC<{ input: ContractInput; onChange: (next: ContractInput) => void }> = ({ input, onChange }) => {
  const rows = sortRows(input.seasons);
  const [total, setTotal] = useState(NaN);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label text="First Season" htmlFor="start-season" />
          <CommitNumberInput id="start-season" value={rows[0]?.season ?? 2026} onCommit={(y) => onChange(setStartSeason(input, y))} />
        </div>
        <div>
          <Label text="Length (Seasons)" htmlFor="length" />
          <CommitNumberInput id="length" min={1} max={30} value={rows.length} onCommit={(n) => onChange(setLength(input, n))} />
        </div>
      </div>

      <div>
        <Label text="Fill Salaries Evenly From Total ($)" htmlFor="fill-total" />
        <div className="flex gap-2">
          <div className="flex-1">
            <MoneyInput id="fill-total" value={total} onChange={setTotal} />
          </div>
          <button
            type="button"
            disabled={!Number.isFinite(total)}
            onClick={() => onChange(fillEvenly(input, total))}
            className="text-sm bg-slate-100 hover:bg-slate-200 disabled:opacity-50 px-3 rounded-lg"
          >
            Fill
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label text="Interest Rate (%)" tip={ILIR_TIP} htmlFor="ilir" />
          <NumberInput id="ilir" step="0.01" min="0" value={input.ilirPct} onChange={(ilirPct) => onChange({ ...input, ilirPct })} />
        </div>
        <div>
          <Label text="Signing Bonus ($)" tip={BONUS_TIP} htmlFor="bonus" />
          <MoneyInput
            id="bonus"
            value={input.signingBonus.amount}
            onChange={(amount) => onChange({ ...input, signingBonus: { ...input.signingBonus, amount } })}
          />
        </div>
      </div>
      {(input.signingBonus.amount > 0 || input.signingBonus.payments.length > 0) && (
        <details className="text-sm" open={input.signingBonus.payments.length > 0}>
          <summary className="cursor-pointer text-slate-600">Signing bonus payment schedule ({input.signingBonus.payments.length || 'paid in first season'})</summary>
          <div className="mt-2">
            <PaymentsEditor
              label="Signing bonus"
              payments={input.signingBonus.payments}
              defaultYear={rows[0]?.season ?? 2026}
              onChange={(payments) => onChange({ ...input, signingBonus: { ...input.signingBonus, payments } })}
            />
          </div>
        </details>
      )}
    </div>
  );
};
```

- [ ] **Step 5: Create `components/ScheduleEditor.tsx`**

```tsx
import React from 'react';
import type { ContractInput, ValidationIssue, YearKind } from '../utils/cbt';
import { setOptOutPayment, sortRows, toggleOptOut, updateRow } from '../utils/form';
import { InfoTooltip } from './InfoTooltip';
import { MoneyInput } from './fields';

export const KIND_LABELS: Record<YearKind, string> = {
  guaranteed: 'Guaranteed',
  club: 'Club option',
  mutual: 'Mutual option',
  vesting: 'Vesting option',
  player: 'Player option',
  dual: 'Dual option',
};
const OPTION = new Set<YearKind>(['club', 'mutual', 'vesting', 'player', 'dual']);

const KIND_TIP =
  'Guaranteed years are averaged into the AAV. Club, mutual and vesting options are not guaranteed: their buyout counts up front and the salary only if exercised. Player and dual options count as guaranteed unless the buyout is more than 50% of that year’s salary (E(5)(a)). Option years must come after all guaranteed years.';
const OPT_OUT_TIP =
  'A player opt-out after this season. The seasons after it stay guaranteed (as player option years) unless the opt-out payment is more than 50% of their salaries (E(5)(a)(ii)). Front-loaded deals can trigger a Valley Charge.';

export const ScheduleEditor: React.FC<{
  input: ContractInput;
  issues: ValidationIssue[];
  onChange: (next: ContractInput) => void;
}> = ({ input, issues, onChange }) => {
  const rows = sortRows(input.seasons);
  const unattributed = input.deferral.attribution === 'unattributed';
  const bad = (season: number) => issues.some((i) => i.severity === 'error' && i.field.startsWith(`seasons.${season}`));
  return (
    <div className="overflow-x-auto -mx-2">
      <table className="w-full text-sm">
        <thead className="text-xs text-slate-500">
          <tr>
            <th className="px-2 py-1 text-left font-medium">Season</th>
            <th className="px-2 py-1 text-left font-medium">Current salary</th>
            <th className="px-2 py-1 text-left font-medium">Deferred</th>
            <th className="px-2 py-1 text-left font-medium">
              <span className="inline-flex items-center">Type<InfoTooltip text={KIND_TIP} /></span>
            </th>
            <th className="px-2 py-1 text-left font-medium">Buyout</th>
            <th className="px-2 py-1 text-center font-medium">
              <span className="inline-flex items-center">Opt-out after<InfoTooltip text={OPT_OUT_TIP} /></span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const optOut = input.optOuts.find((o) => o.afterSeason === r.season);
            const isLast = i === rows.length - 1;
            return (
              <React.Fragment key={r.season}>
                <tr className={bad(r.season) ? 'bg-red-50' : ''}>
                  <td className="px-2 py-1 font-medium text-slate-700">{r.season}</td>
                  <td className="px-2 py-1 min-w-[8rem]">
                    <MoneyInput compact invalid={bad(r.season)} value={r.currentSalary} onChange={(currentSalary) => onChange(updateRow(input, r.season, { currentSalary }))} ariaLabel={`${r.season} current salary`} />
                  </td>
                  <td className="px-2 py-1 min-w-[7rem]">
                    <MoneyInput
                      compact
                      invalid={bad(r.season)}
                      disabled={unattributed && Number.isFinite(r.deferred) && r.deferred >= 0} // keep an invalid value fixable
                      value={r.deferred}
                      onChange={(deferred) => onChange(updateRow(input, r.season, { deferred }))}
                      ariaLabel={unattributed ? `${r.season} deferred (not used: deferrals are not assigned to seasons)` : `${r.season} deferred`}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <select
                      aria-label={`${r.season} type`}
                      value={r.kind}
                      onChange={(e) => onChange(updateRow(input, r.season, { kind: e.target.value as YearKind }))}
                      className="border border-slate-300 rounded px-1 py-1 bg-white"
                    >
                      {Object.entries(KIND_LABELS).map(([k, label]) => (
                        <option key={k} value={k}>{label}</option>
                      ))}
                    </select>
                    {(r.kind === 'player' || r.kind === 'dual') && (
                      <label className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                        <input
                          type="checkbox"
                          checked={r.guaranteedIfExercised ?? true}
                          onChange={(e) => onChange(updateRow(input, r.season, { guaranteedIfExercised: e.target.checked }))}
                        />
                        salary guaranteed if exercised
                      </label>
                    )}
                  </td>
                  <td className="px-2 py-1 min-w-[7rem]">
                    {OPTION.has(r.kind) ? (
                      <MoneyInput compact invalid={bad(r.season)} value={r.buyout ?? 0} onChange={(buyout) => onChange(updateRow(input, r.season, { buyout }))} ariaLabel={`${r.season} buyout`} />
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-2 py-1 text-center">
                    {!isLast && (
                      <input
                        type="checkbox"
                        aria-label={`Opt-out after ${r.season}`}
                        checked={!!optOut}
                        onChange={() => onChange(toggleOptOut(input, r.season))}
                      />
                    )}
                  </td>
                </tr>
                {optOut && (
                  <tr className="bg-amber-50/60">
                    <td colSpan={6} className="px-2 py-1">
                      <div className="flex items-center gap-2 text-xs text-amber-900">
                        <span className="whitespace-nowrap">↳ opt-out after {r.season}, payment if he opts out:</span>
                        <div className="w-40">
                          <MoneyInput compact value={optOut.payment} onChange={(p) => onChange(setOptOutPayment(input, r.season, p))} ariaLabel={`Opt-out after ${r.season} payment`} />
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
```

- [ ] **Step 6: Create `components/DeferralEditor.tsx`**

```tsx
import React from 'react';
import type { ContractInput, DeferralSchedule } from '../utils/cbt';
import { sortRows, totalDeferred } from '../utils/form';
import { formatMoney } from '../utils/format';
import { Label, MoneyInput, NumberInput } from './fields';
import { PaymentsEditor } from './PaymentsEditor';

const ATTRIBUTION_TIP =
  'How the contract ties deferred money to seasons (E(6)(b)(i)). Sequential: first-earned paid first (reproduces Ohtani, Scherzer, Snell). Pro-rata: each season’s deferral is spread across every payment (reproduces Tucker, Bregman/Cubs). Not assigned: the CBA default — spread equally over the Guaranteed Years.';
const STATED_TIP =
  'Interest the contract pays on deferred money. Within 1.5 points of the interest rate above, deferrals count at face value (E(6)(b)(ii)); otherwise they are discounted to present value.';

export const DeferralEditor: React.FC<{ input: ContractInput; onChange: (next: ContractInput) => void }> = ({ input, onChange }) => {
  const d = input.deferral;
  const set = (patch: Partial<DeferralSchedule>) => onChange({ ...input, deferral: { ...d, ...patch } });
  const rows = sortRows(input.seasons);
  const lastSeason = rows[rows.length - 1]?.season ?? 2026;
  const principal = d.attribution === 'unattributed' ? (d.unattributedPrincipal ?? NaN) : totalDeferred(input);
  const paid = d.payments.reduce((s, p) => s + (Number.isFinite(p.amount) ? p.amount : 0), 0);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label text="Attribution" tip={ATTRIBUTION_TIP} htmlFor="attribution" />
          <select
            id="attribution"
            value={d.attribution}
            onChange={(e) => {
              const attribution = e.target.value as DeferralSchedule['attribution'];
              // Switching to the CBA default: start from the per-season total so the principal isn't blank.
              const prefill = attribution === 'unattributed' && d.unattributedPrincipal === undefined ? { unattributedPrincipal: totalDeferred(input) } : {};
              set({ attribution, ...prefill });
            }}
            className="w-full border border-slate-300 rounded-lg px-2 py-2 bg-white text-sm"
          >
            <option value="sequential">Contract assigns seasons (sequential)</option>
            <option value="prorata">Each season spread over every payment (pro-rata)</option>
            <option value="unattributed">Not assigned (CBA default)</option>
          </select>
        </div>
        <div>
          <Label text="Stated Interest (%)" tip={STATED_TIP} htmlFor="stated" />
          <NumberInput id="stated" step="0.01" min="0" value={d.statedInterestPct} onChange={(statedInterestPct) => set({ statedInterestPct })} />
        </div>
      </div>
      {d.attribution === 'unattributed' && (
        <div>
          <Label text="Total Deferred Principal ($)" htmlFor="principal" />
          <MoneyInput id="principal" value={d.unattributedPrincipal ?? NaN} onChange={(unattributedPrincipal) => set({ unattributedPrincipal })} />
        </div>
      )}
      <div>
        <p className="text-sm font-medium text-slate-600 mb-1">Payments (after {lastSeason})</p>
        <PaymentsEditor
          label="Deferral"
          payments={d.payments}
          defaultYear={lastSeason + 1}
          generateTotal={Number.isFinite(principal) ? principal : undefined}
          onChange={(payments) => set({ payments })}
        />
        <p className="text-xs text-slate-500 mt-2 font-mono">
          principal {Number.isFinite(principal) ? formatMoney(principal) : '—'} · scheduled {formatMoney(paid)}
        </p>
      </div>
    </div>
  );
};
```

- [ ] **Step 7: Create `components/IssuesList.tsx`**

```tsx
import React from 'react';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import type { ValidationIssue } from '../utils/cbt';

/** Prefix a season-level message with its season ("2027: …") so errors aren't conveyed by row colour alone. */
const describe = (i: ValidationIssue) => {
  const season = /^seasons\.(\d{4})/.exec(i.field)?.[1];
  return season && !i.message.includes(season) ? `${season}: ${i.message}` : i.message;
};

export const IssuesList: React.FC<{ issues: ValidationIssue[] }> = ({ issues }) => {
  if (issues.length === 0) return null;
  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');
  return (
    <div role="alert" className="space-y-2">
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
          <p className="font-semibold flex items-center gap-1 mb-1">
            <AlertCircle size={14} /> Fix {errors.length === 1 ? 'this' : `these ${errors.length}`} to see results
          </p>
          <ul className="list-disc pl-5 space-y-0.5">
            {errors.map((e, i) => (
              <li key={i}>{describe(e)}{e.rule && <span className="font-mono text-xs text-red-500"> · {e.rule}</span>}</li>
            ))}
          </ul>
        </div>
      )}
      {warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          <ul className="space-y-0.5">
            {warnings.map((w, i) => (
              <li key={i} className="flex gap-1"><AlertTriangle size={14} className="mt-0.5 shrink-0" />{describe(w)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 8: Replace `components/InfoTooltip.tsx`.** It becomes a focusable button that opens on hover, focus or tap, with `aria-describedby`.

```tsx
import React, { useId, useState } from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  text: string;
}

/** Explanation bubble: opens on hover, keyboard focus or tap; the text is linked to the button for screen readers. */
export const InfoTooltip: React.FC<InfoTooltipProps> = ({ text }) => {
  const [show, setShow] = useState(false);
  const id = useId();

  return (
    <span className="relative inline-block ml-2 align-middle">
      <button
        type="button"
        aria-label="More information"
        aria-describedby={id}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        onClick={() => setShow(true)} // a tap opens it (mouseenter/focus already fired); blur, Escape or mouseleave close it
        onKeyDown={(e) => e.key === 'Escape' && setShow(false)}
        className="text-gray-400 hover:text-blue-500 focus:text-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-full transition-colors"
      >
        <Info size={16} />
      </button>
      <span
        id={id}
        role="tooltip"
        className={`${show ? 'block' : 'hidden'} absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 text-white text-xs font-normal normal-case rounded shadow-lg z-50 pointer-events-none`}
      >
        {text}
        <span className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-800"></span>
      </span>
    </span>
  );
};
```

- [ ] **Step 9: Type-check**

Run: `pnpm run typecheck`
Expected: only the 2 pre-existing `App.tsx(530,25)` and `App.tsx(535,25)` errors. Nothing in `components/`.

- [ ] **Step 10: Commit**

```bash
git add components/fields.tsx components/PaymentsEditor.tsx components/PresetBar.tsx components/ContractTerms.tsx components/ScheduleEditor.tsx components/DeferralEditor.tsx components/IssuesList.tsx components/InfoTooltip.tsx
git commit -m "feat: add contract input components"
```

### Task 8: Result components

**Files:** Create `components/ScenarioPanel.tsx`, `components/ResultCards.tsx`, `components/FlagsCallout.tsx`, `components/CbtChart.tsx`, `components/YearTable.tsx`, `components/FundingSchedule.tsx` and `components/FundingRules.tsx`.

- [ ] **Step 1: Create `components/ScenarioPanel.tsx`**

```tsx
import React from 'react';
import { defaultScenario, type ContractInput, type Scenario } from '../utils/cbt';
import { sortRows } from '../utils/form';
import { MoneyInput, cardClass } from './fields';
import { KIND_LABELS } from './ScheduleEditor';

/** "What happens?" toggles: option decisions, opt-out, earned bonuses (spec §6). Declining or opting out ends the contract. */
export const ScenarioPanel: React.FC<{
  input: ContractInput;
  scenario: Scenario;
  playedSeasons: number[] | null;
  onChange: (s: Scenario) => void;
}> = ({ input, scenario, playedSeasons, onChange }) => {
  const rows = sortRows(input.seasons);
  const optionSeasons = Object.keys(defaultScenario(input).options).map(Number).sort((a, b) => a - b);
  const played = new Set(playedSeasons ?? rows.map((r) => r.season));
  if (optionSeasons.length === 0 && input.optOuts.length === 0 && rows.length === 0) return null;
  return (
    <div className={`${cardClass} p-6 space-y-4`}>
      <h3 className="text-lg font-semibold text-slate-800">What Happens?</h3>
      {input.optOuts.length > 0 && (
        <fieldset className="space-y-1">
          <legend className="text-sm font-medium text-slate-600 mb-1">Opt-out</legend>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="optout" checked={scenario.optOutTakenAfter === null} onChange={() => onChange({ ...scenario, optOutTakenAfter: null })} />
            Plays out the contract
          </label>
          {input.optOuts.map((o) => (
            <label key={o.afterSeason} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="optout"
                checked={scenario.optOutTakenAfter === o.afterSeason}
                onChange={() => onChange({ ...scenario, optOutTakenAfter: o.afterSeason })}
              />
              Opts out after {o.afterSeason}
            </label>
          ))}
        </fieldset>
      )}
      {optionSeasons.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-600">Options</p>
          {optionSeasons.map((season) => {
            const row = rows.find((r) => r.season === season)!;
            const vesting = row.kind === 'vesting';
            const value = scenario.options[season] ?? 'declined';
            const voided = !played.has(season) && value === 'exercised';
            return (
              <div key={season} className={`flex items-center justify-between gap-2 text-sm ${voided ? 'opacity-50' : ''}`}>
                <span>
                  {season} {KIND_LABELS[row.kind].toLowerCase()}
                  {voided && <span className="text-xs text-slate-500"> (contract already ended)</span>}
                </span>
                <div className="flex rounded-lg border border-slate-300 overflow-hidden" role="group" aria-label={`${season} option decision`}>
                  {(['exercised', 'declined'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={value === v}
                      onClick={() => onChange({ ...scenario, options: { ...scenario.options, [season]: v } })}
                      className={`px-2 py-1 text-xs ${value === v ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                    >
                      {vesting ? (v === 'exercised' ? 'Vested' : 'Not vested') : v === 'exercised' ? 'Exercised' : 'Declined'}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <details>
        <summary className="text-sm font-medium text-slate-600 cursor-pointer">Earned bonuses (count in the season earned, outside the AAV)</summary>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {rows.map((r) => (
            <label key={r.season} className="text-xs text-slate-500">
              {r.season}
              <MoneyInput
                compact
                ariaLabel={`${r.season} earned bonus`}
                value={scenario.earnedBonuses[r.season] ?? 0}
                onChange={(b) => onChange({ ...scenario, earnedBonuses: { ...scenario.earnedBonuses, [r.season]: b } })}
              />
            </label>
          ))}
        </div>
      </details>
    </div>
  );
};
```

- [ ] **Step 2: Create `components/ResultCards.tsx`**

```tsx
import React from 'react';
import { Landmark, RefreshCw, Wallet } from 'lucide-react';
import type { Result } from '../utils/cbt';
import { formatMillions, formatMoney } from '../utils/format';

/** AAV at signing (A1, scenario-independent) and the selected scenario's totals (spec §6). */
export const ResultCards: React.FC<{ result: Result }> = ({ result }) => {
  const diff = result.totals.cbt - result.totals.cash;
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-200 ring-4 ring-blue-50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-blue-700">CBT AAV at Signing</h3>
          <RefreshCw className="w-5 h-5 text-blue-500" />
        </div>
        <p className="text-3xl font-bold text-blue-600" data-testid="aav">{formatMillions(result.aavAtSigning)}</p>
        <p className="text-xs text-blue-400 mt-1 font-mono">{formatMoney(result.aavAtSigning)} per guaranteed year</p>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-slate-500">Total CBT (This Scenario)</h3>
          <Landmark className="w-5 h-5 text-slate-300" />
        </div>
        <p className="text-3xl font-bold text-slate-900" data-testid="total-cbt">{formatMillions(result.totals.cbt)}</p>
        <p className="text-xs text-slate-500 mt-1">charged across every season</p>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-slate-500">Total Cash (This Scenario)</h3>
          <Wallet className="w-5 h-5 text-green-500" />
        </div>
        <p className="text-3xl font-bold text-slate-900" data-testid="total-cash">{formatMillions(result.totals.cash)}</p>
        <p className={`text-xs mt-1 ${diff < 0 ? 'text-green-600' : diff > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
          CBT {diff < 0 ? 'below' : diff > 0 ? 'above' : 'equals'} cash{diff !== 0 && ` by ${formatMillions(Math.abs(diff))}`} — see the breakdown
        </p>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Create `components/FlagsCallout.tsx`.** The V8 quote matches CBA E(5)(d)(i) ¶1 word for word.

```tsx
import React from 'react';
import { Scale } from 'lucide-react';
import { RULES, type Flag, type Tag } from '../utils/cbt';

const TAG_STYLE: Record<Tag, string> = {
  TEXT: 'bg-slate-100 text-slate-600',
  PRACTICE: 'bg-blue-100 text-blue-700',
  INTERP: 'bg-amber-100 text-amber-800',
  CONV: 'bg-purple-100 text-purple-700',
};
export const TAG_HELP: Record<Tag, string> = {
  TEXT: 'stated directly in the CBA',
  PRACTICE: 'CBA ambiguous; matches what MLB actually charged',
  INTERP: 'CBA ambiguous; this calculator’s reading',
  CONV: 'CBA silent; modeling convention',
};

export const TagBadge: React.FC<{ tag: Tag }> = ({ tag }) => (
  <span title={TAG_HELP[tag]} className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${TAG_STYLE[tag]}`}>{tag}</span>
);

/** E(5)(d)(i) ¶1, quoted for the V8 callout (spec §6). */
const V8_QUOTE =
  '“…the difference between the amount paid to the Player under his Contract (including any Option Buyout payment) and the amount that has been attributed to Actual Club Payroll (excluding any amounts attributed pursuant to subparagraph (ii) below) of the Club under that Contract shall be added to (or subtracted from) Actual Club Payroll in the Contract Year in which the Player Option Year falls.”';

/** Every reading, practice or convention the current result depends on, with cite and the alternative reading. */
export const FlagsCallout: React.FC<{ flags: Flag[] }> = ({ flags }) => {
  if (flags.length === 0) return null;
  return (
    <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-6 text-sm">
      <h3 className="font-semibold text-amber-900 flex items-center gap-2 mb-3">
        <Scale size={16} /> This result depends on {flags.length} rule{flags.length === 1 ? '' : 's'} worth knowing
      </h3>
      <ul className="space-y-3">
        {flags.map((f) => {
          const rule = RULES[f.rule];
          const alt = 'alternative' in rule ? rule.alternative : undefined;
          return (
            <li key={f.rule}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-semibold text-slate-700">{f.rule}</span>
                <TagBadge tag={rule.tag} />
                <span className="text-slate-800">{f.message}</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {rule.cite}
                {alt && <> · other reading: {alt}</>}
              </p>
              {f.rule === 'V8' && <blockquote className="mt-2 border-l-2 border-amber-300 pl-3 text-xs italic text-slate-600">E(5)(d)(i): {V8_QUOTE}</blockquote>}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
```

- [ ] **Step 4: Create `components/CbtChart.tsx`**

```tsx
import React from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Result } from '../utils/cbt';
import { formatMoney } from '../utils/format';
import { cardClass } from './fields';

/** CBT charged vs cash received per calendar year, with the last played season marked (spec §6). */
export const CbtChart: React.FC<{ result: Result }> = ({ result }) => {
  const lastPlayed = result.playedSeasons[result.playedSeasons.length - 1];
  return (
    <div className={`${cardClass} p-6`}>
      <h3 className="text-lg font-semibold text-slate-800 mb-6">Financial Timeline</h3>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={result.perSeason} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="season" interval="preserveStartEnd" minTickGap={5} tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v: number) => `$${Math.round(v / 1_000_000)}M`} />
            <Tooltip formatter={(v) => formatMoney(Number(v))} labelStyle={{ color: '#1e293b', fontWeight: 'bold' }} />
            <Legend />
            {lastPlayed !== undefined && <ReferenceLine x={lastPlayed} stroke="red" strokeDasharray="3 3" label={{ value: 'last season played', fontSize: 10, fill: '#ef4444', position: 'top' }} />}
            <Bar dataKey="cash" name="Cash Received" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            <Bar dataKey="cbt" name="CBT Charge" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
```

- [ ] **Step 5: Create `components/YearTable.tsx`**

```tsx
import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { RULES, type Result, type SeasonClass } from '../utils/cbt';
import { formatMoney } from '../utils/format';
import { cardClass } from './fields';
import { TagBadge } from './FlagsCallout';

function status(c: SeasonClass | undefined, played: boolean): string {
  if (!c) return 'payout year';
  const base = c.effectiveKind === 'guaranteed' ? 'guaranteed' : c.effectiveKind === 'club' ? 'club-type option' : c.isGuaranteed ? 'player option (guaranteed)' : 'player option';
  return played ? base : `${base} · not played`;
}

/** Per-season CBT and cash; each season expands into its charge line items with rule ids, tags and cites (spec §6). */
export const YearTable: React.FC<{ result: Result }> = ({ result }) => {
  const [open, setOpen] = useState<Set<number>>(new Set());
  const played = new Set(result.playedSeasons);
  const toggle = (s: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  return (
    <div className={`${cardClass} overflow-hidden`}>
      <div className="px-6 py-4 border-b border-slate-100 flex items-baseline justify-between">
        <h3 className="font-semibold text-slate-800">Year-by-Year Breakdown</h3>
        <span className="text-xs text-slate-400">expand a season to see why</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-3">Season</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right bg-blue-50/50 text-blue-800">CBT Charge</th>
              <th className="px-6 py-3 text-right">Cash Received</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {result.perSeason.map((row) => {
              const charges = result.charges.filter((c) => c.season === row.season);
              const cls = result.classification.find((c) => c.season === row.season);
              const isOpen = open.has(row.season);
              const detailsId = `season-${row.season}-charges`;
              return (
                <React.Fragment key={row.season}>
                  <tr className="hover:bg-slate-50">
                    <td className="px-6 py-3 font-medium text-slate-700">
                      {charges.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => toggle(row.season)}
                          aria-expanded={isOpen}
                          aria-controls={detailsId}
                          aria-label={`${row.season}: ${isOpen ? 'hide' : 'show'} ${charges.length} charge${charges.length === 1 ? '' : 's'}`}
                          className="inline-flex items-center gap-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          {row.season}
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <span className="w-[14px]" />
                          {row.season}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-slate-500">{status(cls, played.has(row.season))}</td>
                    <td className="px-6 py-3 text-right font-medium bg-blue-50/30 text-blue-600 font-mono">{charges.length ? formatMoney(row.cbt) : '—'}</td>
                    <td className="px-6 py-3 text-right text-slate-800 font-mono">{row.cash ? formatMoney(row.cash) : '—'}</td>
                  </tr>
                  {isOpen && (
                    <tr id={detailsId} className="bg-slate-50/60 text-xs">
                      <td colSpan={4} className="px-6 py-2">
                        <ul className="space-y-2">
                          {charges.map((c, i) => (
                            <li key={i} className="grid grid-cols-[1fr_auto] gap-x-4">
                              <span className="text-slate-700">{c.label}</span>
                              <span className="text-right font-mono text-blue-700">{formatMoney(c.amount)}</span>
                              <span className="col-span-2 flex flex-wrap gap-x-3 gap-y-1 text-slate-500">
                                {c.rules.map((r) => (
                                  <span key={r} className="inline-flex items-center gap-1">
                                    <span className="font-mono text-slate-600">{r}</span>
                                    <TagBadge tag={RULES[r].tag} />
                                    <span>{RULES[r].cite}</span>
                                  </span>
                                ))}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-50 font-semibold text-slate-700 border-t border-slate-200">
            <tr>
              <td className="px-6 py-3" colSpan={2}>Total</td>
              <td className="px-6 py-3 text-right font-mono text-blue-700">{formatMoney(result.totals.cbt)}</td>
              <td className="px-6 py-3 text-right font-mono">{formatMoney(result.totals.cash)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
```

- [ ] **Step 6: Create `components/FundingSchedule.tsx`**

```tsx
import React from 'react';
import type { Result } from '../utils/cbt';
import { formatMoney } from '../utils/format';
import { cardClass } from './fields';

/** Article XVI: the funded balance the club must hold each July 1 (X1–X5). Hidden when nothing is deferred. */
export const FundingSchedule: React.FC<{ result: Result }> = ({ result }) => {
  const { snapshots, peak } = result.funding;
  if (snapshots.length === 0) return null;
  return (
    <div className={`${cardClass} p-6`}>
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Required Funding (Article XVI)</h3>
        <p className="text-sm text-slate-500">
          peak <span className="font-mono font-semibold text-slate-800">{formatMoney(peak)}</span>
        </p>
      </div>
      <p className="text-xs text-slate-500 mb-3">
        Present value at 5% of the deferred payments still owed, held from the second July 1 after each season they were earned. Snapshots use
        whole years; a payment due on July 1 counts as paid.
      </p>
      <details>
        <summary className="text-sm text-slate-600 cursor-pointer">Balance by July 1 ({snapshots.length} years)</summary>
        <table className="w-full text-sm mt-2">
          <tbody className="divide-y divide-slate-100">
            {snapshots.map((s) => (
              <tr key={s.july1}>
                <td className="py-1 text-slate-600">July 1, {s.july1}</td>
                <td className="py-1 text-right font-mono">{formatMoney(s.required)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
};
```

- [ ] **Step 7: Create `components/FundingRules.tsx`.** This moves `FundingDetailCard` and `FundingRules` **verbatim** out of the current `App.tsx`; PR 4 corrects the copy.

```tsx
import React from 'react';
import { Calendar, Wallet, Landmark, Percent, Coins, Users, ShieldCheck } from 'lucide-react';

// Article XVI funding rules (static copy, moved from App.tsx).
const FundingDetailCard = ({ icon, title, tag, children }: { icon: React.ReactNode, title: string, tag: string, children?: React.ReactNode }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
    <div className="flex justify-between items-start mb-3">
      <div className="flex items-center gap-3">
        {/* <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">{icon}</div> */}
        <h5 className="font-bold text-slate-900 text-lg">{title}</h5>
      </div>
      <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-1 rounded uppercase tracking-wide">{tag}</span>
    </div>
    <div className="text-sm text-slate-600 leading-relaxed">
      {children}
    </div>
  </div>
);

export const FundingRules = () => {
  return (
    <div className="space-y-6 mt-8">
      <h3 className="text-xl font-bold text-slate-800 px-1">Funding & Escrow Rules</h3>
      
      {/* Timeline Card */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <h4 className="text-lg font-bold text-slate-800 mb-8">Funding Deadline Timeline</h4>
        <div className="relative border-l-2 border-blue-100 ml-3 space-y-10 pl-8 py-2">
          
          {/* Year 0 */}
          <div className="relative">
            <div className="absolute -left-[39px] top-1 w-5 h-5 rounded-full bg-blue-500 border-4 border-white shadow-sm box-content"></div>
            <span className="text-xs font-bold text-blue-600 tracking-wider uppercase mb-1 block">Year 0</span>
            <h5 className="font-bold text-slate-900 text-lg">Contract Execution</h5>
            <p className="text-sm text-slate-600 mt-1">Player and Club agree to deferred compensation terms.</p>
          </div>

          {/* Year 1 */}
          <div className="relative">
            <div className="absolute -left-[39px] top-1 w-5 h-5 rounded-full bg-blue-500 border-4 border-white shadow-sm box-content"></div>
            <span className="text-xs font-bold text-blue-600 tracking-wider uppercase mb-1 block">Year 1</span>
            <h5 className="font-bold text-slate-900 text-lg">Season Played</h5>
            <p className="text-sm text-slate-600 mt-1">The championship season in which the deferred compensation is earned.</p>
          </div>

          {/* Year 2 */}
          <div className="relative">
            <div className="absolute -left-[39px] top-1 w-5 h-5 rounded-full bg-blue-300 border-4 border-white shadow-sm box-content"></div>
            <span className="text-xs font-bold text-blue-500 tracking-wider uppercase mb-1 block">Year 2 (July 1)</span>
            <h5 className="font-bold text-slate-800 text-lg">First July 1</h5>
            <p className="text-sm text-slate-600 mt-1">First July 1st following the season earned. No funding required yet.</p>
          </div>

          {/* Year 3 */}
          <div className="relative">
            <div className="absolute -left-[39px] top-1 w-5 h-5 rounded-full bg-blue-600 border-4 border-white shadow-sm box-content"></div>
            <span className="text-xs font-bold text-blue-700 tracking-wider uppercase mb-1 block">Year 3 (Second July 1)</span>
            <h5 className="font-bold text-slate-900 text-lg">Funding Deadline</h5>
            <p className="text-sm text-slate-600 mt-1">The deferred obligation must be fully funded by the Club by this date.</p>
          </div>
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Calendar size={20} /></div>
            <h4 className="font-bold text-slate-900 text-lg">The Deadline</h4>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">
            Funding must occur on or before the <strong>second July 1</strong> following the championship season in which the deferred compensation is earned.
          </p>
        </div>
        <div className="bg-green-50/50 p-6 rounded-xl border border-green-100 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg"><Wallet size={20} /></div>
            <h4 className="font-bold text-slate-900 text-lg">No Limits</h4>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">
            There are no limitations on either the amount of deferred compensation or the percentage of total compensation attributable to deferred compensation for which a Uniform Player’s Contract may provide.
          </p>
        </div>
      </div>

      {/* Detailed Rules List */}
      <div className="space-y-4">
        <FundingDetailCard 
          icon={<Landmark size={18} />} 
          title="Funding Requirement" 
          tag="Article XVI"
        >
          Deferred compensation obligations incurred in a Contract executed on or after September 30, 2002 must be fully funded by the Club. The funding amount must be equal to the present value of the total deferred compensation obligation.
        </FundingDetailCard>

        <FundingDetailCard 
          icon={<Percent size={18} />} 
          title="Calculation of Present Value" 
          tag="Article XVI"
        >
          Full funding of the present value of deferred compensation obligations means the Club must fund the current present value of the outstanding deferred payments, discounted by 5% annually. <br/><br/>
          <span className="text-slate-500 text-xs">Note: If the prime interest rate is 7% or higher, the parties may agree to amend this discount rate.</span>
        </FundingDetailCard>

        <FundingDetailCard 
          icon={<Coins size={18} />} 
          title="Nature of Funded Assets" 
          tag="Article XVI"
        >
          The amount funded must be maintained in the form of unencumbered assets comprising:
          <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-600">
            <li>Cash</li>
            <li>Cash equivalents</li>
            <li>Registered and unrestricted readily marketable securities</li>
          </ul>
          <p className="mt-2">Unless the Club obtains the Parties' prior written authorization of an alternative form.</p>
        </FundingDetailCard>

        <FundingDetailCard 
          icon={<Users size={18} />} 
          title="Creditor Access" 
          tag="Article XVI"
        >
          Crucially, while the funds must be exclusively for the purpose of satisfying the deferred obligation, the agreement specifies that "such amount(s) funded are subject to the claims of the Club's general creditors." This differs from a bankruptcy-remote escrow.
        </FundingDetailCard>

        <div className="bg-amber-50 p-5 rounded-lg border border-amber-100">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-100 text-amber-600 rounded-md"><ShieldCheck size={16} /></div>
              <h5 className="font-bold text-amber-900">Historical Deductible</h5>
            </div>
          </div>
          <p className="text-sm text-amber-800 leading-relaxed">
            For contracts executed before December 11, 2011, Clubs are entitled to an annual deductible amount of deferred compensation which need not be funded. This deductible is the lesser of $2,000,000 or the present value of the total deferred compensation obligations owed.
          </p>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 8: Type-check**

Run: `pnpm run typecheck`
Expected: only the 2 pre-existing `App.tsx` errors.

- [ ] **Step 9: Commit**

```bash
git add components/ScenarioPanel.tsx components/ResultCards.tsx components/FlagsCallout.tsx components/CbtChart.tsx components/YearTable.tsx components/FundingSchedule.tsx components/FundingRules.tsx
git commit -m "feat: add result components; move funding rules into their own component"
```

### Task 9: New `App.tsx`; retire the old calculator; retitle

**Files:** Replace `App.tsx` and `index.html`; delete `utils/calculations.ts` and `utils/__tests__/calculations.test.ts`.

- [ ] **Step 1: Replace `App.tsx`**

```tsx
import React, { useMemo, useState } from 'react';
import { Calculator, Info, Plus } from 'lucide-react';
import { calculate, defaultScenario, validate, validateScenario, type ContractInput, type Result, type Scenario } from './utils/cbt';
import { PRESETS, type Preset } from './data/presets';
import { hasDeferral, syncScenario } from './utils/form';
import { cardClass } from './components/fields';
import { PresetBar } from './components/PresetBar';
import { ContractTerms } from './components/ContractTerms';
import { ScheduleEditor } from './components/ScheduleEditor';
import { DeferralEditor } from './components/DeferralEditor';
import { IssuesList } from './components/IssuesList';
import { ScenarioPanel } from './components/ScenarioPanel';
import { ResultCards } from './components/ResultCards';
import { FlagsCallout } from './components/FlagsCallout';
import { CbtChart } from './components/CbtChart';
import { YearTable } from './components/YearTable';
import { FundingSchedule } from './components/FundingSchedule';
import { FundingRules } from './components/FundingRules';

const initial = PRESETS.find((p) => p.id === 'ohtani')!;

const App: React.FC = () => {
  const [input, setInput] = useState<ContractInput>(() => structuredClone(initial.input));
  const [scenario, setScenario] = useState<Scenario>(() => defaultScenario(initial.input));
  const [presetId, setPresetId] = useState<string | null>(initial.id);
  const [showDeferral, setShowDeferral] = useState(false);

  const edit = (next: ContractInput) => {
    if (next === input) return; // no-op edits (e.g. an invalid length) keep the preset and its reconciliation
    setInput(next);
    setScenario((s) => syncScenario(next, s));
    setPresetId(null); // the preset's reported figure no longer applies
  };
  const load = (p: Preset) => {
    const next = structuredClone(p.input);
    setInput(next);
    setScenario(defaultScenario(next));
    setPresetId(p.id);
  };

  const issues = useMemo(() => [...validate(input), ...validateScenario(input, scenario)], [input, scenario]);
  const result: Result | null = useMemo(
    () => (issues.some((i) => i.severity === 'error') ? null : calculate(input, scenario)),
    [input, scenario, issues],
  );
  const deferralVisible = showDeferral || hasDeferral(input);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      <header className="bg-slate-900 text-white pt-8 pb-12 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <Calculator className="w-8 h-8 text-blue-400" />
            <h1 className="text-2xl font-bold">MLB Contract Calculator</h1>
          </div>
          <p className="text-slate-400 max-w-3xl">
            Calculate a contract’s Competitive Balance Tax (luxury tax) charge — salaries, signing bonuses, options, opt-outs and deferred money —
            under Article XXIII of the 2022–2026 Basic Agreement.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 -mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-6">
            <div className={`${cardClass} p-6 space-y-5`}>
              <h2 className="text-lg font-semibold text-slate-800">Contract Terms</h2>
              <PresetBar presets={PRESETS} activeId={presetId} onLoad={load} />
              <ContractTerms input={input} onChange={edit} />
            </div>

            {deferralVisible ? (
              <div className={`${cardClass} p-6`}>
                <h2 className="text-lg font-semibold text-slate-800 mb-3">Deferred Money</h2>
                <DeferralEditor input={input} onChange={edit} />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowDeferral(true)}
                className="w-full flex items-center justify-center gap-1 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl py-3"
              >
                <Plus size={14} /> Add deferred money
              </button>
            )}

            <IssuesList issues={issues} />

            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100 text-sm text-blue-900 space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Info size={16} /> Calculation Methodology
              </h3>
              <p>
                The <strong>CBT charge</strong> for a multi-year contract is its Average Annual Value: Base Salary, signing bonus and the cost of
                deferred money across the Guaranteed Years, divided by the number of Guaranteed Years (Art. XXIII(E)(2)). Options, opt-outs and
                earned bonuses then adjust individual seasons.
              </p>
              <p>
                Deferred money counts in the season the contract attributes it to — or equally across the Guaranteed Years if it doesn’t (E(6)(b)(i)).
                It is discounted to present value at the Imputed Loan Interest Rate unless it carries interest within 1.5 points of that rate, in which
                case it counts at face value (E(6)(b)(ii)).
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className={`${cardClass} p-6`}>
              <h2 className="text-lg font-semibold text-slate-800 mb-3">Season by Season</h2>
              <ScheduleEditor input={input} issues={issues} onChange={edit} />
            </div>
            {/* Always rendered: it holds the earned-bonus inputs, so an invalid bonus must stay editable. */}
            <ScenarioPanel input={input} scenario={scenario} playedSeasons={result?.playedSeasons ?? null} onChange={setScenario} />
            {result ? (
              <>
                <ResultCards result={result} />
                <FlagsCallout flags={result.flags} />
                <CbtChart result={result} />
                <YearTable result={result} />
                <FundingSchedule result={result} />
              </>
            ) : (
              <div className={`${cardClass} p-12 text-center text-slate-500`}>Results appear once the contract terms are valid.</div>
            )}
            <FundingRules />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
```

- [ ] **Step 2: Replace `index.html`.** Only the `<title>` changes.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MLB Contract Calculator</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
      body {
        font-family: 'Inter', sans-serif;
        background-color: #f3f4f6;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/index.tsx"></script>
  </body>
</html>
```

- [ ] **Step 3: Delete the old calculator and its characterization tests**

```bash
git rm utils/calculations.ts utils/__tests__/calculations.test.ts
```

- [ ] **Step 4: Verify**

Run: `pnpm run typecheck && pnpm run typecheck:engine && pnpm test && pnpm run build`
Expected: both type-checks exit 0 with no errors, then `Test Files  13 passed (13)`, `Tests  173 passed (173)`, then `✓ built in`.

- [ ] **Step 5: Smoke-test in a browser** (the controller may do this step)

Run `pnpm exec vite --port 3107 --strictPort --host 127.0.0.1` and open it. Check that:
- the title reads "MLB Contract Calculator";
- the Ohtani preset shows "$46.08M" and "Reported CBT $46,080,000 · Engine $46,081,476 · Δ $1,476";
- loading Bellinger and choosing "Opts out after 2027" shows Total CBT $109.5M, Total Cash $85M and a V8 quote;
- clearing a salary shows an error that names the season ("2027: …") and hides results;
- typing a new Length only takes effect on blur or Enter;
- the year-table rows expand with Enter.

Stop the server.

- [ ] **Step 6: Commit**

```bash
git add App.tsx index.html
git commit -m "feat!: rebuild the UI on the CBT engine and rename to MLB Contract Calculator"
```

### Task 10: Rename across the repo, CI type-check, docs, spec

**Files:** Replace `.github/workflows/ci.yml`, `README.md`, `CLAUDE.md` and `docs/superpowers/specs/2026-11-04-cbt-contract-engine-design.md`; edit one line of `Dockerfile`.

- [ ] **Step 1: Replace `.github/workflows/ci.yml`.** This changes the smoke-test title and adds the "Type-check project" step.

```yaml
name: CI

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  audit:
    runs-on: ubuntu-26.04
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1

      # One step supplies pnpm (from `packageManager`), Node (auto-detected
      # from .nvmrc), the pnpm store cache, and the frozen install.
      # `require-lockfile` also fails the job when no lockfile exists at all.
      - uses: pnpm/setup@fa36a5ef7dcdefc3a7cb25655c122e00cf6e636e # v3.1.2
        with:
          cache: true
          require-lockfile: true

      - name: Check for known vulnerabilities
        run: pnpm audit --prod --audit-level=moderate

  test:
    runs-on: ubuntu-26.04
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1

      # Same setup as the audit job: pnpm from `packageManager`, Node from
      # .nvmrc, store cache, frozen install.
      - uses: pnpm/setup@fa36a5ef7dcdefc3a7cb25655c122e00cf6e636e # v3.1.2
        with:
          cache: true
          require-lockfile: true

      - name: Type-check engine
        run: pnpm run typecheck:engine

      - name: Type-check project
        run: pnpm run typecheck

      - name: Run tests
        run: pnpm test

  # Build the image on every PR. publish.yml only runs on a published release,
  # so without this job a Dockerfile-only change (e.g. a Renovate Node-major
  # bump like #262, which removed Corepack out from under `corepack enable`)
  # shows all-green and first fails at release time. Build only, no push.
  # Both arches build natively, matching publish.yml, because the image's main
  # target is a Raspberry Pi (arm64).
  docker-build:
    strategy:
      fail-fast: false
      matrix:
        # Keep the `runner: <os>-<version>` one-line shape: the shared
        # preset's `github-runners` customManager keys on it (see the long
        # note in publish.yml). Any other shape silently un-tracks the label.
        include:
          - platform: linux/amd64
            runner: ubuntu-26.04
          - platform: linux/arm64
            runner: ubuntu-26.04-arm
    runs-on: ${{ matrix.runner }}
    permissions:
      contents: read

    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@f87e5991a6d7451dcb8d9637bfbc97413f497069 # v4.4.1

      - name: Build image
        uses: docker/build-push-action@c3c9e263c25d99ce0380d002d59b67737d91b0dc # v7.4.0
        with:
          context: .
          platforms: ${{ matrix.platform }}
          push: false
          load: true
          tags: mlb-calc:ci

      # Proves the runtime stage works too (serve installed and on PATH,
      # dist/ copied), not just that the builder stage compiled.
      - name: Smoke test
        run: |
          docker run -d --name app -p 3000:3000 mlb-calc:ci
          for _ in $(seq 30); do
            curl -sf -o /dev/null http://localhost:3000/ && break
            sleep 1
          done
          if ! curl -sf http://localhost:3000/ | grep -q '<title>MLB Contract Calculator</title>'; then
            echo "::error::Container did not serve the app on :3000"
            docker logs app
            exit 1
          fi
```

- [ ] **Step 2: Dockerfile comment**

Run: `sed -i '' 's/# Multi-stage build for MLB Deferred Contract Calculator/# Multi-stage build for MLB Contract Calculator/' Dockerfile`. On Linux, use `sed -i` without `''`.
Expected: `head -1 Dockerfile` prints `# Multi-stage build for MLB Contract Calculator`.

- [ ] **Step 3: Replace `README.md`**

```markdown
# MLB Contract Calculator

A calculator for the Competitive Balance Tax (CBT / luxury tax) charge of any MLB contract under Article XXIII of the 2022–2026 Basic Agreement: year-by-year salaries, signing bonuses, club/mutual/vesting/player/dual options with buyouts, opt-outs (including the Valley Charge), earned bonuses, and deferred money (discounted at the Imputed Loan Interest Rate), plus the Article XVI funding requirement.

Pick what happens — options exercised or declined, an opt-out taken — and see the CBT charge season by season, with every line item traced to the CBA rule behind it and a callout for every result that depends on an interpretation. Presets reproduce the published figures for real contracts (Ohtani, Scherzer, Snell, Bregman, Guerrero Jr., Soto, Bellinger, Tucker, Alonso, Bichette, Jansen, Kim), each with its sources.

The rules, their CBA citations and every judgment call are documented in [`docs/superpowers/specs/2026-11-04-cbt-contract-engine-design.md`](docs/superpowers/specs/2026-11-04-cbt-contract-engine-design.md).

## Credits

Originally created by [WarrenAdams8](https://github.com/WarrenAdams8/MLB-Deferred-Contract-Calculator-) using Google AI Studio.

## Run Locally

**Prerequisites:** the exact Node.js version in `package.json` `engines.node` (`.npmrc` sets `engine-strict`, so other versions fail to install) and the pnpm version pinned in `package.json` `packageManager`. Node 25+ no longer bundles Corepack, so install it with `npm install -g pnpm@<version>`.

```bash
pnpm install
pnpm run dev
```

The app will be available at `http://localhost:3000`.

## Docker Deployment

The Docker image is published to GHCR and builds for both `linux/amd64` and `linux/arm64` (Raspberry Pi compatible).

### Using the pre-built image (recommended)

```bash
docker-compose up -d
```

This pulls `ghcr.io/owine/mlb-deferred-contract-calculator:latest` and serves on port 3000.

### Building locally

Uncomment the `build` section in `docker-compose.yml` and comment out the `image` line, then:

```bash
docker-compose up -d --build
```

Or build directly:

```bash
docker build -t mlb-calculator .
docker run -d --name mlb-calculator --restart unless-stopped -p 3000:3000 mlb-calculator
```

### Reverse Proxy

The container serves on port 3000. Point your reverse proxy (nginx, Caddy, Traefik, etc.) to `http://localhost:3000`.
```

- [ ] **Step 4: Replace `CLAUDE.md`**

```markdown
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Dev server:** `pnpm run dev` (serves on port 3000, binds 0.0.0.0)
- **Build:** `pnpm run build` (Vite production build to `dist/`)
- **Preview build:** `pnpm run preview`
- **Tests:** `pnpm test` (Vitest, `vitest run`; also runs in CI)
- **Type-check:** `pnpm run typecheck` (whole project) and `pnpm run typecheck:engine` (strict, engine + presets); both run in CI
- **Docker:** `docker-compose up -d` (builds and serves on port 3000)

There is no linting or formatting configured.

## Architecture

Single-page React + TypeScript app built with Vite. Calculates the MLB Competitive Balance Tax (CBT/luxury tax) charge of any contract — salaries, signing bonuses, options, opt-outs, deferred money — under Article XXIII of the CBA.

### Key Files

- `App.tsx` — State and layout only: holds the `ContractInput` and `Scenario`, validates, calls the engine, and lays out the components.
- `components/` — `ContractTerms`, `ScheduleEditor`, `DeferralEditor`, `PaymentsEditor`, `IssuesList` (inputs); `ScenarioPanel`, `ResultCards`, `FlagsCallout`, `CbtChart`, `YearTable`, `FundingSchedule`, `FundingRules` (results); `PresetBar`, `fields.tsx` (shared inputs), `InfoTooltip`.
- `utils/form.ts` — Pure helpers for editing a contract and keeping the scenario valid (`syncScenario`); tested in `utils/__tests__/form.test.ts`.
- `utils/format.ts` — Money formatting and parsing.
- `utils/cbt/` — CBT contract engine (pure functions). Implements every rule in `docs/superpowers/specs/2026-11-04-cbt-contract-engine-design.md`. `rules.ts` maps each rule id to its CBA citation and evidence tag. `calculate(input, scenario)` in `index.ts` is the entry point. Tests are in `utils/cbt/__tests__/` (worked examples W1–W18, presets, invariants). Strict type-check: `pnpm run typecheck:engine`.
- `data/presets.ts` — Real-contract presets with sources and reported CBT figures.
- `components/InfoTooltip.tsx` — Hover tooltip component used for field explanations.
- `index.tsx` — React entry point, renders `<App />` into `#root`.

### Domain Concepts

- **CBT AAV**: (Base Salary + signing bonus + deferred-money cost over the Guaranteed Years) ÷ number of Guaranteed Years (E(2)). Options, opt-outs, the Valley Charge and earned bonuses then adjust individual seasons.
- **Deferred money** counts in the season the contract attributes it to — sequential, pro-rata, or (CBA default) equally over the Guaranteed Years — discounted at the Imputed Loan Interest Rate (October mid-term AFR before the first Contract Year).
- **Article XVI funding**: separate 5% present value the club must hold from the second July 1 after each season.
- The spec's rule ids (A1, V4, F4c, …) appear in `utils/cbt/rules.ts`, in charge line items, and in the UI.

### Styling

Tailwind CSS v4 is a real dependency, wired through the `@tailwindcss/vite` plugin (see `vite.config.ts`). `style.css` is a single `@import "tailwindcss";` line, imported by `index.tsx`. There is no `tailwind.config.*` or PostCSS config — v4 is zero-config. Uses Inter font from Google Fonts (linked in `index.html`). Path alias `@/*` maps to project root.

### Commit Conventions

This project uses **conventional commits** and squash-merges only, so the PR title becomes the commit subject. Releases come from **release-drafter**: every push to `main` refreshes one draft GitHub Release, and a human publishes it to release. `.github/release-drafter.yml` only `_extends` the shared `owine/renovate-config:/release-drafter.yml`, so don't add local categories or replacers. Sections and version bump are read from the **PR title**:

- `feat` → minor; `fix`, `perf`, `revert`, `deps` → patch.
- `chore`, `ci`, `docs`, `test`, `refactor`, `build`, `style` are hidden. If only these merged, the draft reads `_No user-facing changes._`, so don't publish it.
- A breaking change needs `!` **in the title** (`feat!:`). A `BREAKING CHANGE:` footer is ignored. While on `0.x`, a `!` drafts `1.0.0`.
- A non-conventional title still shows up, unsectioned, and bumps patch.

**GitHub Releases is the source of truth for versions and release notes.** `CHANGELOG.md` is frozen at v0.4.7. `package.json` `"version"` is no longer bumped and stays at `0.4.7`. The package is private and nothing reads the field (not the app, `vite.config.ts` or the Dockerfile), so leave it alone rather than treating it as the current version.

Renovate produces `deps:` commits for all dependency PRs. `renovate.json` only extends the shared `owine/renovate-config` presets (base + `:automerge` + `:node` + `:docker`); `semanticCommitType: "deps"`, scheduling, automerge, and the Dockerfile `npm install -g` custom manager all come from those presets rather than being defined locally.

### Deployment

Multi-stage Dockerfile. The build stage installs pnpm with `npm install -g pnpm@$PNPM_VERSION --ignore-scripts` (`.npmrc` is not copied in yet at that point), because Node 25+ no longer bundles Corepack (`PNPM_VERSION` must match `packageManager` in `package.json`; the shared Renovate preset tracks the `ARG PNPM_VERSION=` line in the `toolchain-versions` group). It then copies the manifests, lockfile, `pnpm-workspace.yaml` and `.npmrc`, and runs `pnpm install --frozen-lockfile` and `pnpm run build`. The runtime stage copies only `dist/` and serves it with `serve` on port 3000. It installs `serve` with `npm install -g serve@VERSION` on purpose: that stage has no pnpm installed, and the shared Renovate `docker` preset's custom manager tracks exactly that `npm install -g pkg@VERSION` pattern. Designed for Raspberry Pi (ARM compatible). GitHub Actions handle Docker image publishing and release drafting. `publish.yml` runs on `release: published`, i.e. when the draft is published. It does not run on tag pushes. It tags the multi-arch image `X.Y.Z`, `X.Y`, `X` and `latest` from the release tag.
```

- [ ] **Step 5: Replace the spec.** This adds F4(c), the §2.4.1 evidence, the V11 scope, §6 UI notes, the §7 presets and the §10 decisions.

````markdown
# CBT Contract Engine — Design Spec (Spec 1 of 2)

**Date:** 2026-11-04 (rev. 4, after three independent CBA-verification reviews)
**Status:** Approved 2026-11-04
**Scope:** Generalize the calculator from "deferred money only" to any MLB Uniform Player's Contract: year-by-year salaries, signing bonuses, club / mutual / vesting / player / dual options with buyouts, opt-outs (including the Valley Charge), earned incentives, deferrals, and Article XVI funding. Real-contract presets.
**Follow-on (Spec 2, not designed here):** team tax bill (Actual Club Payroll, thresholds, tiered and repeat-payor rates, surcharges), with thresholds/rates stored per Contract Year as data. The 2022–2026 Basic Agreement expires December 1, 2026; 2027+ terms are unknown as of this spec.

---

## 1. Source of truth and evidence standard

**Primary source:** 2022–2026 Basic Agreement (MLB / MLBPA), PDF at
`https://registrationz.mlbpa.org/pdf/MLB%20Basic%20Agreement%202022-26.pdf`.
Citations give the Article/Section and the printed page number.

Every rule the engine implements carries exactly one evidence tag:

| Tag | Meaning |
|---|---|
| **[TEXT]** | Stated directly in the CBA text. |
| **[PRACTICE]** | CBA text is ambiguous or silent; engine follows the figure MLB actually charged, as reported by named sources. |
| **[INTERP]** | CBA text is ambiguous and no published figure resolves it; engine's reading is stated, the alternative is named, and the UI flags results that depend on it. |
| **[CONV]** | CBA is silent; a modeling convention is required to compute anything. Shown in the UI as a convention, not a rule. |

No rule enters the engine without a tag. Code comments cite the same section, and each per-season charge line item carries its rule id so the UI can show *why* a number exists.

---

## 2. CBT rules implemented (Article XXIII)

### 2.1 Definitions

| # | Rule | Tag | Cite |
|---|---|---|---|
| D1 | **Contract Year** = Dec 2 → Dec 1, referenced by the calendar year of its championship season. | [TEXT] | XXIII(A)(1), p.115–116 |
| D2 | **Imputed Loan Interest Rate (ILIR)** = annual Federal mid-term rate (IRC §1274(d)) for the **October preceding** the Contract Year. For deferral discounting, use the ILIR for the **first Contract Year covered by the contract**. If terms are confirmed before that rate is available, use the mid-term rate for the **month preceding confirmation**. | [TEXT] | XXIII(A)(4), p.116; E(6)(b)(ii), p.136–137 |
| D3 | **Base Salary** = amount in ¶2 of the UPC for a season (or a Special Covenant in lieu of ¶2). | [TEXT] | XXIII(A)(7), p.116 |
| D4 | **Guaranteed Year** = a season for which **more than 50%** of Base Salary is guaranteed on termination under UPC ¶7(b)(2). The UI's "Guaranteed" kind means the user asserts this test is met. | [TEXT] | XXIII(A)(8), p.116 |
| D5 | **Current vs. deferred salary.** Each season's salary is entered as **current salary** (paid during the term) plus **deferred** (principal attributed to that season, F2). Everywhere Article XXIII says "Base Salary", the engine uses **current salary**, and deferred money enters only through E(6). The basis is that E(2) and E(5)(d)(ii) both list "Base Salary" and "deferred compensation" as *separate* addends, so a Base Salary that included the deferral would count it twice. For A1 this is confirmed by practice: Ohtani's $46.08M reproduces only as current $2M + PV(deferred). For the 50% tests (D4, Y2, Y3) and V1/V2 it is **[INTERP]**. The alternative uses current + nominal deferred, and for a deferral-heavy contract with a buyout it can flip guaranteed status. | A1 use: [PRACTICE]; 50% tests, V1/V2: [INTERP] | E(2), p.131; E(5)(d)(ii), p.136 |

### 2.2 Year classification

| # | Rule | Tag | Cite |
|---|---|---|---|
| Y1 | **Club Option Year**: becomes due or guaranteed at the Club's election **or by reason of specified performance by a Player**, so a vesting option is a Club Option Year. Not a Guaranteed Year. Any other non-Guaranteed season in a multi-year contract is also treated as a Club Option Year. | [TEXT] | E(5)(a)(i), p.133 |
| Y2 | **Player Option Year** (the player elects, or may nullify for a reason outside UPC ¶7): it is a Guaranteed Year **if** its terms are guaranteed within A(8), **unless** the payment for declining or nullifying is **more than 50%** of that season's Base Salary. The A(8) condition is the `SeasonRow.guaranteedIfExercised` input (player/dual rows, default `true`). Under D5, a season with $0 current salary (e.g., Scherzer 2019–21) fails the 50% test for any positive buyout. That is the D5 [INTERP] consequence, and the alternative reading would compare the buyout against current + nominal deferred. | [TEXT] | E(5)(a)(ii), p.133 |
| Y3 | **Player Opt-Out** (the right to exercise or nullify multiple Contract Years at one time): the following years **are** Guaranteed Years, **unless** the opt-out payment is **more than 50%** of the sum of Base Salaries in the following years. If that test fails, they are **non-guaranteed Player Option Years**, not Club Option Years. The opt-out payment is then an Option Buyout deemed a Signing Bonus (A3), and if he stays, O6 applies. | [TEXT] | E(5)(a)(ii), p.133; E(5)(b)(i)(A), p.134; E(5)(d)(i) ¶2, p.135 |
| Y4 | Seasons after an opt-out that the user marks `guaranteed` are **Player Option Years** because they "can be nullified by a Player", and `classify` derives that status automatically. Rows marked with an option kind keep that kind. For example, an opt-out followed by a final club option stays a Club Option Year. | inference from [TEXT] | E(5)(a)(ii)(B), p.133 |
| Y5 | **Dual Option Year** (either party may elect) → calculated as a Player Option Year. | [TEXT] | E(5)(a)(iii), p.133 |
| Y6 | **Mutual Option Year** (both must elect) → calculated as a Club Option Year. | [TEXT] | E(5)(a)(iv), p.133–134 |

### 2.3 AAV at signing

| # | Rule | Tag | Cite |
|---|---|---|---|
| A1 | A contract longer than one season has, in each Guaranteed Year, Salary = **AAV** = (Σ Base Salary in Guaranteed Years + Signing Bonus attributed to Guaranteed Years + deferred-compensation cost attributed to Guaranteed Years) ÷ number of Guaranteed Years. Earned bonuses are added on top (B1). | [TEXT] | E(2), p.131 |
| A2 | The **Signing Bonus** is attributed **pro rata over the Guaranteed Years**, irrespective of payment dates. With no Guaranteed Years, it goes in full to the first year. | [TEXT] | E(3), p.132 |
| A3 | An **Option Buyout** on a Club Option Year, or on a Player Option Year that is **not** a Guaranteed Year, is **deemed a Signing Bonus** and so enters A1/A2. | [TEXT] | E(5)(b)(i)(A), p.134 |
| A4 | When there are buyouts on more than one Option Year, **only the earliest Option Year's buyout** is deemed a Signing Bonus. | [TEXT] | E(5)(b)(i)(B), p.134 |
| A5 | **Mixed buyouts.** When the contract has both a Club-option buyout and a non-guaranteed Player-option buyout, the engine applies (A)'s specific rule: the **higher** buyout is the Signing Bonus. A4 governs otherwise. The UI warns whenever this rule fires. The alternative applies (B)'s earliest-year rule in all cases. The engine prefers the specific provision (A) over the general one (B). | [INTERP] | E(5)(b)(i)(A)–(B), p.134 |
| A6 | Potential (unearned) bonuses are **not** in the AAV. | [TEXT] | E(4)(a), p.132 |
| A7 | **Signing-bonus installments paid in a Contract Year after the last season** are Deferred Compensation, because Salary is all compensation (E(1)) and Salary payable after the last season is Deferred Compensation (E(6)(a)). They are attributed pro rata over the Guaranteed Years (A2) and discounted per F3/F5. Installments paid during the term are not discounted. The alternative never discounts signing bonuses. | [INTERP] | E(1), p.131; E(3), p.132; E(6)(a), p.136 |

### 2.4 Deferred compensation (XXIII(E)(6))

| # | Rule | Tag | Cite |
|---|---|---|---|
| F1 | **Deferred Compensation** = Salary payable **in a Contract Year after the last championship season** for which services are required. The last season depends on the scenario (options, opt-out). **Scope limit:** deferral payments, and any signing-bonus installment treated as deferred (A7), must fall after the last season of the **maximum term** (all options exercised). A payment inside a possible option year would switch between deferred and current pay depending on the scenario, and would reprice a signing-day AAV. No rule settles that, so such contracts are rejected with an explanatory error and listed in §2.8. Signing-bonus installments are classified automatically: on or before the last Guaranteed season they are current pay; after the maximum term they are A7. Using the calendar year to stand in for the Contract Year (Dec 2–Dec 1) is a convention. | [TEXT]; scope limit and calendar-year proxy [CONV] | E(6)(a), p.136; E(1), p.131 |
| F2 | Deferred Compensation counts **as if paid in the season to which the contract attributes it**. If the contract does not attribute it, it is treated as attributed **equally to each of the Guaranteed Years**. This applies to any season, option years included. An option year's deferral counts only if that year is exercised or vested (O1, O6). | [TEXT] | E(6)(b)(i), p.136 |
| F3 | If deferrals carry stated interest at an effective rate **within 1.5 percentage points of the ILIR**, they count at **stated value**, i.e., the principal. Otherwise the payments are increased by the stated interest rate and discounted to their **present value in the season to which they are attributed**, using the ILIR (D2). A 0%-interest deferral therefore counts at full stated value whenever the ILIR ≤ 1.5%. | [TEXT] | E(6)(b)(ii), p.136–137 |
| F4 | Attribution modes: **(a) Sequential.** The contract maps seasons to payments in order: the first-earned money is paid first, and a payment is split across seasons where needed. **(c) Pro-rata.** The contract spreads each season's deferral across every payment ("each year's $10M is paid $1M a year"), so each payment is split across the deferral seasons in proportion to their principal. **(b) Not attributed.** Each season's deferral is the total ÷ the number of Guaranteed Years (F2), and each payment is split equally across the Guaranteed Years. In mode (b) the per-season `deferred` inputs are ignored and the UI disables them. The total principal comes from `DeferralSchedule.unattributedPrincipal`, because with stated interest the payments include interest and can't stand in for principal. | (a) [PRACTICE] (reproduces Ohtani, Scherzer, Snell §2.4.1); (c) [TEXT]: the contract's own attribution (reproduces Tucker, Bregman/CHC §2.4.1; added 2026-11-04, user sign-off); (b) attribution [TEXT], payment split [CONV] | E(6)(b)(i) |
| F5 | Discounting uses whole years (payment calendar year − attributed season year), compounded annually at the ILIR. The CBA does not specify dates, day counts or compounding. This convention reproduces Ohtani and comes within $648/yr of Scherzer (§2.4.1). | [PRACTICE] | silent |
| F6 | "Within 1.5 percentage points" is treated as inclusive (≤ 1.5). | [CONV] | silent |
| F7 | **Representation.** Per-season `deferred` is principal at stated value. `payments` are the actual cash paid, interest included. Discounting the actual cash at the ILIR is the same as "increasing by the stated rate, then discounting". Sequential mapping (F4(a)) maps **principal**: each payment is split into principal and interest by amortizing the outstanding principal at the stated rate, and principal is assigned to seasons first-earned-first. Each payment's interest follows its principal. At 0% stated interest, Σ payments must equal Σ deferred. | [CONV] | E(6)(b)(ii) |

#### 2.4.1 Evidence for F4 and F5 (reproduced as tests)

- **Ohtani** (2024–33): current $2M + deferred $68M each season, paid $68M on July 1 each year 2034–43, no interest. The ILIR for the 2024 Contract Year is the October 2023 mid-term AFR, **4.43%** (PBGC historical table). Sequential attribution gives **$46,081,476.50**, against a reported **$46.08M** (Pivotal180, Yahoo/AP). Mode (b) gives **$46,769,026**. Ohtani's contract attributes each season to a payment, so mode (b) does not apply to it. **The current app uses mode (b), so it overstates Ohtani by about $687.5K/yr.**
- **Scherzer** (2015–21, signed under the 2012–16 CBA): the October 2014 mid-term AFR is **1.85%** (Rev. Rul. 2014-26; PBGC). Sequential attribution gives **$28,690,024** against a reported **$28,689,376** (AP via SI/TSN). The **$648/yr (0.002%) residual is unexplained**. Mode (b) gives **$28,211,365**. The engine applies 2022–26 rules, and the preset says so.
- **Snell** (LAD 2025–29; $13.2M a year deferred, paid $5.5M each July 1 2035–46; ILIR 3.70%, Rev. Rul. 2024-21). Sequential gives **$31,306,184.53**, against Spotrac's luxury tax of **$31,306,185** (read from the page). Mode (b), which is also pro-rata here because every season defers the same amount, gives **$31,357,257**. That matches FanGraphs and the AP's "about $31.4 million". So the outlets differ because they choose different attributions.
- **Tucker** (LAD 2026–29; $10M of each 2027–29 salary, each paid $1M a year 2036–45, i.e. $3M a year; ILIR 3.87%, Rev. Rul. 2025-19). **Pro-rata** gives **$57,195,945**, which is **Cot's and the AP to the dollar** (present value $228,783,778). Sequential gives $57,181,099, and mode (b) $57,109,570 (ESPN's "$57.1M").
- **Bregman, Cubs** (2026–30; deferrals 15/10/10/15/20, paid $8.75M a year 2034–41; ILIR 3.87%). **Pro-rata** gives **$30,893,902**, which is MLBTR's present value ÷ 5 and Spotrac, exactly. Sequential gives $30,845,960 and mode (b) $30,811,604.
- **Bregman, Red Sox** (2025–27; context only, not a preset): the two reported figures split on two choices. Sequential with the $5M bonus paid in 2028 discounted (A7) gives **$31,732,959** (MLBTR, via the Boston Globe's Alex Speier and MassLive's Chris Cotillo: "$31.7MM"). The bonus at face value with pro-rata or mode (b) gives **$31,884,538** (Boston Globe: "roughly $31.9 million").

### 2.5 Bonuses

| # | Rule | Tag | Cite |
|---|---|---|---|
| B1 | Performance, award and other bonuses **actually earned** are Salary in the Contract Year in which the triggering performance occurred. They are not averaged into the AAV. | [TEXT] | E(4)(a), p.132 |

### 2.6 Option outcomes

| # | Rule | Tag | Cite |
|---|---|---|---|
| O1 | **Club option (incl. mutual and vesting) exercised**: Salary for that year = Base Salary + earned bonuses + that year's attributed deferral cost (F2). | [TEXT] | E(5)(c), p.135; E(6)(b)(i) |
| O2 | **Buyout ultimately not received, for any reason**: the option was exercised or vested, **or** the contract ended before the option year (an earlier option declined, or an opt-out taken). No portion of the buyout is included in that year, and the Club receives a **deduction of the full buyout** previously included, in the Contract Year covered by that option. Exercised Club-type option: net O1 + O2 = option salary + bonuses + deferral cost − buyout previously charged. **Non-stacking:** (i) an exercised non-guaranteed Player Option Year uses O6, which already nets the buyout, so O2 is not applied again. (ii) When the contract ends through an O7 opt-out, the O7 true-up already nets every unpaid buyout, because the buyout is in "attributed" but not in "paid". O2 is therefore not applied to option years after a taken opt-out (W18). Read literally, (b)(ii)'s only carve-out is C(2)(b)(i)(B), so the text alone would deduct twice. | [TEXT]; non-stacking (i)–(ii) [INTERP] | E(5)(b)(ii), p.134–135 |
| O3 | **Option declined and buyout paid** (Club-type, or a non-guaranteed Player Option Year): nothing further is charged if the buyout was the deemed Signing Bonus (A3–A5). Otherwise it is charged under O4. | follows [TEXT] A3 | E(5)(b)(i) |
| O4 | **Buyout actually paid that was not the deemed Signing Bonus**: included in Salary in the Contract Year covered by the option that was not exercised. That covers (a) a buyout on a non-earliest Option Year, and (b) the lower buyout left out under A5. | (a) [TEXT]; (b) [INTERP] (the text covers only "other than the earliest") | E(5)(b)(i)(B), p.134 |
| O5 | **Vesting option vested** = treated as an exercised Club Option Year (O1 + O2). The definition (Y1) groups performance-triggered years with Club elections, and the engine reads O1's "if exercised" as also covering "if vested". | [INTERP] | E(5)(a)(i), (c) |
| O6 | **Non-guaranteed Player Option Year(s) exercised**: one year → Salary = option-year Salary (incl. earned bonuses) − buyout attributed in all previous years. Several years → each year = AAV of the exercised option salaries − a prorated share of the attributed buyout. | [TEXT] | E(5)(d)(i) ¶2, p.135 |
| O7 | **Guaranteed Player Option Year declined or nullified (opt-out taken)**: (amount paid to the Player under the contract, incl. any buyout) − (amount attributed to Actual Club Payroll, **excluding amounts attributed under E(5)(d)(ii)**) is added to or subtracted from the Contract Year in which the Player Option Year falls. With several nullified years it is applied **pro rata over the nullified years**. These charges land in seasons after the player has left. | [TEXT] | E(5)(d)(i) ¶1, p.135 |
| O8 | In O7, deferred compensation in "amount paid to the Player" is valued at its **attributed cost (F3 present value)**, not nominal, consistent with E(6)(b)(i) treating it "as if paid in the championship season". The alternative uses nominal value, which would add the whole deferral discount back on an opt-out. | [INTERP] | E(5)(d)(i); E(6)(b)(i) |

### 2.7 Valley Charge (XXIII(E)(5)(d)(ii), p.136)

| # | Rule | Tag | Cite |
|---|---|---|---|
| V1 | **Player Option Year Value** = Base Salary (D5) + deferred comp/annuity cost − any Option Buyout for that Player Option Year. | [TEXT] | E(5)(d)(ii) |
| V2 | **80% Figure** = 80% × (Base Salary + attributed Signing Bonus + deferred comp/annuity) of the **smallest such Guaranteed Year before the first *such* Player Option Year**, where "such" means a Player Option Year whose Value falls below the Figure. | [TEXT] | E(5)(d)(ii) |
| V3 | **Floor**: if the 80% Figure < 75% × AAV calculated **as if the Player Option Year were not a Guaranteed Year**, the Figure becomes that 75% amount. | [TEXT] | E(5)(d)(ii) |
| V4 | For each such Player Option Year, the shortfall (Figure − Value) is allocated **pro rata across the Guaranteed Years preceding the first such Player Option Year**. | [TEXT] | E(5)(d)(ii) |
| V5 | For V2, the Signing Bonus is attributed **over the Guaranteed Years preceding the first such Player Option Year**, as if the option years were not Guaranteed, consistent with V3's parenthetical. It is **not** attributed over all Guaranteed Years per A2. | [PRACTICE] | Bellinger: $44.75M reported by Joel Sherman (NY Post), Forbes (Freedman, 2026-02-06), MLBTR (2026-01). The A2 reading gives $41.5625M, which no outlet reports. **Corroborated by a confirmed total:** Bellinger's 2026 CBT charge was confirmed at $48.55M (Gary Phillips, citing Joel Sherman), reported as $44.75M plus a $3.8M true-up from his prior contract's opt-out (O7 on the old deal). $48.55M − $3.8M = $44.75M exactly. The A2 reading would total $45.36M. The $3.8M concerns the old contract and is not itself evidence about bonus attribution. **Signed off by user 2026-11-04.** |
| V6 | **Resolving "such" (the circularity in V2).** Take the Player Option Years p₁ < p₂ < … in order. For each candidate pₖ: compute the Figure from the Guaranteed Years before pₖ (earlier guaranteed Player Option Years included), with the V3 floor treating pₖ and every later Player Option Year as non-Guaranteed (V5 attribution). If Value(pₖ) < Figure, pₖ is the first such year: charge every pⱼ (j ≥ k) whose Value < that Figure, and stop. If no candidate qualifies, there is no Valley Charge. A Valley share allocated to an earlier guaranteed Player Option Year that is later nullified **stays charged** in that Contract Year. The allocation is fixed when the contract is signed, consistent with V8. | [INTERP] | E(5)(d)(ii) |
| V7 | **Option years exercised after a Valley Charge**: "the Valley Charge … shall be deducted from the Player Option Salary in the calculation of the AAV of the Player Option Year(s)". Engine reading: each exercised **"such"** Player Option Year (one with a V4 shortfall) is charged **contract AAV − (Σ shortfalls of the exercised such years ÷ number of exercised such years)**. Only the exercised years' own shortfalls are credited. An exercised Player Option Year that comes *before* the first such year is a Guaranteed Year carrying a V4 share (W17 yr 3), so it gets no credit. If every option year is exercised, total CBT = total paid. The alternative recomputes the AAV over option years only (Bellinger: ($77.5M − $24.5M) ÷ 3 = $17.67M), which leaves total CBT $20M below cash paid. | [INTERP] | Only published figure: MLBTR "roughly $24.33MM" (single source, matches engine) |
| V8 | **Opt-out taken after a Valley Charge**: the Valley Charge is **not refunded**. The O7 true-up excludes it, so total CBT can exceed cash paid (Bellinger opting out after 2027: $109.5M CBT vs $85M paid). The UI shows a callout quoting E(5)(d)(i). | [TEXT] (user decision 2026-11-04: literal reading) | E(5)(d)(i) ¶1 |
| V9 | **O7 "excluding amounts attributed under (ii)" also excludes V7 credits.** In a partial opt-out (some option years exercised, later ones nullified), the V7 credits for the exercised years are left out of "amount attributed", just as the charges are. The alternative counts the credits as attributed, which raises the true-up (Bellinger W13: 21.5 instead of 13.3; total 135.3 instead of 127.1). | [INTERP] | E(5)(d)(i) ¶1 |
| V10 | The Valley Charge applies only to Player Option Years that are **Guaranteed Years**. V3's "as if the Player Option Year was not a Guaranteed Year" presupposes a guaranteed year, and G(3)(e) avoids Valley Charges by reclassifying years as non-guaranteed. Combined with O6, applying it to non-guaranteed years can produce negative charges. | [INTERP] | E(5)(d)(ii), p.136; G(3)(e), p.143 |
| V11 | In V3's "as if not Guaranteed" AAV, a Player Option Year buyout becomes a deemed Signing Bonus (A3 applied within the hypothetical). **Only in V3:** the V2 80% Figure uses the contract's actual Signing Bonus. Corrected 2026-11-04: the first implementation also applied the hypothetical to V2, which gave Bichette a spurious $1.2M Valley Charge against his implied $42M. | [INTERP] | E(5)(d)(ii); (b)(i)(A) |

### 2.8 Explicitly out of scope (cited, so they are known gaps rather than oversights)

- Mid-season signing proration (E(2), last sentence)
- Trades and assignments, Net Over/Undercharge, cash considerations, incl. conditional cash tied to option outcomes (C(2)(b), incl. (iii)(C))
- Termination or release with salary owed (C(2)(d))
- Split contracts (C(2)(e))
- Restricted List and suspension reductions (C(2)(g))
- Non-cash compensation (E(1))
- Contract extensions and renegotiation, incl. G(3)(e)–(f) Valley rules
- Salary escalators via Special Covenant (E(4)(b))
- Earned bonus increasing a buyout (E(5)(b)(i)(C))
- Buyouts paid in installments (a buyout is modeled as one payment at the decision)
- Deferral or signing-bonus payments falling inside a possible option year (F1 scope limit)
- Contracts with no Guaranteed Years (A2's "attributed in full to the first year" fallback); rejected by validation
- Option years placed before guaranteed years (END ordering rule, §5.3)
- Retirement-triggered deferral start and the age-40 assumption (E(6)(b)(ii))
- Annuity arrangements (E(6)(c))
- Loans (E(7))
- Player Benefit Costs and Actual Club Payroll (C(1), D; Spec 2)
- Pre-9/30/2002 funding deadlines (Art. XVI)

---

## 3. Article XVI funding — corrected model

| # | Rule | Tag | Cite |
|---|---|---|---|
| X1 | For contracts executed on or after Sept 30, 2002: deferred compensation earned in a season must be fully funded **on or before the second July 1** following that season (season *s* → July 1 of *s*+2). | [TEXT] | Art. XVI, p.89 |
| X2 | Full funding = the Club must maintain, without interruption, the **current present value of then-outstanding deferred payments, discounted at 5% annually**. | [TEXT] | Art. XVI, p.89 |
| X3 | If J.P. Morgan Chase Bank's prime rate on the preceding Nov 1 is ≥ 7%, the Parties **shall meet and confer** and **may**, with due notice, amend the rate effective the next July 1. The engine uses 5%, and the UI quotes the clause. | [TEXT] | Art. XVI, p.89 |
| X4 | Art. XVI's "season in which the deferred compensation is earned" = the season to which Article XXIII attribution assigns it (F2/F4). XXIII's definitions apply "only to this Article XXIII" (A, preamble), so carrying them over to Art. XVI is a reading, not a given. | [INTERP] | Art. XVI; XXIII(A) preamble, p.115 |
| X5 | Output: the **required funded balance at each July 1** = Σ over outstanding payments attributed to seasons whose deadline has passed of payment ÷ 1.05^(payment year − snapshot year). Payments due on the snapshot date count as already paid. The peak balance is also reported. | [CONV] (snapshot timing, whole years) | — |

**Correction to the current app:** `calculateContract()` discounts escrow back to the *earning* season "for simplicity" (comment in `utils/calculations.ts`). Article XVI measures the PV at the funding date and continuously after it, so the current figure understates the requirement. X5 replaces it.

---

## 4. Existing user-facing claims — audit results (all must be fixed or removed)

| Location | Current claim | Finding | Fix |
|---|---|---|---|
| `utils/calculations.ts` `calculatePresentValue` doc | "years from the earned date (June 30 of playing season)" | June 30 does not appear in Art. XXIII. It appears only in Attachment 45 Addendum A, the qualifying-offer salary calculation, which applies only to that calculation. | Remove it, and cite F5 |
| `App.tsx:373` tooltip | "Federal Mid-Term Rate … as defined in Article XXIII" | Incomplete: it doesn't say *which month* (D2) | State D2 precisely |
| `App.tsx:460` | "included … in the year earned at its discounted present value" | Leaves out attribution (F2) and the 1.5-pp stated-value exception (F3) | Rewrite per F2/F3 |
| `App.tsx:140` | "parties may agree to amend" when prime ≥ 7% | The text names J.P. Morgan Chase prime on the preceding Nov 1. The parties "shall meet and confer" and "may … amend … effective the next succeeding July 1". | Quote X3 |
| `App.tsx:162` | "This differs from a bankruptcy-remote escrow." | Commentary, not CBA text; Art. XVI never uses "escrow" | Label as commentary or remove. Section title becomes "Funding Rules (Article XVI)" |
| Historical Deductible card | "lesser of $2,000,000 or the PV…" (already says "before December 11, 2011") | Correct, but leaves out that it applies to the aggregate per Basic Agreement period | Add the aggregate wording |
| Scherzer preset | $105M deferred evenly over 7 years, 2.5% "historic rate approx" | Wrong structure and an unsourced rate (§2.4.1) | Rebuild from AP terms at 1.85% |
| README | "Federal Mid-Term Rate" | Accurate, but doesn't reflect the new scope | Update |

---

## 5. Architecture

A pure-function engine plus a split UI. The engine contains no React, and every function is deterministic and unit-tested.

```
utils/cbt/
  types.ts        ContractInput, SeasonRow, OptOut, DeferralSchedule, Scenario, Charge, Result
  classify.ts     D4, D5, Y1–Y6  → per-season { kind, effectiveKind, isGuaranteed, reason }
  deferral.ts     F1–F7, A7      → deferred cost per season (+ cash-flow schedule)
  aav.ts          A1–A6          → AAV at signing, deemed-signing-bonus breakdown
  valley.ts       V1–V6, V10, V11 → Valley Charge per Player Option Year and per pre-option season
  outcome.ts      O1–O8, V7–V9, B1 → per-season Charge[] for a Scenario
  funding.ts      X1–X5          → July 1 required-balance schedule, peak
  index.ts        calculate(input, scenario): Result
  rules.ts        rule id → { cite, tag, summary, alternative? } (one table, used by code and UI)
utils/format.ts   formatMoney, formatMillions (moved from calculations.ts)
data/presets.ts   presets with sources[] (URL + what each source confirms)
components/
  ScheduleEditor.tsx   year-by-year table + "fill evenly" helper + opt-out markers
  DeferralEditor.tsx   payment stream, attribution mode, stated interest
  ScenarioPanel.tsx    option/vesting/opt-out toggles, earned bonuses per season
  ResultCards.tsx      AAV at signing; total CBT for the scenario vs cash paid; deferral discount
  CbtChart.tsx         Recharts: CBT charge vs cash by season
  YearTable.tsx        per-season rows; expandable Charge line items with rule ids, cites, tags
  FundingRules.tsx     static Art. XVI copy (corrected per §4) + funding schedule
  InfoTooltip.tsx      (existing)
App.tsx                state + layout only
```

`utils/calculations.ts` is deleted once `App.tsx` uses `utils/cbt`, since nothing else imports it.

### 5.1 Key types (shape, not final code)

```ts
type YearKind = 'guaranteed' | 'club' | 'mutual' | 'vesting' | 'player' | 'dual';

interface SeasonRow {
  season: number;          // calendar year of the championship season (D1)
  currentSalary: number;   // "Base Salary" for all XXIII tests (D5)
  deferred: number;        // principal attributed to this season (F2, F7); ignored in 'unattributed' mode
  kind: YearKind;          // 'guaranteed' rows after an opt-out become Player Option Years in classify (Y4)
  buyout?: number;         // option rows only; a single payment at the decision
  guaranteedIfExercised?: boolean;  // player/dual rows: A(8) condition (Y2), default true
}
interface OptOut { afterSeason: number; payment: number }          // Y3
interface DeferralSchedule {
  payments: { year: number; amount: number }[];                    // actual cash incl. interest (F7)
  attribution: 'sequential' | 'prorata' | 'unattributed';         // F4(a) / F4(c) / F4(b)
  statedInterestPct: number;                                       // F3, default 0
  unattributedPrincipal?: number;                                  // F4(b) only: total principal at stated value
}
interface ContractInput {
  seasons: SeasonRow[];
  signingBonus: { amount: number; payments: { year: number; amount: number }[] };  // A2, A7
  optOuts: OptOut[];
  deferral: DeferralSchedule;
  ilirPct: number;                                                 // D2
}
interface Scenario {
  options: Record<number /*season*/, 'exercised' | 'declined'>;   // vesting: exercised = vested (O5)
                                   // [CONV] declining an option, or taking an opt-out, ends the contract:
                                   // later rows are void, and the UI disables their toggles
  optOutTakenAfter: number | null;                                 // must match an OptOut.afterSeason
  earnedBonuses: Record<number, number>;                           // B1
}
type ChargeKind = 'aav' | 'valley' | 'valleyCredit' | 'option' | 'trueUp' | 'buyout' | 'bonus';
interface Charge {
  season: number; amount: number; label: string;
  kind: ChargeKind;        // what the charge is; code identifies charges by kind, never by rule-id membership
  rules: RuleId[];         // every rule that determined the amount (§6), incl. F-rules when it carries deferred cost
}
interface Result {
  classification: SeasonClass[];
  playedSeasons: number[];                 // seasons actually played under the scenario (END)
  aavAtSigning: number;
  charges: Charge[];                       // every component, each with its kind and rule ids
  perSeason: { season: number; cbt: number; cash: number }[];
  totals: { cbt: number; cash: number; attributedCost: number };  // cash: deferrals nominal; attributedCost: deferrals at F3 value (used by the §8 invariant)
  funding: { snapshots: { july1: number; required: number }[]; peak: number };
  flags: { rule: RuleId; message: string }[];   // every [PRACTICE]/[INTERP]/[CONV] rule that moved a number
}
```

### 5.2 Data flow

`calculate()` first runs `validate(input)` and `validateScenario(input, scenario)` and **throws** on any error-severity issue (warnings don't throw). Then: `ContractInput` → `classify` → `deferral` (cost per season) → `aav` (needs classification + deferral) → `valley` (needs aav + classification) → `outcome(Scenario)` emits `Charge[]` → `ledger` (cash by year, `perSeason`, `totals`) → `funding` (deferral payments only) → `flags` (every non-[TEXT] rule behind a non-zero charge, using `MONEY_EPS`). Attributed cost has a single definition, on the same `costBySeason` basis as the AAV, and both O7 and `totals.attributedCost` use it.

### 5.3 Validation (blocking errors, shown inline)

- At least one season, with seasons consecutive and ascending. **At least one Guaranteed season** (A2's no-Guaranteed-Years fallback is out of scope, §2.8).
- **Numbers:** every amount (current salary, deferred, buyout, signing bonus and each of its payments, deferral payments, opt-out payments, stated interest, `unattributedPrincipal`) must be finite and ≥ 0; `NaN` is rejected. ILIR must be finite. Seasons and payment years must be integers. Duplicate opt-outs (same `afterSeason`) are rejected.
- **Ordering (END [CONV]):** no `guaranteed` row may follow an option row, because declining an option ends the contract and would otherwise void a Guaranteed Year. The season right after an opt-out must be a `guaranteed` row (Y4).
- Every deferral payment year, and every signing-bonus installment after the last Guaranteed season, falls after the last season of the maximum term (F1 scope limit).
- **F7 consistency:** at 0% stated interest, Σ payments must equal the principal: Σ `deferred` in sequential mode, `unattributedPrincipal` in unattributed mode. This is an error. With stated interest, a mismatch is a warning showing the amount. Unattributed mode requires `unattributedPrincipal`. **Deferred principal with no payment schedule is an error in both modes**, at any stated interest. In unattributed mode, per-season `deferred` values are ignored, and a warning (F4b) says so.
- `buyout` only on option rows. `guaranteedIfExercised` only on player/dual rows. Each `optOut.afterSeason` has at least one season after it.
- Signing-bonus payments sum to the bonus amount. Payments after the actual last season are classified automatically as A7 (no input flag).
- ILIR is in (0, 25] **when the contract has deferred compensation** (deferral payments, deferred principal, or an A7 installment). Otherwise it is unused and may be 0. Stated interest is ≥ 0.
- **Scenario (`validateScenario`):** `optOutTakenAfter` is null or equals an `OptOut.afterSeason`. Every `options` key is an option-row season, with value `exercised` or `declined`. Every `earnedBonuses` key is a contract season, with a finite value ≥ 0.

---

## 6. UI behavior

- **Inputs:** Contract Terms (ILIR with the D2 tooltip, signing bonus + payment schedule) → Schedule table (one row per season: current salary, deferred, kind, buyout; "+ season"; "fill evenly from total") → opt-out markers between rows (with a payment input) → Deferral panel (shown only when any deferral exists).
- **Scenario panel:** one toggle per option row, defaulting club/mutual/vesting to **declined** and player/dual to **exercised**. One opt-out selector, defaulting to **not taken**. Earned-bonus inputs per season. The defaults mirror the CBA's guaranteed classification and are a UI choice, not a rule.
- **Results:** "AAV at signing" (A1) is always shown and does not depend on the scenario. Below it, the totals for the selected scenario: total CBT vs total cash, with the difference explained by line items.
- **Year table:** each season's CBT figure expands into its Charge line items, e.g. "AAV $32.5M · A1 [TEXT]" or "Valley Charge +$12.25M · V4 [TEXT] · V5 [PRACTICE] · V6 [INTERP]". A line item lists **every** rule id that determined its amount, each with its own tag. Seasons outside the playing term appear when charges land there (O7).
- **Flags:** a callout lists every [PRACTICE]/[INTERP]/[CONV] rule the current result depends on, with a one-line explanation, its cite and the named alternative. V8 shows the quoted E(5)(d)(i) text. END is flagged only when ending the contract voids a season that would otherwise count, not when the contract simply ends at a declined final option.
- **Presets:** a select grouped by rule family (deferred money, signing bonus, opt-outs, club options, basic). The loaded preset shows its note, "Sources" (links), and where a figure was reported, "Reported CBT: $X · Engine: $Y · Δ" (Δ rounded to whole dollars). The reconciliation is shown on purpose. Editing any term turns the preset into a custom contract, and the reconciliation disappears.
- **Chart:** CBT charge vs cash received per calendar year, with a "last season played" reference line from `Result.playedSeasons`.
- Responsive and accessible per the existing Tailwind patterns:
  - Year-table rows expand through a real `<button aria-expanded>`, and rule cites are visible text.
  - Tooltips open on focus as well as hover.
  - Errors name their season and set `aria-invalid`, not just a colour.
  - First Season and Length commit on blur or Enter, and only when the value changes. Length is limited to 1–30, and anything else reverts.
  - Info tooltips open on the first tap or click and sit beside, not inside, their `<label>`.
  - The scenario panel stays mounted when results are hidden.
  - No new runtime dependencies.

---

## 7. Presets (all terms from named public sources; no estimates)

| Preset | Terms | Sources | Reported figure → test |
|---|---|---|---|
| **Ohtani** (LAD, 2024–33) | Current $2M + deferred $68M per season; $68M paid each July 1 2034–43; no interest; sequential; ILIR 4.43% (Oct 2023) | AP/Yahoo; Pivotal180; PBGC AFR table | CBT AAV $46.08M (published to $10K) → assert within ±$5,000 of $46,080,000 |
| **Scherzer** (WSH, 2015–21) | Current salary ($M) 10, 15, 15, 15, 0, 0, 0; deferred 0, 0, 0, 0, 35, 35, 35; $50M signing bonus paid 5 (2015), 15 (2019), 15 (2020), 15 (2021); deferral paid $15M each July 1 2022–28; no interest; sequential; ILIR 1.85% (Oct 2014). Labeled "signed under the 2012–16 CBA; 2022–26 rules applied." | AP via SI/TSN/ESPN; Rev. Rul. 2014-26; PBGC | $28,689,376 → assert within ±$1,000 (documented residual $648) |
| **Bellinger** (NYY, 2026–30) | Current salary ($M) 32.5, 32.5, 25.8, 25.8, 25.9; $20M signing bonus paid $10M on 4/1/26 + $10M on 8/1/26; **opt-outs after 2027 and after 2028**, $0 payment | MLBTR 2026-01 ("after the second or third season", "$77.5MM remaining at the first decision point"); Forbes 2026-02-06; NY Post (Sherman) | 2026 and 2027 CBT $44,750,000 → assert exact |
| **Snell** (LAD, 2025–29) | $12.8M current + $13.2M deferred per season; $52M bonus (2025); $5.5M each July 1 2035–46; sequential; ILIR 3.70%; 2030 conditional club option $10M (no buyout; trigger disputed) | AP via ESPN; MLBTR; Spotrac; Rev. Rul. 2024-21 | Spotrac $31,306,185 → ±$1 |
| **Bregman** (CHC, 2026–30) | $35M per season, deferred 15/10/10/15/20; $8.75M a year 2034–41; pro-rata; ILIR 3.87% | AP via Capitol City Now; MLBTR; Cubs Insider | $30,893,902 → ±$1 |
| **Guerrero Jr.** (TOR, 2026–39) | Salaries 17…6 ($M); $325M bonus in 15 installments 2025–39; no deferrals | AP via Fox Sports; MLBTR; Canadian Press | MLBTR "$35.714MM" → ±$1,000 |
| **Soto** (NYM, 2025–39) | 46.875/46.875/42.5/46.875/46.875 then $46M × 10; $75M bonus; opt-out after 2029 (club negate right not modeled) | AP via theScore; Cot's; MLBTR | Cot's $51M → exact |
| **Tucker** (LAD, 2026–29) | Current 1/45/50/50 + deferred 0/10/10/10; bonus $54M (2026) + $10M (2027); opt-outs after 2027 and 2028; $3M a year 2036–45; pro-rata; ILIR 3.87% | AP via Fox Sports; Cot's; Spotrac; Rev. Rul. 2025-19 | Cot's/AP $57,195,945 → ±$1 |
| **Alonso** (NYM, 2025–26) | $20M, $24M; $10M bonus; opt-out after 2025 (taken) | MLBTR; MLB.com | MLBTR "$27MM … for luxury tax purposes" → exact |
| **Bichette** (NYM, 2026–28) | $2M, $42M, $42M; $40M bonus; opt-outs after 2026 and 2027, each paying $5M | AP via CBS; MLBTR; MLB.com | $42M, **implied** by MLBTR → exact |
| **Jansen** (DET, 2026) | $9M; 2027 club option $12M, $2M buyout (declined) | AP via Fox17; MLBTR | MLBTR "$11MM" → exact |
| **Kim** (LAD, 2025–27) | $2.5M, $3.75M, $3.75M; $1M bonus; 2028–29 joint club options $5M each, one $1.5M buyout | Dodgers press release; True Blue LA (AP) | $4,166,667 → ±$1 |
| **Standard** | 5 × $20M guaranteed, nothing else | — | $20M (identity) |

Every preset's terms come from sources read directly, or from Spotrac pages the user saved. Conflicts and unconfirmed items are stated in each preset's note, as is anything the engine doesn't model: Soto's club negate right, Kim's joint exercise, and the disputed deferral of Bichette's buyout. **Soto and Alonso sit exactly at the 80% Valley boundary**, so neither gets a charge, and named tests pin this. No illustrative preset is presented as a real contract.

---

## 8. Testing (Vitest, engine only)

Add `vitest` as an exact-pinned dev dependency, a `test` script, and a `pnpm test` step in `.github/workflows/ci.yml`. Update CLAUDE.md, which currently says "There are no tests…".

Every rule id in §2–§3 gets at least one test named with that id (e.g., `V3 floor applies when 80% figure < 75% AAV`). The fixtures below were derived by hand from the rules, re-derived independently in review, and serve as the acceptance tests ($M):

| # | Contract | Expected |
|---|---|---|
| W1 | 5 × 20 guaranteed | AAV 20.0; total CBT = total cash = 100 |
| W2 | 30, 30, 20 guaranteed + 6 signing bonus | AAV (80 + 6) / 3 = 28.6667 |
| W3 | 4 × 20 guaranteed; yr 5 club option 25, buyout 2 | AAV (80 + 2) / 4 = 20.5. Exercised: yr 5 = 25 − 2 = 23 (O1 + O2); total 105 = cash 105. Declined: yr 5 = 0; total 82 = cash 82 |
| W4 | 3 × 20 guaranteed; yr 4 player option 12, no buyout (guaranteed, Y2) | AAV 72 / 4 = 18. Figure 16; floor 75% × (60 / 3) = 15 → 16. Valley 4 → +1.3333 in yrs 1–3 (19.3333 each). Exercised: yr 4 = 18 − 4 = 14 (V7); total 72 = cash. Declined: paid 60 − attributed excl. valley 54 = +6 in yr 4 (O7); total 64 vs cash 60 (V8) |
| W5 | 3 × 20 guaranteed; yr 4 player option 10, buyout 6 (> 50% → not guaranteed) | Buyout deemed SB: AAV (60 + 6) / 3 = 22. Exercised: yr 4 = 10 − 6 = 4 (O6, no O2); total 70 = cash. Declined: yr 4 = 0 (O3); total 66 = cash. No Valley Charge (V10) |
| W6 | 3 × 20 guaranteed; opt-out after yr 3, payment 25; yrs 4–5 at 20 each (50% of 40 = 20 < 25 → not guaranteed, Y3) | Payment deemed SB: AAV (60 + 25) / 3 = 28.3333. Stays: yrs 4–5 each = 20 − 25/2 = 7.5 (O6 multi-year); total 100 = cash 100. Opts out: yrs 4–5 = 0; total 85 = cash 85. No Valley Charge (V10) |
| W7 | 2024–25: current 5 + deferred 5 each; payments 5 in 2027, 5 in 2028; sequential; 0% stated | ILIR 1.2% → within 1.5 pp → stated value: AAV 10.0 (F3). ILIR 2.0% → (10 + 2 × 5 / 1.02³) / 2 = 9.71161 |
| W8 | 4 × 20 guaranteed; yr 5 club option 25, buyout 2; yr 6 club option 26, buyout 3 | Only 2 enters the AAV (A4): 20.5. Yr 5 exercised + yr 6 declined: yr 5 = 23, yr 6 = 3 (O4); total 108 = cash 108. Yr 5 declined (contract ends): total 82 = cash 82 |
| W9 | W1 + 0.5 earned in yr 2 | Yr 2 CBT = 20.5; AAV unchanged (B1) |
| W10 | Funding X5: one season (2024) deferral of 10, paid 2030 | July 1 2026 = 10 / 1.05⁴ = 8.2270; 2027 = 8.6384; 2028 = 9.0703; 2029 = 9.5238; 2030 = 0 |
| W11 | Bellinger, opt-out after 2027 | 2026–27: 44.75 each. True-up (85 − 65) = 20 spread over 2028–30 (6.6667 each). Total 109.5 vs cash 85 |
| W12 | Bellinger, no opt-out | 2026–27: 44.75; 2028–30: 32.5 − 24.5 / 3 = 24.3333; total 162.5 = cash |
| W13 | Bellinger, opt-out after 2028 | 2028 exercised: 32.5 − 8.2 (its own shortfall, V7) = 24.3; the 2029–30 shortfalls (8.2 + 8.1) stay charged. True-up (paid 110.8 − attributed excl. (ii) amounts 97.5, V9) = 13.3 over 2029–30. Total 127.1 vs cash 110.8 (derived; no published figure) |
| W14 | Regression: Ohtani, Scherzer, Bellinger presets | Per §7 tolerances |
| W15 | Scherzer terms in `unattributed` mode | 28,211,365 ± 1 (F4(b) spreads over the 7 Guaranteed Years, not just the seasons with deferrals) |
| W16 | A5: 4 × 20 guaranteed; yr 5 club option 25, buyout 2; yr 6 player option 4, buyout 3 (> 50% of 4 → not guaranteed) | The higher buyout (3) is the deemed SB: AAV (80 + 3) / 4 = 20.75, and an A5 warning is flagged. **Yr 5 + yr 6 exercised:** yr 5 = 25 (its buyout of 2 was never charged, so nothing to deduct); yr 6 = 4 − 3 = 1 (O6); total 109 = cash 109. **Yr 5 exercised, yr 6 declined:** yr 5 = 25; yr 6 = 0 (O3, buyout of 3 already charged); total 108 = cash 108. **Yr 5 declined (contract ends):** yr 5 = +2 (O4(b)); yr 6 = −3 (O2: buyout never received); total 82 = cash 82 |
| W17 | V6 "such" iteration: yrs 1–2 guaranteed 20; yr 3 player option 18; yr 4 player option 10 (both guaranteed, no buyouts) | AAV 68 / 4 = 17. Candidate yr 3: Figure 16 (floor 75% × 40/2 = 15), Value 18 → not "such". Candidate yr 4: smallest prior Guaranteed Year = 18 → 14.4; floor 75% × (58/3) = 14.5 → Figure 14.5; Value 10 → shortfall 4.5, so +1.5 in yrs 1–3. **Both exercised:** yrs 1–3 = 18.5, yr 4 = 17 − 4.5 = 12.5; total 68 = cash. **Yr 3 declined (yr 4 falls with it):** yrs 1–2 = 18.5 each; yr 3 = 1.5 (V6, stays) + 3 (O7: (40 − 34) / 2); yr 4 = 3; total 44.5 vs cash 40, a difference equal to the full 4.5 Valley Charge (V8). The "both exercised" split is per V7, which credits only "such" years. |
| W18 | O2 non-stacking (ii): yrs 1–3 at 20 each, opt-out after yr 2 ($0, so yr 3 is a guaranteed Player Option Year, Y4); yr 4 club option 25, buyout 3 (deemed SB) | AAV (60 + 3) / 3 = 21. No Valley Charge: Figure 0.8 × (20 + 3/2) = 17.2 against a floor of 0.75 × 43/2 = 16.125; Value 20. **Opt-out taken:** yrs 1–2 = 21 each; yr 3 = 40 − 42 = −2 (O7); yr 4 void and **no O2**; total 40 = cash 40. **Stays, option declined:** total 63 = cash 63. **Stays, option exercised:** yr 4 = 25 − 3 = 22 (O1 + O2); total 85 = cash 85 |

**Invariant tests** (property-style, on small generated contracts): with no Valley Charge, total CBT over every scenario = total cash paid, with deferrals at attributed cost (O8). With a Valley Charge, the difference equals exactly the non-refunded Valley amount (V8/V9), or zero when every option year is exercised (V7).

---

## 9. Delivery

- One branch per PR, squash-merged. The PR title drives release-drafter.
- Suggested PR split for the implementation plan:
  1. `ci:` Vitest + test step.
  2. `refactor:` engine + tests (UI still on the old path; hidden from release notes).
  3. **`feat!:`** UI split + new inputs and scenarios. This PR carries the major-version marker.
  4. `fix:` copy corrections per §4 + Scherzer preset rebuild.
- **This ships as a major release (1.0.0).** The repo is on `0.x`, where a `!` in a PR title drafts `1.0.0`, and release-drafter takes the largest bump among merged PRs. The `!` goes on (3) because that's where users see the breaking change: new inputs, and changed results (Ohtani $46.77M → $46.08M, which the release notes must call out).
- **Don't publish the draft release** between (1) and (4). Each merge refreshes the same draft. Publish once, after (4), as 1.0.0.
- No changes to `package.json` `version`, CHANGELOG, Dockerfile, or Renovate config.

## 10. Decisions log

| Date | Decision | By |
|---|---|---|
| 2026-11-04 | Year-by-year schedule input | user |
| 2026-11-04 | Signing-day AAV + scenario toggles | user |
| 2026-11-04 | Include vesting options, earned incentives, presets; tax bill moved to Spec 2 | user |
| 2026-11-04 | Architecture A (pure engine + split UI + Vitest) | user |
| 2026-11-04 | V8 literal reading (Valley Charge not refunded on opt-out) | user |
| 2026-11-04 | Every rule validated against CBA text; evidence tags required | user |
| 2026-11-04 | rev. 2 after independent review: fixed F4(b) (equal over Guaranteed Years), Bellinger opt-out seasons (after 2027 / 2028), Y3 failure → non-guaranteed Player Option Years; added D5, A5, A7, O8, V6, V9, F7; re-tagged F4(a)/F5 → [PRACTICE], X4 → [INTERP]; expanded §2.8 | Claude (review) |
| 2026-11-04 | rev. 3 after second review: O2 broadened to "not received for any reason" (E(5)(b)(ii)); O3/O4 adjusted, O4(b) → [INTERP]; Y4 no longer rejects option rows after an opt-out; F1 validates against the last Guaranteed season, with in-term handling per scenario; added `guaranteedIfExercised`, `unattributedPrincipal`, `totals.attributedCost`; principal mapping under interest (F7); line items list every rule id; W16 outcomes + W17 | Claude (review) |
| 2026-11-04 | rev. 4 after third (final) review: V7 credits only exercised "such" years (fixes the conflict with W17); O2 non-stacking (ii) with O7 on opt-outs + W18; F1 in-term handling replaced by a scope limit (payments must fall after the maximum term); [CONV] declining an option or taking an opt-out ends the contract. **These rev. 4 edits were made after the review limit and have not been independently re-reviewed.** | Claude |
| 2026-11-04 | V5 signed off: signing bonus attributed over pre-option Guaranteed Years for the 80% Figure, corroborated by the confirmed $48.55M 2026 total minus the $3.8M prior-contract true-up | user |
| 2026-11-04 | Signed off as written: V7 (staying after a Valley Charge → AAV − averaged own shortfalls; Bellinger $24.33M), V9 (O7 exclusion covers V7 credits; W13 = $127.1M), D5 (Base Salary = current pay only, everywhere), A5 (higher buyout when club + player buyouts mix) | user |
| 2026-11-04 | Accepted as written: A7, O2 non-stacking (i)–(ii), O4(b), O5, O8, V6 (incl. nullified share), V10, V11, X4. **Spec approved.** | user |
| 2026-11-04 | Ships as a major release, 1.0.0: the `!` goes on PR (3) `feat!:`, PR (2) is `refactor:`, and drafts are not published mid-series (§9) | user |
| 2026-11-04 | Plan B decisions: keep the current Tailwind look; rename to "MLB Contract Calculator" (title, header, README, CI smoke test); add F4(c) pro-rata attribution; ship the nine presets in §7. | user |
| 2026-11-04 | Plan B engine changes from prototype verification: `Result.playedSeasons` (END-aware) for the chart and table; V11 scope fix (V3 floor only); END flag only when it voids a season that would count; `@types/react` 19.3.0 + whole-project type-check in CI. | Claude (verified, tests) |
| 2026-11-04 | **Post-approval changes from the plan review, signed off by user 2026-11-04:** §5.3 validation. (a) F7 payment/principal mismatch at 0% interest is a blocking error, in both modes. (b) END ordering: no guaranteed row after an option row; found by a generated counterexample that voided a Guaranteed Year. (c) The season after an opt-out must be a guaranteed row. (d) ILIR is required only with deferred compensation. (e) At least one Guaranteed season is required, and A2's no-Guaranteed-Years fallback is out of scope (§2.8). | Claude (plan review) |
````

- [ ] **Step 6: Verify and commit**

Run: `pnpm run typecheck && pnpm test && pnpm run build && grep -rn "MLB Deferred Contract Calculator" --include='*.html' --include='*.yml' --include='*.md' --include='Dockerfile' . | grep -v node_modules | grep -v CHANGELOG.md | grep -v docs/superpowers/plans/`
Expected: type-check exit 0, `Tests  173 passed (173)`, `✓ built in`, and **no** grep output. `CHANGELOG.md` is frozen history, and the plan files quote the old name in their own commands.

```bash
git add .github/workflows/ci.yml Dockerfile README.md CLAUDE.md docs/superpowers/specs/2026-11-04-cbt-contract-engine-design.md
git commit -m "docs: rename to MLB Contract Calculator; type-check the project in CI; update spec"
```

### Task 11: Open PR 3 (controller)

- [ ] Push `feat/contract-ui` and open the PR with the title **`feat!: generalize to any contract — new UI, real-contract presets, MLB Contract Calculator`**. The body summarizes: the new UI, the 13 presets with their reconciliation, F4(c), the V11 fix, the rename, Ohtani changing from $46.77M to $46.08M (the app previously used the CBA-default attribution), and "don't publish the draft until PR 4 merges".
- [ ] Wait for CI: `audit`, `test` (both type-checks and tests), and both `docker-build` jobs, whose smoke test looks for the new title. Request Sourcery. If it's skipped for budget, get a code-reviewer subagent pass and ask the user before merging.

---

## Phase 4 — PR 4: `fix: correct the Article XVI funding copy`

### Task 12: Funding copy (spec §4) and the Vite config warning

**Files:** Replace `components/FundingRules.tsx` and `vite.config.ts`.

- [ ] **Step 1: Branch from the updated main**

```bash
git checkout main && git pull --ff-only && git checkout -b fix/funding-copy
```

- [ ] **Step 2: Replace `components/FundingRules.tsx`.** Four copy changes, each checked against Art. XVI (p.89):
  - The title becomes "Funding Rules (Article XVI)".
  - The prime-rate note: the J.P. Morgan Chase prime rate on the preceding Nov 1; the Parties "shall meet and confer" and may, "with due notice", amend the rate effective the next July 1.
  - The creditor-access card drops the non-CBA "bankruptcy-remote escrow" remark.
  - The deductible applies to the aggregate per Basic Agreement period.

```tsx
import React from 'react';
import { Calendar, Wallet, Landmark, Percent, Coins, Users, ShieldCheck } from 'lucide-react';

// Article XVI funding rules (static copy, moved from App.tsx).
const FundingDetailCard = ({ icon, title, tag, children }: { icon: React.ReactNode, title: string, tag: string, children?: React.ReactNode }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
    <div className="flex justify-between items-start mb-3">
      <div className="flex items-center gap-3">
        {/* <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">{icon}</div> */}
        <h5 className="font-bold text-slate-900 text-lg">{title}</h5>
      </div>
      <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-1 rounded uppercase tracking-wide">{tag}</span>
    </div>
    <div className="text-sm text-slate-600 leading-relaxed">
      {children}
    </div>
  </div>
);

export const FundingRules = () => {
  return (
    <div className="space-y-6 mt-8">
      <h3 className="text-xl font-bold text-slate-800 px-1">Funding Rules (Article XVI)</h3>
      
      {/* Timeline Card */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <h4 className="text-lg font-bold text-slate-800 mb-8">Funding Deadline Timeline</h4>
        <div className="relative border-l-2 border-blue-100 ml-3 space-y-10 pl-8 py-2">
          
          {/* Year 0 */}
          <div className="relative">
            <div className="absolute -left-[39px] top-1 w-5 h-5 rounded-full bg-blue-500 border-4 border-white shadow-sm box-content"></div>
            <span className="text-xs font-bold text-blue-600 tracking-wider uppercase mb-1 block">Year 0</span>
            <h5 className="font-bold text-slate-900 text-lg">Contract Execution</h5>
            <p className="text-sm text-slate-600 mt-1">Player and Club agree to deferred compensation terms.</p>
          </div>

          {/* Year 1 */}
          <div className="relative">
            <div className="absolute -left-[39px] top-1 w-5 h-5 rounded-full bg-blue-500 border-4 border-white shadow-sm box-content"></div>
            <span className="text-xs font-bold text-blue-600 tracking-wider uppercase mb-1 block">Year 1</span>
            <h5 className="font-bold text-slate-900 text-lg">Season Played</h5>
            <p className="text-sm text-slate-600 mt-1">The championship season in which the deferred compensation is earned.</p>
          </div>

          {/* Year 2 */}
          <div className="relative">
            <div className="absolute -left-[39px] top-1 w-5 h-5 rounded-full bg-blue-300 border-4 border-white shadow-sm box-content"></div>
            <span className="text-xs font-bold text-blue-500 tracking-wider uppercase mb-1 block">Year 2 (July 1)</span>
            <h5 className="font-bold text-slate-800 text-lg">First July 1</h5>
            <p className="text-sm text-slate-600 mt-1">First July 1st following the season earned. No funding required yet.</p>
          </div>

          {/* Year 3 */}
          <div className="relative">
            <div className="absolute -left-[39px] top-1 w-5 h-5 rounded-full bg-blue-600 border-4 border-white shadow-sm box-content"></div>
            <span className="text-xs font-bold text-blue-700 tracking-wider uppercase mb-1 block">Year 3 (Second July 1)</span>
            <h5 className="font-bold text-slate-900 text-lg">Funding Deadline</h5>
            <p className="text-sm text-slate-600 mt-1">The deferred obligation must be fully funded by the Club by this date.</p>
          </div>
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Calendar size={20} /></div>
            <h4 className="font-bold text-slate-900 text-lg">The Deadline</h4>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">
            Funding must occur on or before the <strong>second July 1</strong> following the championship season in which the deferred compensation is earned.
          </p>
        </div>
        <div className="bg-green-50/50 p-6 rounded-xl border border-green-100 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg"><Wallet size={20} /></div>
            <h4 className="font-bold text-slate-900 text-lg">No Limits</h4>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">
            There are no limitations on either the amount of deferred compensation or the percentage of total compensation attributable to deferred compensation for which a Uniform Player’s Contract may provide.
          </p>
        </div>
      </div>

      {/* Detailed Rules List */}
      <div className="space-y-4">
        <FundingDetailCard 
          icon={<Landmark size={18} />} 
          title="Funding Requirement" 
          tag="Article XVI"
        >
          Deferred compensation obligations incurred in a Contract executed on or after September 30, 2002 must be fully funded by the Club. The funding amount must be equal to the present value of the total deferred compensation obligation.
        </FundingDetailCard>

        <FundingDetailCard 
          icon={<Percent size={18} />} 
          title="Calculation of Present Value" 
          tag="Article XVI"
        >
          Full funding of the present value of deferred compensation obligations means the Club must fund the current present value of the outstanding deferred payments, discounted by 5% annually. <br/><br/>
          <span className="text-slate-500 text-xs">Note: if the prime rate at J.P. Morgan Chase Bank on the preceding November 1 is 7% or higher, the Parties shall meet and confer and may, with due notice to the Clubs, amend this discount rate effective the next July 1.</span>
        </FundingDetailCard>

        <FundingDetailCard 
          icon={<Coins size={18} />} 
          title="Nature of Funded Assets" 
          tag="Article XVI"
        >
          The amount funded must be maintained in the form of unencumbered assets comprising:
          <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-600">
            <li>Cash</li>
            <li>Cash equivalents</li>
            <li>Registered and unrestricted readily marketable securities</li>
          </ul>
          <p className="mt-2">Unless the Club obtains the Parties' prior written authorization of an alternative form.</p>
        </FundingDetailCard>

        <FundingDetailCard 
          icon={<Users size={18} />} 
          title="Creditor Access" 
          tag="Article XVI"
        >
          The funds must be used exclusively to satisfy the deferred obligation, yet Article XVI specifies that "such amount(s) funded are subject to the claims of the Club's general creditors."
        </FundingDetailCard>

        <div className="bg-amber-50 p-5 rounded-lg border border-amber-100">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-100 text-amber-600 rounded-md"><ShieldCheck size={16} /></div>
              <h5 className="font-bold text-amber-900">Historical Deductible</h5>
            </div>
          </div>
          <p className="text-sm text-amber-800 leading-relaxed">
            For contracts executed before December 11, 2011, Clubs are entitled to an annual deductible amount of deferred compensation which need not be funded. This deductible is the lesser of $2,000,000 or the present value of the total deferred compensation owed under those contracts, and it applies to the aggregate of a Club's contracts from each Basic Agreement period, not to any one contract.
          </p>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Replace `vite.config.ts`.** `__dirname` becomes `import.meta.dirname`, which removes the native-config-loader warning that every Vitest run prints.

```ts
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [tailwindcss(), react()],
      build: {
        chunkSizeWarningLimit: 600,
      },
      resolve: {
        alias: {
          '@': path.resolve(import.meta.dirname, '.'),
        }
      }
    };
});
```

- [ ] **Step 4: Verify**

Run: `pnpm run typecheck && pnpm test 2>&1 | tee /dev/stderr | grep -c __dirname; pnpm run build`
Expected: type-check exit 0, `Tests  173 passed (173)`, the `__dirname` count is `0`, and the build prints `✓ built in`.

- [ ] **Step 5: Commit, push, PR (controller)**

```bash
git add components/FundingRules.tsx vite.config.ts
git commit -m "fix: correct Article XVI funding copy; use import.meta.dirname in Vite config"
```

Open the PR titled `fix: correct the Article XVI funding copy` and use the same CI and review steps as Task 11. **After PR 4 merges, ask the user about publishing the 1.0.0 draft.** Don't publish it yourself.
