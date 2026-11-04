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
- `components/` — `ContractTerms`, `ScheduleEditor`, `DeferralEditor`, `PaymentsEditor`, `IssuesList` (inputs); `ScenarioPanel`, `ResultCards`, `FlagsCallout`, `CbtChart` (lazy-loads `CbtBarChart`, the only Recharts import, so Recharts gets its own chunk), `YearTable`, `FundingSchedule`, `FundingRules` (results); `PresetBar`, `fields.tsx` (shared inputs), `InfoTooltip`, `TagBadge`. Each `.tsx` exports only components, so React Fast Refresh can hot-swap it. Shared class strings live in `components/styles.ts`, and display labels (`KIND_LABELS`, `TAG_HELP`) in `components/labels.ts`.
- `utils/form.ts` — Pure helpers for editing a contract and keeping the scenario valid (`syncScenario`); tested in `utils/__tests__/form.test.ts`.
- `utils/format.ts` — Money formatting and parsing.
- `utils/presets.ts` — `reconcile()`: a preset's reported CBT against the engine's, for the worst reported season; tested in `utils/__tests__/presets.test.ts`.
- `utils/cbt/` — CBT contract engine (pure functions). Implements every rule in `docs/superpowers/specs/2026-11-04-cbt-contract-engine-design.md`. `rules.ts` maps each rule id to its CBA citation and evidence tag. `calculate(input, scenario)` in `index.ts` is the entry point. Tests are in `utils/cbt/__tests__/` (worked examples W1–W18, presets, invariants). Strict type-check: `pnpm run typecheck:engine`.
- `data/presets.ts` — Real-contract presets with sources and reported CBT figures.
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
