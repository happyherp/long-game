# The Long Game — Game Design Document

---

## Overview

**The Long Game** is a browser-based demographic strategy game. The player authors the doctrine of a Mennonite community and guides it across generations — watching it grow, splinter, modernize, or hold firm. The core tension: every mechanism that accelerates growth also accelerates cultural erosion. The player who wins is the one who figures out which technologies and policies to *refuse*, not just which to adopt.

The game is grounded in real demographic mechanics: TFR compounding, cohesion drift, schism dynamics, lineage tracking, genetic bottleneck pressure, and the slow demographic collapse of modern Western society as backdrop and pressure.

The doctrine UI is framed around **refusal**: every adopted item is a concession the community has made to the outside world; every refused item is a fence around the community. Over decades, the doctrine sheet becomes a chronicle of which fences were held and which were given up.

---

## Version 1 Scope

The player always starts as a **Mennonite** community arriving in the **Cayo District of Belize** in **1960** — the historical basis for the Spanish Lookout colony. The horizon is **1960 to 2100**.

Time advances by **annual tick, turn-based**. There is a "Next Year" button. No auto-advance, no game speed, no real-time.

---

## Setting and Actors

The world contains two demographic actors in V1:

| Actor | Description |
|---|---|
| **Mennonites (player)** | Starting community in Cayo District, Belize. High TFR, high cohesion, agriculturally self-sufficient. The federation grows from this seed. |
| **Modern West** | A single aggregate population number with declining TFR (~1.4 in 1960, drifting to ~1.1 by 2080) and a fixed mortality curve. Depopulates on its own. Source of cultural pressure, institutional threats, inflow members, and — eventually — empty regions to settle. |

After 2050, specific named regions in the Modern West become **available for settlement** at population thresholds. Suggested set: rural Saxony-Anhalt (Germany), Castilla-La Mancha (Spain), the Saguenay region (Quebec), and the Iowa farm belt. Each unlocks at a defined Modern West regional population floor.

---

## Core Vocabulary

| Term | Definition |
|---|---|
| **Colony** | A single geographically distinct Mennonite settlement, governed by its own doctrine. |
| **Doctrine** | The ruleset the player authors for a colony — controls technology, marriage norms, schooling, religious practice, outside contact. |
| **Cohesion** | A 0–255 scalar per individual measuring how tightly they hold community values. High cohesion = low departure risk, high fertility contribution, high doctrine compliance. Displayed as low/medium/high bands. |
| **TFR** | Total Fertility Rate. Average children per woman. |
| **Inflow** | Men or women from the Modern West who apply to join a colony. |
| **Departure** | Members who leave a colony for the surrounding world. Emergent outcome of cohesion, age, doctrine exposure, household conditions — never player-triggered. |
| **Visibility** | Outside institutional attention attracted by the colony. Modifies the probability of threat events when their causal triggers fire. |
| **The Anchor** | Economic indispensability threshold to Belize. Once crossed, the Belizean state has a positive reason to shield the colony, and Visibility flips polarity. |
| **Modernity Pressure (MP)** | A hidden accumulating variable per colony. Rises with wealth, size, tech adoption, outside contact. When MP exceeds Cohesion, schism events fire. |
| **Schism** | A colony splitting into two daughter colonies with diverging doctrines. Direction depends on internal population distribution. |
| **Lineage** | A founder family line, identified by surname. Each individual belongs to two lineages (paternal and maternal). |

---

## What the Player Controls

The player controls **Doctrine** — the ruleset for each colony.

- The player does not directly command people.
- The player writes and amends community norms, policies, and frameworks.
- The population lives inside those rules and produces emergent outcomes.
- Cohesion determines how faithfully individuals follow doctrine.
- A colony that rewrites its own doctrine through internal pressure is undergoing a schism. The player decides which resulting colony to continue authoring.

The player governs a **federation of colonies** under potentially different doctrines. As the federation grows, managing divergence between colonies becomes the central challenge.

---

## Determinism and RNG

Every engine function that involves randomness takes a seeded PRNG as a parameter. There is **no use of `Math.random` anywhere in the engine**. Identical seed + identical inputs produces identical outputs across all platforms and runs.

```typescript
interface RNG {
  next(): number       // [0, 1)
  nextInt(maxExclusive: number): number
  fork(label: string): RNG    // deterministic sub-stream
}

function tick(colony: Colony, doctrine: Doctrine, year: number, rng: RNG): TickResult
function pairUp(colony: Colony, doctrine: Doctrine, rng: RNG): PairingEvent[]
```

This enables a deterministic replay tool from day one: any seed + initial state can be re-run forward to year N to reproduce the exact sequence of events. Used for debugging, balance, and player-shareable replays.

