# The Long Game — Phase 2 Specification

> Builds on Phase 1. Federation of colonies, schism dynamics, stable person IDs, the full V1 doctrine sheet, sex-specific cohesion, inflow, and inbreeding pressure. The slice that proves the central GDD thesis: **a community cannot stay both large and strict — it must split, modernize, or collapse under enforcement debt.**

Phase 2 ships everything Phase 1 ships, plus everything in this document. A developer should be able to build the entire game described here without referring to the full GDD, given a working Phase 1 build as the starting point.

---

## Phase 2 Goal

A browser-runnable **multi-colony Mennonite federation simulator**, 1960 to 2100, where:

- The starting Cayo colony can grow large enough to undergo a schism, producing a daughter colony with diverging doctrine.
- The player authors doctrine independently for each colony in the federation.
- Modernity Pressure (MP) accumulates per colony from size, wealth, and tech adoption. When MP exceeds Cohesion, schism fires.
- Inflow from the Modern West provides genetic relief and sex-ratio rebalancing.
- Inbreeding coefficient is tracked at every pairing and modulates infant mortality and child starting cohesion.
- Land parcels and a small set of buildings give doctrine choices (especially higher ed for men, English schooling) mechanical economic consequences.

The player can win by reaching 2100 with at least two colonies, each with a positive population. The player loses if the entire federation collapses to zero or every colony has been deeply insolvent for 5 consecutive years.

---

## Out of Scope (Still)

Deferred to Phase 3 or later. If unsure whether something is in scope, the answer is no.

- **Threat events, Visibility, the Anchor** — no adversarial outside layer in P2. Outside trade and inflow are still mechanically modeled, but they don't trigger journalists, NGOs, or government actions.
- **Modern West regional unlocks** — no post-2050 reclamation colonies. Daughter colonies in P2 are founded in Belize/Paraguay region only, abstracted as "remote" vs "near".
- **Animation layer / SVG colony map** — federation is a list/grid UI, not a geographic map. Stable IDs are still required (engine prerequisite for P3 animations).
- **Lineage tree visualization** — lineage data is fully tracked; the chart that draws it is P3.
- **Replay tool UI** — engine remains deterministic and a `replay()` function exists, but no player-facing replay viewer.
- **Late-game economic depth** — sawmill, credit union, commercial plot, and remote jungle land type are P3.
- **Modern West aggregate mortality curve** — P2 models the Modern West only as an inflow *source* with declining willingness over time (a single number); P3 adds the full population mortality model and regional thresholds.

---

## What's New for the Player (vs Phase 1)

After Phase 1 the player sees a single colony summary with four doctrine toggles and one chart. After Phase 2:

1. The header shows **the federation**: a list of colonies with population, year, cohesion band, MP/Cohesion ratio. Selecting a colony focuses the rest of the UI on it.
2. The doctrine sheet has **the full V1 doctrine list** (technology, religion, marriage, schooling). Each item is still framed as a fence around the community.
3. A new **Federation tab** shows the lineage living-counts across all colonies, total federation population, and per-colony MP.
4. After a tick, if any colony's MP exceeds its Cohesion, the **Schism modal** appears: shows which faction is splitting off, where they want to settle, what their starting doctrine looks like, and asks the player to grant or refuse the split. Refusing has costs (cohesion drop, departure spike risk).
5. Inflow is shown each year as a count and (when notable) by named individual in the year's events panel. Inflow policy is part of the doctrine sheet.
6. The chart panel becomes a **chart tabbed view**: Population over time (P1), Population pyramid, TFR by cohesion band, Cohesion distribution, Lineage living-count bars.
7. Saves auto-migrate from Phase 1: an existing P1 save loads as a federation of one colony, with the new doctrine items defaulted (see Save Migration below).

---

## Engine Changes from Phase 1

### 1. Stable Person IDs (no more swap-and-pop ID churn)

Phase 1 uses swap-and-pop on `PopulationStore`, which means a person's index changes when someone else is removed. Phase 2 introduces stable IDs.

