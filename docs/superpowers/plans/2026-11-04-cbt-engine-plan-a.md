# CBT Contract Engine — Plan A (Vitest + Engine) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Vitest test runner to CI, then a pure-TypeScript CBT contract engine (`utils/cbt/`) that implements every rule in the approved spec and reproduces the reported Ohtani, Scherzer and Bellinger figures.

**Architecture:** The engine is a set of pure functions with no React. Each module owns one block of spec rules: `classify` → `deferral` → `aav` → `valley` → `outcome` → `funding`, composed by `calculate()` in `index.ts`. Every charge carries the rule ids that produced it (`rules.ts` is the single id → citation/tag table). The existing UI keeps using `utils/calculations.ts` until Plan B wires in the engine. This plan adds no user-visible change.

**Tech Stack:** TypeScript 7.0.2, Vitest 5.0.5 (exact pin), Vite 8.3.5, pnpm 12.16.1, Node 26.13.0.

**Spec:** `docs/superpowers/specs/2026-11-04-cbt-contract-engine-design.md` (approved 2026-11-04). Rule ids in this plan (A1, V7, O2NS, …) refer to it.

**Plan B (not in this plan):** UI split, new inputs and scenario panel, copy corrections (spec §4), and switching `App.tsx` to `utils/cbt`. It will be written against the merged engine API.

---

## How this plan was verified

Every code block below was generated from a prototype worktree, not retyped. In that prototype:

- `pnpm add -D vitest@5.0.5` installed with no build scripts. The repo's `ignore-scripts=true` and empty `allowBuilds` needed no change.
- `pnpm exec vitest run` passed **87 tests in 10 files**.
- `pnpm exec tsc --noEmit -p tsconfig.engine.json` (strict) reported **0 errors**, and a planted type error made it fail.
- `pnpm run build` succeeded.
- **Mutation checks:**
  - Removing the O2NS guard fails W18.
  - Using the A2 signing-bonus attribution in place of V5 fails all four Bellinger tests.
  - Making the F6 band exclusive fails F6.

If any step's actual output differs from the expected output given here, stop and investigate. Don't edit a test to make it pass.

## Ground rules for the executor

- **Never push to `main`.** It's protected: open a PR per phase. PR titles must be conventional commits. Squash-merge only.
- Commits are signed through 1Password. If signing fails with `1Password: agent returned an error`, ask the user to unlock 1Password. **Never** use `--no-gpg-sign` or `-c commit.gpgsign=false`.
- Install only with `pnpm add -D <pkg>@<exact>`. `.npmrc` has `save-exact=true`, so check that `package.json` gets an exact version.
- Vitest prints a harmless warning about `__dirname` in `vite.config.ts`. Ignore it, and leave `vite.config.ts` unchanged in this plan.
- `pnpm exec tsc --noEmit -p .` (the whole repo) already reports ~319 errors, because `@types/react` is not installed. That predates this work and is out of scope. Use only the engine-scoped `typecheck:engine` script.
- Units: the worked-example tests use **$M** with season 1 = 2026. Presets use dollars.

## File structure

| File | Responsibility | Spec rules |
|---|---|---|
| `utils/cbt/rules.ts` | Rule id → `{cite, tag, summary}` | all |
| `utils/cbt/types.ts` | Input, scenario and result types | §5.1 |
| `utils/cbt/classify.ts` | Year classification, opt-out-derived Player Option Years | D4, D5, Y1–Y6 |
| `utils/cbt/deferral.ts` | Deferral cost (sequential / unattributed, stated-interest band), signing-bonus cost | F1–F7, A2, A7 |
| `utils/cbt/aav.ts` | Deemed-buyout selection, AAV at signing | A1–A6 |
| `utils/cbt/valley.ts` | Valley Charge, including the "such" iteration | V1–V6, V10, V11 |
| `utils/cbt/funding.ts` | Article XVI required balance by July 1 | X1–X5 |
| `utils/cbt/validate.ts` | Blocking errors and warnings | §5.3 |
| `utils/cbt/outcome.ts` | Scenario → per-season charges | O1–O8, V7–V9, B1, END |
| `utils/cbt/index.ts` | `calculate()`, `defaultScenario()`, cash, totals, flags, re-exports | §5.2 |
| `data/presets.ts` | Ohtani, Scherzer, Bellinger, Standard, each with sources and reported figures | §7 |
| `utils/cbt/__tests__/*` | Unit, worked-example (W1–W18), preset (W14–W15) and invariant tests | §8 |
| `utils/__tests__/calculations.test.ts` | Characterization tests of the existing calculator | — |
| `tsconfig.engine.json` | Strict type-check of the engine and presets only | — |

---

## Phase 0 — Land the spec and this plan

The spec branch `docs/cbt-contract-engine-spec` already exists with the approved spec committed.

- [ ] **Step 1:** Commit this plan on that branch.

```bash
git checkout docs/cbt-contract-engine-spec
git add docs/superpowers/plans/2026-11-04-cbt-engine-plan-a.md
git commit -m "docs: add CBT engine implementation plan A"
```

- [ ] **Step 2:** Push and open the PR. Wait for checks (and the Sourcery review, if it posts) before merging.

```bash
git push -u origin docs/cbt-contract-engine-spec
gh pr create --title "docs: add CBT contract engine design spec and plan A" --body "Approved design spec (rev. 4, CBA-verified) and implementation plan A (Vitest + engine). No code changes."
```

---

## Phase 1 — PR 1: `ci: add Vitest test runner and CI test job`

### Task 1: Add Vitest and characterize the existing calculator

**Files:**
- Modify: `package.json` (scripts, devDependencies)
- Modify: `pnpm-lock.yaml` (via pnpm)
- Create: `utils/__tests__/calculations.test.ts`

- [ ] **Step 1: Branch from up-to-date main**

```bash
git checkout main && git pull --ff-only && git checkout -b ci/vitest
```

- [ ] **Step 2: Install Vitest (exact pin)**

Run: `pnpm add -D vitest@5.0.5`
Expected: `+ vitest 5.0.5` under devDependencies, and `package.json` shows `"vitest": "5.0.5"` with no caret.

- [ ] **Step 3: Add the test script**

In `package.json` `"scripts"`, add after `"preview"`:

```json
    "preview": "vite preview",
    "test": "vitest run"
```

- [ ] **Step 4: Write the characterization test**

Create `utils/__tests__/calculations.test.ts`:

```ts
// Characterization tests for the existing calculator (replaced by utils/cbt in a later PR).
import { describe, expect, it } from 'vitest';
import { calculateContract, calculatePresentValue } from '../calculations';

describe('existing calculations.ts', () => {
  it('calculatePresentValue discounts FV / (1 + r)^n', () => {
    expect(calculatePresentValue(100, 2, 10)).toBeCloseTo(82.6446281, 6);
  });

  it('Ohtani preset: current app spreads every payment over all seasons → $46,769,026 (spec §2.4.1)', () => {
    const r = calculateContract({ totalValue: 700e6, years: 10, deferralAmount: 680e6, deferralStartYear: 1, payoutDuration: 10, interestRate: 4.43 });
    expect(Math.round(r.cbtAAV)).toBe(46_769_026);
  });
});
```

- [ ] **Step 5: Run it**

Run: `pnpm test`
Expected: `Test Files  1 passed (1)`, `Tests  2 passed (2)`. These tests pin today's behavior and must pass immediately. The $46,769,026 value is the overstatement the spec documents in §2.4.1.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml utils/__tests__/calculations.test.ts
git commit -m "ci: add Vitest with characterization tests for the current calculator"
```

### Task 2: Run tests in CI and document the command

**Files:**
- Modify: `.github/workflows/ci.yml` (add a `test` job after `audit`)
- Modify: `CLAUDE.md:5-12`

- [ ] **Step 1: Add the CI job**

In `.github/workflows/ci.yml`, insert this job between the `audit` job and the `# Build the image on every PR.` comment, at the same indentation as `audit:`. The action pins are copied from the existing `audit` job.

```yaml
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

      - name: Run tests
        run: pnpm test
```

- [ ] **Step 2: Update CLAUDE.md**

Replace lines 5–12 of `CLAUDE.md`:

```markdown
## Commands

- **Dev server:** `pnpm run dev` (serves on port 3000, binds 0.0.0.0)
- **Build:** `pnpm run build` (Vite production build to `dist/`)
- **Preview build:** `pnpm run preview`
- **Tests:** `pnpm test` (Vitest, `vitest run`; also runs in CI)
- **Docker:** `docker-compose up -d` (builds and serves on port 3000)

There is no linting or formatting configured.
```

- [ ] **Step 3: Verify locally**

Run: `pnpm test && pnpm run build`
Expected: tests pass (2 tests) and the build prints `✓ built in`.

- [ ] **Step 4: Commit, push, open the PR**

```bash
git add .github/workflows/ci.yml CLAUDE.md
git commit -m "ci: run Vitest in a CI test job"
git push -u origin ci/vitest
gh pr create --title "ci: add Vitest test runner and CI test job" --body "Adds Vitest 5.0.5 (exact pin), \`pnpm test\`, characterization tests for utils/calculations.ts, and a CI \`test\` job. Groundwork for the CBT engine (spec docs/superpowers/specs/2026-11-04-cbt-contract-engine-design.md)."
```

Expected: the PR's `test` job is green. Merge after checks pass, then continue to Phase 2.

---

## Phase 2 — PR 2: `refactor: add CBT contract engine (not yet wired to the UI)`

> **Title note:** spec §9 suggested `feat:` for this PR. Nothing user-visible changes until Plan B wires the engine into `App.tsx`. A `feat:` title would put a release-note entry and a minor bump on a release whose users see no difference. Use `refactor:`, which release-drafter hides, and give the user-facing `feat:` to Plan B's UI PR. If the user prefers `feat:` here, change only the PR title.

### Task 3: Rule table, types, and the engine type-check

**Files:**
- Create: `utils/cbt/rules.ts`
- Create: `utils/cbt/types.ts`
- Create: `tsconfig.engine.json`
- Modify: `package.json` (script)
- Modify: `.github/workflows/ci.yml` (`test` job)

- [ ] **Step 1: Branch**

```bash
git checkout main && git pull --ff-only && git checkout -b refactor/cbt-engine
```

- [ ] **Step 2: Create `utils/cbt/rules.ts`**

