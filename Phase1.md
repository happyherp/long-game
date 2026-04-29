# The Long Game — Phase 1 Specification

> Reduced scope of the full Game Design Document. Phase 1 is the smallest version of the game that runs in the browser and demonstrates the core thesis: doctrine choices compound demographically over decades. A developer should be able to build the entire game described here without referring to the full GDD.

---

## Phase 1 Goal

A browser-runnable single-colony Mennonite demographic simulation, 1960 to 2100, with four doctrine items, that the player can win (population grows over generations) or lose (population collapses to zero or cohesion bottoms out). Determinism via seeded RNG. Auto-save to IndexedDB. One D3 chart.

---

## Out of Scope (Explicit Non-Goals)

The following are described in the full GDD but **must not be implemented in Phase 1**:

- Multiple colonies / federation
- Schism mechanic and daughter colonies
- Modern West depopulation, regional unlocks
- Inflow members (no immigration)
- Threat events, Visibility, the Anchor mechanic
- Genetic bottleneck / inbreeding coefficient (lineages tracked, but no math)
- Land parcel types, buildings (clinic, dairy plant, sawmill, credit union)
- Sex-specific cohesion drift
- All marriage doctrines except courtship
- Religious doctrine items beyond plain dress
- Animation layer
- Replay tool UI (determinism required, but no UI)
- Lineage tree visualization
- Map / SVG colony territories
- Multiple charts (just one in P1)

If a developer is unsure whether something is in scope, the answer is no.

---

## Player Experience in Phase 1

The player:

1. Opens the page. Game auto-loads from IndexedDB if a save exists, otherwise starts a fresh colony in 1960.
2. Sees a single colony summary panel: population, year, treasury, cohesion band, TFR, last year's events.
3. Sees a doctrine sheet with four items, framed as fences around the community. Each item is a toggle. Toggles affect future ticks immediately on next tick.
4. Sees a D3 chart of population over time.
5. Clicks "Next Year". The simulation advances one tick. The summary updates. The chart appends a point. An inline panel below the summary shows what happened that year (births, deaths, departures, cohesion change, treasury delta).
6. Repeats. Plays toward 2100. Loses if population reaches 0 or treasury goes deeply negative for too long. "Wins" by reaching 2100 with a positive population (no fancier win condition in P1).

That is the entire game in Phase 1.

---

## Determinism and RNG

Every engine function that involves randomness takes a seeded PRNG as a parameter. No `Math.random` anywhere in the engine.

```typescript
interface RNG {
  next(): number               // [0, 1)
  nextInt(maxExclusive: number): number
  fork(label: string): RNG     // deterministic sub-stream
}

function createRNG(seed: number): RNG
```

Use a small PRNG library (mulberry32 or sfc32 implemented inline — no dependency). Identical seed + identical inputs must produce identical outputs.

A new game generates a random seed and stores it in the save. Loading a save restores the seed and the full state.

---

## Founding Conditions (Year 1960)

- 280 individuals
- Age distribution: skewed young-family. Suggested mix:
  - 0–5: 60 individuals
  - 6–12: 50
  - 13–17: 30
  - 18–35: 80 (the parent generation)
  - 36–50: 40
  - 51–65: 18
  - 66+: 2
- 50/50 sex ratio
- All adults of marriageable age (18+) are paired
- All adult cohesion seeded at 220–250 (high band)
- Children's cohesion seeded at 200–230
- Treasury: $50,000 (Belize dollars)
- Lineages: 30 founder surnames distributed across the founding population (see surname pool below)

### Founder Surname Pool

```typescript
const FOUNDER_SURNAMES = [
  "Penner", "Reimer", "Dueck", "Friesen", "Wiebe", "Klassen",
  "Loewen", "Janzen", "Thiessen", "Neufeld", "Hiebert", "Plett",
  "Toews", "Harder", "Funk", "Bergen", "Kroeker", "Unger",
  "Schmidt", "Epp", "Peters", "Martens", "Fehr", "Wall",
  "Braun", "Enns", "Giesbrecht", "Hildebrand", "Dyck", "Rempel"
]
```

Each founder is assigned a paternal and maternal lineage from this pool. Display name is `FirstName Paternalsurname` (e.g. "Helena Penner"). First names are pulled from a fixed list of ~50 male and ~50 female traditional Mennonite first names (Helena, Maria, Anna, Katharina, Susanna, Sara, Margaretha, Elisabeth, Aganetha, Tina; Johann, Peter, Heinrich, Jakob, Abraham, Isaak, David, Cornelius, Wilhelm, Bernhard, etc.).