```typescript
interface PopulationStore {
  // parallel arrays — index is INTERNAL slot, not stable ID
  age:              Uint8Array
  sex:              Uint8Array
  cohesion:         Uint8Array
  married:          Uint8Array
  partnerId:        Int32Array     // stores stable ID, not slot index
  paternalLineage:  Uint16Array
  maternalLineage:  Uint16Array
  fatherId:         Int32Array     // stable ID; -1 if founder
  motherId:         Int32Array
  origin:           Uint8Array     // 0 = born-in, 1 = inflow
  arrivalYear:      Int16Array     // for inflow drift offset; equals birth year for born-in
  firstNameId:      Uint8Array

  // stable-ID infrastructure
  idToSlot:         Map<number, number>   // stable id -> current slot
  slotToId:         Int32Array            // slot -> stable id
  nextId:           number                // monotonically increasing

  capacity:         number
  size:             number
}
```

Operations:

- `addPerson(store, attrs): number` — assigns a new stable ID from `nextId++`, places at `slot = size`, updates both maps, returns the stable ID.
- `removePerson(store, id): void` — looks up slot via `idToSlot`, swap-and-pop the slot, **fix up `slotToId` and `idToSlot` for the moved slot**, delete `id` from `idToSlot`. The stable ID is *retired* — never reused.
- `getSlot(store, id): number` — `idToSlot.get(id) ?? -1`.
- `getAlive(store)` still iterates `0..size-1` for hot loops; engine code that needs to refer to a person across ticks (or across removals within a tick) must use stable IDs.

`partnerId`, `fatherId`, `motherId` all hold **stable IDs**. The pairing module sets `partnerId` symmetrically; a partner death lookups via `idToSlot` to clear the survivor's `partnerId`.

This change is invasive. Update every Phase 1 module that walks `partnerId` to do an `idToSlot` lookup instead of treating it as a slot index.

### 2. Sex-Specific Cohesion Drift

Phase 1 has a single `applyDrift`. Phase 2 splits it.

```typescript
function applyDriftFemale(person, partner, doctrine, rng) {
  let delta = 0
  // Common factors
  if (doctrine.smartphones)        delta -= 3
  if (doctrine.englishSchool)      delta -= 3              // stronger than male
  if (doctrine.outsideTrade === 'open') delta -= 1
  if (doctrine.plainDress)         delta += 2
  if (doctrine.headCovering)       delta += 1
  if (doctrine.sundayObservance)   delta += 0.5
  if (doctrine.worshipLanguage === 'plautdietsch') delta += 1
  if (doctrine.shunning)           delta += 0.5

  // Female-specific accelerators
  if (doctrine.higherEdWomen === 'permitted' || doctrine.higherEdWomen === 'encouraged') delta -= 3
  if (doctrine.marriageDoctrine === 'modern')      delta -= 2

  // Inflow tenure offset
  if (person.origin === 1) {
    const tenure = year - person.arrivalYear
    delta -= Math.max(0, 5 - tenure * 0.5)
  }

  // Partner pull
  if (partner) delta += (partner.cohesion - person.cohesion) * 0.05

  delta += (rng.next() - 0.5) * 2
  person.cohesion = clamp(person.cohesion + delta, 0, 255)
}

function applyDriftMale(person, partner, doctrine, rng) {
  let delta = 0
  if (doctrine.smartphones)        delta -= 4              // stronger than female
  if (doctrine.englishSchool)      delta -= 2
  if (doctrine.outsideTrade === 'open') delta -= 2         // stronger than female
  if (doctrine.motorizedFarming)   delta -= 2              // male-specific
  if (doctrine.plainDress)         delta += 2
  if (doctrine.beardForMarried && person.married) delta += 1
  if (doctrine.sundayObservance)   delta += 0.5
  if (doctrine.worshipLanguage === 'plautdietsch') delta += 1
  if (doctrine.shunning)           delta += 0.5

  if (doctrine.higherEdMen === 'permitted' || doctrine.higherEdMen === 'encouraged') delta -= 2

  if (person.origin === 1) {
    const tenure = year - person.arrivalYear
    delta -= Math.max(0, 5 - tenure * 0.5)
  }

  if (partner) delta += (partner.cohesion - person.cohesion) * 0.05
  delta += (rng.next() - 0.5) * 2
  person.cohesion = clamp(person.cohesion + delta, 0, 255)
}
```

