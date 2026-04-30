import { Colony, GameEvent, LineageRegistry } from './types'
import { addPerson, PersonAttrs } from './population'
import { RNG } from './rng'

// Inflow surname pool (~100 generic North American + European surnames)
const INFLOW_SURNAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill',
  'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell',
  'Mitchell', 'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz',
  'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales',
  'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper', 'Peterson',
  'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson',
  'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza',
  'Ruiz', 'Hughes', 'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers',
  'Long', 'Ross', 'Foster', 'Jimenez',
]

// Extend the lineage registry with a new inflow lineage
function registerInflowLineage(registry: LineageRegistry, rng: RNG): number {
  const surname = INFLOW_SURNAMES[Math.floor(rng.next() * INFLOW_SURNAMES.length)]
  registry.surnames.push(surname)
  // Extend the livingCount array
  const newLivingCount = new Uint32Array(registry.livingCount.length + 1)
  newLivingCount.set(registry.livingCount)
  registry.livingCount = newLivingCount
  return registry.surnames.length - 1
}

export function applyInflow(colony: Colony, year: number, rng: RNG): GameEvent[] {
  if (colony.doctrine.inflowPolicy === 'closed') return []

  // Modern West inflow willingness drops over time
  const modernWestWillingness = Math.max(0.2, 1.0 - (year - 1960) / 200)

  // Vetted policy halves the rate but raises starting cohesion
  const rate = colony.doctrine.inflowPolicy === 'vetted' ? 0.003 : 0.008

  const expected = colony.population.size * rate * modernWestWillingness
  const count = poissonDraw(expected, rng)

  const events: GameEvent[] = []
  for (let i = 0; i < count; i++) {
    const sex = rng.next() < 0.5 ? 0 : 1
    const age = 18 + Math.floor(rng.next() * 12)
    const cohesion = colony.doctrine.inflowPolicy === 'vetted'
      ? 80 + Math.floor(rng.next() * 60)
      : 50 + Math.floor(rng.next() * 80)

    // New lineage per inflow member — they are themselves the founder
    const lineageId = registerInflowLineage(colony.lineages, rng)

    const attrs: PersonAttrs = {
      age,
      sex,
      cohesion,
      married: 0,
      partnerId: -1,
      paternalLineage: lineageId,
      maternalLineage: lineageId,
      fatherId: -1,
      motherId: -1,
      origin: 1,
      arrivalYear: year,
      firstNameId: pickInflowName(sex, rng),
    }

    const id = addPerson(colony.population, attrs)

    events.push({ type: 'inflow', personId: id, year })
  }
  return events
}

function pickInflowName(sex: number, rng: RNG): number {
  // Simplified: return a random firstNameId (0-49 range)
  return Math.floor(rng.next() * 50)
}

// Poisson random draw using Knuth's algorithm
function poissonDraw(lambda: number, rng: RNG): number {
  if (lambda < 0) return 0
  const L = Math.exp(-lambda)
  let k = 0
  let p = 1

  do {
    k++
    p *= rng.next()
  } while (p > L)

  return k - 1
}