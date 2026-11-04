# CBT Contract Engine — Design Spec (Spec 1 of 2)

**Date:** 2026-11-04
**Status:** Draft — awaiting user review
**Scope:** Generalize the calculator from "deferred money only" to any MLB Uniform Player's Contract: year-by-year salaries, signing bonuses, club / mutual / vesting / player / dual options with buyouts, opt-outs (including the Valley Charge), earned incentives, deferrals, and Article XVI funding. Real-contract presets.
**Follow-on (Spec 2, not designed here):** team tax bill (Actual Club Payroll, thresholds, tiered and repeat-payor rates, surcharges), with thresholds/rates stored per Contract Year as data. The 2022–2026 Basic Agreement expires December 1, 2026; 2027+ terms are unknown as of this spec.

---

## 1. Source of truth and evidence standard

**Primary source:** 2022–2026 Basic Agreement (MLB / MLBPA), PDF at
`https://registrationz.mlbpa.org/pdf/MLB%20Basic%20Agreement%202022-26.pdf`.
Citations below give the Article/Section and the printed page number.

Every rule the engine implements carries exactly one evidence tag:

| Tag | Meaning |
|---|---|
| **[TEXT]** | Stated directly in the CBA text. |
| **[PRACTICE]** | CBA text is ambiguous; engine follows the figure MLB actually charged, as reported by named independent outlets. |
| **[INTERP]** | CBA text is ambiguous and no published figure resolves it; engine's reading is stated and the UI flags results that depend on it. |
| **[CONV]** | CBA is silent; a modeling convention is required to compute anything. Shown in the UI as a convention, not a rule. |

No rule enters the engine without a tag. Code comments cite the same section, and each per-season charge line item carries its citation string so the UI can show *why* a number exists.

---

## 2. CBT rules implemented (Article XXIII)

### 2.1 Definitions

| # | Rule | Tag | Cite |
|---|---|---|---|
| D1 | **Contract Year** = Dec 2 → Dec 1; referenced by the calendar year of its championship season. | [TEXT] | XXIII(A)(1), p.115–116 |
| D2 | **Imputed Loan Interest Rate (ILIR)** = annual Federal mid-term rate (IRC §1274(d)) for the **October preceding** the Contract Year. For deferral discounting, use the ILIR for the **first Contract Year covered by the contract**; if terms are confirmed before that rate is available, use the mid-term rate for the **month preceding confirmation**. | [TEXT] | XXIII(A)(4), p.116; E(6)(b)(ii), p.136–137 |
| D3 | **Base Salary** = amount in ¶2 of the UPC for a season (or a Special Covenant in lieu of ¶2). | [TEXT] | XXIII(A)(7), p.116 |
| D4 | **Guaranteed Year** = a season for which **more than 50%** of Base Salary is guaranteed on termination under UPC ¶7(b)(2). The UI's "Guaranteed" status means the user asserts this test is met. | [TEXT] | XXIII(A)(8), p.116 |

### 2.2 Year classification

| # | Rule | Tag | Cite |
|---|---|---|---|
| Y1 | **Club Option Year**: becomes due/guaranteed at the Club's election **or by reason of specified performance by a Player** (so a vesting option is a Club Option Year). Not a Guaranteed Year. Any non-Guaranteed season in a multi-year contract is also treated as a Club Option Year. | [TEXT] | E(5)(a)(i), p.133 |
| Y2 | **Player Option Year** (player elects, or may nullify): **is** a Guaranteed Year, **unless** the payment for declining/nullifying is **more than 50%** of that season's Base Salary. | [TEXT] | E(5)(a)(ii), p.133 |
| Y3 | **Player Opt-Out** (player may exercise/nullify multiple Contract Years at once): years following it **are** Guaranteed Years, **unless** the opt-out payment is **more than 50%** of the sum of Base Salaries in the years following the opt-out. Years after an opt-out are Player Option Years. | [TEXT] | E(5)(a)(ii), p.133 |
| Y4 | **Dual Option Year** (either party may elect) → calculated as a Player Option Year. | [TEXT] | E(5)(a)(iii), p.133 |
| Y5 | **Mutual Option Year** (both must elect) → calculated as a Club Option Year. | [TEXT] | E(5)(a)(iv), p.133–134 |

### 2.3 AAV at signing

