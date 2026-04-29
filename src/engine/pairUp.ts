import { Colony, GameEvent } from './types'
import { getAlive, getSlot } from './population'
import { RNG } from './rng'

export function pairUp(colony: Colony, rng: RNG): GameEvent[] {
  const { population, doctrine } = colony
  const year = colony.year

  switch (doctrine.marriageDoctrine) {
    case 'courtship':
      return pairUpCourtship(population, doctrine, year, rng)
    case 'lateMarriage':
      return pairUpLateMarriage(population, doctrine, year, rng)
    case 'modern':
      return pairUpModern(population, doctrine, year, rng)
    default:
      return pairUpCourtship(population, doctrine, year, rng)
  }
}

function pairUpCourtship(population: Colony['population'], doctrine: Colony['doctrine'], year: number, rng: RNG): GameEvent[] {
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

  void rng
  return events
}

function pairUpLateMarriage(population: Colony['population'], doctrine: Colony['doctrine'], year: number, rng: RNG): GameEvent[] {
  const males: number[] = []
  const females: number[] = []

  // lateMarriage: effectiveMinAge = max(doctrine.marriageAge, 22)
  const minAge = Math.max(doctrine.marriageAge, 22)

  for (const slot of getAlive(population)) {
    const age = population.age[slot]
    const married = population.married[slot]
    const sex = population.sex[slot]

    if (age >= minAge && married === 0) {
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

  void rng
  return events
}

function pairUpModern(population: Colony['population'], doctrine: Colony['doctrine'], year: number, rng: RNG): GameEvent[] {
  const males: number[] = []
  const females: number[] = []

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

  // Probabilistic pairing: probability scales with cohort sex-ratio balance and inversely with cohesion
  const events: GameEvent[] = []

  for (let i = 0; i < males.length; i++) {
    for (let j = 0; j < females.length; j++) {
      const maleSlot = males[i]
      const femaleSlot = females[j]

      if (population.married[maleSlot] || population.married[femaleSlot]) continue

      const maleCohesion = population.cohesion[maleSlot]
      const femaleCohesion = population.cohesion[femaleSlot]
      const avgCohesion = (maleCohesion + femaleCohesion) / 2

      // Lower probability for low cohesion
      const cohesionFactor = Math.max(0.1, avgCohesion / 255)
      const probability = 0.3 * cohesionFactor

      if (rng.next() < probability) {
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

        // Remove from available pools
        males.splice(i, 1)
        females.splice(j, 1)
        i--
        break
      }
    }
  }

  return events
}