```ts
// Single source of truth for rule ids, CBA citations and evidence tags.
// Every id here must match a row in the spec (§2–§3). Tags:
//   TEXT     — stated directly in the CBA
//   PRACTICE — CBA ambiguous/silent; matches the figure MLB actually charged
//   INTERP   — CBA ambiguous; engine's reading (alternative named in the spec)
//   CONV     — CBA silent; modeling convention
export type Tag = 'TEXT' | 'PRACTICE' | 'INTERP' | 'CONV';

export interface Rule {
  cite: string;
  tag: Tag;
  summary: string;
}

export const RULES = {
  D2: { cite: 'XXIII(A)(4); E(6)(b)(ii)', tag: 'TEXT', summary: 'ILIR = Federal mid-term rate for the October before the first Contract Year' },
  D4: { cite: 'XXIII(A)(8)', tag: 'TEXT', summary: 'Guaranteed Year: >50% of Base Salary guaranteed on termination' },
  D5: { cite: 'E(2); E(5)(d)(ii)', tag: 'INTERP', summary: 'Base Salary = current (non-deferred) pay; deferrals enter only via E(6)' },
  Y1: { cite: 'E(5)(a)(i)', tag: 'TEXT', summary: 'Club (incl. vesting) option years are not Guaranteed Years' },
  Y2: { cite: 'E(5)(a)(ii)', tag: 'TEXT', summary: 'Player option year is guaranteed unless buyout > 50% of Base Salary' },
  Y3: { cite: 'E(5)(a)(ii)', tag: 'TEXT', summary: 'Years after an opt-out are guaranteed unless payment > 50% of following Base Salaries' },
  Y4: { cite: 'E(5)(a)(ii)(B)', tag: 'TEXT', summary: 'Guaranteed seasons after an opt-out are Player Option Years' },
  Y5: { cite: 'E(5)(a)(iii)', tag: 'TEXT', summary: 'Dual option = Player Option Year' },
  Y6: { cite: 'E(5)(a)(iv)', tag: 'TEXT', summary: 'Mutual option = Club Option Year' },
  A1: { cite: 'E(2)', tag: 'TEXT', summary: 'AAV = (Base Salary + Signing Bonus + deferred cost) / Guaranteed Years' },
  A2: { cite: 'E(3)', tag: 'TEXT', summary: 'Signing Bonus attributed pro rata over Guaranteed Years' },
  A3: { cite: 'E(5)(b)(i)(A)', tag: 'TEXT', summary: 'Buyout on a non-guaranteed option year is deemed a Signing Bonus' },
  A4: { cite: 'E(5)(b)(i)(B)', tag: 'TEXT', summary: 'Only the earliest option year buyout is deemed a Signing Bonus' },
  A5: { cite: 'E(5)(b)(i)(A)-(B)', tag: 'INTERP', summary: 'Club + player buyouts both present: the higher is the Signing Bonus' },
  A7: { cite: 'E(1); E(3); E(6)(a)', tag: 'INTERP', summary: 'Signing-bonus installments after the term are discounted as deferred compensation' },
  F1: { cite: 'E(6)(a)', tag: 'TEXT', summary: 'Deferred Compensation = Salary payable after the last season' },
  F2: { cite: 'E(6)(b)(i)', tag: 'TEXT', summary: 'Deferred comp counts in the season the contract attributes it to' },
  F3: { cite: 'E(6)(b)(ii)', tag: 'TEXT', summary: 'Stated interest within 1.5 pp of ILIR → stated value; else discounted at ILIR' },
  F4a: { cite: 'E(6)(b)(i)', tag: 'PRACTICE', summary: 'Sequential attribution: first-earned principal paid first' },
  F4b: { cite: 'E(6)(b)(i)', tag: 'TEXT', summary: 'Unattributed: equally to each Guaranteed Year' },
  F5: { cite: 'silent', tag: 'PRACTICE', summary: 'Whole-year, annually compounded discounting' },
  F6: { cite: 'silent', tag: 'CONV', summary: '"Within 1.5 percentage points" is inclusive' },
  F7: { cite: 'E(6)(b)(ii)', tag: 'CONV', summary: 'Payments are cash incl. interest; principal = cash / (1+stated)^years' },
  B1: { cite: 'E(4)(a)', tag: 'TEXT', summary: 'Earned bonuses count in the season earned, outside the AAV' },
  O1: { cite: 'E(5)(c)', tag: 'TEXT', summary: 'Exercised club option year = Base Salary + bonuses' },
  O2: { cite: 'E(5)(b)(ii)', tag: 'TEXT', summary: 'Buyout not received → deduction of the buyout previously included' },
  O2NS: { cite: 'E(5)(b)(ii)', tag: 'INTERP', summary: 'O2 not stacked on O6 or on an O7 true-up' },
  O3: { cite: 'E(5)(b)(i)', tag: 'TEXT', summary: 'Declined; deemed buyout already charged' },
  O4: { cite: 'E(5)(b)(i)(B)', tag: 'TEXT', summary: 'Paid buyout that was not the deemed Signing Bonus is charged in its option year' },
  O4b: { cite: 'E(5)(b)(i)(B)', tag: 'INTERP', summary: 'O4 extended to the lower buyout left out under A5' },
  O5: { cite: 'E(5)(a)(i), (c)', tag: 'INTERP', summary: 'Vested option treated as exercised club option' },
  O6: { cite: 'E(5)(d)(i) ¶2', tag: 'TEXT', summary: 'Exercised non-guaranteed player option: salary − buyout attributed' },
  O7: { cite: 'E(5)(d)(i) ¶1', tag: 'TEXT', summary: 'Nullified guaranteed player option: true-up of paid − attributed (excl. Valley)' },
  O8: { cite: 'E(5)(d)(i); E(6)(b)(i)', tag: 'INTERP', summary: 'O7 values deferred pay at attributed cost' },
  V4: { cite: 'E(5)(d)(ii)', tag: 'TEXT', summary: 'Valley shortfall allocated pro rata over preceding Guaranteed Years' },
  V5: { cite: 'E(5)(d)(ii)', tag: 'PRACTICE', summary: 'Signing Bonus attributed over pre-option years for the 80% Figure' },
  V6: { cite: 'E(5)(d)(ii)', tag: 'INTERP', summary: '"Such" resolved by testing option years in order; shares stay charged' },
  V7: { cite: 'E(5)(d)(ii)', tag: 'INTERP', summary: 'Exercised "such" years credited their averaged shortfalls' },
  V8: { cite: 'E(5)(d)(i) ¶1', tag: 'TEXT', summary: 'Valley Charge not refunded on opt-out' },
  V9: { cite: 'E(5)(d)(i) ¶1', tag: 'INTERP', summary: 'O7 exclusion also covers V7 credits' },
  V10: { cite: 'E(5)(d)(ii); G(3)(e)', tag: 'INTERP', summary: 'Valley applies only to guaranteed player option years' },
  V11: { cite: 'E(5)(d)(ii); E(5)(b)(i)(A)', tag: 'INTERP', summary: 'In the floor hypothetical, option-year buyouts become deemed Signing Bonus' },
  X1: { cite: 'Art. XVI', tag: 'TEXT', summary: 'Fund by the second July 1 after the season earned' },
  X2: { cite: 'Art. XVI', tag: 'TEXT', summary: 'Maintain PV of outstanding payments at 5%' },
  X4: { cite: 'Art. XVI; XXIII(A)', tag: 'INTERP', summary: '"Earned" season = Art. XXIII attributed season' },
  X5: { cite: '—', tag: 'CONV', summary: 'July 1 snapshots, whole years; same-day payments count as paid' },
  END: { cite: '—', tag: 'CONV', summary: 'Declining an option or taking an opt-out ends the contract' },
} as const satisfies Record<string, Rule>;

export type RuleId = keyof typeof RULES;
```

- [ ] **Step 3: Create `utils/cbt/types.ts`**

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
  attribution: 'sequential' | 'unattributed';
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

export interface Charge {
  season: number;
  amount: number;
  label: string;
  /** Every rule that determined the amount (spec §6). */
  rules: RuleId[];
}

export interface Flag {
  rule: RuleId;
  message: string;
}

export interface Result {
  classification: SeasonClass[];
  aavAtSigning: number;
  charges: Charge[];
  perSeason: { season: number; cbt: number; cash: number }[];
  totals: { cbt: number; cash: number; attributedCost: number };
  funding: { snapshots: { july1: number; required: number }[]; peak: number };
  flags: Flag[];
}
```

- [ ] **Step 4: Create `tsconfig.engine.json`**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": { "strict": true, "jsx": "preserve" },
  "include": ["utils/cbt/**/*.ts", "data/**/*.ts"]
}
```

- [ ] **Step 5: Add the script**

In `package.json` `"scripts"`, after `"test"`:

```json
    "test": "vitest run",
    "typecheck:engine": "tsc --noEmit -p tsconfig.engine.json"
```

- [ ] **Step 6: Run the type-check**

Run: `pnpm run typecheck:engine`
Expected: exit 0 with no output.

- [ ] **Step 7: Add the CI step**

In `.github/workflows/ci.yml`, in the `test` job, add before `- name: Run tests`:

```yaml
      - name: Type-check engine
        run: pnpm run typecheck:engine

```

- [ ] **Step 8: Commit**

```bash
git add utils/cbt/rules.ts utils/cbt/types.ts tsconfig.engine.json package.json .github/workflows/ci.yml
git commit -m "refactor: add CBT rule table, engine types and strict engine type-check"
```

### Task 4: Classification (D4, Y1–Y6)

**Files:**
- Create: `utils/cbt/__tests__/helpers.ts`
- Create: `utils/cbt/__tests__/classify.test.ts`
- Create: `utils/cbt/classify.ts`

- [ ] **Step 1: Create the test helpers**

`utils/cbt/__tests__/helpers.ts`:

```ts
// Test helpers. Worked examples (spec §8) are in $M; season 1 = 2026.
import type { ContractInput, SeasonRow } from '../types';

export const Y1 = 2026;

type Row = Partial<SeasonRow> & { currentSalary: number };

export function build(rows: Row[], opts: Partial<ContractInput> = {}): ContractInput {
  return {
    seasons: rows.map((r, i) => ({ season: Y1 + i, deferred: 0, kind: 'guaranteed', ...r })),
    signingBonus: { amount: 0, payments: [] },
    optOuts: [],
    deferral: { payments: [], attribution: 'sequential', statedInterestPct: 0 },
    ilirPct: 0,
    ...opts,
  };
}

/** n guaranteed seasons at `salary`. */
export const guaranteed = (n: number, salary: number): Row[] => Array.from({ length: n }, () => ({ currentSalary: salary }));
```

- [ ] **Step 2: Write the failing test**

