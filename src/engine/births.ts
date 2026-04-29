import { Colony, GameEvent } from './types'
import { getAlive, addPerson } from './population'
import { incrementLivingCount } from './lineage'
import { RNG } from './rng'

function ageCurve(age: number): number {
  if (age < 16 || age > 44) return 0

  const peak = 25
  const range = 8
  const x = (age - peak) / range
  return Math.max(0, 1 - x * x)
}

export function birthProbability(
  motherCohesion: number,
  age: number,
): number {
  const cohesionFactor = motherCohesion / 255
  const ageFactorVal = ageCurve(age)
  const base = 0.35

  return base * cohesionFactor * ageFactorVal
}

export function applyBirths(colony: Colony, rng: RNG, year: number): GameEvent[] {
  const { population } = colony
  const events: GameEvent[] = []

  for (const motherId of getAlive(population)) {
    const age = population.age[motherId]
    const sex = population.sex[motherId]
    const married = population.married[motherId]
    const cohesion = population.cohesion[motherId]

    if (sex !== 0 || age < 16 || age > 44 || married === 0) {
      continue
    }

    const fatherId = population.partnerId[motherId]
    if (fatherId === -1 || fatherId < 0) {
      continue
    }

    const prob = birthProbability(cohesion, age)

    if (rng.next() < prob) {
      const childSex = rng.nextInt(2)
      const motherCohesionVal = population.cohesion[motherId]
      const fatherCohesionVal = population.cohesion[fatherId]
      const avgCohesion = (motherCohesionVal + fatherCohesionVal) / 2
      const jitter = (rng.next() - 0.5) * 40
      const childCohesion = Math.max(0, Math.min(255, Math.round(avgCohesion + jitter)))

      const childFirstNameId = rng.nextInt(255)
      const childPaternalLineage = population.paternalLineage[fatherId]
      const childMaternalLineage = population.maternalLineage[motherId]

      const childId = addPerson(population, {
        age: 0,
        sex: childSex,
        cohesion: childCohesion,
        married: 0,
        partnerId: -1,
        paternalLineage: childPaternalLineage,
        maternalLineage: childMaternalLineage,
        firstNameId: childFirstNameId,
      })

      incrementLivingCount(colony.lineages, childPaternalLineage)
      incrementLivingCount(colony.lineages, childMaternalLineage)

      events.push({
        type: 'birth',
        personId: childId,
        year,
        payload: { motherId, fatherId },
      })
    }
  }

  return events
}
