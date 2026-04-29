import { Colony } from './types'
import { getAlive } from './population'
import { RNG } from './rng'

export function applyCohesionDrift(colony: Colony, rng: RNG): void {
  const { population, doctrine } = colony

  for (const id of getAlive(population)) {
    let delta = 0

    if (doctrine.smartphones) delta -= 3
    if (doctrine.englishSchool) delta -= 2
    if (doctrine.plainDress) delta += 2

    const partnerId = population.partnerId[id]
    if (partnerId !== -1 && partnerId >= 0) {
      const pull = (population.cohesion[partnerId] - population.cohesion[id]) * 0.05
      delta += pull
    }

    delta += (rng.next() - 0.5) * 2

    population.cohesion[id] = clamp(Math.round(population.cohesion[id] + delta), 0, 255)
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
