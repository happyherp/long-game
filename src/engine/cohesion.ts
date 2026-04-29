import { Colony } from './types'
import { getAlive, getSlot } from './population'
import { RNG } from './rng'

export function applyCohesionDrift(colony: Colony, rng: RNG): void {
  const { population, doctrine } = colony

  for (const slot of getAlive(population)) {
    let delta = 0

    if (doctrine.smartphones) delta -= 3
    if (doctrine.englishSchool) delta -= 2
    if (doctrine.plainDress) delta += 2

    const partnerStableId = population.partnerId[slot]
    if (partnerStableId >= 0) {
      const partnerSlot = getSlot(population, partnerStableId)
      if (partnerSlot >= 0) {
        const pull = (population.cohesion[partnerSlot] - population.cohesion[slot]) * 0.05
        delta += pull
      }
    }

    delta += (rng.next() - 0.5) * 2

    population.cohesion[slot] = clamp(Math.round(population.cohesion[slot] + delta), 0, 255)
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
