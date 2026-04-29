import { Colony } from './types'
import { getAlive, getSlot } from './population'
import { RNG } from './rng'

export function applyCohesionDrift(colony: Colony, rng: RNG): void {
  const { population, doctrine } = colony
  const year = colony.history.length > 0 ? colony.history[colony.history.length - 1].year + 1 : 1960

  for (const slot of getAlive(population)) {
    const sex = population.sex[slot]
    const person = {
      age: population.age[slot],
      sex,
      cohesion: population.cohesion[slot],
      married: population.married[slot],
      origin: population.origin[slot],
      arrivalYear: population.arrivalYear[slot],
    }

    const partnerStableId = population.partnerId[slot]
    let partner = null
    if (partnerStableId >= 0) {
      const partnerSlot = getSlot(population, partnerStableId)
      if (partnerSlot >= 0) {
        partner = {
          cohesion: population.cohesion[partnerSlot],
        }
      }
    }

    if (sex === 0) {
      // Female
      applyDriftFemale(person, partner, doctrine, year, rng)
    } else {
      // Male
      applyDriftMale(person, partner, doctrine, year, rng)
    }

    population.cohesion[slot] = person.cohesion
  }
}

function applyDriftFemale(
  person: { age: number; sex: number; cohesion: number; married: number; origin: number; arrivalYear: number },
  partner: { cohesion: number } | null,
  doctrine: any,
  year: number,
  rng: RNG,
): void {
  let delta = 0

  // Common factors
  if (doctrine.smartphones) delta -= 3
  if (doctrine.englishSchool) delta -= 3
  if (doctrine.outsideTrade === 'open') delta -= 1
  if (doctrine.plainDress) delta += 2
  if (doctrine.headCovering) delta += 1
  if (doctrine.sundayObservance) delta += 0.5
  if (doctrine.worshipLanguage === 'plautdietsch') delta += 1
  if (doctrine.shunning) delta += 0.5

  // Female-specific accelerators
  if (doctrine.higherEdWomen === 'permitted' || doctrine.higherEdWomen === 'encouraged') delta -= 3
  if (doctrine.marriageDoctrine === 'modern') delta -= 2

  // Inflow tenure offset
  if (person.origin === 1) {
    const tenure = year - person.arrivalYear
    delta -= Math.max(0, 5 - tenure * 0.5)
  }

  // Partner pull
  if (partner) {
    delta += (partner.cohesion - person.cohesion) * 0.05
  }

  delta += (rng.next() - 0.5) * 2

  person.cohesion = clamp(Math.round(person.cohesion + delta), 0, 255)
}

function applyDriftMale(
  person: { age: number; sex: number; cohesion: number; married: number; origin: number; arrivalYear: number },
  partner: { cohesion: number } | null,
  doctrine: any,
  year: number,
  rng: RNG,
): void {
  let delta = 0

  // Common factors (male-specific values)
  if (doctrine.smartphones) delta -= 4
  if (doctrine.englishSchool) delta -= 2
  if (doctrine.outsideTrade === 'open') delta -= 2
  if (doctrine.plainDress) delta += 2
  if (doctrine.beardForMarried && person.married) delta += 1
  if (doctrine.sundayObservance) delta += 0.5
  if (doctrine.worshipLanguage === 'plautdietsch') delta += 1
  if (doctrine.shunning) delta += 0.5

  // Male-specific factors
  if (doctrine.motorizedFarming) delta -= 2
  if (doctrine.higherEdMen === 'permitted' || doctrine.higherEdMen === 'encouraged') delta -= 2

  // Inflow tenure offset
  if (person.origin === 1) {
    const tenure = year - person.arrivalYear
    delta -= Math.max(0, 5 - tenure * 0.5)
  }

  // Partner pull
  if (partner) {
    delta += (partner.cohesion - person.cohesion) * 0.05
  }

  delta += (rng.next() - 0.5) * 2

  person.cohesion = clamp(Math.round(person.cohesion + delta), 0, 255)
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}