Calibration target: under default strict doctrine, both sexes hold above the 200 cohesion line. Permitting smartphones drops average male cohesion ~30 points faster than female over 30 years; permitting higher education for women drops female cohesion ~30 points faster than male over the same period.

### 3. Full Doctrine Sheet

```typescript
interface Doctrine {
  // Marriage
  marriageDoctrine:  'courtship' | 'lateMarriage' | 'modern'
  marriageAge:       number      // 17–22; meaningful only for courtship & modern
  marriageOutside:   'forbidden' | 'permitted'

  // Religion / visible markers
  baptismAge:        'infant' | 'sixteen' | 'believer'
  shunning:          boolean
  worshipLanguage:   'plautdietsch' | 'highGerman' | 'english'
  plainDress:        boolean
  headCovering:      boolean
  beardForMarried:   boolean
  sundayObservance:  boolean

  // Education
  englishSchool:     boolean
  higherEdMen:       'forbidden' | 'tradeOnly' | 'permitted' | 'encouraged'
  higherEdWomen:     'forbidden' | 'tradeOnly' | 'permitted' | 'encouraged'

  // Technology
  smartphones:       boolean
  motorizedFarming:  boolean
  gridElectricity:   boolean

  // Outside contact
  outsideTrade:      'open' | 'restricted' | 'closed'
  inflowPolicy:      'open' | 'vetted' | 'closed'
}
```

`countStrictness(d)` is updated to match the GDD list (~16 items). The enforcement constant is **re-tuned** so that pop=300 strictness=12 still feels manageable and pop=3000 strictness=12 is the schism cliff. Expect to drop the constant from `0.001` to roughly `0.0003` once the strictness ceiling triples — verify by re-running the calibration tests.

### 4. Marriage Doctrines

Phase 1 implements `courtship` only. Phase 2 implements all three.

- **`courtship`** — unchanged from P1. Greedy cohesion-rank pairing.
- **`lateMarriage`** — same as courtship but `effectiveMinAge = max(doctrine.marriageAge, 22)`. Higher unmarried young-adult population means cohesion drift effects (and departures) hit before pairing stabilizes them.
- **`modern`** — probabilistic per-tick pairing per unpaired adult. Probability scales with cohort sex-ratio balance and inversely with cohesion. Separation: each tick, married couples with average cohesion below 100 have a small probability of separating; both partners go back to the unmarried pool. Widows still do not remarry.

Determinism: the `modern` doctrine's per-tick draws use `rng.fork('pairing')` consistently. Test: identical seed + identical doctrine sequence → identical pairings even under modern.

### 5. Modernity Pressure

Per-colony hidden scalar 0–500. Recomputed each tick after cohesion drift, before schism check.

```typescript
function updateModernityPressure(colony) {
  let mp = 0

  // Size pressure (compounds)
  mp += Math.log10(Math.max(10, colony.population.size)) * 30

  // Wealth pressure
  mp += Math.max(0, colony.treasury / 100_000) * 5

  // Tech adoption (each permitted item)
  if (colony.doctrine.smartphones)       mp += 30
  if (colony.doctrine.motorizedFarming)  mp += 20
  if (colony.doctrine.gridElectricity)   mp += 15
  if (colony.doctrine.englishSchool)     mp += 25
  if (colony.doctrine.outsideTrade === 'open') mp += 20

  // Outside contact accumulation
  const inflowMembers = countInflow(colony.population)
  mp += inflowMembers * 0.3

  // Higher ed
  if (colony.doctrine.higherEdMen === 'permitted')   mp += 15
  if (colony.doctrine.higherEdMen === 'encouraged')  mp += 25
  if (colony.doctrine.higherEdWomen === 'permitted') mp += 20
  if (colony.doctrine.higherEdWomen === 'encouraged') mp += 30

  colony.modernityPressure = clamp(mp, 0, 500)
}
```

Surfaced in the colony summary as MP/Cohesion ratio. When MP > avg cohesion, the colony is in the **schism window**.

### 6. Schism

Phase 2's central mechanic. Runs after Modernity Pressure update.

