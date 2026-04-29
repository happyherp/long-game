import { Colony, Doctrine, PopulationStore } from './types'
import { getAlive, getSlot } from './population'
import { RNG } from './rng'

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function applyDriftFemale(
  slot: number,
  population: PopulationStore,
  doctrine: Doctrine,
  year: number,
  rng: RNG,
): void {
  let delta = 0

  // Common factors
  if (doctrine.smartphones) delta -= 3
  if (doctrine.englishSchool) delta -= 3  // stronger than male
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
  if (population.origin[slot] === 1) {
    const arrivalYear = population.arrivalYear[slot]
    const tenure = year - arrivalYear
    delta -= Math.max(0, 5 - tenure * 0.5)
  }

  // Partner pull
  const partnerStableId = population.partnerId[slot]
  if (partnerStableId >= 0) {
    const partnerSlot = getSlot(population, partnerStableId)
    if (partnerSlot >= 0) {
      const pull = (population.cohesion[partnerSlot] - population.cohesion[slot]) * 0.05
      delta += pull
    }
  }

  delta += (rng.next() - 0.5) * 2
  population.cohesion[slot] = clamp(Math.round(population.cohesion[slot] + delta), 0, 255)
}

function applyDriftMale(
  slot: number,
  population: PopulationStore,
  doctrine: Doctrine,
  year: number,
  rng: RNG,
): void {
  let delta = 0

  if (doctrine.smartphones) delta -= 4  // stronger than female
  if (doctrine.englishSchool) delta -= 2
  if (doctrine.outsideTrade === 'open') delta -= 2  // stronger than female
  if (doctrine.motorizedFarming) delta -= 2  // male-specific
  if (doctrine.plainDress) delta += 2
  if (doctrine.beardForMarried && population.married[slot] === 1) delta += 1
  if (doctrine.sundayObservance) delta += 0.5
  if (doctrine.worshipLanguage === 'plautdietsch') delta += 1
  if (doctrine.shunning) delta += 0.5

  if (doctrine.higherEdMen === 'permitted' || doctrine.higherEdMen === 'encouraged') delta -= 2

  // Inflow tenure offset
  if (population.origin[slot] === 1) {
    const arrivalYear = population.arrivalYear[slot]
    const tenure = year - arrivalYear
    delta -= Math.max(0, 5 - tenure * 0.5)
  }

  // Partner pull
  const partnerStableId = population.partnerId[slot]
  if (partnerStableId >= 0) {
    const partnerSlot = getSlot(population, partnerStableId)
    if (partnerSlot >= 0) {
      const pull = (population.cohesion[partnerSlot] - population.cohesion[slot]) * 0.05
      delta += pull
    }
  }

  delta += (rng.next() - 0.5) * 2
  population.cohesion[slot] = clamp(Math.round(population.cohesion[slot] + delta), 0, 255)
}

export function applyCohesionDrift(colony: Colony, year: number, rng: RNG): void {
  const { population, doctrine } = colony

  for (const slot of getAlive(population)) {
    const sex = population.sex[slot]
    if (sex === 0) {
      applyDriftFemale(slot, population, doctrine, year, rng)
    } else {
      applyDriftMale(slot, population, doctrine, year, rng)
    }
  }
}
