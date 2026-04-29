import { PopulationStore, GameEvent } from './types'
import { RNG } from './rng'
import { removePerson, getAlive, getSlot } from './population'
import { decrementLivingCount } from './lineage'
import { LineageRegistry } from './types'

interface AgeBand {
  minAge: number
  maxAge: number
  probability: number
}

const DEATH_PROBABILITIES: AgeBand[] = [
  { minAge: 0, maxAge: 0, probability: 0.02 },
  { minAge: 1, maxAge: 15, probability: 0.001 },
  { minAge: 15, maxAge: 50, probability: 0.003 },
  { minAge: 50, maxAge: 65, probability: 0.01 },
  { minAge: 65, maxAge: 75, probability: 0.03 },
  { minAge: 75, maxAge: 85, probability: 0.08 },
  { minAge: 85, maxAge: 89, probability: 0.20 },
  { minAge: 90, maxAge: 200, probability: 1.0 },
]

function getDeathProbability(age: number): number {
  for (const band of DEATH_PROBABILITIES) {
    if (age >= band.minAge && age <= band.maxAge) {
      return band.probability
    }
  }
  return 0
}

export function applyDeaths(
  population: PopulationStore,
  lineages: LineageRegistry,
  rng: RNG,
  year: number,
): GameEvent[] {
  const events: GameEvent[] = []
  const toRemove: number[] = []  // stable IDs

  for (const slot of getAlive(population)) {
    const age = population.age[slot]
    const prob = getDeathProbability(age)

    if (rng.next() < prob) {
      const stableId = population.slotToId[slot]
      toRemove.push(stableId)
      events.push({ type: 'death', personId: stableId, year })
    }
  }

  for (const stableId of toRemove) {
    const slot = getSlot(population, stableId)
    if (slot === -1) continue  // already removed (e.g. partner died first)

    const paternalLineage = population.paternalLineage[slot]
    const maternalLineage = population.maternalLineage[slot]
    const partnerStableId = population.partnerId[slot]

    decrementLivingCount(lineages, paternalLineage)
    decrementLivingCount(lineages, maternalLineage)

    if (partnerStableId >= 0) {
      const partnerSlot = getSlot(population, partnerStableId)
      if (partnerSlot >= 0) {
        population.married[partnerSlot] = 0
        population.partnerId[partnerSlot] = -1
      }
    }

    removePerson(population, stableId)
  }

  return events
}