```typescript
function detectSchism(colony, rng): SchismEvent | null {
  if (colony.modernityPressure <= computeMetrics(colony).cohesionAvg) return null

  // Identify factions
  const conservative = peopleWithCohesion(colony, c => c >= 200)
  const liberal      = peopleWithCohesion(colony, c => c < 120)

  // Schism direction: smaller faction splits off
  const splittingFaction = conservative.length < liberal.length ? 'conservative' : 'liberal'
  const splittingMembers = splittingFaction === 'conservative' ? conservative : liberal

  // Threshold: at least 30 members and < 40% of total
  if (splittingMembers.length < 30) return null
  if (splittingMembers.length / colony.population.size > 0.4) return null

  return {
    type: 'schism',
    parentColonyId: colony.id,
    direction: splittingFaction,
    memberIds: splittingMembers,                 // stable IDs
    proposedDoctrine: deriveSchismDoctrine(colony.doctrine, splittingFaction),
    proposedName: deriveSchismName(colony.name, splittingFaction, rng),
  }
}
```

`deriveSchismDoctrine` returns a doctrine that is one step *more strict* (for conservative split) or *more lax* (for liberal split) than the parent, item by item. The player can edit it before granting.

When granted: members + their partners + their unmarried minor children are transferred to a new colony. The transfer mutates two `PopulationStore` instances; lineages are *copied* into a new `LineageRegistry` for the daughter colony, and `livingCount` is recomputed for both registries. The treasury is split proportional to membership share. The new colony starts with no land parcels and a one-time founding grant from the parent treasury (`-$30,000` from parent, `+$30,000` to daughter).

When refused: the splitting faction's average cohesion drops by 20, and a flag is set on the colony that boosts departure probability by 1.5× for the next 3 years. If MP > Cohesion persists for 5 consecutive years after a refused schism, an *uncontrolled* schism fires (the faction departs to Modern West rather than founding a daughter colony — pure population loss).

### 7. Inflow

```typescript
function applyInflow(colony, year, rng) {
  if (colony.doctrine.inflowPolicy === 'closed') return []

  // Modern West inflow willingness drops over time
  const modernWestWillingness = Math.max(0.2, 1.0 - (year - 1960) / 200)

  // Vetted policy halves the rate but raises starting cohesion
  const rate = colony.doctrine.inflowPolicy === 'vetted' ? 0.003 : 0.008

  const expected = colony.population.size * rate * modernWestWillingness
  const count = poissonDraw(expected, rng)

  const events = []
  for (let i = 0; i < count; i++) {
    const sex = rng.next() < 0.5 ? 0 : 1
    const age = 18 + Math.floor(rng.next() * 12)
    const cohesion = colony.doctrine.inflowPolicy === 'vetted'
      ? 80 + Math.floor(rng.next() * 60)
      : 50 + Math.floor(rng.next() * 80)

    // New lineage per inflow member — they are themselves the founder
    const lineageId = registerInflowLineage(colony.lineages, rng)

    const id = addPerson(colony.population, {
      age, sex, cohesion,
      married: 0, partnerId: -1,
      paternalLineage: lineageId,
      maternalLineage: lineageId,
      fatherId: -1, motherId: -1,
      origin: 1, arrivalYear: year,
      firstNameId: pickInflowName(sex, rng),
    })
    events.push({ type: 'inflow', personId: id, year })
  }
  return events
}
```

Inflow surnames come from a separate **inflow surname pool** (~100 generic North American + European surnames). When an inflow member's lineage produces children, those children carry the inflow surname forward.

### 8. Inbreeding Coefficient (Wired In)

Computed at the moment of pairing using the standard kinship formula over both parental lineages:

```typescript
function inbreedingCoefficient(a: number, b: number, store: PopulationStore): number {
  // Walk the ancestor sets via fatherId/motherId. Compute the kinship
  // coefficient via path counting: 0 for unrelated, 0.25 for siblings,
  // 0.0625 for first cousins, etc. Bounded depth: 6 generations.
  const ancestorsA = walkAncestors(a, store, 6)
  const ancestorsB = walkAncestors(b, store, 6)
  let kinship = 0
  for (const [ancestor, depthA] of ancestorsA) {
    const depthB = ancestorsB.get(ancestor)
    if (depthB !== undefined) kinship += Math.pow(0.5, depthA + depthB + 1)
  }
  return clamp(kinship, 0, 0.5)
}
```

Effects:

