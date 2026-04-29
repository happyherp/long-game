import { Colony, GameEvent } from './types'
import { getAlive, getSlot } from './population'
import { RNG } from './rng'

export function applySeparations(colony: Colony, rng: RNG, year: number): GameEvent[] {
  const { population, doctrine } = colony

  // Only applies for modern marriage doctrine
  if (doctrine.marriageDoctrine !== 'modern') return []

  const events: GameEvent[] = []
  const toSeparate: Array<[number, number]> = []  // [femaleStableId, maleStableId]

  for (const slot of getAlive(population)) {
    // Only process married females
    if (population.sex[slot] !== 0) continue
    if (population.married[slot] !== 1) continue

    const partnerStableId = population.partnerId[slot]
    if (partnerStableId < 0) continue

    const partnerSlot = getSlot(population, partnerStableId)
    if (partnerSlot < 0) continue

    const femaleCohesion = population.cohesion[slot]
    const maleCohesion = population.cohesion[partnerSlot]
    const avgCohesion = (femaleCohesion + maleCohesion) / 2

    if (avgCohesion < 100 && rng.next() < 0.05) {
      const femaleStableId = population.slotToId[slot]
      toSeparate.push([femaleStableId, partnerStableId])
    }
  }

  for (const [femaleStableId, maleStableId] of toSeparate) {
    const femaleSlot = getSlot(population, femaleStableId)
    const maleSlot = getSlot(population, maleStableId)

    if (femaleSlot >= 0) {
      population.married[femaleSlot] = 0
      population.partnerId[femaleSlot] = -1
    }

    if (maleSlot >= 0) {
      population.married[maleSlot] = 0
      population.partnerId[maleSlot] = -1
    }

    events.push({ type: 'separation', personId: femaleStableId, year })
  }

  return events
}