---

## Save / Load

Auto-save runs every tick to **IndexedDB**. Typed arrays serialize cleanly into IndexedDB without conversion overhead. Closing and reopening the browser resumes the game where it left off by default.

Manual save slots and named saves are supported. Export-to-file and import-from-file produce a JSON-wrapped save bundle suitable for sharing.

---

## Core Game Loop

Three interdependent meters per colony, all surfaced in the colony summary panel:

- **Population** — raw headcount, driven by TFR and age structure.
- **Cohesion** — aggregate weighted average across all individuals. Drives TFR, departure rate, doctrine compliance.
- **Visibility** — outside institutional attention. Modifies threat event probability once causal triggers fire.

Growth raises Visibility. Tech adoption raises productivity but lowers Cohesion. Cohesion drives TFR. The Anchor is a threshold — once crossed, Visibility flips from liability to strategic asset, and "Anchor leverage" becomes a valid response to threat events.

---

## Population Model

Every person is a real individual with a stable integer ID. Rather than an array of person objects, the model uses **parallel typed arrays** — one array per attribute, all indexed by person ID.

```typescript
interface PopulationStore {
  // parallel arrays — index is person ID
  age:           Uint8Array     // 0–89
  sex:           Uint8Array     // 0=female, 1=male
  cohesion:      Uint8Array     // 0–255
  married:       Uint8Array     // 0=single, 1=married
  children:      Uint8Array     // count; meaningful for females
  partnerId:     Int32Array     // index of partner, -1 if single
  paternalLineageId: Uint16Array   // index into LineageRegistry
  maternalLineageId: Uint16Array   // index into LineageRegistry
  fatherId:      Int32Array     // -1 if founder
  motherId:      Int32Array     // -1 if founder
  origin:        Uint8Array     // 0=born-in, 1=inflow
  arrivalYear:   Int16Array     // year joined colony; for inflow drift rate

  capacity:      number         // allocated array size
  size:          number         // count of live persons
}
```

**Dead persons are not retained.** When a person dies or departs, their slot is freed and the store is compacted. Stable person IDs are maintained via an `idToIndex` map separate from the contiguous live arrays. The animation layer uses person ID for keying; compaction does not break it.

```typescript
interface Colony {
  id:         string
  name:       string
  population: PopulationStore
  doctrine:   Doctrine
  metrics:    ColonyMetrics
  land:       LandParcel[]
  treasury:   number         // Belize dollars
  lineages:   LineageRegistry
}
```

### Lineage Registry

```typescript
interface LineageRegistry {
  surnames:   string[]              // 0..N, indexed by lineage ID
  founderIds: Int32Array            // person ID of founding ancestor per lineage
  bornCount:  Uint32Array           // running count of descendants per lineage
  livingCount: Uint32Array          // current living descendants per lineage
}
```

Founding surname pool (Russian Mennonite / Plautdietsch tradition, ~30 names):

> Penner, Reimer, Dueck, Friesen, Wiebe, Klassen, Loewen, Janzen, Thiessen, Neufeld, Hiebert, Plett, Toews, Harder, Funk, Bergen, Kroeker, Unger, Schmidt, Epp, Peters, Martens, Fehr, Wall, Braun, Enns, Giesbrecht, Hildebrand, Dyck, Rempel.

Each individual carries both paternal and maternal lineage IDs. Display name uses paternal surname by default; lineage charts and inbreeding computations use both.

### Memory and Performance

| Colony size | Memory | Tick time (est.) |
|---|---|---|
| 100 people | ~2 KB | < 1ms |
| 1,000 people | ~20 KB | ~1ms |
| 5,000 people | ~100 KB | ~5ms |
| 10,000 people | ~200 KB | ~15ms |

10,000 individuals fits trivially in a browser. There is no aggregate fallback model in V1 — colonies of any size are individually simulated.

### Mapping to Graphics

The animation layer maintains parallel position arrays indexed by person ID:

```typescript
const posX: Float32Array
const posY: Float32Array
```

Every demographic event references a specific person ID. The animation layer subscribes to the engine event bus and responds.

---

## Tick Ordering

A single year-tick runs in this fixed order. Order matters for determinism and for resolving edge cases:

