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
| F4 | Attribution modes: **(a) Sequential.** The contract maps seasons to payments in order: the first-earned money is paid first, and a payment is split across seasons where needed. **(b) Not attributed.** Each season's deferral is the total ÷ the number of Guaranteed Years (F2), and each payment is split equally across the Guaranteed Years. In mode (b) the per-season `deferred` inputs are ignored and the UI disables them. The total principal comes from `DeferralSchedule.unattributedPrincipal`, because with stated interest the payments include interest and can't stand in for principal. | (a) [PRACTICE] (reproduces Ohtani, Scherzer §2.4.1); (b) attribution [TEXT], payment split [CONV] | E(6)(b)(i) |
| F5 | Discounting uses whole years (payment calendar year − attributed season year), compounded annually at the ILIR. The CBA does not specify dates, day counts or compounding. This convention reproduces Ohtani and comes within $648/yr of Scherzer (§2.4.1). | [PRACTICE] | silent |
| F6 | "Within 1.5 percentage points" is treated as inclusive (≤ 1.5). | [CONV] | silent |
| F7 | **Representation.** Per-season `deferred` is principal at stated value. `payments` are the actual cash paid, interest included. Discounting the actual cash at the ILIR is the same as "increasing by the stated rate, then discounting". Sequential mapping (F4(a)) maps **principal**: each payment is split into principal and interest by amortizing the outstanding principal at the stated rate, and principal is assigned to seasons first-earned-first. Each payment's interest follows its principal. At 0% stated interest, Σ payments must equal Σ deferred. | [CONV] | E(6)(b)(ii) |

#### 2.4.1 Evidence for F4(a) and F5 (reproduced as tests)

