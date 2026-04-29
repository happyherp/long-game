import { Colony, GameEvent } from './types'
import { addLivingPerson } from './population'
import { addInflowLineage } from './lineage'
import { RNG } from './rng'

export const INFLOW_SURNAMES: string[] = [
  'Anderson', 'Baker', 'Brown', 'Campbell', 'Carter',
  'Clark', 'Collins', 'Cook', 'Cooper', 'Davis',
  'Edwards', 'Evans', 'Fisher', 'Foster', 'Garcia',
  'Gonzalez', 'Green', 'Hall', 'Harris', 'Harrison',
  'Henderson', 'Hill', 'Hughes', 'Jackson', 'Johnson',
  'Jones', 'King', 'Lee', 'Lewis', 'Martin',
  'Martinez', 'Miller', 'Mitchell', 'Moore', 'Morgan',
  'Morris', 'Nelson', 'Parker', 'Patterson', 'Perez',
  'Phillips', 'Ramirez', 'Rivera', 'Roberts', 'Robinson',
  'Rodriguez', 'Rogers', 'Ross', 'Russell', 'Sanchez',
  'Scott', 'Smith', 'Stewart', 'Taylor', 'Thomas',
  'Thompson', 'Turner', 'Walker', 'Ward', 'Watson',
  'White', 'Williams', 'Wilson', 'Wood', 'Wright',
  'Young', 'Adams', 'Allen', 'Bailey', 'Barnes',
  'Bell', 'Bennett', 'Brooks', 'Butler', 'Cole',
  'Cox', 'Diaz', 'Ford', 'Gray', 'Griffin',
  'Howard', 'James', 'Jenkins', 'Kelly', 'Kennedy',
  'Kim', 'Long', 'Lopez', 'Murphy', 'Murray',
  'Myers', 'Nguyen', 'Ortiz', 'Owen', 'Price',
  'Reed', 'Richardson', 'Sanders', 'Shaw', 'Torres',
]

/**
 * Poisson draw using Knuth algorithm.
 */
export function poissonDraw(lambda: number, rng: RNG): number {
  if (lambda <= 0) return 0
  const L = Math.exp(-lambda)
  let k = 0
  let p = 1.0
  do {
    k++
    p *= rng.next()
  } while (p > L)
  return k - 1
}

export function applyInflow(colony: Colony, year: number, rng: RNG): GameEvent[] {
  if (colony.doctrine.inflowPolicy === 'closed') return []

  // Modern West willingness declines over time
  const modernWestWillingness = Math.max(0.2, 1.0 - (year - 1960) / 200)

  // Vetted policy halves rate but raises starting cohesion
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

    const surnameIdx = rng.nextInt(INFLOW_SURNAMES.length)
    const surname = INFLOW_SURNAMES[surnameIdx]
    const lineageId = addInflowLineage(colony.lineages, surname)

    const firstNameId = rng.nextInt(255)

    const id = addLivingPerson(colony.population, colony.lineages, {
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
      firstNameId,
    })

    events.push({ type: 'inflow', personId: id, year })
  }

  return events
}