1. **Aging** — every alive person's age increments by 1.
2. **Deaths** — apply mortality curve; remove dead individuals; compact store.
3. **Pairings** (`pairUp`) — eligible singles attempt to pair under current doctrine.
4. **Births** — for each married woman 16–44, draw against birth probability.
5. **Cohesion drift** — apply per-individual cohesion drift (sex-specific, doctrine-specific).
6. **Departures** — per-individual draw against departure probability; remove departed individuals.
7. **Inflow** — under open or vetted policy, draw new members from Modern West.
8. **Economy** — compute land output, expenses, treasury delta.
9. **Enforcement cost** — deduct doctrine enforcement cost from treasury.
10. **Modernity Pressure update** — recompute MP from doctrine and exposure.
11. **Schism check** — if MP exceeds Cohesion, fire schism event.
12. **Threat event check** — evaluate causal triggers; fire events with probability modified by Visibility.
13. **Metrics computation** — derive `ColonyMetrics` snapshot.
14. **Event bus flush** — emit accumulated `GameEvent`s.

Consequence: someone who dies this year does not have a child this year. Someone who pairs this year may have a child next year at earliest. A child born this year ages into a 1-year-old at the start of next tick.

---

## Founding Conditions (Year Zero — 1960)

The starting Cayo colony:

- **280 individuals**, age distribution skewed young-family (many children, few elderly).
- **50/50 sex ratio**.
- **All adult cohesion = high** (220–250 range).
- **All adults of marriageable age are paired**.
- **~30 founder lineages** drawn from the surname pool, distributed across the founding population.
- **Treasury** sufficient for initial land purchase and 2 years of operations.
- **Land**: ~3,000 hectares jungle clearing.
- **Doctrine defaults**: courtship-with-inflow marriage, infant baptism, shunning, Plautdietsch worship, plain dress on, head covering on, beard for married men on, conscientious objection mandatory, Sunday observance on, marriage outside forbidden, higher education forbidden for both sexes, motorized farming forbidden, grid electricity forbidden, English schooling forbidden, smartphones forbidden, outside trade restricted, inflow vetted.

---

## Doctrine System

The doctrine sheet is the primary player interface. It is framed as **The Fence Around the Community** — a list of what the community is protecting itself from. Every adopted item reads as a past concession; every refused item reads as a current protection.

UI copy example:

> **The Fence Around the Community**
> ☐ Smartphones — *break the household to outside influence*
> ☐ Motorized farming — *separate young men from the land*
> ☐ English-language schooling — *open the door to outside identity*
> ☑ Grid electricity — *we have accepted this; the next generation will not remember refusing it*

The toggles are mechanically the same as a permit/forbid list. The framing is what makes adoption feel weighty.

### Marriage Doctrine (3 V1 options)

| Option | Description | Effect |
|---|---|---|
| **Open courtship including inflow** | Young adults pair off from a pool that includes same colony, federation, and inflow members. Elders bless. Permanent monogamy. | High cohesion, high TFR, useful for absorbing sex-ratio imbalance. |
| **Late marriage permitted** | Minimum pairing age rises to 22+. Permanent monogamy. | Lower lifetime TFR, but reduces young-adult departure risk because fewer peers leave the community unmarried in the high-risk window. |
| **Modern relationship** | Pairing starts ~18, separation possible, individuals can return to the unmarried pool. Permanent monogamy is no longer required. | Sharply lower TFR, weaker partner-cohesion buffer (a partner who can leave provides less cohesion stability than one who cannot). |

**Widows do not remarry in V1**, regardless of doctrine.

### Pairing Mechanics

Under **Open courtship** and **Late marriage**, pairing is largely deterministic: eligible same-cohort singles are matched with weight given to cohesion compatibility (high-cohesion individuals strongly prefer high-cohesion partners). Sex-ratio imbalance in a cohort leaves the surplus sex unpaired that year; they retry next year.

Under **Modern relationship**, pairing is probabilistic: per unpaired adult, a per-tick draw occurs. Probability scales with cohort sex-ratio (more imbalance = lower) and inversely with cohesion (low-cohesion individuals are likelier to pair under modern norms; high-cohesion individuals hold out for cohesion-compatible partners and may go unpaired indefinitely). Separation also occurs probabilistically in low-cohesion couples; separated individuals return to the unmarried pool.

### Religious Doctrine (V1)