---

## Engine

### Types

```typescript
interface PopulationStore {
  age:              Uint8Array     // 0–89
  sex:              Uint8Array     // 0=F, 1=M
  cohesion:         Uint8Array     // 0–255
  married:          Uint8Array     // 0/1
  partnerId:        Int32Array     // -1 if single
  paternalLineage:  Uint16Array    // index into LineageRegistry
  maternalLineage:  Uint16Array    // index into LineageRegistry
  firstNameId:      Uint8Array     // index into first name table

  capacity: number
  size:     number
}

interface LineageRegistry {
  surnames:     string[]
  livingCount:  Uint32Array        // current living descendants per lineage
}

interface Doctrine {
  smartphones:     boolean         // false = forbidden (refused)
  englishSchool:   boolean
  plainDress:      boolean         // true = required
  marriageAge:     number          // 17–22 inclusive
}

interface Colony {
  name:        string
  population:  PopulationStore
  doctrine:    Doctrine
  lineages:    LineageRegistry
  treasury:    number
  year:        number
  history:     YearSnapshot[]
}

interface YearSnapshot {
  year:           number
  population:     number
  tfr:            number
  cohesionAvg:    number
  treasury:       number
  births:         number
  deaths:         number
  departures:     number
}

interface ColonyMetrics {
  totalPopulation:    number
  femaleCount:        number
  maleCount:          number
  medianAge:          number
  tfr:                number
  cohesionAvg:        number     // 0–255
  cohesionBand:       'low' | 'medium' | 'high'
  treasury:           number
  birthsThisYear:     number
  deathsThisYear:     number
  departuresThisYear: number
}

interface GameEvent {
  type:     'birth' | 'death' | 'departure' | 'pairing'
  personId: number
  year:     number
  payload?: unknown
}

interface TickResult {
  colony:  Colony
  events:  GameEvent[]
  metrics: ColonyMetrics
}
```

### Population Store Operations

Pure functions. Mutating an individual means writing the new value at index `id`.

- `createStore(capacity: number): PopulationStore` — allocate parallel arrays.
- `addPerson(store, attrs): number` — append, return new ID. Grow capacity if needed (double).
- `removePerson(store, id): void` — swap-and-pop with last live person; size decrements; the moved person's ID changes. **No tombstones.**
- `getAlive(store): Iterable<number>` — yields IDs 0..size-1. Anything past `size` is unused capacity.

Stable IDs are not maintained across ticks in Phase 1 — the swap-and-pop changes IDs on removal. This is fine for P1 because there is no animation layer subscribing to IDs. (The full GDD requires stable IDs via an idToIndex map; defer this to Phase 2.)

### Tick Ordering

Strictly fixed order each year:

```typescript
function tick(colony: Colony, year: number, rng: RNG): TickResult {
  // 1. Aging
  ageEveryone(colony.population)

  // 2. Deaths
  const deathEvents = applyDeaths(colony.population, rng.fork('deaths'))

  // 3. Pairings
  const pairEvents = pairUp(colony, rng.fork('pairing'))

  // 4. Births
  const birthEvents = applyBirths(colony, rng.fork('births'))

  // 5. Cohesion drift
  applyCohesionDrift(colony, rng.fork('cohesion'))

  // 6. Departures
  const departureEvents = applyDepartures(colony, rng.fork('departures'))

  // 7. Economy + enforcement
  updateTreasury(colony)

  // 8. Metrics
  const metrics = computeMetrics(colony)

  // 9. History append
  colony.history.push(toSnapshot(metrics, year))

  // 10. Year increment
  colony.year = year + 1

  return {
    colony,
    events: [...deathEvents, ...pairEvents, ...birthEvents, ...departureEvents],
    metrics
  }
}
```

Consequence: a person who dies this year cannot have a child this year. A person who pairs this year may have a child next year at earliest.

### Death Model

Age-banded annual death probability:

| Age band | Probability |
|---|---|
| Under 1 | 2% |
| 1–15 | 0.1% |
| 15–50 | 0.3% |
| 50–65 | 1% |
| 65–75 | 3% |
| 75–85 | 8% |
| 85–89 | 20% |
| 90 | 100% (hard cap) |

For each alive person, draw against the band probability. If dead, remove via swap-and-pop. If the deceased had a partner, mark partner as single (`married = 0`, `partnerId = -1`). Update `lineages.livingCount` for both lineages.

