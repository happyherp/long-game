import { Colony, GameEvent } from './types'
import { getAlive, addLivingPerson, getSlot } from './population'
import { RNG } from './rng'
import { inbreedingCoefficient } from './inbreeding'

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

  for (const motherSlot of getAlive(population)) {
    const age = population.age[motherSlot]
    const sex = population.sex[motherSlot]
    const married = population.married[motherSlot]
    const cohesion = population.cohesion[motherSlot]

    if (sex !== 0 || age < 16 || age > 44 || married === 0) {
      continue
    }

    const fatherStableId = population.partnerId[motherSlot]
    if (fatherStableId < 0) {
      continue
    }

    const fatherSlot = getSlot(population, fatherStableId)
    if (fatherSlot < 0) {
      continue
    }

    const prob = birthProbability(cohesion, age)

    if (rng.next() < prob) {
      const childSex = rng.nextInt(2)
      const motherCohesionVal = population.cohesion[motherSlot]
      const fatherCohesionVal = population.cohesion[fatherSlot]
      const avgCohesion = (motherCohesionVal + fatherCohesionVal) / 2
      const jitter = (rng.next() - 0.5) * 40

      const motherStableId = population.slotToId[motherSlot]

      // Compute inbreeding coefficient and adjust child cohesion
      const coef = inbreedingCoefficient(motherStableId, fatherStableId, population)
      colony.pairingCoefficients.set(motherStableId, coef)

      const childCohesion = Math.max(0, Math.min(255, Math.round(avgCohesion + jitter - coef * 30)))

      const childFirstNameId = rng.nextInt(255)
      const childPaternalLineage = population.paternalLineage[fatherSlot]
      const childMaternalLineage = population.maternalLineage[motherSlot]

      const childStableId = addLivingPerson(population, colony.lineages, {
        age: 0,
        sex: childSex,
        cohesion: childCohesion,
        married: 0,
        partnerId: -1,
        paternalLineage: childPaternalLineage,
        maternalLineage: childMaternalLineage,
        fatherId: fatherStableId,
        motherId: motherStableId,
        origin: 0,
        arrivalYear: year,
        firstNameId: childFirstNameId,
      })

      events.push({
        type: 'birth',
        personId: childStableId,
        year,
        payload: { motherId: motherStableId, fatherId: fatherStableId },
      })
    }
  }

  return events
}