| Item | Options | Notes |
|---|---|---|
| **Baptism age** | Infant / At 16 / Believer's (adult choice) | Infant baptism deepens lineage cohesion inheritance; believer's baptism creates a vulnerable adolescent cohesion window. |
| **Excommunication** | None / Shunning (Meidung) | Shunning cuts a departed individual off from family contact. Reduces ongoing cohesion damage to remaining family (the wound closes), but increases the one-time cohesion shock to the household and adds Visibility (outside world finds shunning newsworthy). |
| **Language of worship** | Plautdietsch / High German / English | Plautdietsch maximizes cohesion, blocks English schooling synergies. High German is a middle ground. English maximizes integration with inflow and outside trade but is the largest cohesion drain among the three. |
| **Plain dress** | Yes / No | Visible marker. +cohesion contribution, -Visibility while colony is small (outside finds it quaint), polarity reverses if colony grows large with plain dress on (becomes media-ready). |
| **Head covering for women** | Yes / No | Visible marker. Cohesion + Visibility dynamics same as plain dress. |
| **Beard for married men** | Yes / No | Visible marker. Same dynamics. |
| **Conscientious objection** | Mandatory / Individual choice | Pure flavor in V1 (Belize has no draft). Becomes mechanical only if a Modern West conscription event fires post-2080. |
| **Sunday observance** | Yes / No | -1/7 economic output, +small cohesion contribution. |
| **Marriage outside the faith** | Forbidden / Permitted | Permitting drops cohesion of the marrying-out individual, removes them and any future children from lineage tracking. |
| **Higher education for men** | Forbidden / Trade only / Permitted / Encouraged | Trade only unlocks dairy plant, sawmill, credit union purchases. Permitted/Encouraged accelerates male cohesion drift. |
| **Higher education for women** | Forbidden / Trade only / Permitted / Encouraged | Same productivity unlocks. Permitted/Encouraged accelerates female cohesion drift more sharply than the male equivalent (see drift model). |

Mechanical-vs-flavor flags in spec:

- **Mechanical (substantial engine effect)**: Excommunication, Higher education (both), Marriage outside, Language of worship, Baptism age.
- **Visible-marker cluster**: Plain dress, head covering, beard.
- **Flavor / small effect in V1**: Sunday observance, conscientious objection.

### Technology Doctrine

| Item | Options | Upside | Downside |
|---|---|---|---|
| Motorized farming | Permit / Forbid | +crop yield, +treasury | +departure risk for young men; purpose gap |
| Grid electricity | Permit / Forbid | +productivity, unlocks next tier | External infrastructure dependency; +MP |
| English schooling | Permit / Forbid | +trade capacity, +inflow compatibility | +MP; outside cultural exposure for children |
| Smartphones | Permit / Forbid | +coordination, +commerce | Departure rate doubles in young cohorts |
| Community clinic | Build / None | -mortality, +TFR via healthier pregnancies | +small Visibility/year (outside-trained staff) |
| Dairy plant | Build / None | +50% productivity multiplier on pasture | Requires English schooling permitted (or trade-only higher ed for men) for trade contacts |
| Outside trade | Open / Restricted / Closed | +treasury, +Anchor progress | +Visibility, +MP |
| Inflow policy | Open / Vetted / Closed | Absorbs gender imbalance; +labor | Integration risk; outside values infiltration |

---

## Cohesion Drift (Sex-Specific)

Cohesion is a 0–255 scalar per individual. Each tick, every individual's cohesion drifts. The drift function is sex-specific.

**Common drift factors (both sexes):**
- Smartphone permitted: -drift
- English schooling permitted: -drift
- Outside trade open: -drift
- Partner cohesion: high-cohesion partner pulls individual cohesion upward; low-cohesion partner pulls downward
- Inflow origin with recent arrival year: -drift offset that decays with tenure

**Female-specific accelerators:**
- Higher education for women permitted/encouraged: -drift
- English schooling: stronger -drift contribution than male equivalent
- Modern relationship doctrine active: -drift

**Male-specific accelerators:**
- Motorized farming permitted: -drift (separates young men from communal labor rhythms)
- Outside trade open: stronger -drift contribution than female equivalent
- Smartphones permitted: -drift

**Stabilizers (both sexes):**
- Plain dress / head covering / beard cluster: +drift toward high
- Sunday observance: +small drift
- Plautdietsch worship: +drift
- Shunning policy active: +drift toward high (departure threat is real)

At birth, child's starting cohesion is the average of mother's and father's cohesion, perturbed by a small RNG draw and offset by baptism doctrine (infant baptism shifts the starting value upward).

---

## Births and Deaths

### Death Model

Age-banded annual death probability:

| Age band | Annual death probability |
|---|---|
| Under 1 | 2% |
| 1–15 | 0.1% |
| 15–50 | 0.3% |
| 50–65 | 1% |
| 65–75 | 3% |
| 75–85 | 8% |
| 85+ | 20% |

Hard cap at age 89 (everyone alive at 89 dies on their 90th birthday). Community clinic doctrine reduces under-1 and childbirth mortality by a fixed multiplier.

### Birth Model

For each married woman aged 16–44, per-tick birth probability is a function of:
- Doctrine (marriage doctrine, clinic presence)
- Cohesion (high cohesion → higher birth probability)
- Age (peaks 22–32)
- Existing children (slight decline after 6+)

