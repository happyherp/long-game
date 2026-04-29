# The Long Game — Agent Guide

Browser-based demographic strategy game. The player authors doctrine for a Mennonite community and watches it grow, splinter, modernize, or hold firm across generations.

- Full design: [GDD.md](GDD.md)
- Reduced V1 scope (what we're actually building first): [Phase1.md](Phase1.md)

## Current phase

**Phase 1**: single-colony sim, 1960–2100, four doctrine items, IndexedDB auto-save, one D3 chart. Build order is numbered in [Phase1.md § Build Order](Phase1.md#build-order-numbered-tasks). Pick the lowest-numbered unfinished task.

## Tech stack

Vite, React 18, TypeScript (strict), Zustand, D3, Tailwind CSS, shadcn/ui, idb, Vitest. No router. No animation libraries in P1.

## Non-negotiable constraints

These three rules are load-bearing for the entire engine. Violating any of them is an architectural bug, not a stylistic one.

1. **Engine purity.** Code under `src/engine/` is pure functions with **zero React/DOM imports**. The engine must be runnable in plain Node for tests and a future replay tool. UI imports engine — never the reverse.
2. **No `Math.random` in the engine.** Every randomness source is a seeded RNG passed as a parameter. Same seed + same inputs must produce identical outputs across machines and runs. See [Phase1.md § Determinism and RNG](Phase1.md#determinism-and-rng).
3. **No tombstones in `PopulationStore`.** Dead and departed persons are removed via swap-and-pop; the store is compacted in place. P1 does not maintain stable IDs across ticks (the full GDD upgrades to stable IDs via an `idToIndex` map in P2).

## Folder structure

See [Phase1.md § Folder Structure](Phase1.md#folder-structure). Don't drift from it without good reason — the build order assumes that layout.

## Commands

Available after Phase 1 task #1 (Vite scaffold) lands:

- `npm run dev` — start Vite dev server
- `npm run test` — run Vitest in non-watch mode
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — ESLint
- `npm run build` — Vite production build

## Workflow

This repo is edited from two clients (VSCode + Claude Code locally, and Claude Code Web). To keep them from stepping on each other:

- **Never push to `main`.** Always create a feature branch.
- **Open a PR for every change.** CI must be green to merge.
- **Use the Vercel preview URL** in the PR comment to verify UI changes before merging. CI alone does not verify gameplay.
- **Squash-merge** by default; the branch is auto-deleted on merge.

CI runs lint, typecheck, test, and build on every PR. See [.github/workflows/ci.yml](.github/workflows/ci.yml).

## Calibration constants

Once code exists, the numbers worth tuning live in:

- `src/engine/economy.ts` — output per adult, expenses per capita, enforcement constant
- `src/engine/births.ts` — base birth rate, age curve
- `src/engine/deaths.ts` — age-banded mortality probabilities
- `src/engine/departures.ts` — base departure rate, doctrine multipliers
- `src/engine/cohesion.ts` — drift deltas per doctrine item

Calibration targets are in [Phase1.md](Phase1.md) — TFR ~7.0/3.5/1.6 by cohesion band under default doctrine, etc. Don't tune by feel without running the determinism + statistical tests.