### Pairing (Courtship Doctrine Only)

Per tick, build two lists: unmarried males ≥ doctrine.marriageAge, unmarried females ≥ doctrine.marriageAge. Both lists sorted by cohesion descending. Pair them greedily by cohesion-rank: highest-cohesion male with highest-cohesion female, etc. Any surplus from either list stays unpaired this year and retries next year. Mark both as `married = 1`, set `partnerId` to each other. Emit a `pairing` event per pair.

(The full GDD has three marriage doctrines with probabilistic pairing under "Modern relationship". Phase 1 implements only this deterministic courtship variant.)

### Birth Model

For each married woman aged 16–44, draw against birth probability:

```typescript
function birthProbability(motherCohesion: number, age: number, doctrine: Doctrine): number {
  // Base probability shaped to produce realistic TFR by cohesion band
  const cohesionFactor = motherCohesion / 255   // 0..1
  
  // Age curve, peaks around 25
  const ageFactor = ageCurve(age)               // 0..1
  
  // Base rate calibrated so high-cohesion + courtship + age 25 produces ~7 lifetime births
  const base = 0.30
  
  return base * cohesionFactor * ageFactor
}
```

Calibration target TFR by aggregate cohesion band, courtship doctrine, no clinic:
- High band: ~7.0
- Medium band: ~3.5
- Low band: ~1.6

If a birth occurs:
- Sex: 50/50 RNG draw
- Starting cohesion: average of mother's and father's cohesion, ± up to 20 RNG-jitter
- Paternal lineage: father's paternal lineage
- Maternal lineage: mother's paternal lineage
- First name: random from sex-appropriate name list
- Append to PopulationStore
- Increment `livingCount` for both lineages
- Emit `birth` event

### Cohesion Drift (Per Tick, Per Person)

Single drift function in P1 (sex-specific in V1).

```typescript
function applyDrift(person, partner, doctrine, rng) {
  let delta = 0

  // Doctrine-driven drift
  if (doctrine.smartphones)    delta -= 3
  if (doctrine.englishSchool)  delta -= 2
  if (doctrine.plainDress)     delta += 2

  // Partner-pull (if married)
  if (partner) {
    const pull = (partner.cohesion - person.cohesion) * 0.05
    delta += pull
  }

  // Small random jitter
  delta += (rng.next() - 0.5) * 2

  person.cohesion = clamp(person.cohesion + delta, 0, 255)
}
```

Note: `delta` is a float; round at write time. Use a Float32 accumulator if needed, or just round each tick.

### Departure Model

Per individual (not children under 13):

```typescript
function departureProbability(person, partner, doctrine): number {
  // Base by cohesion: low cohesion → high departure
  const cohesionFactor = 1 - (person.cohesion / 255)   // 0..1
  
  // Age factor: peaks 16-25
  const ageFactor = ageDepartureCurve(person.age)      // 0..1
  
  // Doctrine modifiers
  let mult = 1.0
  if (doctrine.smartphones)    mult *= 1.8
  if (doctrine.englishSchool)  mult *= 1.4
  
  // Partner cohesion suppresses
  if (partner && partner.cohesion > 200) mult *= 0.4
  
  // Base rate calibrated so a low-cohesion young adult has ~5%/yr departure under permissive doctrine
  const base = 0.025
  
  return base * cohesionFactor * ageFactor * mult
}
```

If departure occurs: remove from PopulationStore (swap-and-pop). If had partner, mark partner as single. Decrement lineage `livingCount` for both. Emit `departure` event.

### Economy + Enforcement Cost

Phase 1 economy is intentionally simple — no land parcels, no buildings.

```typescript
function updateTreasury(colony) {
  const adults = countAdults(colony.population)        // 18–65
  
  // Per-adult output (rough Belize-1960 farming yield in BZD)
  const output   = adults * 1200
  
  // Per-capita expenses
  const expenses = colony.population.size * 600
  
  // Enforcement cost — quadratic in pop, linear in strictness
  const strictness = countStrictness(colony.doctrine)
  const enforcement = colony.population.size ** 2 * strictness * 0.001
  
  colony.treasury += output - expenses - enforcement
}

function countStrictness(d: Doctrine): number {
  let s = 0
  if (!d.smartphones)   s++   // refusing smartphones = +1 strictness
  if (!d.englishSchool) s++
  if (d.plainDress)     s++
  // marriageAge 17-19 = +1 (early marriage is strict)
  if (d.marriageAge <= 19) s++
  return s
}
```

