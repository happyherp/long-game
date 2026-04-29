import { describe, it, expect } from 'vitest'
import { computeMetrics, computeMedianAge, computeRollingTFR, toSnapshot } from '../../src/engine/metrics'
import { createStore, addPerson } from '../../src/engine/population'
import { createLineageRegistry, incrementLivingCount } from '../../src/engine/lineage'
import { Colony } from '../../src/engine/types'

describe('Metrics', () => {
  function createTestColony(): Colony {
    return {
      name: 'Test',
      population: createStore(300),
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

  it('computes population correctly', () => {
    const colony = createTestColony()

    for (let i = 0; i < 50; i++) {
      addPerson(colony.population, {
        age: 25,
        sex: i % 2,
        cohesion: 150,
        married: 0,
        partnerId: -1,
        paternalLineage: 0,
        maternalLineage: 0,
        firstNameId: 0,
      })
      incrementLivingCount(colony.lineages, 0)
      incrementLivingCount(colony.lineages, 0)
    }

    const metrics = computeMetrics(colony)
    expect(metrics.totalPopulation).toBe(50)
    expect(metrics.femaleCount + metrics.maleCount).toBe(50)
  })

  it('computes median age correctly', () => {
    const colony = createTestColony()

    addPerson(colony.population, { age: 20, sex: 0, cohesion: 150, married: 0, partnerId: -1, paternalLineage: 0, maternalLineage: 0, firstNameId: 0 })
    addPerson(colony.population, { age: 30, sex: 1, cohesion: 150, married: 0, partnerId: -1, paternalLineage: 0, maternalLineage: 0, firstNameId: 0 })
    addPerson(colony.population, { age: 40, sex: 0, cohesion: 150, married: 0, partnerId: -1, paternalLineage: 0, maternalLineage: 0, firstNameId: 0 })
    for (const lineage of [0]) {
      incrementLivingCount(colony.lineages, lineage)
      incrementLivingCount(colony.lineages, lineage)
    }

    const median = computeMedianAge(colony.population)
    expect(median).toBe(30)
  })

  it('computes cohesion band correctly', () => {
    const lowColony = createTestColony()
    const mediumColony = createTestColony()
    const highColony = createTestColony()

    for (let i = 0; i < 50; i++) {
      addPerson(lowColony.population, {
        age: 25,
        sex: i % 2,
        cohesion: 80,
        married: 0,
        partnerId: -1,
        paternalLineage: 0,
        maternalLineage: 0,
        firstNameId: 0,
      })
      addPerson(mediumColony.population, {
        age: 25,
        sex: i % 2,
        cohesion: 150,
        married: 0,
        partnerId: -1,
        paternalLineage: 0,
        maternalLineage: 0,
        firstNameId: 0,
      })
      addPerson(highColony.population, {
        age: 25,
        sex: i % 2,
        cohesion: 240,
        married: 0,
        partnerId: -1,
        paternalLineage: 0,
        maternalLineage: 0,
        firstNameId: 0,
      })
      incrementLivingCount(lowColony.lineages, 0)
      incrementLivingCount(lowColony.lineages, 0)
      incrementLivingCount(mediumColony.lineages, 0)
      incrementLivingCount(mediumColony.lineages, 0)
      incrementLivingCount(highColony.lineages, 0)
      incrementLivingCount(highColony.lineages, 0)
    }

    expect(computeMetrics(lowColony).cohesionBand).toBe('low')
    expect(computeMetrics(mediumColony).cohesionBand).toBe('medium')
    expect(computeMetrics(highColony).cohesionBand).toBe('high')
  })

  it('computes rolling TFR', () => {
    const history = [
      { year: 1960, population: 280, tfr: 3.0, cohesionAvg: 200, treasury: 50000, births: 10, deaths: 2, departures: 1 },
      { year: 1961, population: 290, tfr: 3.5, cohesionAvg: 200, treasury: 51000, births: 12, deaths: 2, departures: 1 },
      { year: 1962, population: 300, tfr: 4.0, cohesionAvg: 200, treasury: 52000, births: 14, deaths: 2, departures: 1 },
    ]

    const tfr = computeRollingTFR(history)
    expect(tfr).toBeCloseTo((3.0 + 3.5 + 4.0) / 3, 1)
  })

  it('creates snapshot from metrics', () => {
    const colony = createTestColony()
    addPerson(colony.population, {
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

    const metrics = computeMetrics(colony)
    const snapshot = toSnapshot(metrics, 1960, 10, 2, 1)

    expect(snapshot.year).toBe(1960)
    expect(snapshot.births).toBe(10)
    expect(snapshot.deaths).toBe(2)
    expect(snapshot.departures).toBe(1)
  })
})