Target TFR by cohesion band, with default doctrine:
- High cohesion: ~7.0
- Medium cohesion: ~3.5
- Low cohesion: ~1.6

Modern relationship doctrine roughly halves these. Late marriage doctrine reduces high-cohesion TFR to ~5.5.

---

## Genetic Bottleneck

With both parental lineages tracked, an inbreeding coefficient is computed at the moment of pairing. The coefficient is a function of how many shared ancestors the two individuals have within N generations.

**Effects of high inbreeding coefficient at pairing:**
- Increased infant mortality multiplier on this couple's children
- Reduced child cohesion contribution at birth (proxy for developmental issues)

**Mitigation:**
- **Inflow members** reset the lineage diversity — they bring new founder lineages.
- **Cross-colony marriage** (a doctrine item: Forbidden / Same federation / Open) directly mitigates by drawing partners from outside the colony's gene pool.

This makes inflow strategically valuable beyond labor and sex-ratio absorption — it is also genetic relief. Closed-inflow colonies face escalating bottleneck pressure over generations.

---

## Doctrine Enforcement Cost

Every tick, a doctrine enforcement cost is deducted from treasury:

```
enforcement_cost = population² × strictness × constant
```

Where **strictness** is the count of strict doctrine choices currently active. Each of the following adds 1 to strictness:

- Plain dress on
- Head covering on
- Beard for married men on
- Shunning active
- Infant baptism
- Plautdietsch worship
- Sunday observance on
- Marriage outside forbidden
- Higher education for women forbidden
- Higher education for men forbidden
- Motorized farming forbidden
- Grid electricity forbidden
- English schooling forbidden
- Smartphones forbidden
- Outside trade closed
- Inflow closed

A small, strict colony (pop=300, strictness=12) has a manageable cost. A large, strict colony (pop=3000, strictness=12) has a cost ~100× higher. A large, lax colony (pop=3000, strictness=4) is sustainable.

This is the structural pressure driving schism: a community cannot stay both large and strict indefinitely. It must split (preserving strictness via smaller daughters), modernize (reducing strictness), or collapse under enforcement debt.

---

## Land and Economic Model

### Land Types

| Type | Productivity | Cost | Notes |
|---|---|---|---|
| **Jungle clearing** | Low initially, improves with labor and tech | Cheap | Starting land type in Cayo |
| **Farmland** | High | Moderate | Best for staple crops |
| **Pasture** | Medium | Moderate | Dairy and beef — Spanish Lookout's historical base |
| **Commercial plot** | High | Expensive | Unlocks trade and manufacturing doctrine options |
| **Remote jungle** | Very low | Very cheap | Low Visibility; suited to conservative daughter colonies |

```typescript
interface LandParcel {
  id:            string
  type:          LandType
  hectares:      number
  productivity:  number    // 0–1, improves with labor investment and tech
  purchaseYear:  number
  purchasePrice: number
}
```

### Economic Flow Per Tick

1. **Output** — each parcel produces based on type × productivity × labor force × tech multipliers.
2. **Expenses** — population maintenance, schooling costs, clinic costs, debt service.
3. **Enforcement cost** — deducted per the formula above.
4. **Treasury delta** — output minus expenses and enforcement, added to treasury.
5. **Land purchase** — player can spend treasury to acquire adjacent parcels; price set by land type and current Visibility (high Visibility = hostile sellers, inflated prices).

### Buildings (One-Time Purchases)

| Building | Effect | Doctrine requirement |
|---|---|---|
| Community clinic | -mortality, +TFR; +small Visibility/year | None |
| Dairy plant | +50% productivity on pasture | Trade-only higher ed for men, or English schooling permitted |
| Sawmill | +productivity on jungle clearing | Trade-only higher ed for men |
| Credit union | Treasury interest, +Anchor progress | Trade-only higher ed for men |

### Founding a Daughter Colony

Requirements:
- Minimum treasury threshold
- Minimum land parcel purchased in target region
- A schism event, or a deliberate split decision (if doctrine permits planned splits)

The founding group transfers as individuals from parent PopulationStore to a new daughter colony PopulationStore. Lineages travel with them — copied entries from the parent LineageRegistry.

---

## Schism Mechanic

When **Modernity Pressure** exceeds **Cohesion** in a colony, a Schism Event fires.

### Schism Direction

The split direction depends on the internal population distribution:

- **High-cohesion minority** → they split off to form a more conservative daughter colony; the larger modernizing majority stays.
- **Low-cohesion minority** → they split off to form a more liberal daughter colony; the conservative majority stays.

(Contested schism cases are resolved by whichever faction has the larger cohesion-weighted total.)

### Resolution

**Grant the split:** The splitting individuals transfer to a new colony PopulationStore. Remaining colony cohesion adjusts. Player chooses which resulting colony to author doctrine for.

