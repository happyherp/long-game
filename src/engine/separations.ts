import { Colony, GameEvent } from './types'
import { getAlive, getSlot } from './population'
import { RNG } from './rng'

export function applySeparations(colony: Colony, rng: RNG): GameEvent[] {
  const { population } = colony
  const events: GameEvent[] = []

  for (const slot of getAlive(population)) {
    if (population.married[slot] !== 1) continue

    const partnerStableId = population.partnerId[slot]
    if (partnerStableId < 0) continue

    const partnerSlot = getSlot(population, partnerStableId)
    if (partnerSlot < 0) continue

    // Calculate average cohesion of the couple
    const avgCohesion = (population.cohesion[slot] + population.cohesion[partnerSlot]) / 2

    // Low cohesion couples have higher separation probability
    if (avgCohesion < 100) {
      const separationProbability = 0.05 * (1 - avgCohesion / 100)

      if (rng.next() < separationProbability) {
        const personStableId = population.slotToId[slot]
        const partnerStableId = population.partnerId[slot]

        // Separate the couple
        population.married[slot] = 0
        population.partnerId[slot] = -1

        population.married[partnerSlot] = 0
        population.partnerId[partnerSlot] = -1

        events.push({
          type: 'departure',
          personId: personStableId,
          year: colony.year,
          payload: { reason: 'separation', partnerId: partnerStableId },
        })
      }
    }
  }

  return events
}