- **Infant mortality multiplier** for offspring of this pairing: `1 + coefficient * 4` (so first-cousin pairing ~+25% infant mortality).
- **Child starting cohesion** reduction: `coefficient * 30` points subtracted from the average-of-parents starting cohesion.

The pairing record is stored on each spouse so subsequent births can read the coefficient without recomputing.

### 9. Land Parcels and Buildings (Minimal)

Phase 1 economy is `output = adults * 1200`. Phase 2 replaces this with land-driven output.

```typescript
type LandType = 'jungleClearing' | 'farmland' | 'pasture'

interface LandParcel {
  id: string
  type: LandType
  hectares: number
  productivity: number    // 0..1, improves with labor and tech
  purchaseYear: number
}

type Building = 'clinic' | 'dairyPlant'

interface ColonyEconomy {
  parcels:    LandParcel[]
  buildings:  Building[]
}
```

Output per parcel per year:

```
output = hectares
       × baseYield[type]
       × productivity
       × laborMultiplier(adults, totalHectares)
       × techMultiplier(doctrine, buildings)
```

Suggested base yields (BZD per hectare-year): jungleClearing 30, farmland 100, pasture 70. Pasture × dairyPlant = 1.5× multiplier. Motorized farming = 1.3× on farmland and pasture. Sunday observance = 6/7 multiplier on all output (this finally has its mechanical effect).

Productivity climbs from 0.4 toward 1.0 over ~15 years of consistent labor. Jungle clearing converts to farmland or pasture after 10 years of cultivation (player choice via a parcel action).

Buildings:

- **Clinic** ($25,000): infant mortality × 0.5, married women +5% birth probability. Available without doctrine prerequisites.
- **Dairy plant** ($60,000): pasture multiplier 1.5×. Requires `doctrine.englishSchool === true` OR `doctrine.higherEdMen === 'tradeOnly' or 'permitted' or 'encouraged'`.

Founding land for the Cayo colony: 3,000 hectares jungle clearing (matching GDD founding conditions). Daughter colonies start with zero land — the player must spend the founding grant on a first parcel.

### 10. Replay Tool (Engine Only, No UI)

```typescript
function replay(seed: number, doctrineSequence: { year: number, doctrine: Doctrine }[],
                inflowEvents?: ReplayHook[], untilYear: number): Federation
```

Used in tests and by the developer. No UI in P2.

---

## Tick Ordering (Updated)

```typescript
function tick(federation: Federation, rng: RNG): TickResult {
  const events: GameEvent[] = []

  // Per-colony inner tick
  for (const colony of federation.colonies) {
    const cRng = rng.fork(`colony:${colony.id}`)
    ageEveryone(colony.population)
    events.push(...applyDeaths(colony, cRng.fork('deaths')))
    events.push(...pairUp(colony, cRng.fork('pairing')))
    events.push(...applyBirths(colony, cRng.fork('births')))
    if (colony.doctrine.marriageDoctrine === 'modern')
      events.push(...applySeparations(colony, cRng.fork('separations')))
    applyCohesionDrift(colony, cRng.fork('cohesion'))
    events.push(...applyDepartures(colony, cRng.fork('departures')))
    events.push(...applyInflow(colony, federation.year, cRng.fork('inflow')))
    updateLandProductivity(colony)
    updateTreasury(colony)
    updateModernityPressure(colony)
  }

  // Federation-level: schism check
  for (const colony of federation.colonies) {
    const schism = detectSchism(colony, rng.fork(`schism:${colony.id}`))
    if (schism) events.push(schism)   // surfaced to UI; resolution deferred until player responds
  }

  for (const colony of federation.colonies) colony.history.push(toSnapshot(colony, federation.year))
  federation.year += 1
  return { federation, events, metrics: computeFederationMetrics(federation) }
}
```

A schism is *detected* during a tick but *resolved* by player action in the schism modal. The federation can have at most one pending schism at a time; if multiple colonies trigger in the same tick, queue them and resolve in order.

---

## Federation State

```typescript
interface Federation {
  year:               number
  colonies:           Colony[]
  modernWest:         { willingness: number }    // P3 expands this
  pendingSchisms:     SchismEvent[]
  history:            FederationSnapshot[]
}

interface FederationSnapshot {
  year:               number
  totalPopulation:    number
  colonyCount:        number
  totalTreasury:      number
}
```