**Refuse:** The faction stays. Their cohesion drops further. Risk of uncontrolled departure spike rises. Visibility increases. Grievance-carrying departures contribute to future threat events.

A colony that escapes player doctrine becomes an **independent actor** on the map, following its own demographic trajectory and potentially generating threat events.

---

## Departures (Emergent)

Members leave for the surrounding world as an emergent outcome — not a player action. Per-individual departure probability is driven by:

- Cohesion level (low cohesion = high departure probability)
- Age (young adults 16–25 are highest risk)
- Sex (sex-specific function — see cohesion drift)
- Tech exposure (smartphones, outside schooling raise probability)
- Recent events (a badly resolved threat event spikes departure probability colony-wide)
- Economic conditions (low treasury, land scarcity increase push factors)
- Partner cohesion (a high-cohesion partner reduces individual departure risk)
- Shunning policy (presence of shunning slightly suppresses departure — the threat is real)

Departed individuals are removed from the PopulationStore and added to Modern West counts. They do not return.

**Departure consequences in the household:**
- Without shunning: ongoing cohesion bleed in remaining family members (wound stays open).
- With shunning: large one-time cohesion shock to the household, then the wound closes; outside Visibility spike.

Departures carrying grievances (low cohesion + bad recent threat event) contribute to future Visibility and become causal triggers for journalist visits.

---

## Inflow Mechanic

Inflow members are men or women from the Modern West who apply to join a colony. Both sexes apply.

- Arrive as new individuals appended to the PopulationStore with `origin = 1` and starting cohesion in the low-medium band.
- Integration is slow — cohesion drift toward medium and high is a function of `arrivalYear` delta.
- A new lineage is created in the LineageRegistry for each inflow member (they are themselves a founder of their line).
- Player sets inflow policy in doctrine (Open / Vetted / Closed).
- Vetted policy applies a minimum residency before full membership status and filters out the lowest-cohesion arrivals.
- Strategically useful for absorbing sex-ratio imbalance, adding labor, and providing genetic relief against the bottleneck.
- Risk: persistently low-cohesion inflow members become departure candidates and may drag partner cohesion downward.

---

## Threat Events (Causal Triggers)

Threat events fire when their **causal trigger** condition is met. Visibility is no longer the trigger — it is a probability modifier on whether the triggered event escalates.

| Event | Causal trigger | Visibility role |
|---|---|---|
| **School inspector demand** | A child reaches Belizean mandatory schooling age in a colony with English schooling forbidden, after Belize's mandatory education law year | Higher Visibility raises probability of escalation (formal demand vs informal note) |
| **Journalist visit** | A grievance-carrying departure within last 5 years OR colony pop crosses 2,000 | Higher Visibility = larger outlet, wider story |
| **"Cult" media story** | A shunning event in last 2 years OR a marriage below age 17 | Higher Visibility = international vs local story |
| **NGO report filed** | Higher education for women forbidden + colony has outside contact (English schooling, open trade, or open inflow) | Higher Visibility = formal report vs internal memo |
| **CPS investigation** | A specific underage marriage event OR a specific child injury event | Higher Visibility = formal investigation vs welfare check |
| **Government land challenge** | Land purchase >X hectares in a single year, OR Anchor stagnation at >50% progress | Higher Visibility = legal challenge vs administrative obstruction |

Each event has multiple response options with Cohesion / Visibility / Treasury tradeoffs. At high Anchor progress, **Anchor leverage** becomes available as a response across all events.

---

## Win Conditions / Milestones

Not a single win state — a series of unlocking thresholds:

1. **Survive the first generation** — don't bleed out to departures before TFR compounds.
2. **The Anchor** — economic indispensability to Belize.
3. **Legal minority status** — formal religious minority protection established.
4. **The Second Colony** — first daughter colony founded.
5. **The Chaco** — autonomous colony in Paraguay established.
6. **The First Reclamation** — colony founded in a depopulated Modern West region (post-2050).
7. **Demographic escape velocity** — federation growth rate exceeds any plausible institutional suppression.

---

## Animations (Deferred)

> Not in V1. The event bus is architected so animations can be added without touching engine code.

The engine emits typed `GameEvent` objects from `tick()`. The animation layer subscribes independently.

| Event | Animation |
|---|---|
| Daughter colony founded | Small figures walk from source colony to target location |
| Birth | Baby arrives at the colony |
| Death (old age) | Elderly figure walks to graveyard at colony edge |
| Departure | Figure walks away from colony toward map edge |
| Inflow | Figure walks in from outside toward the colony |
| Schism | Colony marker splits visually; two new markers appear |
| Threat event | Warning icon pulses over colony |
| Anchor achieved | Colony appearance shifts to prosperity state |
| Shunning | Departing figure walks past family figures who turn away |

