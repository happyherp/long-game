import { Colony, GameEvent } from './types'
import { getAlive } from './population'
import { RNG } from './rng'

export function pairUp(colony: Colony, rng: RNG, year: number): GameEvent[] {
  const { population, doctrine } = colony

  const males: number[] = []    // slots
  const females: number[] = []  // slots

  for (const slot of getAlive(population)) {
    const age = population.age[slot]
    const married = population.married[slot]
    const sex = population.sex[slot]

    if (age >= doctrine.marriageAge && married === 0) {
      if (sex === 1) {
        males.push(slot)
      } else {
        females.push(slot)
      }
    }
  }

  males.sort((a, b) => population.cohesion[b] - population.cohesion[a])
  females.sort((a, b) => population.cohesion[b] - population.cohesion[a])

  const pairs = Math.min(males.length, females.length)
  const events: GameEvent[] = []

  for (let i = 0; i < pairs; i++) {
    const maleSlot = males[i]
    const femaleSlot = females[i]

    const maleStableId = population.slotToId[maleSlot]
    const femaleStableId = population.slotToId[femaleSlot]

    population.married[maleSlot] = 1
    population.partnerId[maleSlot] = femaleStableId

    population.married[femaleSlot] = 1
    population.partnerId[femaleSlot] = maleStableId

    events.push({
      type: 'pairing',
      personId: maleStableId,
      year,
      payload: { partnerId: femaleStableId },
    })
  }

  // rng parameter reserved for future probabilistic pairing doctrines
  void rng

  return events
}
