import { describe, it, expect } from 'vitest'
import { Colony } from '../../src/engine/types'
import { createStore, addPerson } from '../../src/engine/population'
import { createLineageRegistry } from '../../src/engine/lineage'
import { applyCohesionDrift } from '../../src/engine/cohesion'
import { createRNG } from '../../src/engine/rng'

function createTestColony(sexRatios: number[]): Colony {
  const store = createStore(100)
  const lineages = createLineageRegistry()

  // Add people with specified sexes (0=female, 1=male)
  for (let i = 0; i < sexRatios.length; i++) {
    addPerson(store, {
      age: 20 + i,
      sex: sexRatios[i],
      cohesion: 200,
      married: 0,
      partnerId: -1,
      paternalLineage: i,
      maternalLineage: i,
      fatherId: -1,
      motherId: -1,
      origin: 0,
      arrivalYear: 1960,
      firstNameId: 0,
    })
  }

  return {
    population: store,
    lineages,
    doctrine: {
      smartphones: false,
      englishSchool: false,
      outsideTrade: 'restricted',
      plainDress: true,
      headCovering: true,
      beardForMarried: true,
      sundayObservance: true,
      worshipLanguage: 'plautdietsch',
      shunning: true,
      higherEdMen: 'forbidden',
      higherEdWomen: 'forbidden',
      marriageDoctrine: 'courtship',
      marriageAge: 18,
      marriageOutside: 'forbidden',
      baptismAge: 'infant',
      motorizedFarming: false,
      gridElectricity: false,
      inflowPolicy: 'closed',
    },
    history: [{
      year: 1960,
      population: sexRatios.length,
      tfr: 0,
      cohesionAvg: 200,
      treasury: 0,
      births: 0,
      deaths: 0,
      departures: 0,
    }],
    year: 1960,
    treasury: 0,
    foundingYear: 1960,
    name: 'Test Colony',
    id: 0,
    modernityPressure: 0,
    economy: { parcels: [], buildings: [] },
    pairingRecords: new Map(),
    flags: {},
  }
}

function getAverageCohesion(colony: Colony): { female: number; male: number } {
  const result = { female: 0, male: 0 }
  const counts = { female: 0, male: 0 }

  for (let slot = 0; slot < colony.population.size; slot++) {
    const sex = colony.population.sex[slot]
    const cohesion = colony.population.cohesion[slot]
    if (sex === 0) {
      result.female += cohesion
      counts.female++
    } else {
      result.male += cohesion
      counts.male++
    }
  }

  if (counts.female > 0) result.female /= counts.female
  if (counts.male > 0) result.male /= counts.male

  return result
}

describe('Sex-specific cohesion drift', () => {
  it('smartphones drop male average faster than female over 30 years', () => {
    const colony = createTestColony([0, 1, 0, 1]) // 2 females, 2 males
    colony.doctrine.smartphones = true

    const rng = createRNG(42)

    // Run for 30 ticks
    for (let i = 0; i < 30; i++) {
      applyCohesionDrift(colony, rng.fork(`tick${i}`))
    }

    const averages = getAverageCohesion(colony)

    // Male cohesion should drop more than female (male: -4/yr vs female: -3/yr without other factors)
    expect(averages.male).toBeLessThan(averages.female)
  })

  it('higher ed for women drops female average faster than male', () => {
    const colony = createTestColony([0, 0, 1, 1]) // 2 females, 2 males
    
    // Use neutral doctrine (no conservative bonuses)
    colony.doctrine = {
      smartphones: false,
      englishSchool: false,
      outsideTrade: 'restricted',
      plainDress: false,
      headCovering: false,
      beardForMarried: false,
      sundayObservance: false,
      worshipLanguage: 'plautdietsch',
      shunning: false,
      higherEdMen: 'forbidden',
      higherEdWomen: 'permitted',
      marriageDoctrine: 'courtship',
      marriageAge: 18,
      marriageOutside: 'forbidden',
      baptismAge: 'infant',
      motorizedFarming: false,
      gridElectricity: false,
      inflowPolicy: 'closed',
    }

    const rng = createRNG(123)

    // Run for 30 ticks
    for (let i = 0; i < 30; i++) {
      applyCohesionDrift(colony, rng.fork(`tick${i}`))
    }

    const averages = getAverageCohesion(colony)

    // Female cohesion should drop more than male (female: -3/yr vs male: 0/yr for higher ed)
    expect(averages.female).toBeLessThan(averages.male)
  })

  it('default strict doctrine keeps both sexes above 200 after 30 years', () => {
    const colony = createTestColony([0, 1, 0, 1, 0, 1])
    // Default doctrine is strict (all conservative settings)

    const rng = createRNG(999)

    for (let i = 0; i < 30; i++) {
      applyCohesionDrift(colony, rng.fork(`tick${i}`))
    }

    const averages = getAverageCohesion(colony)

    // Under strict doctrine, both sexes should maintain high cohesion
    expect(averages.female).toBeGreaterThan(200)
    expect(averages.male).toBeGreaterThan(200)
  })
})