| # | Rule | Tag | Cite |
|---|---|---|---|
| A1 | A contract longer than one season has, in each Guaranteed Year, Salary = **AAV** = (Σ Base Salary in Guaranteed Years + Signing Bonus attributed to Guaranteed Years + deferred-comp cost attributed to Guaranteed Years) ÷ number of Guaranteed Years. Earned bonuses are added on top (rule B1). | [TEXT] | E(2), p.131 |
| A2 | **Signing Bonus** is attributed **pro rata over the Guaranteed Years**, irrespective of payment dates. If there are no Guaranteed Years, it is attributed in full to the first year. | [TEXT] | E(3), p.132 |
| A3 | An **Option Buyout** on a Club Option Year, or on a Player Option Year that is **not** a Guaranteed Year, is **deemed a Signing Bonus** (so it enters A1/A2). | [TEXT] | E(5)(b)(i)(A), p.134 |
| A4 | If a contract has buyouts for more than one Option Year, **only the earliest Option Year's buyout** is deemed a Signing Bonus. | [TEXT] | E(5)(b)(i)(B), p.134 |
| A5 | Potential (unearned) bonuses are **not** in the AAV. | [TEXT] | E(4)(a), p.132 |

### 2.4 Deferred compensation (XXIII(E)(6))

| # | Rule | Tag | Cite |
|---|---|---|---|
| F1 | **Deferred Compensation** = Salary payable **after the last championship season** for which services are required. Money paid later *within* the term is not Deferred Compensation. Validation: every deferred payment year must be later than the final season. | [TEXT] | E(6)(a), p.136 |
| F2 | Deferred Compensation counts **as if paid in the season to which the contract attributes it**. If the contract does not attribute it, it is treated as attributed **equally to each Guaranteed Year**. | [TEXT] | E(6)(b)(i), p.136 |
| F3 | If deferrals carry stated interest at an effective rate **within 1.5 percentage points of the ILIR**, they count at **stated value** (not discounted). Otherwise each payment is increased by the stated interest rate (if any) and then discounted to its **present value in the season to which it is attributed**, using the ILIR (D2). Note: a 0%-interest deferral counts at full stated value whenever the ILIR ≤ 1.5%. | [TEXT] | E(6)(b)(ii), p.136–137 |
| F4 | Attribution modes the engine supports: **(a) Sequential**: the contract maps seasons to payments in order (first-earned is paid first, splitting payments across seasons as needed). **(b) Equal**: the CBA default under F2, with every payment split equally across all seasons that have a deferral. | (a) [CONV] (b) [TEXT] | — / E(6)(b)(i) |
| F5 | Discounting uses whole years (payment calendar year − attributed season year), compounded annually at the ILIR. The CBA does not specify dates, day counts, or compounding. | [CONV] | silent |
| F6 | "Within 1.5 percentage points" is treated as inclusive (≤ 1.5). | [CONV] | silent |

**Evidence that F4(a) + F5 match MLB's figures** (computed during brainstorming; scripts reproduced in tests):

- **Ohtani** (2024–33, $70M/yr with $68M deferred, no interest, $68M paid each July 1 2034–43). The ILIR for the 2024 Contract Year is the October 2023 mid-term AFR, **4.43%** (PBGC historical table). Sequential attribution gives **$46,081,476.50**; reported **$46.08M** (Pivotal180, Yahoo/AP). Equal attribution gives **$46.77M**, which is wrong. **The current app uses equal attribution and overstates Ohtani by about $690K/yr.**
- **Scherzer** (2015–21; signed under the 2012–16 CBA). October 2014 mid-term AFR = **1.85%** (Rev. Rul. 2014-26; PBGC). Sequential gives **$28,690,024**; reported **$28,689,376** (AP via SI/TSN). The residual of **$648/yr (0.002%)** is unexplained. A likely cause is a date/day-count convention the CBA leaves unspecified. The engine applies 2022–26 rules to this contract; the preset says so.

### 2.5 Bonuses

| # | Rule | Tag | Cite |
|---|---|---|---|
| B1 | Performance, award and other bonuses **actually earned** are Salary in the Contract Year the triggering performance occurred. They are not averaged into the AAV. | [TEXT] | E(4)(a), p.132 |

### 2.6 Option outcomes

