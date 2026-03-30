# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Dev server:** `npm run dev` (serves on port 3000, binds 0.0.0.0)
- **Build:** `npm run build` (Vite production build to `dist/`)
- **Preview build:** `npm run preview`
- **Docker:** `docker-compose up -d` (builds and serves on port 3000)

There are no tests, linting, or formatting configured.

## Architecture

Single-page React + TypeScript app built with Vite. Calculates MLB Competitive Balance Tax (CBT/Luxury Tax) implications of deferred money in player contracts, based on Article XXIII of the CBA.

### Key Files

- `App.tsx` — Entire UI in one file: form inputs, validation, results cards, Recharts bar chart, year-by-year table, and static Funding & Escrow Rules section. Contains preset scenarios (Ohtani, Scherzer, Standard).
- `utils/calculations.ts` — All financial logic: present value calculation (`PV = FV / (1+r)^n`), contract modeling, and number formatting. Exports `calculateContract()` which returns `CalculationResult` with AAV figures, yearly breakdown, and escrow requirements.
- `components/InfoTooltip.tsx` — Hover tooltip component used for field explanations.
- `index.tsx` — React entry point, renders `<App />` into `#root`.

### Domain Concepts

- **Nominal AAV**: Total contract value / years (actual dollars).
- **CBT AAV (Tax Hit)**: Total present value (cash + discounted deferrals) / years. This is what counts against the luxury tax.
- **Interest Rate**: Federal Mid-Term Rate used to discount future deferred payments.
- **Escrow PV**: Separate calculation using a fixed 5% discount rate (per Article XVI) for funding requirements.
- The calculation iterates over each earning year × each payout year to sum discounted installments.

### Styling

Tailwind CSS loaded via CDN script tag in `index.html` (not installed as a dependency). Uses Inter font from Google Fonts. Path alias `@/*` maps to project root.

### Commit Conventions

This project uses **conventional commits** with release-please for automated versioning. Dependency updates must use `fix(deps):` (not `chore(deps):`) so release-please recognizes them as releasable units. Only `feat`, `fix`, and `deps` prefixes trigger releases — `chore` and `build` do not.

Renovate is configured to produce `fix(deps):` commits for all dependency PRs.

### Deployment

Multi-stage Dockerfile builds with `npm ci && npm run build`, then serves static files with `serve` on port 3000. Designed for Raspberry Pi (ARM compatible). GitHub Actions handle Docker image publishing and release-please versioning.
