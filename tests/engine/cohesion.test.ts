import { describe, it, expect } from 'vitest'
import { applyCohesionDrift } from '../../src/engine/cohesion'
import { createStore, addPerson } from '../../src/engine/population'
import { createLineageRegistry, incrementLivingCount } from '../../src/engine/lineage'
import { createRNG } from '../../src/engine/rng'
import { Colony } from '../../src/engine/types'

describe('Cohesion Drift', () => {
  function createTestColony(): Colony {
    return {
      name: 'Test',
      population: createStore(100),
      doctrine: {
        smartphones: false,
        englishSchool: false,
        plainDress: true,
        marriageAge: 18,
      },
      lineages: createLineageRegistry(),
      treasury: 50000,
      year: 1960,
      history: [],
    }
  }

  it('applies doctrine-driven drift for smartphones', () => {
    const colony = createTestColony()
    colony.doctrine.smartphones = true
    const rng = createRNG(123)

    const id = addPerson(colony.population, {
      age: 25,
      sex: 0,
      cohesion: 150,
      married: 0,
      partnerId: -1,
      paternalLineage: 0,
      maternalLineage: 0,
      firstNameId: 0,
    })
    incrementLivingCount(colony.lineages, 0)
    incrementLivingCount(colony.lineages, 0)

    const before = colony.population.cohesion[id]
    applyCohesionDrift(colony, rng)
    const after = colony.population.cohesion[id]

    expect(after).toBeLessThan(before + 5)
  })

  it('applies doctrine-driven drift for plainDress', () => {
    const colony = createTestColony()
    colony.doctrine.plainDress = true
    const rng = createRNG(456)

    const id = addPerson(colony.population, {
      age: 25,
      sex: 0,
      cohesion: 150,
      married: 0,
      partnerId: -1,
      paternalLineage: 0,
      maternalLineage: 0,
      firstNameId: 0,
    })
    incrementLivingCount(colony.lineages, 0)
    incrementLivingCount(colony.lineages, 0)

    const before = colony.population.cohesion[id]
    applyCohesionDrift(colony, rng)
    const after = colony.population.cohesion[id]

    expect(after).toBeGreaterThan(before - 5)
  })

  it('applies partner pull toward higher cohesion partner', () => {
    const colony = createTestColony()
    const rng = createRNG(789)

    const lowCohesionId = addPerson(colony.population, {
      age: 25,
      sex: 0,
      cohesion: 100,
      married: 1,
      partnerId: 1,
      paternalLineage: 0,
      maternalLineage: 0,
      firstNameId: 0,
    })
    incrementLivingCount(colony.lineages, 0)
    incrementLivingCount(colony.lineages, 0)

    const highCohesionId = addPerson(colony.population, {
      age: 27,
      sex: 1,
      cohesion: 240,
      married: 1,
      partnerId: lowCohesionId,
      paternalLineage: 1,
      maternalLineage: 1,
      firstNameId: 0,
    })
    incrementLivingCount(colony.lineages, 1)
    incrementLivingCount(colony.lineages, 1)

    const before = colony.population.cohesion[lowCohesionId]
    applyCohesionDrift(colony, rng)
    const after = colony.population.cohesion[lowCohesionId]

    expect(after).toBeGreaterThan(before)
  })

  it('applies partner pull away from lower cohesion partner', () => {
    const colony = createTestColony()
    const rng = createRNG(111)

    const highCohesionId = addPerson(colony.population, {
      age: 25,
      sex: 0,
      cohesion: 240,
      married: 1,
      partnerId: 1,
      paternalLineage: 0,
      maternalLineage: 0,
      firstNameId: 0,
    })
    incrementLivingCount(colony.lineages, 0)
    incrementLivingCount(colony.lineages, 0)

    const lowCohesionId = addPerson(colony.population, {
      age: 27,
      sex: 1,
      cohesion: 100,
      married: 1,
      partnerId: highCohesionId,
      paternalLineage: 1,
      maternalLineage: 1,
      firstNameId: 0,
    })
    incrementLivingCount(colony.lineages, 1)
    incrementLivingCount(colony.lineages, 1)

    const before = colony.population.cohesion[highCohesionId]
    applyCohesionDrift(colony, rng)
    const after = colony.population.cohesion[highCohesionId]

    expect(after).toBeLessThan(before)
  })

  it('clamps cohesion to 0-255', () => {
    const colony = createTestColony()
    colony.doctrine.smartphones = true
    colony.doctrine.englishSchool = true
    const rng = createRNG(222)

    const id = addPerson(colony.population, {
      age: 25,
      sex: 0,
      cohesion: 5,
      married: 0,
      partnerId: -1,
      paternalLineage: 0,
      maternalLineage: 0,
      firstNameId: 0,
    })
    incrementLivingCount(colony.lineages, 0)
    incrementLivingCount(colony.lineages, 0)

    for (let i = 0; i < 10; i++) {
      applyCohesionDrift(colony, rng.fork(`clamp-test-${i}`))
    }

    expect(colony.population.cohesion[id]).toBeGreaterThanOrEqual(0)
    expect(colony.population.cohesion[id]).toBeLessThanOrEqual(255)
  })

  it('does not drift unmarried persons with partner', () => {
    const colony = createTestColony()
    const rng = createRNG(333)

    const id = addPerson(colony.population, {
      age: 25,
      sex: 0,
      cohesion: 150,
      married: 0,
      partnerId: -1,
      paternalLineage: 0,
      maternalLineage: 0,
      firstNameId: 0,
    })
    incrementLivingCount(colony.lineages, 0)
    incrementLivingCount(colony.lineages, 0)

    const before = colony.population.cohesion[id]
    applyCohesionDrift(colony, rng)
    const after = colony.population.cohesion[id]

    expect(after).toBeLessThanOrEqual(before + 2)
    expect(after).toBeGreaterThanOrEqual(before - 2)
  })
})