| # | Rule | Tag | Cite |
|---|---|---|---|
| O1 | **Club (incl. mutual, vesting) option exercised**: Salary for that year = Base Salary + earned bonuses. | [TEXT] | E(5)(c), p.135 |
| O2 | **Buyout not received** (option exercised): no portion of the buyout is included in that year, and the Club receives a **deduction equal to the full buyout** previously included, in the Contract Year covered by that option. Net effect of O1 + O2: option year charge = option salary + earned bonuses − buyout previously charged. | [TEXT] | E(5)(b)(ii), p.134–135 |
| O3 | **Club option declined**: buyout already charged via A3; nothing further in that year. | [TEXT] (follows A3; no further charge is specified) | E(5)(b)(i) |
| O4 | **Later-year buyout actually paid** (a buyout not deemed Signing Bonus under A4): included in Salary in the Contract Year covered by the option that was not exercised. | [TEXT] | E(5)(b)(i)(B), p.134 |
| O5 | **Vesting option vested** = treated as an exercised Club Option Year (O1 + O2). The definition (Y1) groups performance-triggered years with club elections, and O1's "if exercised" is read as also covering "if vested". | [INTERP] | E(5)(a)(i), (c) |
| O6 | **Non-guaranteed Player Option Year exercised**: Salary = option-year Salary (incl. earned bonuses) − buyout attributed in all previous years. Multiple such years: AAV of exercised option salaries less prorated attributed buyout. | [TEXT] | E(5)(d)(i) ¶2, p.135 |
| O7 | **Guaranteed Player Option Year declined / nullified (opt-out taken)**: (amount paid to the Player under the contract, incl. any buyout) − (amount attributed to Actual Club Payroll, **excluding Valley Charge amounts**) is added to or subtracted from the Contract Year in which the Player Option Year falls. If multiple years are nullified, it is applied **pro rata over the nullified years**. Charges therefore land in seasons after the player has left. | [TEXT] | E(5)(d)(i) ¶1, p.135 |

### 2.7 Valley Charge (XXIII(E)(5)(d)(ii), p.136)

