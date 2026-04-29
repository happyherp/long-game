import { Colony, GameEvent } from './types'
import { getAlive } from './population'
import { RNG } from './rng'

export function pairUp(colony: Colony, rng: RNG, year: number): GameEvent[] {
  const { doctrine } = colony

  switch (doctrine.marriageDoctrine) {
    case 'courtship':
      return pairUpCourtship(colony, rng, year, doctrine.marriageAge)
    case 'lateMarriage':
      return pairUpCourtship(colony, rng, year, Math.max(doctrine.marriageAge, 22))
    case 'modern':
      return pairUpModern(colony, rng, year)
    default:
      return pairUpCourtship(colony, rng, year, doctrine.marriageAge)
  }
}

function pairUpCourtship(colony: Colony, _rng: RNG, year: number, effectiveMinAge: number): GameEvent[] {
  const { population } = colony

  const males: number[] = []    // slots
  const females: number[] = []  // slots

  for (const slot of getAlive(population)) {
    const age = population.age[slot]
    const married = population.married[slot]
    const sex = population.sex[slot]

    if (age >= effectiveMinAge && married === 0) {
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

  return events
}

function pairUpModern(colony: Colony, rng: RNG, year: number): GameEvent[] {
  const { population, doctrine } = colony
  const pairingRng = rng.fork('pairing')

  // Collect unpaired adults by sex
  const unpairedMales: number[] = []    // slots
  const unpairedFemales: number[] = []  // slots

  for (const slot of getAlive(population)) {
    const age = population.age[slot]
    const married = population.married[slot]
    const sex = population.sex[slot]

    if (age >= doctrine.marriageAge && married === 0) {
      if (sex === 1) {
        unpairedMales.push(slot)
      } else {
        unpairedFemales.push(slot)
      }
    }
  }

  const events: GameEvent[] = []
  const pairedMaleSlots = new Set<number>()

  // Shuffle males for random selection
  for (let i = unpairedMales.length - 1; i > 0; i--) {
    const j = pairingRng.nextInt(i + 1)
    ;[unpairedMales[i], unpairedMales[j]] = [unpairedMales[j], unpairedMales[i]]
  }

  for (const femaleSlot of unpairedFemales) {
    const cohesion = population.cohesion[femaleSlot]
    const pairingProb = 0.15 * (cohesion / 255)

    if (pairingRng.next() < pairingProb) {
      // Try to find an unpaired male
      const availableMales = unpairedMales.filter(s => !pairedMaleSlots.has(s))
      if (availableMales.length === 0) continue

      const maleIdx = pairingRng.nextInt(availableMales.length)
      const maleSlot = availableMales[maleIdx]

      const maleStableId = population.slotToId[maleSlot]
      const femaleStableId = population.slotToId[femaleSlot]

      population.married[maleSlot] = 1
      population.partnerId[maleSlot] = femaleStableId

      population.married[femaleSlot] = 1
      population.partnerId[femaleSlot] = maleStableId

      pairedMaleSlots.add(maleSlot)

      events.push({
        type: 'pairing',
        personId: maleStableId,
        year,
        payload: { partnerId: femaleStableId },
      })
    }
  }

  return events
}
