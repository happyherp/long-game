import { Colony, Doctrine, GameEvent } from './types'
import { getAlive, removePerson, getSlot } from './population'
import { decrementLivingCount } from './lineage'
import { RNG } from './rng'

interface PersonSnapshot {
  age: number
  cohesion: number
}

function ageDepartureCurve(age: number): number {
  if (age < 13) return 0
  if (age < 16) return (age - 13) / 3
  if (age <= 25) return 1.0
  if (age < 35) return 0.8
  if (age < 50) return 0.3
  return 0.1
}

export function departureProbability(person: PersonSnapshot, partner: PersonSnapshot | null, doctrine: Doctrine): number {
  const cohesionFactor = 1 - person.cohesion / 255
  const ageFactor = ageDepartureCurve(person.age)

  let mult = 1.0
  if (doctrine.smartphones) mult *= 1.8
  if (doctrine.englishSchool) mult *= 1.4

  if (partner && partner.cohesion > 200) mult *= 0.4

  const base = 0.025

  return base * cohesionFactor * ageFactor * mult
}

export function applyDepartures(colony: Colony, rng: RNG, year: number): GameEvent[] {
  const { population, doctrine, lineages } = colony
  const events: GameEvent[] = []
  const toRemove: number[] = []  // stable IDs

  for (const slot of getAlive(population)) {
    const age = population.age[slot]
    if (age < 13) continue

    const partnerStableId = population.partnerId[slot]
    const hasPartner = partnerStableId >= 0

    const person = { age, cohesion: population.cohesion[slot] }

    let partnerObj: PersonSnapshot | null = null
    if (hasPartner) {
      const partnerSlot = getSlot(population, partnerStableId)
      if (partnerSlot >= 0) {
        partnerObj = {
          age: population.age[partnerSlot],
          cohesion: population.cohesion[partnerSlot],
        }
      }
    }

    const prob = departureProbability(person, partnerObj, doctrine)

    if (rng.next() < prob) {
      toRemove.push(population.slotToId[slot])
      events.push({ type: 'departure', personId: population.slotToId[slot], year })
    }
  }

  for (const stableId of toRemove) {
    const slot = getSlot(population, stableId)
    if (slot === -1) continue  // already removed

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