---

## End-of-Year Annual Report

After each "Next Year" tick, an annual report card is shown to the player:

- Births, deaths, departures, inflow (numbers and named individuals where notable).
- Treasury delta and breakdown (output, expenses, enforcement cost).
- Cohesion change (aggregate and by band).
- Lineage notes (notable births, lineage extinctions, inflow new lineages).
- Notable events (threat events fired, schism warnings, doctrine compliance failures).
- Visibility movement.
- Anchor progress delta.

This is the feedback loop the player reads every turn. It is the primary connection between doctrine choices and outcomes.

---

## Tech Stack

### Core
- **Vite** — build tool
- **React** — UI framework
- **TypeScript** — required; complex types throughout
- **Zustand** — game state; lightweight, no boilerplate, tick-based loop friendly

### Visualization
- **SVG (React-managed)** — gameplay map; stylized non-realistic regions; no real geography; no external map library
- **D3.js** — all charts: population pyramids, cohesion distributions, TFR curves, lineage trees

### Styling
- **Tailwind CSS** — utility-first
- **shadcn/ui** — panels, modals, tables on top of Tailwind

### Persistence
- **IndexedDB** — auto-save every tick, manual save slots, export/import JSON

### Testing
- **Vitest** — unit tests
- **React Testing Library** — component tests
- **Playwright** — E2E (later)

---

## Architecture

### Critical Constraint: Engine / UI Separation

The population engine is **pure functions with zero UI dependencies**. This is the non-negotiable architectural rule.

```typescript
// Complete engine surface — pure functions, no React, no side effects
function tick(colony: Colony, doctrine: Doctrine, year: number, rng: RNG): TickResult
function pairUp(colony: Colony, doctrine: Doctrine, rng: RNG): PairingEvent[]
function applyBirths(colony: Colony, doctrine: Doctrine, rng: RNG): BirthEvent[]
function applyDeaths(colony: Colony, rng: RNG): DeathEvent[]
function applyDepartures(colony: Colony, doctrine: Doctrine, rng: RNG): DepartureEvent[]
function applyInflow(colony: Colony, doctrine: Doctrine, modernWest: ModernWestState, rng: RNG): InflowEvent[]
function computeMetrics(colony: Colony): ColonyMetrics
function detectSchism(colony: Colony, rng: RNG): SchismEvent | null
function computeInbreedingCoefficient(a: number, b: number, colony: Colony): number
function applyEvent(colony: Colony, event: GameEvent): Colony

interface TickResult {
  colony: Colony
  events: GameEvent[]
}
```

### Event Bus

The engine emits `GameEvent` objects as a side-channel output from `tick()`. The animation layer and UI subscribe to this bus independently. The engine has no reference to either subscriber.

```typescript
interface GameEvent {
  type:     GameEventType   // 'birth' | 'death' | 'departure' | 'inflow' | 'schism' | 'pairing' | 'separation' | 'shunning' | 'threat' | ...
  personId: number          // relevant person ID where applicable
  colonyId: string
  year:     number
  payload:  unknown         // event-specific data
}
```

### Folder Structure

```
src/
  engine/               ← pure TypeScript, no React, fully testable
    types.ts            ← all core types: Colony, PopulationStore, Doctrine, LineageRegistry, etc.
    rng.ts              ← seeded PRNG, fork sub-streams
    population.ts       ← typed array operations, individual lifecycle, compaction
    lineage.ts          ← lineage registry operations, surname assignment, inbreeding coefficient
    doctrine.ts         ← doctrine type and effect definitions
    pairUp.ts           ← marriage market mechanics
    births.ts           ← birth probability and event generation
    deaths.ts           ← mortality curve and event generation
    departures.ts       ← departure probability and event generation
    inflow.ts           ← inflow generation, integration clock
    cohesion.ts         ← per-individual cohesion drift, sex-specific
    economy.ts          ← land output, treasury, enforcement cost
    modernity.ts        ← Modernity Pressure update
    schism.ts           ← schism detection and splitting
    threats.ts          ← causal trigger evaluation, threat event generation
    metrics.ts          ← ColonyMetrics computation
    modernWest.ts       ← Modern West aggregate population, regional thresholds
    tick.ts             ← tick orchestrator, fixed ordering
    events.ts           ← GameEvent types and bus interface
    replay.ts           ← deterministic replay tool
  store/                ← Zustand game state
  persistence/          ← IndexedDB save/load, JSON export/import
  components/
    map/                ← SVG gameplay map
    charts/             ← D3 demographic visualizations, lineage trees
    doctrine/           ← refusal-framed doctrine authoring UI
    events/             ← event notification and resolution UI
    annualReport/       ← end-of-year report card
    animations/         ← animation layer (subscribes to event bus — implement later)
  data/                 ← starting scenarios, surname pool, historical baselines
tests/
  engine/               ← unit tests for all tick logic
  components/           ← React Testing Library tests
```

