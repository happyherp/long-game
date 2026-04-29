# 1. OBJECTIVE

Eliminate the repeated pattern of `addPerson(...)` followed by two `incrementLivingCount(...)` calls by centralizing lineage-count updates into a single “add person + lineage tracking” helper.

# 2. CONTEXT SUMMARY

- `src/engine/population.ts` defines the low-level `PopulationStore` operations, including `addPerson(store, attrs)`.
- `src/engine/lineage.ts` tracks living members per lineage via `incrementLivingCount` / `decrementLivingCount`.
- Current invariant (enforced manually throughout the code/tests): whenever a living person is added to the population, the lineage registry should be incremented twice:
  - once for `attrs.paternalLineage`
  - once for `attrs.maternalLineage`
- Production call sites with this pattern:
  - `src/engine/founding.ts` (founding population generation)
  - `src/engine/births.ts` (new child)
- Many tests repeat the same pattern after creating people.

Constraint to keep in mind:
- `addPerson` is a generic store primitive; some tests (e.g. `tests/engine/population.test.ts`) intentionally focus on array behavior and should continue to use the low-level function without requiring lineage setup.

# 3. APPROACH OVERVIEW

Preferred approach: **add a new helper function** (e.g. `addLivingPerson`) that wraps `addPerson` and performs the two lineage increments, then migrate call sites to use it.

Rationale:
- Preserves `addPerson` as a low-level primitive (useful for focused population-store tests and any future use cases where lineage counts shouldn’t be touched).
- Avoids changing the signature/semantics of `addPerson` across the codebase.

Alternative (not chosen unless you prefer it): modify `addPerson` itself to accept a `LineageRegistry` (or a `Colony`) and always increment counts. This reduces API surface area but increases coupling and makes it harder to use `addPerson` in isolation.

# 4. IMPLEMENTATION STEPS

1. Add a lineage-tracking add helper
   - Goal: Provide a single function that adds a person and updates lineage living counts.
   - Method:
     - In `src/engine/population.ts`, export a new function, e.g.:
       - `addLivingPerson(store: PopulationStore, lineages: LineageRegistry, attrs: PersonAttrs): number`
     - Implementation:
       1) call existing `addPerson(store, attrs)`
       2) call `incrementLivingCount(lineages, attrs.paternalLineage)`
       3) call `incrementLivingCount(lineages, attrs.maternalLineage)`
       4) return the new person id
     - Reference: `src/engine/population.ts`, `src/engine/lineage.ts`, `src/engine/types.ts`.

2. Migrate engine code to use the helper
   - Goal: Remove duplicated lineage increment code in production engine modules.
   - Method:
     - Update `src/engine/founding.ts`:
       - Replace `addPerson(...)` + two `incrementLivingCount(...)` calls with a single `addLivingPerson(population, lineages, attrs)`.
       - Remove now-unused `incrementLivingCount` import.
     - Update `src/engine/births.ts` similarly:
       - Use `addLivingPerson(colony.population, colony.lineages, attrs)` for the new child.
       - Remove explicit increments.
   - Reference: `src/engine/founding.ts`, `src/engine/births.ts`.

3. Migrate tests to the helper (except population-store unit tests)
   - Goal: Eliminate boilerplate in tests and ensure they follow the same invariant through one API.
   - Method:
     - Update tests that currently do `addPerson` followed by two increments to use `addLivingPerson` instead:
       - `tests/engine/births.test.ts`
       - `tests/engine/deaths.test.ts`
       - `tests/engine/departures.test.ts`
       - `tests/engine/pairUp.test.ts`
       - `tests/engine/cohesion.test.ts`
       - `tests/engine/economy.test.ts`
       - `tests/engine/metrics.test.ts`
     - Keep `tests/engine/population.test.ts` using `addPerson` to continue testing the primitive behavior without lineage coupling.
     - Remove now-unused imports of `incrementLivingCount` in the migrated tests.

4. Optional: add one focused unit test for the new helper
   - Goal: Lock in the contract that the helper increments both lineage counts.
   - Method:
     - Add a small test (either in `tests/engine/population.test.ts` or a new `tests/engine/populationLineage.test.ts`) that:
       - creates a store + lineage registry
       - calls `addLivingPerson(..., { paternalLineage: X, maternalLineage: Y, ... })`
       - asserts both `livingCount[X]` and `livingCount[Y]` increased by 1
   - Note: this is optional because existing tests already depend on the invariant, but it makes the intention explicit.

# 5. TESTING AND VALIDATION

- Run the existing Vitest suite; success means all tests still pass after the refactor.
- Validate invariants via tests:
  - Founding colony total living lineage counts should still equal `population.size * 2` (see `tests/engine/founding.test.ts`).
  - Births should still increment lineage counts for new children (see `tests/engine/births.test.ts`).
  - Deaths/departures should continue decrementing counts correctly (existing tests).
- Manual spot-check (quick sanity): after refactor, there should be no remaining engine call sites with the pattern “`addPerson` then `incrementLivingCount` twice” in `src/engine` (the only remaining `addPerson` usage should be either inside the helper or in population-store-only tests).
