import { describe, it, expect } from 'vitest'
import { pairUp } from '../../src/engine/pairUp'
import { createStore, addLivingPerson } from '../../src/engine/population'
import { createLineageRegistry } from '../../src/engine/lineage'
import { createRNG } from '../../src/engine/rng'
import { Colony, DEFAULT_DOCTRINE } from '../../src/engine/types'

function createColony(overrides: Partial<Colony> = {}): Colony {
  return {
    id: 'test',
    name: 'Test',
    population: createStore(200),
    doctrine: { ...DEFAULT_DOCTRINE },
    lineages: createLineageRegistry(),
    treasury: 50000,
    year: 1960,
    history: [],
    modernityPressure: 0,
    economy: { parcels: [], buildings: [] },
    pairingCoefficients: new Map(),
    flags: {},
    ...overrides,
  }
}

describe('PairUp Modern', () => {
  it('modern doctrine produces lower pairing rate at low cohesion', () => {
    const highCohesionColony = createColony()
    highCohesionColony.doctrine = { ...DEFAULT_DOCTRINE, marriageDoctrine: 'modern', marriageAge: 18 }
    const lowCohesionColony = createColony()
    lowCohesionColony.doctrine = { ...DEFAULT_DOCTRINE, marriageDoctrine: 'modern', marriageAge: 18 }

    const N = 50
    // High cohesion colony
    for (let i = 0; i < N; i++) {
      addLivingPerson(highCohesionColony.population, highCohesionColony.lineages, {
        age: 22, sex: 0, cohesion: 230, married: 0, partnerId: -1,
        paternalLineage: 0, maternalLineage: 0, fatherId: -1, motherId: -1,
        origin: 0, arrivalYear: 1960, firstNameId: 0,
      })
      addLivingPerson(highCohesionColony.population, highCohesionColony.lineages, {
        age: 24, sex: 1, cohesion: 225, married: 0, partnerId: -1,
        paternalLineage: 1, maternalLineage: 1, fatherId: -1, motherId: -1,
        origin: 0, arrivalYear: 1960, firstNameId: 0,
      })
    }

    // Low cohesion colony
    for (let i = 0; i < N; i++) {
      addLivingPerson(lowCohesionColony.population, lowCohesionColony.lineages, {
        age: 22, sex: 0, cohesion: 50, married: 0, partnerId: -1,
        paternalLineage: 0, maternalLineage: 0, fatherId: -1, motherId: -1,
        origin: 0, arrivalYear: 1960, firstNameId: 0,
      })
      addLivingPerson(lowCohesionColony.population, lowCohesionColony.lineages, {
        age: 24, sex: 1, cohesion: 45, married: 0, partnerId: -1,
        paternalLineage: 1, maternalLineage: 1, fatherId: -1, motherId: -1,
        origin: 0, arrivalYear: 1960, firstNameId: 0,
      })
    }

    const highEvents = pairUp(highCohesionColony, createRNG(42), 1960)
    const lowEvents = pairUp(lowCohesionColony, createRNG(42), 1960)

    // High cohesion = more pairings
    expect(highEvents.length).toBeGreaterThan(lowEvents.length)
  })

  it('lateMarriage shifts minimum marriage age to 22', () => {
    const colony = createColony()
    colony.doctrine = { ...DEFAULT_DOCTRINE, marriageDoctrine: 'lateMarriage', marriageAge: 19 }

    // Add a 20-year-old female and 20-year-old male
    addLivingPerson(colony.population, colony.lineages, {
      age: 20, sex: 0, cohesion: 220, married: 0, partnerId: -1,
      paternalLineage: 0, maternalLineage: 0, fatherId: -1, motherId: -1,
      origin: 0, arrivalYear: 1960, firstNameId: 0,
    })
    addLivingPerson(colony.population, colony.lineages, {
      age: 20, sex: 1, cohesion: 220, married: 0, partnerId: -1,
      paternalLineage: 1, maternalLineage: 1, fatherId: -1, motherId: -1,
      origin: 0, arrivalYear: 1960, firstNameId: 0,
    })

    // Under lateMarriage, effective min age = max(19, 22) = 22
    // 20-year-olds should NOT be paired
    const events = pairUp(colony, createRNG(123), 1960)
    expect(events.length).toBe(0)
  })

  it('lateMarriage pairs adults at or above 22', () => {
    const colony = createColony()
    colony.doctrine = { ...DEFAULT_DOCTRINE, marriageDoctrine: 'lateMarriage', marriageAge: 19 }

    addLivingPerson(colony.population, colony.lineages, {
      age: 22, sex: 0, cohesion: 220, married: 0, partnerId: -1,
      paternalLineage: 0, maternalLineage: 0, fatherId: -1, motherId: -1,
      origin: 0, arrivalYear: 1960, firstNameId: 0,
    })
    addLivingPerson(colony.population, colony.lineages, {
      age: 23, sex: 1, cohesion: 215, married: 0, partnerId: -1,
      paternalLineage: 1, maternalLineage: 1, fatherId: -1, motherId: -1,
      origin: 0, arrivalYear: 1960, firstNameId: 0,
    })

    const events = pairUp(colony, createRNG(456), 1960)
    expect(events.length).toBe(1)
  })

  it('modern pairing is deterministic with same seed', () => {
    function runModern(seed: number): number {
      const colony = createColony()
      colony.doctrine = { ...DEFAULT_DOCTRINE, marriageDoctrine: 'modern', marriageAge: 18 }
      for (let i = 0; i < 30; i++) {
        addLivingPerson(colony.population, colony.lineages, {
          age: 22, sex: 0, cohesion: 150, married: 0, partnerId: -1,
          paternalLineage: 0, maternalLineage: 0, fatherId: -1, motherId: -1,
          origin: 0, arrivalYear: 1960, firstNameId: 0,
        })
        addLivingPerson(colony.population, colony.lineages, {
          age: 25, sex: 1, cohesion: 150, married: 0, partnerId: -1,
          paternalLineage: 1, maternalLineage: 1, fatherId: -1, motherId: -1,
          origin: 0, arrivalYear: 1960, firstNameId: 0,
        })
      }
      return pairUp(colony, createRNG(seed), 1960).length
    }

    const result1 = runModern(777)
    const result2 = runModern(777)
    expect(result1).toBe(result2)
  })
})