### Example Unit Tests

```typescript
it("high cohesion colony grows population over one tick", () => {
  const result = tick(highCohesionColony, strictDoctrine, 1960, seededRng(42))
  expect(computeMetrics(result.colony).totalPopulation)
    .toBeGreaterThan(computeMetrics(highCohesionColony).totalPopulation)
})

it("identical seed produces identical outcome", () => {
  const a = tick(colony, doctrine, 1960, seededRng(42))
  const b = tick(colony, doctrine, 1960, seededRng(42))
  expect(a.colony).toEqual(b.colony)
  expect(a.events).toEqual(b.events)
})

it("smartphone adoption raises male departure rate more than female", () => {
  const without = tick(colony, { ...doctrine, smartphones: false }, 1980, seededRng(7))
  const with_   = tick(colony, { ...doctrine, smartphones: true  }, 1980, seededRng(7))
  const maleDelta   = countMaleDepartures(with_)   - countMaleDepartures(without)
  const femaleDelta = countFemaleDepartures(with_) - countFemaleDepartures(without)
  expect(maleDelta).toBeGreaterThan(femaleDelta)
})

it("schism preserves total population count", () => {
  const { a, b } = applySchism(colony, schismEvent, seededRng(1))
  const totalAfter = computeMetrics(a).totalPopulation + computeMetrics(b).totalPopulation
  expect(totalAfter).toBe(computeMetrics(colony).totalPopulation)
})

it("high-cohesion partner reduces individual departure probability", () => {
  const withHigh = makeIndividual({ cohesion: 128, partnerCohesion: 240 })
  const withLow  = makeIndividual({ cohesion: 128, partnerCohesion: 40 })
  expect(departureProbability(withHigh, colony))
    .toBeLessThan(departureProbability(withLow, colony))
})

it("enforcement cost is quadratic in population", () => {
  const small = enforcementCost({ ...colony, population: 300 }, doctrine)
  const large = enforcementCost({ ...colony, population: 3000 }, doctrine)
  expect(large / small).toBeCloseTo(100, 0)
})

it("inflow member creates a new lineage", () => {
  const before = colony.lineages.surnames.length
  const after = applyInflow(colony, doctrine, modernWest, seededRng(1))
  expect(after.colony.lineages.surnames.length).toBeGreaterThan(before)
})

it("dead persons are removed from store, not retained", () => {
  const result = applyDeaths(colony, seededRng(1))
  expect(result.colony.population.size).toBeLessThan(colony.population.size)
  expect(result.colony.population.alive).toBeUndefined() // no tombstone field
})
```

---

## Build Order

1. **TypeScript types** (`types.ts`) — Colony, PopulationStore, Doctrine, ColonyMetrics, LandParcel, LineageRegistry, GameEvent.
2. **Seeded PRNG** (`rng.ts`) — with fork sub-streams.
3. **PopulationStore typed array operations** with tests (create, age, add, remove, compact).
4. **Lineage registry** — surname assignment, both-parents tracking, inbreeding coefficient.
5. **`tick()` orchestrator** with full unit test coverage at the orchestration level.
6. **`pairUp()`** — marriage market for all three doctrines, with tests.
7. **Births and deaths** modules with tests.
8. **Cohesion drift** (sex-specific) with tests.
9. **Departures** with tests.
10. **Inflow** with tests.
11. **`computeMetrics()`** with tests.
12. **`economy.ts`** — land output, treasury, enforcement cost — with tests.
13. **Modernity Pressure** module with tests.
14. **Schism** detection and splitting logic with tests.
15. **Modern West aggregate model** — depopulation curve, regional thresholds.
16. **Causal threat event triggers** with tests.
17. **Event bus** (emitted from tick).
18. **Replay tool** — re-run from seed and initial state to year N.
19. **IndexedDB persistence** — auto-save, manual save slots, JSON export/import.
20. **Zustand store** wiring game state.
21. **SVG map** with colony territories and Modern West regions.
22. **D3 charts** — population pyramid, TFR curve, lineage tree, cohesion distribution.
23. **Refusal-framed doctrine authoring UI**.
24. **Threat event system and response UI**.
25. **End-of-year annual report card**.
26. **Inflow and departure UI feedback**.
27. **Animation layer** (subscribes to event bus).
