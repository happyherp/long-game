import { Colony, GameEvent } from './types'
import { getAlive } from './population'
import { RNG } from './rng'

export function pairUp(colony: Colony, rng: RNG, year: number): GameEvent[] {
  const { population, doctrine } = colony

  const males: number[] = []
  const females: number[] = []

  for (const id of getAlive(population)) {
    const age = population.age[id]
    const married = population.married[id]
    const sex = population.sex[id]

    if (age >= doctrine.marriageAge && married === 0) {
      if (sex === 1) {
        males.push(id)
      } else {
        females.push(id)
      }
    }
  }

  males.sort((a, b) => population.cohesion[b] - population.cohesion[a])
  females.sort((a, b) => population.cohesion[b] - population.cohesion[a])

  const pairs = Math.min(males.length, females.length)
  const events: GameEvent[] = []

  for (let i = 0; i < pairs; i++) {
    const maleId = males[i]
    const femaleId = females[i]

    population.married[maleId] = 1
    population.partnerId[maleId] = femaleId

    population.married[femaleId] = 1
    population.partnerId[femaleId] = maleId

    events.push({
      type: 'pairing',
      personId: maleId,
      year,
      payload: { partnerId: femaleId },
    })
  }

  return events
}