`utils/cbt/__tests__/classify.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { classify } from '../classify';
import { build, guaranteed, Y1 } from './helpers';

const at = (input: ReturnType<typeof build>, n: number) => classify(input).find((c) => c.season === Y1 + n - 1)!;

describe('classify (D4, Y1–Y6)', () => {
  it('D4 guaranteed rows are Guaranteed Years', () => {
    expect(at(build(guaranteed(2, 20)), 1)).toMatchObject({ effectiveKind: 'guaranteed', isGuaranteed: true });
  });

  it('Y1 club and vesting options are not Guaranteed Years', () => {
    const input = build([...guaranteed(1, 20), { currentSalary: 25, kind: 'club', buyout: 2 }, { currentSalary: 25, kind: 'vesting' }]);
    expect(at(input, 2)).toMatchObject({ effectiveKind: 'club', isGuaranteed: false, buyout: 2 });
    expect(at(input, 3)).toMatchObject({ effectiveKind: 'club', isGuaranteed: false });
  });

  it('Y6 mutual option is treated as a club option', () => {
    expect(at(build([...guaranteed(1, 20), { currentSalary: 25, kind: 'mutual' }]), 2).effectiveKind).toBe('club');
  });

  it('Y2 player option is guaranteed unless buyout > 50% of Base Salary', () => {
    const input = build([...guaranteed(1, 20), { currentSalary: 10, kind: 'player', buyout: 5 }, { currentSalary: 10, kind: 'player', buyout: 6 }]);
    expect(at(input, 2).isGuaranteed).toBe(true); // 5 is exactly 50%: not "more than"
    expect(at(input, 3).isGuaranteed).toBe(false);
  });

  it('Y2 respects guaranteedIfExercised = false (A(8) not met)', () => {
    expect(at(build([...guaranteed(1, 20), { currentSalary: 10, kind: 'player', guaranteedIfExercised: false }]), 2).isGuaranteed).toBe(false);
  });

  it('Y5 dual option is treated as a player option', () => {
    expect(at(build([...guaranteed(1, 20), { currentSalary: 10, kind: 'dual' }]), 2)).toMatchObject({ effectiveKind: 'player', isGuaranteed: true });
  });

  it('Y3/Y4 guaranteed seasons after a passing opt-out are guaranteed Player Option Years', () => {
    const input = build(guaranteed(5, 20), { optOuts: [{ afterSeason: Y1 + 1, payment: 0 }] });
    expect(at(input, 2)).toMatchObject({ effectiveKind: 'guaranteed' });
    expect(at(input, 3)).toMatchObject({ effectiveKind: 'player', viaOptOut: true, isGuaranteed: true });
  });

  it('Y3 failing opt-out (W6): payment 25 > 50% of 40 → non-guaranteed Player Option Years, payment is the buyout', () => {
    const input = build(guaranteed(5, 20), { optOuts: [{ afterSeason: Y1 + 2, payment: 25 }] });
    expect(at(input, 4)).toMatchObject({ effectiveKind: 'player', isGuaranteed: false, buyout: 25 });
    expect(at(input, 5)).toMatchObject({ effectiveKind: 'player', isGuaranteed: false, buyout: 0 });
  });

  it('Y4 an option row after an opt-out keeps its kind', () => {
    const input = build([...guaranteed(3, 20), { currentSalary: 25, kind: 'club', buyout: 3 }], { optOuts: [{ afterSeason: Y1 + 1, payment: 0 }] });
    expect(at(input, 3).effectiveKind).toBe('player');
    expect(at(input, 4).effectiveKind).toBe('club');
  });
});
```

- [ ] **Step 3: Run it to confirm it fails**

Run: `pnpm exec vitest run utils/cbt/__tests__/classify.test.ts`
Expected: FAIL with `Error: Cannot find module '../classify'`.

- [ ] **Step 4: Implement `utils/cbt/classify.ts`**

```ts
// Year classification: D4, D5, Y1–Y6 (spec §2.1–§2.2).
import type { RuleId } from './rules';
import type { ContractInput, SeasonClass } from './types';

export function sortedSeasons(input: ContractInput) {
  return [...input.seasons].sort((a, b) => a.season - b.season);
}

export function classify(input: ContractInput): SeasonClass[] {
  const rows = sortedSeasons(input);
  // Y3: each opt-out's 50% test, against the Base Salaries (D5: current pay) of every following Contract Year.
  const optOutPasses = new Map<number, boolean>();
  for (const o of input.optOuts) {
    const following = rows.filter((r) => r.season > o.afterSeason).reduce((s, r) => s + r.currentSalary, 0);
    optOutPasses.set(o.afterSeason, !(o.payment > 0.5 * following));
  }

  return rows.map((row): SeasonClass => {
    const preceding = input.optOuts.filter((o) => row.season > o.afterSeason);

    if (row.kind === 'guaranteed' && preceding.length > 0) {
      // Y4: a guaranteed season after an opt-out can be nullified → Player Option Year.
      // Y3: guaranteed only if every opt-out covering it passes its 50% test.
      const isGuaranteed = preceding.every((o) => optOutPasses.get(o.afterSeason));
      // The opt-out payment is the Option Buyout for the first season it nullifies (used by A3/V1).
      const buyout = input.optOuts
        .filter((o) => rows.find((r) => r.season > o.afterSeason)?.season === row.season)
        .reduce((s, o) => s + o.payment, 0);
      return { season: row.season, effectiveKind: 'player', isGuaranteed, viaOptOut: true, buyout, rules: ['Y4', 'Y3', 'D5'] };
    }

    if (row.kind === 'guaranteed') {
      return { season: row.season, effectiveKind: 'guaranteed', isGuaranteed: true, viaOptOut: false, buyout: 0, rules: ['D4'] };
    }

    const buyout = row.buyout ?? 0;
    if (row.kind === 'club' || row.kind === 'mutual' || row.kind === 'vesting') {
      const rules: RuleId[] = row.kind === 'mutual' ? ['Y1', 'Y6'] : ['Y1'];
      return { season: row.season, effectiveKind: 'club', isGuaranteed: false, viaOptOut: false, buyout, rules };
    }

    // player | dual (Y2, Y5)
    const meetsA8 = row.guaranteedIfExercised ?? true;
    const isGuaranteed = meetsA8 && !(buyout > 0.5 * row.currentSalary);
    const rules: RuleId[] = row.kind === 'dual' ? ['Y2', 'Y5', 'D5'] : ['Y2', 'D5'];
    return { season: row.season, effectiveKind: 'player', isGuaranteed, viaOptOut: false, buyout, rules };
  });
}

/** Option rows a Scenario decides on: club-type rows and explicit player/dual rows (not opt-out-derived years). */
export function isOptionRow(c: SeasonClass): boolean {
  return c.effectiveKind === 'club' || (c.effectiveKind === 'player' && !c.viaOptOut);
}
```

- [ ] **Step 5: Run it to confirm it passes**

Run: `pnpm exec vitest run utils/cbt/__tests__/classify.test.ts && pnpm run typecheck:engine`
Expected: `Tests  9 passed (9)`; type-check exit 0.

- [ ] **Step 6: Commit**

```bash
git add utils/cbt/classify.ts utils/cbt/__tests__/helpers.ts utils/cbt/__tests__/classify.test.ts
git commit -m "refactor: classify contract years per CBA E(5)(a)"
```

### Task 5: Deferral and signing-bonus cost (F1–F7, A2, A7)

**Files:**
- Create: `utils/cbt/__tests__/deferral.test.ts`
- Create: `utils/cbt/deferral.ts`

- [ ] **Step 1: Write the failing test**

`utils/cbt/__tests__/deferral.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { classify } from '../classify';
import { deferralCosts, signingBonusCost, withinStatedBand } from '../deferral';
import { build, guaranteed, Y1 } from './helpers';

const w7 = (ilirPct: number) =>
  build(
    [
      { currentSalary: 5, deferred: 5 },
      { currentSalary: 5, deferred: 5 },
    ],
    { ilirPct, deferral: { payments: [{ year: 2029, amount: 5 }, { year: 2030, amount: 5 }], attribution: 'sequential', statedInterestPct: 0 } },
  );

describe('deferral cost (F3–F7)', () => {
  it('F6 the 1.5-point band is inclusive', () => {
    expect(withinStatedBand(0, 1.5)).toBe(true);
    expect(withinStatedBand(0, 1.51)).toBe(false);
  });

  it('F3 W7: 0% deferral with ILIR 1.2% counts at stated value', () => {
    const input = w7(1.2);
    const d = deferralCosts(input, classify(input));
    expect(d.costBySeason.get(Y1)).toBeCloseTo(5, 9);
    expect(d.costBySeason.get(Y1 + 1)).toBeCloseTo(5, 9);
  });

  it('F3/F5 W7: ILIR 2.0% discounts each payment 3 whole years', () => {
    const input = w7(2.0);
    const d = deferralCosts(input, classify(input));
    expect(d.costBySeason.get(Y1)).toBeCloseTo(5 / 1.02 ** 3, 9);
    expect(d.costBySeason.get(Y1 + 1)).toBeCloseTo(5 / 1.02 ** 3, 9);
  });

  it('F4a sequential: first-earned principal is paid first, splitting payments (Scherzer shape)', () => {
    const input = build([{ currentSalary: 0, deferred: 35 }, { currentSalary: 0, deferred: 35 }], {
      ilirPct: 1.85,
      deferral: { payments: [0, 1, 2, 3, 4].map((i) => ({ year: 2030 + i, amount: 14 })), attribution: 'sequential', statedInterestPct: 0 },
    });
    const d = deferralCosts(input, classify(input));
    const first = d.pieces.filter((p) => p.season === Y1).map((p) => [p.year, p.cash]);
    expect(first).toEqual([[2030, 14], [2031, 14], [2032, 7]]);
    expect(d.unpaidPrincipal).toBeCloseTo(0, 9);
  });

  it('F7 stated interest outside the band: principal grows at the stated rate, cash is discounted at the ILIR', () => {
    const input = build([{ currentSalary: 0, deferred: 100 }], {
      ilirPct: 6,
      deferral: { payments: [{ year: 2030, amount: 100 * 1.03 ** 4 }], attribution: 'sequential', statedInterestPct: 3 },
    });
    const d = deferralCosts(input, classify(input));
    expect(d.costBySeason.get(Y1)).toBeCloseTo((100 * 1.03 ** 4) / 1.06 ** 4, 9);
    expect(d.unpaidPrincipal).toBeCloseTo(0, 9);
    expect(d.excessCash).toBeCloseTo(0, 9);
  });

  it('F4b unattributed: principal spread equally over Guaranteed Years, payments split equally', () => {
    const input = build(guaranteed(2, 0), {
      ilirPct: 4,
      deferral: { payments: [{ year: 2030, amount: 10 }], attribution: 'unattributed', statedInterestPct: 0, unattributedPrincipal: 10 },
    });
    const d = deferralCosts(input, classify(input));
    expect(d.costBySeason.get(Y1)).toBeCloseTo(5 / 1.04 ** 4, 9);
    expect(d.costBySeason.get(Y1 + 1)).toBeCloseTo(5 / 1.04 ** 3, 9);
  });

  it('A2 in-term signing-bonus installments count at nominal; A7 after-term installments are discounted', () => {
    const input = build(guaranteed(2, 10), {
      ilirPct: 5,
      signingBonus: { amount: 6, payments: [{ year: Y1, amount: 2 }, { year: 2030, amount: 4 }] },
    });
    const b = signingBonusCost(input, classify(input));
    expect(b.cost).toBeCloseTo(2 + 2 / 1.05 ** 4 + 2 / 1.05 ** 3, 9);
    expect(b.deferredPieces).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm exec vitest run utils/cbt/__tests__/deferral.test.ts`