- **Ohtani** (2024–33): current $2M + deferred $68M each season, paid $68M on July 1 each year 2034–43, no interest. The ILIR for the 2024 Contract Year is the October 2023 mid-term AFR, **4.43%** (PBGC historical table). Sequential attribution gives **$46,081,476.50**, against a reported **$46.08M** (Pivotal180, Yahoo/AP). Mode (b) gives **$46,769,026**. Ohtani's contract attributes each season to a payment, so mode (b) does not apply to it. **The current app uses mode (b), so it overstates Ohtani by about $687.5K/yr.**
- **Scherzer** (2015–21, signed under the 2012–16 CBA): the October 2014 mid-term AFR is **1.85%** (Rev. Rul. 2014-26; PBGC). Sequential attribution gives **$28,690,024** against a reported **$28,689,376** (AP via SI/TSN). The **$648/yr (0.002%) residual is unexplained**. Mode (b) gives **$28,211,365**. The engine applies 2022–26 rules, and the preset says so.

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
| V11 | In V3's "as if not Guaranteed" AAV, a Player Option Year buyout becomes a deemed Signing Bonus (A3 applied within the hypothetical). | [INTERP] | E(5)(d)(ii); (b)(i)(A) |

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
  attribution: 'sequential' | 'unattributed';                      // F4(a) / F4(b)
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
interface Charge { season: number; amount: number; rule: RuleId; note?: string }
interface Result {
  classification: SeasonClass[];
  aavAtSigning: number;
  charges: Charge[];                       // every component, each with a rule id
  perSeason: { season: number; cbt: number; cash: number }[];
  totals: { cbt: number; cash: number; attributedCost: number };  // cash: deferrals nominal; attributedCost: deferrals at F3 value (used by the §8 invariant)
  funding: { snapshots: { july1: number; required: number }[]; peak: number };
  flags: { rule: RuleId; message: string }[];   // every [PRACTICE]/[INTERP]/[CONV] rule that moved a number
}
```

### 5.2 Data flow

`ContractInput` → `classify` → `deferral` (cost per season) → `aav` (needs classification + deferral) → `valley` (needs aav + classification) → `outcome(Scenario)` emits `Charge[]` → aggregate `perSeason` / `totals` → `funding` (deferral payments only). `flags` collects every non-[TEXT] rule that affected a non-zero charge.

### 5.3 Validation (blocking errors, shown inline)

- At least one season, with seasons consecutive and ascending. **At least one Guaranteed season** (A2's no-Guaranteed-Years fallback is out of scope, §2.8).
- `currentSalary ≥ 0` and `deferred ≥ 0` for every season.
- **Ordering (END [CONV]):** no `guaranteed` row may follow an option row, because declining an option ends the contract and would otherwise void a Guaranteed Year. The season right after an opt-out must be a `guaranteed` row (Y4).
- Every deferral payment year, and every signing-bonus installment after the last Guaranteed season, falls after the last season of the maximum term (F1 scope limit).
- **F7 consistency:** at 0% stated interest, Σ payments must equal the principal: Σ `deferred` in sequential mode, `unattributedPrincipal` in unattributed mode. This is an error. With stated interest, a mismatch is a warning showing the amount. Unattributed mode requires `unattributedPrincipal`.
- `buyout` only on option rows. `guaranteedIfExercised` only on player/dual rows. Each `optOut.afterSeason` has at least one season after it.
- Signing-bonus payments sum to the bonus amount. Payments after the actual last season are classified automatically as A7 (no input flag).
- ILIR is in (0, 25] **when the contract has deferred compensation** (deferral payments, deferred principal, or an A7 installment). Otherwise it is unused and may be 0. Stated interest is ≥ 0.

---

## 6. UI behavior

- **Inputs:** Contract Terms (ILIR with the D2 tooltip, signing bonus + payment schedule) → Schedule table (one row per season: current salary, deferred, kind, buyout; "+ season"; "fill evenly from total") → opt-out markers between rows (with a payment input) → Deferral panel (shown only when any deferral exists).
- **Scenario panel:** one toggle per option row, defaulting club/mutual/vesting to **declined** and player/dual to **exercised**. One opt-out selector, defaulting to **not taken**. Earned-bonus inputs per season. The defaults mirror the CBA's guaranteed classification and are a UI choice, not a rule.
- **Results:** "AAV at signing" (A1) is always shown and does not depend on the scenario. Below it, the totals for the selected scenario: total CBT vs total cash, with the difference explained by line items.
- **Year table:** each season's CBT figure expands into its Charge line items, e.g. "AAV $32.5M · A1 [TEXT]" or "Valley Charge +$12.25M · V4 [TEXT] · V5 [PRACTICE] · V6 [INTERP]". A line item lists **every** rule id that determined its amount, each with its own tag. Seasons outside the playing term appear when charges land there (O7).
- **Flags:** a callout lists every [PRACTICE]/[INTERP]/[CONV] rule the current result depends on, with a one-line explanation, its cite and the named alternative. V8 shows the quoted E(5)(d)(i) text.
- **Presets:** each shows "Sources" (links), and where an official figure exists, "Reported CBT: $X · Engine: $Y · Δ". The reconciliation is shown on purpose.
- **Chart:** CBT charge vs cash received per calendar year, with the existing contract-end reference line.
- Responsive and accessible per the existing Tailwind patterns. No new runtime dependencies.

---

## 7. Presets (all terms from named public sources; no estimates)

| Preset | Terms | Sources | Reported figure → test |
|---|---|---|---|
| **Ohtani** (LAD, 2024–33) | Current $2M + deferred $68M per season; $68M paid each July 1 2034–43; no interest; sequential; ILIR 4.43% (Oct 2023) | AP/Yahoo; Pivotal180; PBGC AFR table | CBT AAV $46.08M (published to $10K) → assert within ±$5,000 of $46,080,000 |
| **Scherzer** (WSH, 2015–21) | Current salary ($M) 10, 15, 15, 15, 0, 0, 0; deferred 0, 0, 0, 0, 35, 35, 35; $50M signing bonus paid 5 (2015), 15 (2019), 15 (2020), 15 (2021); deferral paid $15M each July 1 2022–28; no interest; sequential; ILIR 1.85% (Oct 2014). Labeled "signed under the 2012–16 CBA; 2022–26 rules applied." | AP via SI/TSN/ESPN; Rev. Rul. 2014-26; PBGC | $28,689,376 → assert within ±$1,000 (documented residual $648) |
| **Bellinger** (NYY, 2026–30) | Current salary ($M) 32.5, 32.5, 25.8, 25.8, 25.9; $20M signing bonus paid $10M on 4/1/26 + $10M on 8/1/26; **opt-outs after 2027 and after 2028**, $0 payment | MLBTR 2026-01 ("after the second or third season", "$77.5MM remaining at the first decision point"); Forbes 2026-02-06; NY Post (Sherman) | 2026 and 2027 CBT $44,750,000 → assert exact |
| **Standard** | 5 × $20M guaranteed, nothing else | — | $20M (identity) |

A club-option preset is added **only** if a contract with published salary, buyout **and** reported CBT figure turns up during implementation. Otherwise club options are covered by the worked examples (§8) alone. No illustrative preset is presented as a real contract.

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
| 2026-11-04 | **Post-approval changes from the plan review, pending user sign-off:** §5.3 validation. (a) F7 payment/principal mismatch at 0% interest is a blocking error, in both modes. (b) END ordering: no guaranteed row after an option row; found by a generated counterexample that voided a Guaranteed Year. (c) The season after an opt-out must be a guaranteed row. (d) ILIR is required only with deferred compensation. (e) At least one Guaranteed season is required, and A2's no-Guaranteed-Years fallback is out of scope (§2.8). | Claude (plan review) |
