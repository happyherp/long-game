import { describe, it, expect } from 'vitest'
import { applyCohesionDrift } from '../../src/engine/cohesion'
import { createStore, addLivingPerson } from '../../src/engine/population'
import { createLineageRegistry } from '../../src/engine/lineage'
import { createRNG } from '../../src/engine/rng'
import { Colony, DEFAULT_DOCTRINE } from '../../src/engine/types'

function createColony(): Colony {
  return {
    id: 'test',
    name: 'Test',
    population: createStore(500),
    doctrine: { ...DEFAULT_DOCTRINE, smartphones: false, englishSchool: false, plainDress: false, headCovering: false, shunning: false, sundayObservance: false, worshipLanguage: 'english', beardForMarried: false },
    lineages: createLineageRegistry(),
    treasury: 50000,
    year: 1960,
    history: [],
    modernityPressure: 0,
    economy: { parcels: [], buildings: [] },
    pairingCoefficients: new Map(),
    flags: {},
  }
}

describe('Sex-Specific Cohesion Drift', () => {
  it('smartphones drops male cohesion faster than female over 30 ticks', () => {
    const colony = createColony()
    colony.doctrine.smartphones = true

    const N = 50
    const maleIds: number[] = []
    const femaleIds: number[] = []

    for (let i = 0; i < N; i++) {
      femaleIds.push(addLivingPerson(colony.population, colony.lineages, {
        age: 25, sex: 0, cohesion: 200, married: 0, partnerId: -1,
        paternalLineage: 0, maternalLineage: 0, fatherId: -1, motherId: -1,
        origin: 0, arrivalYear: 1960, firstNameId: 0,
      }))
      maleIds.push(addLivingPerson(colony.population, colony.lineages, {
        age: 25, sex: 1, cohesion: 200, married: 0, partnerId: -1,
        paternalLineage: 0, maternalLineage: 0, fatherId: -1, motherId: -1,
        origin: 0, arrivalYear: 1960, firstNameId: 0,
      }))
    }

    const rng = createRNG(42)
    for (let t = 0; t < 30; t++) {
      applyCohesionDrift(colony, 1960 + t, rng.fork(`tick-${t}`))
    }

    const avgMale = maleIds.reduce((s, id) => s + colony.population.cohesion[id], 0) / N
    const avgFemale = femaleIds.reduce((s, id) => s + colony.population.cohesion[id], 0) / N

    // Males should have dropped more due to stronger smartphone effect (-4 vs -3)
    expect(avgMale).toBeLessThan(avgFemale)
  })

  it('higher ed for women drops female cohesion faster than male over 30 ticks', () => {
    const colony = createColony()
    colony.doctrine.higherEdWomen = 'permitted'
    // higherEdMen stays forbidden (DEFAULT)

    const N = 50
    const maleIds: number[] = []
    const femaleIds: number[] = []

    for (let i = 0; i < N; i++) {
      femaleIds.push(addLivingPerson(colony.population, colony.lineages, {
        age: 25, sex: 0, cohesion: 200, married: 0, partnerId: -1,
        paternalLineage: 0, maternalLineage: 0, fatherId: -1, motherId: -1,
        origin: 0, arrivalYear: 1960, firstNameId: 0,
      }))
      maleIds.push(addLivingPerson(colony.population, colony.lineages, {
        age: 25, sex: 1, cohesion: 200, married: 0, partnerId: -1,
        paternalLineage: 0, maternalLineage: 0, fatherId: -1, motherId: -1,
        origin: 0, arrivalYear: 1960, firstNameId: 0,
      }))
    }

    const rng = createRNG(99)
    for (let t = 0; t < 30; t++) {
      applyCohesionDrift(colony, 1960 + t, rng.fork(`tick-${t}`))
    }

    const avgMale = maleIds.reduce((s, id) => s + colony.population.cohesion[id], 0) / N
    const avgFemale = femaleIds.reduce((s, id) => s + colony.population.cohesion[id], 0) / N

    // Females should drop more (higherEdWomen -3 vs higherEdMen no effect when forbidden)
    expect(avgFemale).toBeLessThan(avgMale)
  })

  it('inflow members start with cohesion offset that fades over time', () => {
    const colony = createColony()

    // Add an inflow member (origin=1) who arrived 0 years ago
    const newArrivalId = addLivingPerson(colony.population, colony.lineages, {
      age: 25, sex: 0, cohesion: 150, married: 0, partnerId: -1,
      paternalLineage: 0, maternalLineage: 0, fatherId: -1, motherId: -1,
      origin: 1, arrivalYear: 1960, firstNameId: 0,
    })

    // Add a born-in member at same cohesion
    const bornInId = addLivingPerson(colony.population, colony.lineages, {
      age: 25, sex: 0, cohesion: 150, married: 0, partnerId: -1,
      paternalLineage: 0, maternalLineage: 0, fatherId: -1, motherId: -1,
      origin: 0, arrivalYear: 1960, firstNameId: 0,
    })

    const rng = createRNG(555)
    // tick at year 1960 (tenure=0): inflow offset is max(0, 5 - 0*0.5) = 5 drop
    applyCohesionDrift(colony, 1960, rng)

    // Inflow member should lose more cohesion than born-in (extra -5 penalty at tenure=0)
    const inflowCohesion = colony.population.cohesion[newArrivalId]
    const bornInCohesion = colony.population.cohesion[bornInId]
    expect(inflowCohesion).toBeLessThan(bornInCohesion + 3)
  })
})