Calibration: a colony of 280 with strictness 4 has enforcement cost 280² × 4 × 0.001 = $314/yr. A colony of 2,800 with strictness 4 has enforcement cost 31,360. Tunes to feel like real pressure around 2,000–3,000 population.

If treasury goes deeply negative (< -$50,000) for 5 consecutive years, the colony loses (game over screen).

### Metrics

```typescript
function computeMetrics(colony): ColonyMetrics {
  const pop = colony.population
  const total = pop.size
  
  let females = 0, males = 0, cohesionSum = 0
  for (let i = 0; i < total; i++) {
    if (pop.sex[i] === 0) females++; else males++
    cohesionSum += pop.cohesion[i]
  }
  
  const cohesionAvg = total > 0 ? cohesionSum / total : 0
  const cohesionBand = cohesionAvg < 85 ? 'low' : cohesionAvg < 170 ? 'medium' : 'high'
  
  // TFR: rolling 5-year average of (births / female 15-49 count)
  const tfr = computeRollingTFR(colony.history)
  
  return {
    totalPopulation: total,
    femaleCount: females,
    maleCount: males,
    medianAge: computeMedianAge(pop),
    tfr,
    cohesionAvg,
    cohesionBand,
    treasury: colony.treasury,
    birthsThisYear: lastSnapshotBirths(colony.history),
    deathsThisYear: lastSnapshotDeaths(colony.history),
    departuresThisYear: lastSnapshotDepartures(colony.history),
  }
}
```

---

## Doctrine UI (Refusal-Framed)

Four items, each as a toggle (or slider for marriage age). Frame the panel as "The Fence Around the Community". Each item label reads as a fence; each item description reads as what the community is protected from.

```
The Fence Around the Community
─────────────────────────────────

[ no  ] Smartphones
        We protect the household from outside coordination.
        Permitting smartphones doubles young-adult departure risk.

[ no  ] English-language schooling
        We protect the children's identity from the outside language.
        Permitting English schooling raises departure risk and lowers cohesion drift.

[ yes ] Plain dress
        We mark ourselves visibly as a people apart.
        Plain dress contributes to cohesion stability.

[ 19  ] Age of marriage
        Earlier marriage compounds generations faster.
        Later marriage reduces young-adult departure risk.
        Range: 17 – 22.
```

A "yes" or "permitted" reads as a concession; a "no" or "refused" reads as a held fence. Every change to doctrine takes effect on the next tick.

---

## UI Layout

A single-page React app. No routing. Three regions:

```
┌───────────────────────────────────────────────────────────────┐
│  Cayo Colony — Year 1960               [Next Year]            │ ← header
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────┐  ┌────────────────────────────┐  │
│  │ Colony Summary          │  │ The Fence Around the       │  │
│  │                         │  │ Community                  │  │
│  │ Population: 280         │  │                            │  │
│  │ TFR: —                  │  │ [doctrine toggles here]    │  │
│  │ Cohesion: high (235)    │  │                            │  │
│  │ Treasury: $50,000       │  │                            │  │
│  │                         │  │                            │  │
│  │ Last year:              │  │                            │  │
│  │  Births: —              │  │                            │  │
│  │  Deaths: —              │  │                            │  │
│  │  Departures: —          │  │                            │  │
│  └─────────────────────────┘  └────────────────────────────┘  │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Population over time                                    │  │
│  │ [D3 line chart: x = year, y = total population]         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

The **Last year** block under Colony Summary is the inline annual report — no modal in P1. After clicking Next Year, the numbers update.

---

## Persistence

Auto-save to **IndexedDB** after every tick. Use the `idb` library to keep code clean.

Save shape:

```typescript
interface SaveState {
  version: 1
  seed: number
  colony: Colony           // includes population, lineages, doctrine, history, year
  // Note: typed arrays serialize natively into IndexedDB without conversion
}
```

On page load:
1. Open IndexedDB, look up the latest save.
2. If found, hydrate Zustand store with it.
3. If not found, initialize a new colony with founding conditions and a freshly-generated seed.

Provide a "New Game" button that wipes the save and starts fresh (with confirmation prompt — auto-save is overwritten, so this is destructive).

No save slots, no export/import, no JSON in P1.

---

## Tech Stack (P1)

- **Vite** — build tool
- **React 18** — UI
- **TypeScript** — strict mode
- **Zustand** — state
- **D3** — the one chart
- **Tailwind CSS** — styling
- **shadcn/ui** — buttons, panels, toggles
- **idb** — IndexedDB wrapper
- **Vitest** — engine tests

No router. No animation libraries. No additional chart libraries.

---

## Folder Structure

```
src/
  engine/
    types.ts
    rng.ts
    population.ts        ← typed array ops, swap-and-pop
    lineage.ts
    names.ts             ← surname + first name pools
    doctrine.ts
    pairUp.ts
    births.ts
    deaths.ts
    departures.ts
    cohesion.ts
    economy.ts
    metrics.ts
    tick.ts              ← orchestrator
    founding.ts          ← year-zero colony generator
  store/
    gameStore.ts         ← Zustand
  persistence/
    db.ts                ← IndexedDB via idb
  components/
    Header.tsx
    ColonySummary.tsx
    DoctrineSheet.tsx
    PopulationChart.tsx  ← D3
    App.tsx
  main.tsx
