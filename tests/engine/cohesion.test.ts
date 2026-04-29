import { describe, it, expect } from 'vitest'
import { applyCohesionDrift } from '../../src/engine/cohesion'
import { createStore, addLivingPerson } from '../../src/engine/population'
import { createLineageRegistry } from '../../src/engine/lineage'
import { createRNG } from '../../src/engine/rng'
import { Colony, DEFAULT_DOCTRINE } from '../../src/engine/types'

describe('Cohesion Drift', () => {
  function createTestColony(): Colony {
    return {
      id: 'test',
      name: 'Test',
      population: createStore(100),
      doctrine: { ...DEFAULT_DOCTRINE },
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
    applyCohesionDrift(colony, 1960, rng)
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
    applyCohesionDrift(colony, 1960, rng)
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

    addLivingPerson(colony.population, colony.lineages, {
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
    applyCohesionDrift(colony, 1960, rng)
    const after = colony.population.cohesion[lowCohesionId]

    expect(after).toBeGreaterThan(before)
  })

  it('applies partner pull away from lower cohesion partner', () => {
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

    addLivingPerson(colony.population, colony.lineages, {
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
    applyCohesionDrift(colony, 1960, rng)
    const after = colony.population.cohesion[highCohesionId]

    expect(after).toBeLessThan(before)
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
      applyCohesionDrift(colony, 1960 + i, rng.fork(`clamp-test-${i}`))
    }

    expect(colony.population.cohesion[id]).toBeGreaterThanOrEqual(0)
    expect(colony.population.cohesion[id]).toBeLessThanOrEqual(255)
  })

  it('drifts unmarried persons based only on doctrine (no partner pull)', () => {
    // Use a neutral doctrine (no positive or negative factors from doctrine)
    // to confirm no partner pull is applied (max drift is just jitter ±1)
    const colony = createTestColony()
    colony.doctrine.plainDress = false
    colony.doctrine.headCovering = false
    colony.doctrine.beardForMarried = false
    colony.doctrine.sundayObservance = false
    colony.doctrine.shunning = false
    colony.doctrine.worshipLanguage = 'english'
    colony.doctrine.smartphones = false
    colony.doctrine.englishSchool = false
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
    applyCohesionDrift(colony, 1960, rng)
    const after = colony.population.cohesion[id]

    // Without partner pull and with neutral doctrine, drift is just random jitter ±1
    expect(after).toBeLessThanOrEqual(before + 2)
    expect(after).toBeGreaterThanOrEqual(before - 2)
  })
})