`Colony` gains `id`, `modernityPressure`, `economy: ColonyEconomy`, `pairingRecords` (kinship at pairing per couple), and `flags` (e.g. `recentRefusedSchism: { year, multiplier }`).

---

## UI Changes

### Header

Replaces the P1 single-colony header. Shows federation year, total population, colony count, and a horizontal strip of colony chips. Selecting a chip focuses the rest of the UI on that colony.

### Colony Summary

Same as P1 plus: MP value and a horizontal MP/Cohesion bar (red zone when MP exceeds cohesion). Shows pending schism warning state.

### Doctrine Sheet (Full V1)

Reorganized into four collapsible sections: **Marriage**, **Religion**, **Education**, **Technology & Outside Contact**. Refusal framing preserved on each item. Each section header shows the strictness count contributed.

### Federation Tab

Lineage living-count bar chart across the federation. Per-colony summary table. MP/Cohesion sparklines.

### Charts

Tabbed view replacing the single P1 chart:
- Population over time (per-colony lines, total line) — P1 chart upgraded.
- Population pyramid for the focused colony.
- TFR by cohesion band over time.
- Cohesion distribution histogram for the focused colony.
- Lineage living-count (federation-wide).

All five charts are D3.

### Schism Modal

Modal that appears when there's a pending schism. Shows splitting faction count, average cohesion, proposed doctrine diff (red/green highlighting against parent), proposed name, "Edit doctrine before granting" action, **Grant** and **Refuse** buttons.

### Building Purchase Action

A small panel under the colony summary listing available buildings, their cost, doctrine prerequisites, and a Build button. Disabled with explanation if treasury or doctrine doesn't permit.

### Land Parcel Panel

List view: type, hectares, productivity bar, purchaseYear. Actions per parcel: convert (jungle clearing → farmland/pasture after 10 years cultivation). Federation-level: buy adjacent parcel (only enabled if treasury sufficient and colony has remaining geographic capacity — capped at 10,000 hectares per colony in P2).

---

## Save Migration (P1 → P2)

```typescript
interface SaveStateV2 {
  version: 2
  seed: number
  federation: Federation
}
```

On load, if `version === 1`:

1. Wrap the P1 colony in a federation with one entry.
2. Generate stable IDs for current population: `nextId = size`, `slotToId[i] = i`, `idToSlot.set(i, i)` for all live slots. Set `partnerId` slots to stable IDs accordingly.
3. Convert P1 doctrine to full doctrine, defaulting new items to the conservative position:
   - `marriageDoctrine: 'courtship'`, `marriageOutside: 'forbidden'`
   - `baptismAge: 'infant'`, `shunning: true`, `worshipLanguage: 'plautdietsch'`, `headCovering: true`, `beardForMarried: true`, `sundayObservance: true`
   - `higherEdMen: 'forbidden'`, `higherEdWomen: 'forbidden'`
   - `motorizedFarming: false`, `gridElectricity: false`
   - `outsideTrade: 'restricted'`, `inflowPolicy: 'closed'`
4. Generate 3,000 hectares jungle clearing parcel with productivity computed from years elapsed since 1960.
5. Set MP from current state.
6. Bump `version` to 2.

Migrated saves are not bit-identical to a fresh P2 run — they are a one-way upgrade. A test verifies migration is idempotent (running migration twice produces the same state as once).

---

## Determinism (Updated)

Determinism still holds:

