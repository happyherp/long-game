import { PopulationStore, GameEvent } from './types'
import { RNG } from './rng'
import { removePerson, getAlive } from './population'
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
  const toRemove: number[] = []

  for (const id of getAlive(population)) {
    const age = population.age[id]
    const prob = getDeathProbability(age)

    if (rng.next() < prob) {
      toRemove.push(id)
      events.push({
        type: 'death',
        personId: id,
        year,
      })
    }
  }

  toRemove.reverse()

  for (const id of toRemove) {
    const paternalLineage = population.paternalLineage[id]
    const maternalLineage = population.maternalLineage[id]
    const partnerId = population.partnerId[id]

    decrementLivingCount(lineages, paternalLineage)
    decrementLivingCount(lineages, maternalLineage)

    if (partnerId !== -1 && partnerId >= 0) {
      population.married[partnerId] = 0
      population.partnerId[partnerId] = -1
    }

    removePerson(population, id)
  }

  return events
}