Expected: FAIL with `Error: Cannot find module '../deferral'`.

- [ ] **Step 3: Implement `utils/cbt/deferral.ts`**

```ts
// Deferred compensation cost (F1–F7) and signing-bonus cost (A2, A7). Spec §2.3–§2.4.
import { sortedSeasons } from './classify';
import type { ContractInput, SeasonClass } from './types';

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

export function signingBonusCost(input: ContractInput, classes: SeasonClass[]): BonusResult {
  const { amount, payments } = input.signingBonus;
  const g = classes.filter((c) => c.isGuaranteed).map((c) => c.season);
  const lastG = g.length ? Math.max(...g) : -Infinity;
  const band = withinStatedBand(0, input.ilirPct); // signing bonuses carry no stated interest
  const deferredPieces: Piece[] = [];
  let cost = 0;
  const schedule = payments.length > 0 ? payments : [{ year: -Infinity, amount }]; // no schedule → paid in term
  for (const p of schedule) {
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
```

- [ ] **Step 4: Run it to confirm it passes**

Run: `pnpm exec vitest run utils/cbt/__tests__/deferral.test.ts && pnpm run typecheck:engine`
Expected: `Tests  7 passed (7)`; type-check exit 0.

- [ ] **Step 5: Commit**

```bash
git add utils/cbt/deferral.ts utils/cbt/__tests__/deferral.test.ts
git commit -m "refactor: cost deferred compensation and signing bonuses per E(3), E(6)"
```

### Task 6: AAV at signing (A1–A5)

**Files:**
- Create: `utils/cbt/__tests__/aav.test.ts`
- Create: `utils/cbt/aav.ts`

- [ ] **Step 1: Write the failing test**

`utils/cbt/__tests__/aav.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { computeAav, selectDeemedBuyout } from '../aav';
import { classify } from '../classify';
import { deferralCosts, signingBonusCost } from '../deferral';
import type { ContractInput } from '../types';
import { build, guaranteed, Y1 } from './helpers';

function aavOf(input: ContractInput) {
  const classes = classify(input);
  return computeAav(input, classes, deferralCosts(input, classes), signingBonusCost(input, classes).cost);
}

describe('AAV at signing (A1–A5)', () => {
  it('A1 W1: 5 × 20 → 20', () => expect(aavOf(build(guaranteed(5, 20))).aav).toBeCloseTo(20, 9));

  it('A2 W2: signing bonus spread over Guaranteed Years', () => {
    const input = build([{ currentSalary: 30 }, { currentSalary: 30 }, { currentSalary: 20 }], { signingBonus: { amount: 6, payments: [] } });
    expect(aavOf(input).aav).toBeCloseTo(86 / 3, 9);
  });

  it('A3 W3: club option buyout is deemed Signing Bonus', () => {
    const r = aavOf(build([...guaranteed(4, 20), { currentSalary: 25, kind: 'club', buyout: 2 }]));
    expect(r.aav).toBeCloseTo(20.5, 9);
    expect(r.deemed).toMatchObject({ season: Y1 + 4, amount: 2, a5: false });
  });

  it('A3 W5: buyout of a non-guaranteed player option is deemed Signing Bonus', () => {
    expect(aavOf(build([...guaranteed(3, 20), { currentSalary: 10, kind: 'player', buyout: 6 }])).aav).toBeCloseTo(22, 9);
  });

  it('A3: buyout of a guaranteed player option is NOT a Signing Bonus', () => {
    expect(aavOf(build([...guaranteed(3, 20), { currentSalary: 12, kind: 'player', buyout: 5 }])).aav).toBeCloseTo(72 / 4, 9);
  });

  it('A4 W8: only the earliest option buyout counts', () => {
    const r = aavOf(build([...guaranteed(4, 20), { currentSalary: 25, kind: 'club', buyout: 2 }, { currentSalary: 26, kind: 'club', buyout: 3 }]));
    expect(r.aav).toBeCloseTo(20.5, 9);
    expect(r.deemed.rules).toEqual(['A3', 'A4']);
  });

  it('A5 W16: club + player buyouts → the higher one', () => {
    const r = aavOf(build([...guaranteed(4, 20), { currentSalary: 25, kind: 'club', buyout: 2 }, { currentSalary: 4, kind: 'player', buyout: 3 }]));
    expect(r.aav).toBeCloseTo(20.75, 9);
    expect(r.deemed).toMatchObject({ season: Y1 + 5, amount: 3, a5: true });
  });

  it('selectDeemedBuyout returns nothing when no option carries a buyout', () => {
    expect(selectDeemedBuyout(classify(build(guaranteed(2, 10)))).season).toBeNull();
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm exec vitest run utils/cbt/__tests__/aav.test.ts`
Expected: FAIL with `Error: Cannot find module '../aav'`.

- [ ] **Step 3: Implement `utils/cbt/aav.ts`**

```ts
// AAV at signing: A1–A7 (spec §2.3).
import type { RuleId } from './rules';
import type { DeferralResult } from './deferral';
import { sortedSeasons } from './classify';
import type { ContractInput, SeasonClass } from './types';

export interface DeemedBuyout {
  /** Season whose buyout is deemed a Signing Bonus, or null. */
  season: number | null;
  amount: number;
  /** True when A5 (higher of club + player buyouts) chose it. */
  a5: boolean;
  rules: RuleId[];
}

/** A3–A5: which option buyout, if any, is deemed a Signing Bonus. */
export function selectDeemedBuyout(classes: SeasonClass[]): DeemedBuyout {
  const candidates = classes.filter((c) => !c.isGuaranteed && c.buyout > 0);
  if (candidates.length === 0) return { season: null, amount: 0, a5: false, rules: [] };
  const hasClub = candidates.some((c) => c.effectiveKind === 'club');
  const hasPlayer = candidates.some((c) => c.effectiveKind === 'player');
  if (hasClub && hasPlayer) {
    // A5: the higher buyout; ties go to the earlier season.
    const pick = candidates.reduce((best, c) => (c.buyout > best.buyout ? c : best));
    return { season: pick.season, amount: pick.buyout, a5: true, rules: ['A3', 'A5'] };
  }
  // A4: earliest option year's buyout only.
  const pick = candidates[0]; // classes are season-sorted
  return { season: pick.season, amount: pick.buyout, a5: false, rules: candidates.length > 1 ? ['A3', 'A4'] : ['A3'] };
}

export interface AavResult {
  aav: number;
  guaranteedSeasons: number[];
  deemed: DeemedBuyout;
}

export function computeAav(
  input: ContractInput,
  classes: SeasonClass[],
  deferral: DeferralResult,
  bonusCost: number,
): AavResult {
  const rows = new Map(sortedSeasons(input).map((r) => [r.season, r]));
  const g = classes.filter((c) => c.isGuaranteed).map((c) => c.season);
  const deemed = selectDeemedBuyout(classes);
  if (g.length === 0) return { aav: 0, guaranteedSeasons: g, deemed };
  const base = g.reduce((s, season) => s + rows.get(season)!.currentSalary, 0);
  const deferred = g.reduce((s, season) => s + (deferral.costBySeason.get(season) ?? 0), 0);
  // A1: (Base Salary + Signing Bonus incl. deemed buyout + deferred cost) / Guaranteed Years.
  return { aav: (base + bonusCost + deemed.amount + deferred) / g.length, guaranteedSeasons: g, deemed };
}
```

- [ ] **Step 4: Run it to confirm it passes**

Run: `pnpm exec vitest run utils/cbt/__tests__/aav.test.ts && pnpm run typecheck:engine`
Expected: `Tests  8 passed (8)`; type-check exit 0.

- [ ] **Step 5: Commit**

```bash
git add utils/cbt/aav.ts utils/cbt/__tests__/aav.test.ts
git commit -m "refactor: compute AAV at signing with deemed option buyouts (E(2), E(5)(b))"
```

### Task 7: Valley Charge (V1–V6, V10, V11)

**Files:**
- Create: `utils/cbt/__tests__/valley.test.ts`
- Create: `utils/cbt/valley.ts`

- [ ] **Step 1: Write the failing test**

