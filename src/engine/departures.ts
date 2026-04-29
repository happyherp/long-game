import { Colony, Doctrine, GameEvent } from './types'
import { getAlive, removePerson } from './population'
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
  const toRemove: number[] = []

  for (const id of getAlive(population)) {
    const age = population.age[id]
    if (age < 13) continue

    const partnerId = population.partnerId[id]
    const partner = partnerId !== -1 && partnerId >= 0 ? population : null

    const person = {
      age,
      cohesion: population.cohesion[id],
    }

    const partnerObj = partner
      ? {
          age: population.age[partnerId],
          cohesion: population.cohesion[partnerId],
        }
      : null

    const prob = departureProbability(person, partnerObj, doctrine)

    if (rng.next() < prob) {
      toRemove.push(id)
      events.push({
        type: 'departure',
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