| # | Rule | Tag | Cite |
|---|---|---|---|
| V1 | **Player Option Year Value** = Base Salary + deferred comp/annuity cost − any Option Buyout, for that Player Option Year. | [TEXT] | E(5)(d)(ii) |
| V2 | **80% Figure** = 80% × (Base Salary + attributed Signing Bonus + deferred comp/annuity) of the **smallest such Guaranteed Year before the first Player Option Year**. | [TEXT] | E(5)(d)(ii) |
| V3 | **Floor**: if the 80% Figure < 75% × AAV (calculated **as if the Player Option Year were not a Guaranteed Year**), the 80% Figure becomes that 75% amount. | [TEXT] | E(5)(d)(ii) |
| V4 | For each Player Option Year with Value < 80% Figure, the shortfall is allocated **pro rata across the Guaranteed Years preceding the first such Player Option Year**. | [TEXT] | E(5)(d)(ii) |
| V5 | For V2, the Signing Bonus is attributed **over the Guaranteed Years preceding the first Player Option Year** (i.e., as if the option years were not Guaranteed, consistent with V3's parenthetical), **not** over all Guaranteed Years per A2. | [PRACTICE] | Bellinger: $44.75M reported by Joel Sherman (NY Post), Forbes (Freedman, 2026-02-06), MLBTR (2026-01). The A2 reading yields $41.56M, which no outlet reports. |
| V6 | **Option exercised after a Valley Charge**: the Valley Charge is "deducted from the Player Option Salary in the calculation of the AAV of the Player Option Year(s)." Engine reading: each exercised Player Option Year is charged **contract AAV − (Σ Valley Charge components arising from the exercised option years ÷ number of exercised option years)**. Only the exercised years' own shortfalls (V4) are credited; components from years later nullified stay charged (V7). If every option year is exercised, total CBT = total paid. A literal recomputed-AAV reading (Bellinger: ($77.5M − $24.5M) ÷ 3 = $17.67M) would leave total CBT **$20M below** cash paid. | [INTERP] | Only published figure is MLBTR's "roughly $24.33MM" (single source, matches engine). |
| V7 | **Opt-out taken after a Valley Charge**: the Valley Charge is **not refunded**. The O7 true-up excludes Valley Charge amounts, so total CBT can exceed cash paid (Bellinger opting out after 2027: $109.5M CBT vs $85M paid). The UI shows a callout quoting E(5)(d)(i). | [TEXT] (user decision 2026-11-04: literal reading) | E(5)(d)(i) ¶1 |
| V8 | Valley Charge applies only to Player Option Years that are **Guaranteed Years**. The text does not restrict it, but applying it to a non-guaranteed option year (buyout > 50%) combined with O6 can produce negative option-year charges. | [INTERP] | E(5)(d)(ii) silent |
| V9 | In V3's "as if not Guaranteed" AAV, a Player Option Year buyout becomes a deemed Signing Bonus (A3 applied within the hypothetical). | [INTERP] | E(5)(d)(ii), (b)(i)(A) |

### 2.8 Known open ambiguity surfaced in the UI

- **A3 vs A4 conflict:** E(5)(b)(i)(A) says that when both a club-option buyout and a player-option buyout exist, the **higher** is the Signing Bonus. (B) says only the **earliest** option year's buyout counts. The engine applies (B) (earliest year) and shows a warning whenever a contract has buyouts on both a Club-type and a non-guaranteed Player-type option year.

### 2.9 Explicitly out of scope (with cite, so it's a known gap and not an oversight)

Mid-season signing proration (E(2) last sentence) · trades/assignments, Net Over/Undercharge, cash considerations (C(2)(b)) · contract extensions and renegotiation incl. G(3)(e)–(f) Valley rules · salary escalators via Special Covenant (E(4)(b)) · earned bonus increasing a buyout (E(5)(b)(i)(C)) · retirement-triggered deferral start / age-40 assumption (E(6)(b)(ii)) · annuity arrangements (E(6)(c)) · loans (E(7)) · Player Benefit Costs and Actual Club Payroll (C(1), D; Spec 2) · pre-9/30/2002 funding deadlines (Art. XVI).

---

## 3. Article XVI funding (escrow) — corrected model

| # | Rule | Tag | Cite |
|---|---|---|---|
| X1 | For contracts executed on/after Sept 30, 2002: deferred comp earned in a season must be fully funded **on or before the second July 1** following that season (season *s* → July 1 of *s*+2). | [TEXT] | Art. XVI, p.89 |
| X2 | Full funding = the Club must maintain, without interruption, the **current present value of then-outstanding deferred payments, discounted at 5% annually**. | [TEXT] | Art. XVI, p.89 |
| X3 | If J.P. Morgan Chase Bank's prime rate on the preceding Nov 1 is ≥ 7%, the Parties **meet and confer** and **may** amend the rate effective the next July 1. Engine uses 5%; the UI notes the clause. | [TEXT] | Art. XVI, p.89 |
| X4 | Engine output: a **required funded balance at each July 1** = Σ over outstanding payments attributed to seasons whose deadline has passed: payment ÷ 1.05^(payment year − snapshot year). Payments due on the snapshot date count as already paid. Also report the peak balance. | [CONV] for snapshot timing and whole years | — |

**Correction to the current app:** `calculateContract()` discounts escrow back to the *earning* season "for simplicity" (comment in `utils/calculations.ts`). Article XVI measures PV at the funding date and then continuously, so the current figure understates the requirement. Replace with X4.

---

## 4. Existing user-facing claims — audit results (all must be fixed or removed)

| Location | Current claim | Finding | Fix |
|---|---|---|---|
| `utils/calculations.ts` `calculatePresentValue` doc | "years from the earned date (June 30 of playing season)" | June 30 appears nowhere in Art. XXIII | Remove; cite F5 [CONV] |
| `App.tsx:373` tooltip | "Federal Mid-Term Rate … as defined in Article XXIII" | Incomplete: omits *which month* (D2) | State D2 precisely |
| `App.tsx:460` | "included … in the year earned at its discounted present value" | Omits attribution (F2) and the 1.5-pp stated-value exception (F3) | Rewrite per F2/F3 |
| `App.tsx:140` | "parties may agree to amend" when prime ≥ 7% | Text: J.P. Morgan Chase prime on preceding Nov 1; parties "shall meet and confer" and "may … amend … effective the next succeeding July 1" | Quote X3 |
| `App.tsx:162` | "This differs from a bankruptcy-remote escrow." | Commentary, not CBA text; Art. XVI never uses "escrow" | Label as commentary, or remove. Section title becomes "Funding Rules (Article XVI)" |
| Historical Deductible card | "lesser of $2,000,000 or the PV…" | Correct, but omits that it applies to the aggregate per Basic Agreement period, not per contract | Add aggregate wording |
| Scherzer preset | $105M deferred evenly over 7 years, 2.5% "historic rate approx" | Wrong structure and unsourced rate (§2.4) | Rebuild from AP terms at 1.85% |
| README | "Federal Mid-Term Rate" | Fine, but now incomplete for scope | Update with new scope |

---

## 5. Architecture

Pure-function engine plus split UI. No React in the engine. Every function is deterministic and unit-tested.

```
utils/cbt/
  types.ts        ContractInput, SeasonRow, OptOut, DeferralSchedule, Scenario, Charge, Result
  classify.ts     D4, Y1–Y5  → per-season { kind, isGuaranteed, reason }
  deferral.ts     F1–F6      → deferred cost per season (+ cash-flow schedule)
  aav.ts          A1–A5      → AAV at signing, deemed-signing-bonus breakdown
  valley.ts       V1–V5, V8, V9 → Valley Charge per Player Option Year and per pre-option season
  outcome.ts      O1–O7, V6–V7, B1 → per-season Charge[] for a Scenario
  funding.ts      X1–X4      → July 1 required-balance schedule, peak
  index.ts        calculate(input, scenario): Result
  citations.ts    rule id → { cite, tag, summary } (single table used by code + UI)
utils/format.ts   formatMoney, formatMillions (moved from calculations.ts)
data/presets.ts   presets with sources[] (URL + what it confirms)
components/
  ScheduleEditor.tsx   year-by-year table + "fill evenly" helper + opt-out markers
  DeferralEditor.tsx   payment stream, attribution mode, stated interest
  ScenarioPanel.tsx    option/vesting/opt-out toggles, earned bonuses per season
  ResultCards.tsx      AAV at signing, total CBT for scenario vs cash paid, deferral discount
  CbtChart.tsx         Recharts: CBT charge vs cash by season
  YearTable.tsx        per-season rows, expandable Charge line items with citations + tags
  FundingRules.tsx     static Art. XVI copy (corrected per §4) + funding schedule
  InfoTooltip.tsx      (existing)
App.tsx                state + layout only
```

`utils/calculations.ts` is deleted; nothing else imports it once `App.tsx` moves to `utils/cbt`.

### 5.1 Key types (shape, not final code)

```ts
type YearKind = 'guaranteed' | 'club' | 'mutual' | 'vesting' | 'player' | 'dual';

interface SeasonRow {
  season: number;          // calendar year of championship season (D1)
  baseSalary: number;      // D3; includes any portion that is deferred
  deferred: number;        // amount of this season's Salary attributed as Deferred Compensation (F2)
  kind: YearKind;
  buyout?: number;         // option rows only
}
interface OptOut { afterSeason: number; payment: number }   // Y3
interface DeferralSchedule {
  payments: { year: number; amount: number }[];             // cash schedule (F1: all years > last season)
  attribution: 'sequential' | 'equal';                      // F4
  statedInterestPct: number;                                // F3, default 0
}
interface ContractInput {
  seasons: SeasonRow[];
  signingBonus: { amount: number; payments: { year: number; amount: number }[] };
  optOuts: OptOut[];
  deferral: DeferralSchedule;
  ilirPct: number;                                          // D2
}
interface Scenario {
  options: Record<number /*season*/, 'exercised' | 'declined'>;  // vesting: exercised = vested
  optOutTakenAfter: number | null;
  earnedBonuses: Record<number, number>;                    // B1
}
interface Charge { season: number; amount: number; rule: RuleId; note?: string }
interface Result {
  classification: SeasonClass[];
  aavAtSigning: number;
  charges: Charge[];                 // every component, each with a rule id
  perSeason: { season: number; cbt: number; cash: number }[];
  totals: { cbt: number; cash: number };
  funding: { snapshots: { july1: number; required: number }[]; peak: number };
  flags: { rule: RuleId; message: string }[];   // [INTERP] dependencies, A3/A4 warning, V7 callout
}
```

### 5.2 Data flow

`ContractInput` → `classify` → `deferral` (cost per season) → `aav` (needs classification + deferral) → `valley` (needs aav + classification) → `outcome(Scenario)` emits `Charge[]` → aggregate `perSeason` / `totals` → `funding` (deferral payments only). `flags` collects every [INTERP]/[CONV] rule that affected a non-zero charge.

### 5.3 Validation (blocking errors, shown inline)

- At least one season. Seasons consecutive and ascending.
- `deferred ≤ baseSalary` per season.
- Every deferral payment year > final season (F1). If attribution is sequential, Σ payments = Σ `deferred` (at 0% stated interest). Otherwise warn with the difference.
- `buyout` only on option rows. `optOut.afterSeason` must have at least one season after it.
- Signing-bonus payments sum to the bonus amount.
- ILIR in (0, 25]. Stated interest ≥ 0.

---

## 6. UI behavior

- **Inputs:** Contract Terms (ILIR with D2 tooltip, signing bonus + payment schedule) → Schedule table (rows per season: base, deferred, kind, buyout; "+ season", "fill evenly from total") → opt-out markers between rows (payment input) → Deferral panel (only shown when any `deferred` > 0).
- **Scenario panel:** one toggle per option row (defaults: club/mutual/vesting **declined**, player/dual **exercised**) and one opt-out selector (default **not taken**), plus earned-bonus inputs per season. The defaults mirror the CBA's guaranteed classification and are a UI default, not a rule.
- **Results:** "AAV at signing" (A1) always shown and independent of the scenario. Below it, totals for the selected scenario: total CBT vs total cash, with the difference explained by line items.
- **Year table:** each season's CBT figure expands into its Charge line items (e.g., "AAV $32.5M · E(2) [TEXT]", "Valley Charge +$12.25M · E(5)(d)(ii) [TEXT]"). Rows outside the playing term appear when charges land there (O7).
- **Flags:** a callout lists every [INTERP]/[PRACTICE]/[CONV] rule the current result depends on, with a one-line explanation and cite. V7 shows the quoted E(5)(d)(i) text.
- **Presets:** each shows "Sources" (links) and, when an official figure exists, "Reported CBT: $X · Engine: $Y · Δ". Visible reconciliation is the point.
- **Chart:** CBT charge vs cash received per calendar year, plus the contract-end reference line (existing).
- Responsive and accessible per existing Tailwind patterns. No new runtime dependencies.

---

## 7. Presets (all terms from named public sources; no estimated values)

| Preset | Terms | Sources | Reported figure → test |
|---|---|---|---|
| **Ohtani** (LAD, 2024–33) | $70M/yr base, $68M/yr deferred, paid $68M July 1 2034–43, no interest, sequential; ILIR 4.43% (Oct 2023) | AP/Yahoo; Pivotal180; PBGC AFR table | CBT AAV $46.08M (published to $10K) → assert within ±$5,000 |
| **Scherzer** (WSH, 2015–21) | Base 10, 15, 15, 15, 35, 35, 35 ($M); 2019–21 fully deferred; $50M signing bonus paid 5 (2015), 15 (2019), 15 (2020), 15 (2021); deferral paid $15M July 1 2022–28, no interest, sequential; ILIR 1.85% (Oct 2014). Labeled "signed under 2012–16 CBA; 2022–26 rules applied." | AP via SI/TSN/ESPN; Rev. Rul. 2014-26; PBGC | $28,689,376 → assert within ±$1,000 (documented residual $648) |
| **Bellinger** (NYY, 2026–30) | Base 32.5, 32.5, 25.8, 25.8, 25.9 ($M); $20M signing bonus paid $10M 4/1/26 + $10M 8/1/26; opt-outs after 2026 and 2027 with $0 payment | MLBTR 2026-01; Forbes 2026-02-06; NY Post (Sherman) | 2026 & 2027 CBT $44,750,000 → assert exact |
| **Standard** | 5 × $20M guaranteed, nothing else | — | $20M (identity) |

A club-option preset is added **only** if a contract with published base, buyout and reported CBT figures is found during implementation. Otherwise club options are covered by worked examples (§8) only. No illustrative presets presented as real.

---

## 8. Testing (Vitest, engine only)

Add `vitest` (dev dependency, exact version pinned per repo convention), a `test` script, and a `pnpm test` step in `.github/workflows/ci.yml`. Update CLAUDE.md ("There are no tests…").

Each rule id in §2–§3 has at least one test named with its id (e.g., `V3 floor applies when 80% figure < 75% AAV`). The fixtures below are hand-derived from the rules and serve as the acceptance tests ($M):

| # | Contract | Expected |
|---|---|---|
| W1 | 5 × 20 guaranteed | AAV 20.0; total CBT = total cash = 100 |
| W2 | 30, 30, 20 guaranteed + 6 signing bonus | AAV (80+6)/3 = 28.6667 |
| W3 | 4 × 20 guaranteed; yr 5 club option 25, buyout 2 | AAV (80+2)/4 = 20.5. Exercised: yr 5 = 25 − 2 = 23 (O1+O2), total 105 = cash 105. Declined: yr 5 = 0, total 82 = cash 82 |
| W4 | 3 × 20 guaranteed; yr 4 player option 12, no buyout (guaranteed, Y2) | AAV 72/4 = 18. 80% Fig = 16; floor 75% × (60/3) = 15 → 16. Valley 4 → +1.3333 in yrs 1–3 (19.3333 each). Exercised: yr 4 = 18 − 4 = 14 (V6), total 72 = cash. Declined: paid 60 − attributed excl. valley 54 = +6 in yr 4 (O7); total 64 vs cash 60 (V7) |
| W5 | 3 × 20 guaranteed; yr 4 player option 10, buyout 6 (> 50% → not guaranteed) | Buyout deemed SB: AAV (60+6)/3 = 22. Exercised: yr 4 = 10 − 6 = 4 (O6), total 70 = cash. Declined: yr 4 = 0, total 66 = cash. No Valley (V8) |
| W6 | Y3 50% test: opt-out payment > 50% of remaining base | Following years not Guaranteed → treated as Club Option Years |
| W7 | F3: 0% deferral with ILIR 1.2% | Counted at stated value (no discount) |
| W8 | A4: club options yrs 5 and 6 with buyouts 2 and 3 | Only 2 enters AAV. If yr 5 is exercised and yr 6 declined, 3 is charged in yr 6 (O4) |
| W9 | B1: 0.5 earned in yr 2 | Yr 2 CBT = AAV + 0.5; AAV unchanged |
| W10 | Funding X4: 1 season (s = 2024) deferral of 10 paid 2030 | First snapshot July 1 2026 = 10 / 1.05⁴ = 8.2270; 2027 = 8.6384 … 2029 = 9.5238; 2030 = 0 |
| W11 | Bellinger, opt-out after 2026 | 2026–27: 44.75 each. Opt-out: true-up (85 − 65) = 20 spread over 2028–30 (6.6667 each). Total 109.5 vs cash 85 |
| W12 | Bellinger, no opt-out | 2026–27: 44.75; 2028–30: 32.5 − 24.5/3 = 24.3333; total 162.5 = cash |
| W13 | Bellinger, opt-out after 2027 | 2027 option year exercised: 32.5 − 8.2 (its own Valley component, V6) = 24.3; the 2029–30 components (8.2 + 8.1) stay charged (V7). Then (paid 110.8 − attributed excl. valley 97.5) = 13.3 over 2029–30. Total 127.1 vs cash 110.8 [derived; no published figure] |
| W14 | Regression: Ohtani, Scherzer, Bellinger presets | Per §7 tolerances |

Invariant tests (property-style, small generated contracts): with no Valley Charge, total CBT over all scenarios = total cash paid, with deferrals counted at their attributed cost. With a Valley Charge, the difference equals exactly the non-refunded Valley amount (V7) or zero (V6).

---

## 9. Delivery

- Branch per PR; squash-merge; PR title drives release-drafter. The engine and UI ship as `feat: …` (minor bump). The spec and CI test step can land as `docs:` / `ci:`.
- Suggested PR split for the implementation plan: (1) `ci:` Vitest + test step, (2) `feat:` engine + tests (UI still on old path), (3) `feat:` UI split + new inputs/scenarios, (4) `fix:` copy corrections per §4 + Scherzer preset rebuild (user-visible correctness fix, patch section). The Ohtani preset value changes ($46.77M → $46.08M) as part of (2)/(3); release notes must call this out.
- No changes to `package.json` `version`, CHANGELOG, Dockerfile, or Renovate config.

## 10. Decisions log

| Date | Decision | By |
|---|---|---|
| 2026-11-04 | Year-by-year schedule input | user |
| 2026-11-04 | Signing-day AAV + scenario toggles | user |
| 2026-11-04 | Include vesting options, earned incentives, presets; tax bill deferred to Spec 2 | user |
| 2026-11-04 | Architecture A (pure engine + split UI + Vitest) | user |
| 2026-11-04 | V7 literal reading (Valley Charge not refunded on opt-out) | user |
| 2026-11-04 | Every rule validated against CBA text; evidence tags required | user |
| 2026-11-04 | V5 [PRACTICE], V6/V8/V9/O5 [INTERP], A3/A4 warning — **pending user review** | proposed |