`utils/cbt/__tests__/valley.test.ts`:

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

  it('V10 W5: a non-guaranteed player option never triggers a Valley Charge', () => {
    expect(valleyOf(build([...guaranteed(3, 20), { currentSalary: 10, kind: 'player', buyout: 6 }])).firstSuch).toBeNull();
  });

  it('V11 W18: club buyout becomes Signing Bonus in the hypothetical; no Valley Charge', () => {
    const v = valleyOf(build([...guaranteed(3, 20), { currentSalary: 25, kind: 'club', buyout: 3 }], { optOuts: [{ afterSeason: Y1 + 1, payment: 0 }] }));
    expect(v.firstSuch).toBeNull();
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm exec vitest run utils/cbt/__tests__/valley.test.ts`
Expected: FAIL with `Error: Cannot find module '../valley'`.

- [ ] **Step 3: Implement `utils/cbt/valley.ts`**

```ts
// Valley Charge: V1–V6, V10, V11 (spec §2.7).
import { selectDeemedBuyout } from './aav';
import { sortedSeasons } from './classify';
import type { DeferralResult } from './deferral';
import type { ContractInput, SeasonClass } from './types';

export interface ValleyResult {
  /** First "such" Player Option Year (V6), or null when there is no Valley Charge. */
  firstSuch: number | null;
  figure: number;
  /** V4 shortfall per "such" Player Option Year. */
  shortfalls: Map<number, number>;
  /** V4 allocation per Guaranteed Year preceding the first such year. */
  allocation: Map<number, number>;
}

const NONE: ValleyResult = { firstSuch: null, figure: 0, shortfalls: new Map(), allocation: new Map() };

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

  for (let k = 0; k < po.length; k++) {
    const candidate = po[k];
    const later = new Set(po.slice(k).map((c) => c.season));
    // V3/V5/V11 hypothetical: the candidate and later Player Option Years are not Guaranteed.
    const hyp = classes.map((c) => (later.has(c.season) ? { ...c, isGuaranteed: false } : c));
    const hypG = hyp.filter((c) => c.isGuaranteed);
    const priorG = hypG.filter((c) => c.season < candidate.season);
    if (priorG.length === 0) continue;
    const signingBonus = bonusCost + selectDeemedBuyout(hyp).amount; // V11
    const hypAav =
      (hypG.reduce((s, c) => s + rows.get(c.season)!.currentSalary + cost(c.season), 0) + signingBonus) / hypG.length;
    // V2 with V5: Signing Bonus attributed over the Guaranteed Years before the candidate.
    const smallest = Math.min(
      ...priorG.map((c) => rows.get(c.season)!.currentSalary + signingBonus / priorG.length + cost(c.season)),
    );
    const figure = Math.max(0.8 * smallest, 0.75 * hypAav); // V3 floor
    if (!(value(candidate) < figure)) continue; // V6: not "such"; try the next option year

    const shortfalls = new Map<number, number>();
    for (const c of po.slice(k)) if (value(c) < figure) shortfalls.set(c.season, figure - value(c));
    const total = [...shortfalls.values()].reduce((s, v) => s + v, 0);
    const allocation = new Map(priorG.map((c) => [c.season, total / priorG.length] as [number, number]));
    return { firstSuch: candidate.season, figure, shortfalls, allocation };
  }
  return NONE;
}
```

- [ ] **Step 4: Run it to confirm it passes**

Run: `pnpm exec vitest run utils/cbt/__tests__/valley.test.ts && pnpm run typecheck:engine`
Expected: `Tests  5 passed (5)`; type-check exit 0.

- [ ] **Step 5: Commit**

```bash
git add utils/cbt/valley.ts utils/cbt/__tests__/valley.test.ts
git commit -m "refactor: compute the Valley Charge per E(5)(d)(ii)"
```

### Task 8: Article XVI funding (X1–X5)

**Files:**
- Create: `utils/cbt/__tests__/funding.test.ts`
- Create: `utils/cbt/funding.ts`

- [ ] **Step 1: Write the failing test**

`utils/cbt/__tests__/funding.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { computeFunding } from '../funding';

describe('Article XVI funding (X1, X2, X5)', () => {
  it('W10: 10 earned in 2024, paid 2030', () => {
    const f = computeFunding([{ season: 2024, year: 2030, cash: 10, cost: 0 }]);
    expect(f.snapshots.map((s) => s.july1)).toEqual([2026, 2027, 2028, 2029, 2030]);
    const req = f.snapshots.map((s) => s.required);
    expect(req[0]).toBeCloseTo(10 / 1.05 ** 4, 9);
    expect(req[1]).toBeCloseTo(10 / 1.05 ** 3, 9);
    expect(req[2]).toBeCloseTo(10 / 1.05 ** 2, 9);
    expect(req[3]).toBeCloseTo(10 / 1.05, 9);
    expect(req[4]).toBe(0);
    expect(f.peak).toBeCloseTo(10 / 1.05, 9);
  });

  it('X1 nothing is required before the second July 1', () => {
    const f = computeFunding([{ season: 2030, year: 2040, cash: 10, cost: 0 }]);
    expect(f.snapshots[0].july1).toBe(2032);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm exec vitest run utils/cbt/__tests__/funding.test.ts`
Expected: FAIL with `Error: Cannot find module '../funding'`.

- [ ] **Step 3: Implement `utils/cbt/funding.ts`**

```ts
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
  return { snapshots, peak: Math.max(...snapshots.map((s) => s.required)) };
}
```

- [ ] **Step 4: Run it to confirm it passes**

Run: `pnpm exec vitest run utils/cbt/__tests__/funding.test.ts && pnpm run typecheck:engine`
Expected: `Tests  2 passed (2)`; type-check exit 0.

- [ ] **Step 5: Commit**

```bash
git add utils/cbt/funding.ts utils/cbt/__tests__/funding.test.ts
git commit -m "refactor: compute Article XVI funding balances by July 1"
```

### Task 9: Validation (§5.3)

**Files:**
- Create: `utils/cbt/__tests__/validate.test.ts`
- Create: `utils/cbt/validate.ts`

- [ ] **Step 1: Write the failing test**

`utils/cbt/__tests__/validate.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { validate } from '../validate';
import { build, guaranteed, Y1 } from './helpers';

const errors = (input: ReturnType<typeof build>) => validate(input).filter((i) => i.severity === 'error');

describe('validate (§5.3)', () => {
  it('accepts a plain guaranteed contract', () => {
    expect(validate(build(guaranteed(3, 20)))).toEqual([]);
  });

  it('rejects non-consecutive seasons and negative amounts', () => {
    const input = build(guaranteed(2, 20));
    input.seasons[1].season = Y1 + 2;
    input.seasons[0].currentSalary = -1;
    expect(errors(input).map((e) => e.message)).toEqual(['Salary amounts cannot be negative.', 'Seasons must be consecutive.']);
  });

  it('requires at least one Guaranteed season', () => {
    expect(errors(build([{ currentSalary: 10, kind: 'club' }]))[0].message).toMatch(/Guaranteed season/);
  });

  it('F1: deferral payments must fall after the maximum term (option years included)', () => {
    const input = build([...guaranteed(2, 10), { currentSalary: 10, kind: 'club' }], {
      ilirPct: 4,
      deferral: { payments: [{ year: Y1 + 2, amount: 1 }], attribution: 'sequential', statedInterestPct: 0 },
    });
    expect(errors(input).some((e) => e.rule === 'F1')).toBe(true);
  });

  it('F1 scope: a signing-bonus installment inside a possible option year is rejected', () => {
    const input = build([...guaranteed(2, 10), { currentSalary: 10, kind: 'club' }], {
      signingBonus: { amount: 4, payments: [{ year: Y1, amount: 2 }, { year: Y1 + 2, amount: 2 }] },
    });
    expect(errors(input).some((e) => e.rule === 'F1')).toBe(true);
  });

  it('D2: ILIR required when there is deferred compensation', () => {
    const input = build([{ currentSalary: 5, deferred: 5 }], { deferral: { payments: [{ year: 2030, amount: 5 }], attribution: 'sequential', statedInterestPct: 0 } });
    expect(errors(input).some((e) => e.rule === 'D2')).toBe(true);
  });

  it('F7: warns when sequential payments do not match the deferred principal', () => {
    const input = build([{ currentSalary: 5, deferred: 5 }], {
      ilirPct: 4,
      deferral: { payments: [{ year: 2030, amount: 4 }], attribution: 'sequential', statedInterestPct: 0 },
    });
    expect(validate(input)).toEqual([expect.objectContaining({ severity: 'warning', rule: 'F7' })]);
  });

  it('F4b: unattributed mode requires the total principal', () => {
    const input = build(guaranteed(2, 5), { ilirPct: 4, deferral: { payments: [{ year: 2030, amount: 4 }], attribution: 'unattributed', statedInterestPct: 0 } });
    expect(errors(input).some((e) => e.rule === 'F4b')).toBe(true);
  });

  it('Y3: an opt-out must be followed by at least one season', () => {
    expect(errors(build(guaranteed(2, 20), { optOuts: [{ afterSeason: Y1 + 1, payment: 0 }] })).some((e) => e.rule === 'Y3')).toBe(true);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm exec vitest run utils/cbt/__tests__/validate.test.ts`
Expected: FAIL with `Error: Cannot find module '../validate'`.

- [ ] **Step 3: Implement `utils/cbt/validate.ts`**

```ts
// Input validation (spec §5.3). Errors block calculate(); warnings are shown alongside results.
import { classify, sortedSeasons } from './classify';
import { deferralCosts } from './deferral';
import type { RuleId } from './rules';
import type { ContractInput } from './types';

export interface ValidationIssue {
  severity: 'error' | 'warning';
  field: string;
  message: string;
  rule?: RuleId;
}

const OPTION_KINDS = new Set(['club', 'mutual', 'vesting', 'player', 'dual']);

export function validate(input: ContractInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const err = (field: string, message: string, rule?: RuleId) => issues.push({ severity: 'error', field, message, rule });
  const rows = sortedSeasons(input);

  if (rows.length === 0) {
    err('seasons', 'Add at least one season.');
    return issues;
  }
  rows.forEach((r, i) => {
    if (i > 0 && r.season !== rows[i - 1].season + 1) err(`seasons.${r.season}`, 'Seasons must be consecutive.');
    if (r.currentSalary < 0 || r.deferred < 0) err(`seasons.${r.season}`, 'Salary amounts cannot be negative.');
    if ((r.buyout ?? 0) > 0 && !OPTION_KINDS.has(r.kind)) err(`seasons.${r.season}.buyout`, 'Only option years can have a buyout.');
    if (r.guaranteedIfExercised !== undefined && r.kind !== 'player' && r.kind !== 'dual')
      err(`seasons.${r.season}.guaranteedIfExercised`, 'Only player or dual option years use this setting.', 'Y2');
  });

  const first = rows[0].season;
  const last = rows[rows.length - 1].season; // last season of the maximum term
  for (const o of input.optOuts) {
    if (o.afterSeason < first || o.afterSeason >= last) err('optOuts', `Opt-out after ${o.afterSeason} must be followed by at least one season.`, 'Y3');
    if (o.payment < 0) err('optOuts', 'Opt-out payment cannot be negative.', 'Y3');
  }

  const classes = classify(input);
  const g = classes.filter((c) => c.isGuaranteed).map((c) => c.season);
  if (g.length === 0) err('seasons', 'At least one Guaranteed season is required.');
  const lastG = g.length ? Math.max(...g) : last;

  const hasDeferral = input.deferral.payments.length > 0 || rows.some((r) => r.deferred > 0);
  for (const p of input.deferral.payments) {
    if (p.year <= last) err('deferral.payments', `Deferred payment in ${p.year} must fall after ${last}, the last season of the maximum term.`, 'F1');
  }
  const bonusPayments = input.signingBonus.payments;
  if (bonusPayments.length > 0) {
    const sum = bonusPayments.reduce((s, p) => s + p.amount, 0);
    if (Math.abs(sum - input.signingBonus.amount) > 0.5) err('signingBonus', 'Signing-bonus payments must add up to the bonus.', 'A2');
    for (const p of bonusPayments) {
      if (p.year > lastG && p.year <= last)
        err('signingBonus', `Signing-bonus installment in ${p.year} falls inside a possible option year; not supported.`, 'F1');
    }
  }
  const hasA7 = bonusPayments.some((p) => p.year > last);
  if ((hasDeferral || hasA7) && !(input.ilirPct > 0 && input.ilirPct <= 25)) err('ilirPct', 'Enter the Imputed Loan Interest Rate (0–25%).', 'D2');
  if (input.deferral.statedInterestPct < 0) err('deferral.statedInterestPct', 'Stated interest cannot be negative.', 'F3');

  if (input.deferral.attribution === 'unattributed') {
    if (input.deferral.payments.length > 0 && !((input.deferral.unattributedPrincipal ?? 0) > 0))
      err('deferral.unattributedPrincipal', 'Enter the total deferred principal.', 'F4b');
  } else if (input.deferral.payments.length > 0) {
    const d = deferralCosts(input, classes);
    if (d.unpaidPrincipal > 0.5 || d.excessCash > 0.5)
      issues.push({
        severity: 'warning',
        field: 'deferral.payments',
        message: `Payments don't match the deferred principal (unpaid principal ${Math.round(d.unpaidPrincipal)}, excess cash ${Math.round(d.excessCash)}).`,
        rule: 'F7',
      });
  }
  return issues;
}
```

- [ ] **Step 4: Run it to confirm it passes**

Run: `pnpm exec vitest run utils/cbt/__tests__/validate.test.ts && pnpm run typecheck:engine`
Expected: `Tests  9 passed (9)`; type-check exit 0.

- [ ] **Step 5: Commit**

```bash
git add utils/cbt/validate.ts utils/cbt/__tests__/validate.test.ts
git commit -m "refactor: validate CBT engine inputs"
```

### Task 10: Scenario outcomes and `calculate()` (O1–O8, V7–V9, B1, END)

**Files:**
- Create: `utils/cbt/__tests__/run.ts`
- Create: `utils/cbt/__tests__/worked-examples.test.ts`
- Create: `utils/cbt/outcome.ts`
- Create: `utils/cbt/index.ts`

- [ ] **Step 1: Create the scenario helper**

`utils/cbt/__tests__/run.ts`:

```ts
// Scenario helpers for tests that need the full engine (added with index.ts).
import { calculate, defaultScenario, type ContractInput, type Result, type Scenario } from '..';
import { Y1 } from './helpers';

export function run(input: ContractInput, overrides: Partial<Scenario> = {}): Result {
  const base = defaultScenario(input);
  return calculate(input, { ...base, ...overrides, options: { ...base.options, ...overrides.options } });
}

/** CBT charged in contract year `n` (1-based). */
export const yr = (res: Result, n: number) => res.perSeason.find((p) => p.season === Y1 + n - 1)?.cbt ?? 0;
```

- [ ] **Step 2: Write the failing worked-example tests (spec §8 W1–W13, W16–W18)**

`utils/cbt/__tests__/worked-examples.test.ts`:

```ts
// Spec §8 worked examples W1–W13, W16–W18 ($M; yr 1 = 2026). W14/W15 are in presets.test.ts.
import { describe, expect, it } from 'vitest';
import { build, guaranteed, Y1 } from './helpers';
import { run, yr } from './run';

const close = (actual: number, expected: number) => expect(actual).toBeCloseTo(expected, 6);

describe('worked examples', () => {
  it('W1 A1: 5 × 20 guaranteed', () => {
    const r = run(build(guaranteed(5, 20)));
    close(r.aavAtSigning, 20);
    close(r.totals.cbt, 100);
    close(r.totals.cash, 100);
  });

  it('W2 A1/A2: front-loaded 30, 30, 20 + 6 signing bonus', () => {
    const r = run(build([{ currentSalary: 30 }, { currentSalary: 30 }, { currentSalary: 20 }], { signingBonus: { amount: 6, payments: [] } }));
    close(r.aavAtSigning, 86 / 3);
  });

  describe('W3 A3/O1/O2/O3: club option 25, buyout 2', () => {
    const input = build([...guaranteed(4, 20), { currentSalary: 25, kind: 'club', buyout: 2 }]);
    it('AAV includes the buyout', () => close(run(input).aavAtSigning, 20.5));
    it('exercised: yr 5 = 25 − 2', () => {
      const r = run(input, { options: { [Y1 + 4]: 'exercised' } });
      close(yr(r, 5), 23);
      close(r.totals.cbt, 105);
      close(r.totals.cash, 105);
    });
    it('declined: nothing in yr 5', () => {
      const r = run(input, { options: { [Y1 + 4]: 'declined' } });
      close(yr(r, 5), 0);
      close(r.totals.cbt, 82);
      close(r.totals.cash, 82);
    });
  });

  describe('W4 V4/V7/O7/V8: guaranteed player option 12', () => {
    const input = build([...guaranteed(3, 20), { currentSalary: 12, kind: 'player' }]);
    it('AAV 18; Valley 4 → 19.3333 in yrs 1–3', () => {
      const r = run(input);
      close(r.aavAtSigning, 18);
      close(yr(r, 1), 18 + 4 / 3);
    });
    it('exercised: yr 4 = 18 − 4; total = cash', () => {
      const r = run(input);
      close(yr(r, 4), 14);
      close(r.totals.cbt, 72);
    });
    it('declined: +6 true-up in yr 4; total 64 vs cash 60', () => {
      const r = run(input, { options: { [Y1 + 3]: 'declined' } });
      close(yr(r, 4), 6);
      close(r.totals.cbt, 64);
      close(r.totals.cash, 60);
    });
  });

  describe('W5 A3/O6/O3/V10: non-guaranteed player option 10, buyout 6', () => {
    const input = build([...guaranteed(3, 20), { currentSalary: 10, kind: 'player', buyout: 6 }]);
    it('AAV 22, no Valley Charge', () => {
      const r = run(input);
      close(r.aavAtSigning, 22);
      close(yr(r, 1), 22);
    });
    it('exercised: yr 4 = 10 − 6 (O6, no O2)', () => {
      const r = run(input);
      close(yr(r, 4), 4);
      close(r.totals.cbt, 70);
    });
    it('declined: total 66 = cash', () => {
      const r = run(input, { options: { [Y1 + 3]: 'declined' } });
      close(r.totals.cbt, 66);
      close(r.totals.cash, 66);
    });
  });

  describe('W6 Y3/O6: failing opt-out (payment 25)', () => {
    const input = build(guaranteed(5, 20), { optOuts: [{ afterSeason: Y1 + 2, payment: 25 }] });
    it('AAV 28.3333', () => close(run(input).aavAtSigning, 85 / 3));
    it('stays: yrs 4–5 = 7.5 each; total 100 = cash', () => {
      const r = run(input);
      close(yr(r, 4), 7.5);
      close(yr(r, 5), 7.5);
      close(r.totals.cbt, 100);
      close(r.totals.cash, 100);
    });
    it('opts out: total 85 = cash', () => {
      const r = run(input, { optOutTakenAfter: Y1 + 2 });
      close(r.totals.cbt, 85);
      close(r.totals.cash, 85);
    });
  });

  describe('W8 A4/O4: club options with buyouts 2 and 3', () => {
    const input = build([...guaranteed(4, 20), { currentSalary: 25, kind: 'club', buyout: 2 }, { currentSalary: 26, kind: 'club', buyout: 3 }]);
    it('only the earliest buyout enters the AAV', () => close(run(input).aavAtSigning, 20.5));
    it('yr 5 exercised, yr 6 declined: yr 6 = 3 (O4); total 108', () => {
      const r = run(input, { options: { [Y1 + 4]: 'exercised', [Y1 + 5]: 'declined' } });
      close(yr(r, 5), 23);
      close(yr(r, 6), 3);
      close(r.totals.cbt, 108);
      close(r.totals.cash, 108);
    });
    it('yr 5 declined ends the contract: total 82', () => {
      const r = run(input, { options: { [Y1 + 4]: 'declined' } });
      close(r.totals.cbt, 82);
      close(r.totals.cash, 82);
    });
  });

  it('W9 B1: 0.5 earned in yr 2', () => {
    const r = run(build(guaranteed(5, 20)), { earnedBonuses: { [Y1 + 1]: 0.5 } });
    close(r.aavAtSigning, 20);
    close(yr(r, 2), 20.5);
  });

  describe('Bellinger shape (W11–W13): 32.5, 32.5, 25.8, 25.8, 25.9; bonus 20; opt-outs after yrs 2 and 3', () => {
    const input = build([32.5, 32.5, 25.8, 25.8, 25.9].map((c) => ({ currentSalary: c })), {
      signingBonus: { amount: 20, payments: [] },
      optOuts: [
        { afterSeason: Y1 + 1, payment: 0 },
        { afterSeason: Y1 + 2, payment: 0 },
      ],
    });
    it('W12 no opt-out: 44.75, 44.75, then 24.3333 × 3; total 162.5', () => {
      const r = run(input);
      close(yr(r, 1), 44.75);
      close(yr(r, 2), 44.75);
      for (const n of [3, 4, 5]) close(yr(r, n), 32.5 - 24.5 / 3);
      close(r.totals.cbt, 162.5);
    });
    it('W11 opt-out after yr 2: true-up 20 over yrs 3–5; total 109.5 vs cash 85', () => {
      const r = run(input, { optOutTakenAfter: Y1 + 1 });
      for (const n of [3, 4, 5]) close(yr(r, n), 20 / 3);
      close(r.totals.cbt, 109.5);
      close(r.totals.cash, 85);
      expect(r.flags.map((f) => f.rule)).toContain('V8');
    });
    it('W13 opt-out after yr 3: yr 3 = 24.3; true-up 13.3 over yrs 4–5; total 127.1', () => {
      const r = run(input, { optOutTakenAfter: Y1 + 2 });
      close(yr(r, 3), 24.3);
      close(yr(r, 4), 6.65);
      close(r.totals.cbt, 127.1);
      close(r.totals.cash, 110.8);
      expect(r.flags.map((f) => f.rule)).toContain('V9');
    });
  });

  describe('W16 A5/O2/O4b/O6: club option yr 5 buyout 2 + non-guaranteed player option yr 6 buyout 3', () => {
    const input = build([...guaranteed(4, 20), { currentSalary: 25, kind: 'club', buyout: 2 }, { currentSalary: 4, kind: 'player', buyout: 3 }]);
    it('higher buyout is the Signing Bonus; A5 flagged', () => {
      const r = run(input);
      close(r.aavAtSigning, 20.75);
      expect(r.flags.map((f) => f.rule)).toContain('A5');
    });
    it('yr 5 + yr 6 exercised: 109 = cash', () => {
      const r = run(input, { options: { [Y1 + 4]: 'exercised', [Y1 + 5]: 'exercised' } });
      close(yr(r, 5), 25);
      close(yr(r, 6), 1);
      close(r.totals.cbt, 109);
      close(r.totals.cash, 109);
    });
    it('yr 5 exercised, yr 6 declined: 108 = cash', () => {
      const r = run(input, { options: { [Y1 + 4]: 'exercised', [Y1 + 5]: 'declined' } });
      close(yr(r, 6), 0);
      close(r.totals.cbt, 108);
      close(r.totals.cash, 108);
    });
    it('yr 5 declined: +2 (O4b) in yr 5, −3 (O2) in yr 6; 82 = cash', () => {
      const r = run(input, { options: { [Y1 + 4]: 'declined' } });
      close(yr(r, 5), 2);
      close(yr(r, 6), -3);
      close(r.totals.cbt, 82);
      close(r.totals.cash, 82);
    });
  });

  describe('W17 V6/V7: player options 18 (yr 3) and 10 (yr 4)', () => {
    const input = build([...guaranteed(2, 20), { currentSalary: 18, kind: 'player' }, { currentSalary: 10, kind: 'player' }]);
    it('both exercised: yrs 1–3 = 18.5, yr 4 = 12.5', () => {
      const r = run(input);
      close(r.aavAtSigning, 17);
      for (const n of [1, 2, 3]) close(yr(r, n), 18.5);
      close(yr(r, 4), 12.5);
      close(r.totals.cbt, 68);
    });
    it('yr 3 declined: yr 3 = 1.5 + 3, yr 4 = 3; total 44.5 vs cash 40', () => {
      const r = run(input, { options: { [Y1 + 2]: 'declined' } });
      close(yr(r, 3), 4.5);
      close(yr(r, 4), 3);
      close(r.totals.cbt, 44.5);
      close(r.totals.cash, 40);
    });
  });

  describe('W18 O2NS: opt-out after yr 2, then club option yr 4 (buyout 3)', () => {
    const input = build([...guaranteed(3, 20), { currentSalary: 25, kind: 'club', buyout: 3 }], { optOuts: [{ afterSeason: Y1 + 1, payment: 0 }] });
    it('AAV 21, no Valley Charge', () => {
      const r = run(input);
      close(r.aavAtSigning, 21);
      close(yr(r, 1), 21);
    });
    it('opt-out taken: yr 3 = −2 (O7), no O2 in yr 4; 40 = cash', () => {
      const r = run(input, { optOutTakenAfter: Y1 + 1 });
      close(yr(r, 3), -2);
      close(yr(r, 4), 0);
      close(r.totals.cbt, 40);
      close(r.totals.cash, 40);
    });
    it('stays, option declined: 63 = cash', () => {
      const r = run(input);
      close(r.totals.cbt, 63);
      close(r.totals.cash, 63);
    });
    it('stays, option exercised: yr 4 = 22; 85 = cash', () => {
      const r = run(input, { options: { [Y1 + 3]: 'exercised' } });
      close(yr(r, 4), 22);
      close(r.totals.cbt, 85);
      close(r.totals.cash, 85);
    });
  });

  it('O5 vested option is charged like an exercised club option', () => {
    const r = run(build([...guaranteed(2, 20), { currentSalary: 15, kind: 'vesting', buyout: 1 }]), { options: { [Y1 + 2]: 'exercised' } });
    close(yr(r, 3), 14);
    expect(r.flags.map((f) => f.rule)).toContain('O5');
  });
});
```

- [ ] **Step 3: Run them to confirm they fail**

Run: `pnpm exec vitest run utils/cbt/__tests__/worked-examples.test.ts`
Expected: FAIL. `index.ts` doesn't exist yet, so the error is `Cannot find module` for the `'..'` import in `run.ts`.

- [ ] **Step 4: Implement `utils/cbt/outcome.ts`**

```ts
// Scenario outcomes: O1–O8, V7–V9, B1, END (spec §2.5–§2.7).
import type { AavResult } from './aav';
import { isOptionRow, sortedSeasons } from './classify';
import type { BonusResult, DeferralResult } from './deferral';
import type { RuleId } from './rules';
import type { ContractInput, Charge, Scenario, SeasonClass } from './types';
import type { ValleyResult } from './valley';

export interface OutcomeResult {
  charges: Charge[];
  played: SeasonClass[];
  voided: SeasonClass[];
  /** The buyout or opt-out payment actually paid when the contract ended, and the season it belongs to. */
  received: { season: number; amount: number } | null;
}

/** UI and engine defaults (spec §6): club-type declined, player-type exercised, no opt-out. */
export function decisionFor(scenario: Scenario, c: SeasonClass): 'exercised' | 'declined' {
  return scenario.options[c.season] ?? (c.effectiveKind === 'club' ? 'declined' : 'exercised');
}

export function computeOutcome(
  input: ContractInput,
  scenario: Scenario,
  classes: SeasonClass[],
  deferral: DeferralResult,
  bonus: BonusResult,
  aav: AavResult,
  valley: ValleyResult,
): OutcomeResult {
  const rows = new Map(sortedSeasons(input).map((r) => [r.season, r]));
  const cost = (season: number) => deferral.costBySeason.get(season) ?? 0;
  const charges: Charge[] = [];
  const add = (season: number, amount: number, label: string, rules: RuleId[]) =>
    charges.push({ season, amount, label, rules });

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
    add(c.season, aav.aav, 'AAV', ['A1', 'A2', ...aav.deemed.rules]);
    if (valley.shortfalls.has(c.season)) add(c.season, -credit, 'Valley Charge credit', ['V7']);
  }

  // V4: Valley Charge allocations stay charged even if the season is later nullified (V6).
  for (const [season, amount] of valley.allocation) add(season, amount, 'Valley Charge', ['V4', 'V5', 'V6']);

  // Club-type option exercised or vested (O1, O5) less the buyout previously included (O2).
  for (const c of played.filter((c) => c.effectiveKind === 'club')) {
    const vesting = rows.get(c.season)!.kind === 'vesting';
    add(c.season, rows.get(c.season)!.currentSalary + cost(c.season), vesting ? 'Vested option' : 'Exercised option', vesting ? ['O1', 'O5'] : ['O1']);
    if (included(c.season) > 0) add(c.season, -included(c.season), 'Buyout not received', ['O2']);
  }

  // Non-guaranteed Player Option Years exercised (O6): AAV of their salaries less prorated attributed buyout.
  const ngPlayer = played.filter((c) => c.effectiveKind === 'player' && !c.isGuaranteed);
  if (ngPlayer.length > 0) {
    const avg = ngPlayer.reduce((s, c) => s + rows.get(c.season)!.currentSalary + cost(c.season), 0) / ngPlayer.length;
    const buyoutShare = ngPlayer.reduce((s, c) => s + included(c.season), 0) / ngPlayer.length;
    for (const c of ngPlayer) add(c.season, avg - buyoutShare, 'Exercised player option', buyoutShare > 0 ? ['O6', 'O2NS'] : ['O6']);
  }

  // B1: earned bonuses in the season earned (played seasons only).
  for (const c of played) {
    const b = scenario.earnedBonuses[c.season] ?? 0;
    if (b !== 0) add(c.season, b, 'Earned bonus', ['B1']);
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
    const paid =
      played.reduce((s, c) => s + rows.get(c.season)!.currentSalary + cost(c.season) + (scenario.earnedBonuses[c.season] ?? 0), 0) +
      bonus.cost +
      (received?.amount ?? 0); // O8: deferrals and A7 bonus at attributed cost
    const attributed = charges
      .filter((ch) => playedSet.has(ch.season) && !ch.rules.includes('V4') && !ch.rules.includes('V7'))
      .reduce((s, ch) => s + ch.amount, 0);
    const per = (paid - attributed) / nullified.length;
    const rules: RuleId[] = ['O7', 'O8'];
    if (credit !== 0) rules.push('V9');
    if (valley.allocation.size > 0) rules.push('V8');
    for (const c of nullified) add(c.season, per, 'Opt-out true-up', rules);
  } else if (received) {
    // O3: the received buyout was already charged as the deemed Signing Bonus; otherwise O4.
    if (aav.deemed.season !== received.season) {
      add(received.season, received.amount, 'Buyout paid', aav.deemed.a5 ? ['O4', 'O4b'] : ['O4']);
    }
  }

  // O2: a deemed buyout never received (contract ended first) is deducted in its option year,
  // unless an O7 true-up already netted it (O2NS).
  for (const c of voided) {
    const inc = included(c.season);
    if (inc > 0 && received?.season !== c.season && nullified.length === 0) add(c.season, -inc, 'Buyout not received', ['O2']);
  }

  return { charges, played, voided, received };
}
```

- [ ] **Step 5: Implement `utils/cbt/index.ts`**

```ts
// CBT contract engine entry point. Spec: docs/superpowers/specs/2026-11-04-cbt-contract-engine-design.md
import { computeAav } from './aav';
import { classify, isOptionRow, sortedSeasons } from './classify';
import { deferralCosts, signingBonusCost } from './deferral';
import { computeFunding } from './funding';
import { computeOutcome } from './outcome';
import { RULES, type RuleId } from './rules';
import type { ContractInput, Flag, Result, Scenario } from './types';
import { computeValley } from './valley';

export * from './types';
export { RULES } from './rules';
export type { RuleId, Tag } from './rules';
export { validate } from './validate';
export type { ValidationIssue } from './validate';

/** Spec §6 defaults: club-type options declined, player-type exercised, no opt-out, no bonuses. */
export function defaultScenario(input: ContractInput): Scenario {
  const options: Scenario['options'] = {};
  for (const c of classify(input)) if (isOptionRow(c)) options[c.season] = c.effectiveKind === 'club' ? 'declined' : 'exercised';
  return { options, optOutTakenAfter: null, earnedBonuses: {} };
}

/** Assumes `validate(input)` returned no errors. */
export function calculate(input: ContractInput, scenario: Scenario): Result {
  const classes = classify(input);
  const deferral = deferralCosts(input, classes);
  const bonus = signingBonusCost(input, classes);
  const aav = computeAav(input, classes, deferral, bonus.cost);
  const valley = computeValley(input, classes, deferral, bonus.cost);
  const outcome = computeOutcome(input, scenario, classes, deferral, bonus, aav, valley);

  const playedSet = new Set(outcome.played.map((c) => c.season));
  const rows = sortedSeasons(input);
  const deferralPieces = deferral.pieces.filter((p) => playedSet.has(p.season));
  const deferredRules: RuleId[] = ['F2', 'F3', input.deferral.attribution === 'sequential' ? 'F4a' : 'F4b', 'F5', 'F7'];
  if (deferralPieces.length > 0) for (const ch of outcome.charges) if (ch.rules.includes('A1')) ch.rules.push(...deferredRules);
  if (bonus.deferredPieces.length > 0) for (const ch of outcome.charges) if (ch.rules.includes('A1')) ch.rules.push('A7');

  // Cash by calendar year (nominal) and attributed cost.
  const cash = new Map<number, number>();
  const addCash = (year: number, v: number) => cash.set(year, (cash.get(year) ?? 0) + v);
  for (const c of outcome.played) addCash(c.season, rows.find((r) => r.season === c.season)!.currentSalary + (scenario.earnedBonuses[c.season] ?? 0));
  const bonusPayments = input.signingBonus.payments.length > 0 ? input.signingBonus.payments : [{ year: rows[0].season, amount: input.signingBonus.amount }];
  for (const p of bonusPayments) addCash(p.year, p.amount);
  for (const p of deferralPieces) addCash(p.year, p.cash);
  if (outcome.received) addCash(outcome.received.season, outcome.received.amount);

  const cbt = new Map<number, number>();
  for (const ch of outcome.charges) cbt.set(ch.season, (cbt.get(ch.season) ?? 0) + ch.amount);
  const years = [...new Set([...cash.keys(), ...cbt.keys()])].sort((a, b) => a - b);
  const perSeason = years.map((season) => ({ season, cbt: cbt.get(season) ?? 0, cash: cash.get(season) ?? 0 }));

  const attributedCost =
    outcome.played.reduce(
      (s, c) => s + rows.find((r) => r.season === c.season)!.currentSalary + (scenario.earnedBonuses[c.season] ?? 0),
      0,
    ) +
    bonus.cost +
    deferralPieces.reduce((s, p) => s + p.cost, 0) +
    (outcome.received?.amount ?? 0);

  // Flags: every non-[TEXT] rule behind a non-zero charge, plus the V8 callout (spec §6).
  const flags: Flag[] = [];
  const seen = new Set<RuleId>();
  for (const ch of outcome.charges) {
    if (Math.abs(ch.amount) < 1e-9) continue;
    for (const r of ch.rules) {
      const flagged = RULES[r].tag !== 'TEXT' || r === 'V8';
      if (flagged && !seen.has(r)) {
        seen.add(r);
        flags.push({ rule: r, message: RULES[r].summary });
      }
    }
  }

  return {
    classification: classes,
    aavAtSigning: aav.aav,
    charges: outcome.charges,
    perSeason,
    totals: {
      cbt: outcome.charges.reduce((s, ch) => s + ch.amount, 0),
      cash: [...cash.values()].reduce((s, v) => s + v, 0),
      attributedCost,
    },
    funding: computeFunding([...deferralPieces, ...bonus.deferredPieces]),
    flags,
  };
}
```

- [ ] **Step 6: Run them to confirm they pass**

Run: `pnpm exec vitest run utils/cbt/__tests__/worked-examples.test.ts && pnpm run typecheck:engine`
Expected: `Tests  32 passed (32)`; type-check exit 0.

- [ ] **Step 7: Commit**

```bash
git add utils/cbt/outcome.ts utils/cbt/index.ts utils/cbt/__tests__/run.ts utils/cbt/__tests__/worked-examples.test.ts
git commit -m "refactor: resolve scenario outcomes and add calculate() entry point"
```

### Task 11: Real-contract presets (spec §7; W14, W15)

**Files:**
- Create: `utils/cbt/__tests__/presets.test.ts`
- Create: `data/presets.ts`

- [ ] **Step 1: Write the failing test**

`utils/cbt/__tests__/presets.test.ts`:

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
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm exec vitest run utils/cbt/__tests__/presets.test.ts`
Expected: FAIL with `Cannot find module '../../../data/presets'`.

- [ ] **Step 3: Create `data/presets.ts`**

Every term and rate in this file comes from the sources listed in it, and spec §7 records where each was checked. Don't change any number without a new source.

```ts
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
  },
];
```

- [ ] **Step 4: Run it to confirm it passes**

Run: `pnpm exec vitest run utils/cbt/__tests__/presets.test.ts && pnpm run typecheck:engine`
Expected: `Tests  11 passed (11)`; type-check exit 0.

- [ ] **Step 5: Commit**

```bash
git add data/presets.ts utils/cbt/__tests__/presets.test.ts
git commit -m "refactor: add sourced Ohtani, Scherzer, Bellinger and Standard presets"
```

### Task 12: Invariant tests (spec §8)

**Files:**
- Create: `utils/cbt/__tests__/invariants.test.ts`

- [ ] **Step 1: Write the test**

`utils/cbt/__tests__/invariants.test.ts`:

```ts
// Spec §8 invariants on generated contracts (seeded, deterministic; no extra dependency).
import { describe, expect, it } from 'vitest';
import { calculate, defaultScenario, validate, type ContractInput, type Scenario } from '..';
import { classify, isOptionRow } from '../classify';
import { build, Y1 } from './helpers';

function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32);
}

/** Guaranteed years, then club options and non-guaranteed player options (no Valley Charge, V10). */
function noValleyContract(rand: () => number): ContractInput {
  const n = 2 + Math.floor(rand() * 4);
  const rows = Array.from({ length: n }, () => ({ currentSalary: Math.round(5 + rand() * 30), deferred: rand() < 0.3 ? Math.round(rand() * 10) : 0 }));
  const opts = Array.from({ length: Math.floor(rand() * 3) }, () => {
    const salary = Math.round(5 + rand() * 30);
    return rand() < 0.5
      ? { currentSalary: salary, kind: 'club' as const, buyout: Math.round(rand() * 5) }
      : { currentSalary: salary, kind: 'player' as const, buyout: Math.round(salary * 0.5) + 1 }; // > 50% → not guaranteed
  });
  const deferredTotal = rows.reduce((s, r) => s + r.deferred, 0);
  const last = Y1 + n + opts.length - 1;
  return build([...rows, ...opts], {
    ilirPct: 1 + rand() * 5,
    signingBonus: { amount: Math.round(rand() * 10), payments: [] },
    deferral: { payments: deferredTotal > 0 ? [{ year: last + 3, amount: deferredTotal }] : [], attribution: 'sequential', statedInterestPct: 0 },
  });
}

/** Every combination of option decisions. */
function scenarios(input: ContractInput): Scenario[] {
  const optionSeasons = classify(input).filter(isOptionRow).map((c) => c.season);
  return Array.from({ length: 2 ** optionSeasons.length }, (_, mask) => ({
    ...defaultScenario(input),
    options: Object.fromEntries(optionSeasons.map((s, i) => [s, mask & (1 << i) ? 'exercised' : 'declined'])),
  }));
}

describe('invariants', () => {
  it('without a Valley Charge, total CBT equals total attributed cost in every scenario', () => {
    const rand = rng(20261104);
    for (let i = 0; i < 300; i++) {
      const input = noValleyContract(rand);
      expect(validate(input).filter((v) => v.severity === 'error')).toEqual([]);
      for (const sc of scenarios(input)) {
        const r = calculate(input, sc);
        expect(r.totals.cbt).toBeCloseTo(r.totals.attributedCost, 6);
      }
    }
  });

  it('with a Valley Charge: zero difference if the player stays (V7), the full Valley amount if he opts out (V8)', () => {
    const rand = rng(42);
    for (let i = 0; i < 200; i++) {
      const pre = 1 + Math.floor(rand() * 3);
      const post = 1 + Math.floor(rand() * 3);
      const high = 20 + rand() * 20;
      const rows = [
        ...Array.from({ length: pre }, () => ({ currentSalary: high })),
        ...Array.from({ length: post }, () => ({ currentSalary: high * (0.3 + rand() * 0.4) })),
      ];
      const input = build(rows, { signingBonus: { amount: Math.round(rand() * 20), payments: [] }, optOuts: [{ afterSeason: Y1 + pre - 1, payment: 0 }] });
      const stays = calculate(input, defaultScenario(input));
      expect(stays.totals.cbt).toBeCloseTo(stays.totals.attributedCost, 6);
      const leaves = calculate(input, { ...defaultScenario(input), optOutTakenAfter: Y1 + pre - 1 });
      const valley = leaves.charges.filter((c) => c.rules.includes('V4')).reduce((s, c) => s + c.amount, 0);
      expect(valley).toBeGreaterThan(0);
      expect(leaves.totals.cbt - leaves.totals.attributedCost).toBeCloseTo(valley, 6);
    }
  });
});
```

- [ ] **Step 2: Run it**

Run: `pnpm exec vitest run utils/cbt/__tests__/invariants.test.ts`
Expected: `Tests  2 passed (2)`. This test exercises code that already exists, so it should pass on the first run. If it fails, the failing seed gives a concrete counterexample: debug the engine, not the test.

- [ ] **Step 3: Commit**

```bash
git add utils/cbt/__tests__/invariants.test.ts
git commit -m "test: add CBT engine invariant tests"
```

### Task 13: Full verification, docs, PR

**Files:**
- Modify: `CLAUDE.md` (Key Files section)

- [ ] **Step 1: Run everything**

Run: `pnpm test && pnpm run typecheck:engine && pnpm run build`
Expected: `Test Files  10 passed (10)`, `Tests  87 passed (87)`; type-check exit 0; build prints `✓ built in`.

- [ ] **Step 2: Document the engine in CLAUDE.md**

In `CLAUDE.md` under `### Key Files`, add after the `utils/calculations.ts` bullet:

```markdown
- `utils/cbt/` — CBT contract engine (pure functions, not yet used by the UI). Implements every rule in `docs/superpowers/specs/2026-11-04-cbt-contract-engine-design.md`. `rules.ts` maps each rule id to its CBA citation and evidence tag. `calculate(input, scenario)` in `index.ts` is the entry point. Tests are in `utils/cbt/__tests__/` (worked examples W1–W18, presets, invariants). Strict type-check: `pnpm run typecheck:engine`.
- `data/presets.ts` — Real-contract presets with sources and reported CBT figures.
```

- [ ] **Step 3: Commit, push, open the PR**

```bash
git add CLAUDE.md
git commit -m "docs: document the CBT engine in CLAUDE.md"
git push -u origin refactor/cbt-engine
gh pr create --title "refactor: add CBT contract engine (not yet wired to the UI)" --body "Implements spec docs/superpowers/specs/2026-11-04-cbt-contract-engine-design.md as a pure engine in utils/cbt/ with 87 tests (worked examples W1–W18, sourced presets, invariants) and a strict engine type-check in CI. Reproduces Ohtani \$46.08M, Bellinger \$44.75M, and Scherzer within \$648. No UI change; Plan B wires it in."
```

Expected: CI `test` job (type-check + tests) green. Merge after checks and review.