- `tick(federation, rng)` is pure given `(federation, rng)`. The RNG is forked per colony with a label that includes the colony ID.
- Schism resolution is deterministic for a given player input sequence: the same seed + same doctrine sequence + same schism grant/refuse responses produce the same final federation.
- New `tests/engine/determinism.test.ts` cases:
  - 1960 → 2100 with no schisms (closed colony, low MP).
  - 1960 → 2100 with one granted schism at a deterministic year.
  - 1960 → 2100 with one refused schism.
  - Migration: P1 save → P2 save → 50 ticks vs fresh P2 with equivalent doctrine → trajectories match within a documented tolerance (these *aren't* expected to be bit-identical because the new MP and inflow draws are computed differently; see test for the tolerance).

---

## Folder Structure (Additions)

```
src/
  engine/
    types.ts             ← extended: Federation, full Doctrine, LandParcel, etc.
    population.ts        ← stable-ID map maintained on add/remove
    cohesion.ts          ← split into applyDriftFemale / applyDriftMale
    pairUp.ts            ← all 3 marriage doctrines
    separations.ts       ← NEW (modern-doctrine separations)
    births.ts            ← reads inbreeding coefficient from pairingRecords
    inflow.ts            ← NEW
    inbreeding.ts        ← NEW
    modernity.ts         ← NEW (MP update)
    schism.ts            ← NEW (detect + resolve)
    economy.ts           ← extended: parcels, buildings, productivity
    land.ts              ← NEW (parcel ops)
    buildings.ts         ← NEW
    federation.ts        ← NEW (top-level federation tick + metrics)
    replay.ts            ← NEW (engine-only)
    migrate.ts           ← NEW (P1 → P2 save migration)
  store/
    gameStore.ts         ← federation-aware; selected colony id
  components/
    Header.tsx           ← federation chip strip
    ColonySummary.tsx    ← MP bar
    DoctrineSheet.tsx    ← four collapsible sections
    FederationTab.tsx    ← NEW
    SchismModal.tsx      ← NEW
    LandPanel.tsx        ← NEW
    BuildingPanel.tsx    ← NEW
    charts/
      PopulationChart.tsx       ← upgraded with per-colony lines
      PopulationPyramid.tsx     ← NEW
      TFRByCohesionChart.tsx    ← NEW
      CohesionHistogram.tsx     ← NEW
      LineageBarChart.tsx       ← NEW
    App.tsx              ← chart tab strip; federation header
tests/
  engine/
    stableIds.test.ts
    cohesionSexSpecific.test.ts
    pairUpModern.test.ts
    inflow.test.ts
    inbreeding.test.ts
    modernity.test.ts
    schism.test.ts
    economyParcels.test.ts
    federationTick.test.ts
    determinismP2.test.ts
    migrationP1ToP2.test.ts
```

---

## Build Order (Numbered Tasks, P2)

Each task lands as a PR on a feature branch with passing tests and CI. Skip nothing.

1. **Stable IDs** — extend `PopulationStore` with `idToSlot`/`slotToId`/`nextId`; update `addPerson`/`removePerson`; fix every consumer that treated `partnerId`/`fatherId`/`motherId` as slot indices. Tests: ID survives N removes, ID is never reused after retirement.
2. **Sex-specific cohesion drift** — split `cohesion.ts`. Tests: smartphone permits drop male average faster than female; higher ed for women drops female average faster than male.
3. **Full Doctrine type** — extend type, add converter for old saves (used in step 16). Defaults match Cayo founding doctrine.
4. **Strictness re-tune** — update `countStrictness` to the full GDD list; lower the enforcement constant; verify P1 calibration still passes by holding `defaultDoctrine` to the equivalent strictness.
5. **`pairUp.ts` for all 3 marriage doctrines** — courtship (existing), lateMarriage (min age 22 floor), modern (probabilistic). Tests: late-marriage shifts pairing distribution upward; modern produces lower pairing-rate at low cohesion.
6. **`separations.ts`** — for modern doctrine. Tests: low-cohesion couple separates eventually; high-cohesion couple does not.
7. **`inflow.ts`** — Modern West willingness curve, vetted vs open, new lineage per inflow. Tests: closed → 0; vetted → ~half rate of open; inflow lineage appears in registry.
8. **`inbreeding.ts`** — kinship coefficient via depth-bounded ancestor walk. Tests: siblings → 0.25; first cousins → 0.0625; unrelated → 0; bounded at 6 generations.
9. **Births reads inbreeding** — child starting cohesion subtracts `coef × 30`; infant mortality multiplier `1 + 4 × coef`. Tests: high-coef pairing produces measurably lower child cohesion and higher infant mortality over many ticks.
10. **`modernity.ts`** — MP per colony per tick. Tests: MP rises with size, with permitted tech, with open trade; bounded 0–500.
11. **`schism.ts`** — detect (MP > cohesion + threshold checks) and resolve (transfer members + lineages + treasury split). Tests: granted schism preserves total federation population; refused schism applies cohesion drop and departure multiplier; uncontrolled schism after 5 years of refused-state fires.
12. **`land.ts` / `buildings.ts`** — parcel ops, productivity climb, conversion, building purchases. Tests: clinic halves infant mortality; dairy plant only buildable when prerequisite met; pasture × dairy plant = 1.5× output.
13. **`economy.ts` extended** — output computed from parcels, expenses unchanged, enforcement uses re-tuned constant. Tests: a colony with default founding parcel produces ~$48k/year output at productivity 0.5 (calibration anchor).
14. **`federation.ts`** — `Federation` type, federation-level tick orchestrator, federation metrics. Tests: tick orchestrator forks RNG per colony; identical seed → identical output across federation.
15. **`replay.ts`** — engine-only replay. Tests: replay matches live run for 50 ticks under varied doctrine sequences.
16. **`migrate.ts`** — P1 → P2 save migration. Tests: round-trip stability; migrated state is internally consistent (every `partnerId` resolves; every `fatherId`/`motherId` resolves or is -1).
17. **Determinism tests P2** — full 1960 → 2100 across granted/refused/no-schism scenarios.
18. **`store/gameStore.ts` upgrade** — federation-aware; `selectedColonyId`; new actions (`grantSchism`, `refuseSchism`, `buyParcel`, `buildBuilding`, `convertParcel`, `setDoctrineForColony`).
19. **`persistence/db.ts` upgrade** — version 2 schema; auto-detect and run migration on load.
20. **`Header.tsx` upgrade** — federation chip strip.
21. **`DoctrineSheet.tsx` upgrade** — four collapsible sections, full V1 doctrine.
22. **`ColonySummary.tsx` upgrade** — MP/Cohesion bar.
23. **`SchismModal.tsx`** — proposed doctrine diff view; grant/refuse/edit-then-grant.
24. **`LandPanel.tsx`** — parcel list, conversion, purchase action.
25. **`BuildingPanel.tsx`** — buildings with prerequisite-aware enablement.
26. **`FederationTab.tsx`** — lineage bar chart, per-colony table, MP sparklines.
27. **Chart tabs** — Population pyramid, TFR-by-cohesion, cohesion histogram, lineage bars.
28. **`App.tsx`** — wire federation header, chart tabs, schism modal.
29. **Game-over states (federation)** — federation population = 0 OR every colony deeply insolvent for 5 consecutive years OR year ≥ 2100. End screen shows per-colony fates, lineage extinctions, total federation history.
30. **Manual playthroughs** — play 1960 → 2100 multiple times. Tune MP weights, schism thresholds, inflow rates, parcel yields. Targets:
    - At default doctrine, the Cayo colony reaches a schism between years 2010 and 2050 in most seeds.
    - A federation that grants every schism reaches 4–8 colonies by 2100.
    - A federation that refuses every schism either collapses by 2080 or modernizes (cohesion drops below schism threshold) by 2070.
    - Closed-inflow colonies show measurably elevated infant mortality from inbreeding by year 2050.

---

## Definition of Done for Phase 2

- A fresh visitor opens the URL, sees the 1960 Cayo colony, the full doctrine sheet, and the federation chip strip with one chip.
- Closing and reopening resumes the game, including any pending schism modal state.
- A P1 save loads cleanly into P2 with all new doctrine items defaulted and all population stable IDs assigned.
- Granting a schism in 2030 produces a daughter colony with its own doctrine, treasury, and chart series. Refusing a schism applies the documented penalties.
- The federation reaches at least 2 colonies in at least one playthrough by 2100 under reasonable doctrine.
- Permitting smartphones for 30 years drops male average cohesion measurably faster than female; permitting higher ed for women drops female faster than male.
- Closed-inflow colonies show inbreeding-driven infant mortality climbing measurably across generations vs open-inflow colonies.
- All five charts render and update each tick.
- Determinism: same seed + same doctrine sequence + same schism grant/refuse responses → identical federation at year 2100, verified by test.
- Migration is idempotent and has a regression test.
- All engine tests pass; CI is green.

That is Phase 2. Threat events, Visibility, the Anchor, animations, the SVG map, lineage tree visualization, and Modern West regional unlocks are Phase 3.
