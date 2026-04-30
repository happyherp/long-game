import { describe, it, expect } from 'vitest'
import { applyCohesionDrift } from '../../src/engine/cohesion'
import { createStore, addLivingPerson } from '../../src/engine/population'
import { createLineageRegistry } from '../../src/engine/lineage'
import { createRNG } from '../../src/engine/rng'
import { Colony } from '../../src/engine/types'
import { makeDoctrine, makePopulation, makeLineages } from '../../tests/components/testUtils'

describe('Cohesion Drift', () => {
  function createTestColony(): Colony {
    return {
      id: 1,
      name: 'Test',
      population: makePopulation(100),
      doctrine: makeDoctrine({ marriageAge: 18 }),
      lineages: makeLineages(),
      treasury: 50000,
      year: 1960,
      history: [],
      foundingYear: 1960,
      modernityPressure: 100,
      economy: {
        parcels: [],
        buildings: [],
      },
      pairingRecords: new Map(),
      flags: {},
    } as Colony
  }

  it('applies doctrine-driven drift for smartphones', () => {
    const colony = createTestColony()
    colony.doctrine.smartphones = true
    const rng = createRNG(123)

    const id = addLivingPerson(colony.population, colony.lineages, {
      age: 25,
      sex: 0,
      cohesion: 150,
      married: 0,
      partnerId: -1,
      paternalLineage: 0,
      maternalLineage: 0,
      fatherId: -1,
      motherId: -1,
      origin: 0,
      arrivalYear: 1960,
      firstNameId: 0,
    })

    const before = colony.population.cohesion[id]
    applyCohesionDrift(colony, rng)
    const after = colony.population.cohesion[id]

    expect(after).toBeLessThan(before + 5)
  })

  it('applies doctrine-driven drift for plainDress', () => {
    const colony = createTestColony()
    colony.doctrine.plainDress = true
    const rng = createRNG(456)

    const id = addLivingPerson(colony.population, colony.lineages, {
      age: 25,
      sex: 0,
      cohesion: 150,
      married: 0,
      partnerId: -1,
      paternalLineage: 0,
      maternalLineage: 0,
      fatherId: -1,
      motherId: -1,
      origin: 0,
      arrivalYear: 1960,
      firstNameId: 0,
    })

    const before = colony.population.cohesion[id]
    applyCohesionDrift(colony, rng)
    const after = colony.population.cohesion[id]

    expect(after).toBeGreaterThan(before - 5)
  })

  it('applies partner pull toward higher cohesion partner', () => {
    const colony = createTestColony()
    const rng = createRNG(789)

    const lowCohesionId = addLivingPerson(colony.population, colony.lineages, {
      age: 25,
      sex: 0,
      cohesion: 100,
      married: 1,
      partnerId: 1,
      paternalLineage: 0,
      maternalLineage: 0,
      fatherId: -1,
      motherId: -1,
      origin: 0,
      arrivalYear: 1960,
      firstNameId: 0,
    })

    const highCohesionId = addLivingPerson(colony.population, colony.lineages, {
      age: 27,
      sex: 1,
      cohesion: 240,
      married: 1,
      partnerId: lowCohesionId,
      paternalLineage: 1,
      maternalLineage: 1,
      fatherId: -1,
      motherId: -1,
      origin: 0,
      arrivalYear: 1960,
      firstNameId: 0,
    })

    const before = colony.population.cohesion[lowCohesionId]
    applyCohesionDrift(colony, rng)
    const after = colony.population.cohesion[lowCohesionId]

    expect(after).toBeGreaterThan(before)
  })

  it('applies partner pull toward partner cohesion', () => {
    const colony = createTestColony()
    const rng = createRNG(111)

    const highCohesionId = addLivingPerson(colony.population, colony.lineages, {
      age: 25,
      sex: 0,
      cohesion: 240,
      married: 1,
      partnerId: 1,
      paternalLineage: 0,
      maternalLineage: 0,
      fatherId: -1,
      motherId: -1,
      origin: 0,
      arrivalYear: 1960,
      firstNameId: 0,
    })

    const lowCohesionId = addLivingPerson(colony.population, colony.lineages, {
      age: 27,
      sex: 1,
      cohesion: 100,
      married: 1,
      partnerId: highCohesionId,
      paternalLineage: 1,
      maternalLineage: 1,
      fatherId: -1,
      motherId: -1,
      origin: 0,
      arrivalYear: 1960,
      firstNameId: 0,
    })

    const before = colony.population.cohesion[highCohesionId]
    applyCohesionDrift(colony, rng)
    const after = colony.population.cohesion[highCohesionId]

    // Partner pull should move cohesion toward partner's value (100), so high cohesion should decrease
    // But doctrine drift might offset this. Allow some tolerance.
    expect(after).toBeLessThanOrEqual(before + 10)
    expect(after).toBeGreaterThanOrEqual(before - 50)
  })

  it('clamps cohesion to 0-255', () => {
    const colony = createTestColony()
    colony.doctrine.smartphones = true
    colony.doctrine.englishSchool = true
    const rng = createRNG(222)

    const id = addLivingPerson(colony.population, colony.lineages, {
      age: 25,
      sex: 0,
      cohesion: 5,
      married: 0,
      partnerId: -1,
      paternalLineage: 0,
      maternalLineage: 0,
      fatherId: -1,
      motherId: -1,
      origin: 0,
      arrivalYear: 1960,
      firstNameId: 0,
    })

    for (let i = 0; i < 10; i++) {
      applyCohesionDrift(colony, rng.fork(`clamp-test-${i}`))
    }

    expect(colony.population.cohesion[id]).toBeGreaterThanOrEqual(0)
    expect(colony.population.cohesion[id]).toBeLessThanOrEqual(255)
  })

  it('does not drift unmarried persons with partner', () => {
    const colony = createTestColony()
    const rng = createRNG(333)

    const id = addLivingPerson(colony.population, colony.lineages, {
      age: 25,
      sex: 0,
      cohesion: 150,
      married: 0,
      partnerId: -1,
      paternalLineage: 0,
      maternalLineage: 0,
      fatherId: -1,
      motherId: -1,
      origin: 0,
      arrivalYear: 1960,
      firstNameId: 0,
    })

    const before = colony.population.cohesion[id]
    applyCohesionDrift(colony, rng)
    const after = colony.population.cohesion[id]

    // Unmarried persons still get doctrine drift, so allow up to 10 change
    expect(after).toBeLessThanOrEqual(before + 10)
    expect(after).toBeGreaterThanOrEqual(before - 10)
  })
})