tests/
  engine/
    rng.test.ts
    population.test.ts
    pairUp.test.ts
    births.test.ts
    deaths.test.ts
    departures.test.ts
    cohesion.test.ts
    economy.test.ts
    tick.test.ts
    determinism.test.ts  ← same seed → same result
```

---

## Build Order (Numbered Tasks)

Each task should land as a PR with passing tests. Skip nothing.

1. **Project scaffold** — Vite + React + TS + Tailwind + shadcn/ui + Vitest. Verify dev server runs.
2. **`engine/rng.ts`** — seeded PRNG (mulberry32), `fork()`, tests for determinism.
3. **`engine/types.ts`** — all P1 types.
4. **`engine/names.ts`** — surname pool, first name pools.
5. **`engine/population.ts`** — store ops (create, add, remove via swap-and-pop, grow capacity), tests.
6. **`engine/lineage.ts`** — registry ops, tests.
7. **`engine/founding.ts`** — generate year-1960 colony deterministically from seed, tests.
8. **`engine/deaths.ts`** — mortality model, tests (statistical: run 10,000 ticks and verify band probabilities).
9. **`engine/pairUp.ts`** — courtship pairing, tests (deterministic, sex-balanced).
10. **`engine/births.ts`** — birth model, tests (target TFR per cohesion band, calibrated within ±15%).
11. **`engine/cohesion.ts`** — drift model, tests (high cohesion stays high under strict doctrine; collapses under lax).
12. **`engine/departures.ts`** — departure model, tests (smartphone permits raise departure rate measurably).
13. **`engine/economy.ts`** — treasury update, enforcement cost, tests (quadratic-in-population verified).
14. **`engine/metrics.ts`** — metrics computation, tests.
15. **`engine/tick.ts`** — orchestrator, tests for tick ordering and determinism.
16. **`engine/determinism.test.ts`** — full game determinism: same seed + same doctrine sequence → same final state at year 2100.
17. **`store/gameStore.ts`** — Zustand store, actions: `tick`, `setDoctrine`, `newGame`.
18. **`persistence/db.ts`** — IndexedDB save/load via idb.
19. **`components/Header.tsx`** — colony name, year, Next Year button.
20. **`components/ColonySummary.tsx`** — read-only summary panel.
21. **`components/DoctrineSheet.tsx`** — refusal-framed doctrine UI with toggles and marriage age slider.
22. **`components/PopulationChart.tsx`** — D3 line chart from `colony.history`.
23. **`components/App.tsx`** — page layout, wire everything together.
24. **Auto-save integration** — subscribe to store, save after each tick.
25. **Auto-load integration** — on app mount, restore from save if present.
26. **Game-over states** — population = 0 OR treasury < -$50,000 for 5 years OR year ≥ 2100. Display end screen with summary stats.
27. **Manual playthrough** — play 1960 → 2100 a few times with varying doctrines. Tune calibration constants until results feel right.

---

## Definition of Done for Phase 1

The game is "done" with Phase 1 when:

- A fresh visitor can open the URL, see the 1960 colony, click Next Year, and watch the simulation advance.
- Closing and reopening the browser tab resumes the game where it was.
- Toggling smartphones from refused to permitted and running 30 years produces a measurably worse cohesion outcome than holding the fence.
- The game ends naturally at 2100 (or earlier on collapse) and shows a final summary.
- All engine tests pass.
- The full 1960 → 2100 run is deterministic given a fixed seed and doctrine sequence (verified by test).

That is Phase 1. Anything else listed in the full GDD is Phase 2 or later.
