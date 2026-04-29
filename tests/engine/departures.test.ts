import { describe, it, expect } from 'vitest'
import { applyDepartures, departureProbability } from '../../src/engine/departures'
import { createStore, addLivingPerson } from '../../src/engine/population'
import { createLineageRegistry } from '../../src/engine/lineage'
import { createRNG } from '../../src/engine/rng'
import { Colony, DEFAULT_DOCTRINE } from '../../src/engine/types'

describe('Departures', () => {
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

  it('does not remove children', () => {
    const colony = createTestColony()
    const rng = createRNG(123)

    addLivingPerson(colony.population, colony.lineages, {
      age: 12,
      sex: 0,
      cohesion: 50,
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

    const initialSize = colony.population.size
    applyDepartures(colony, rng, 1960)

    expect(colony.population.size).toBe(initialSize)
  })

  it('removes low-cohesion adolescents', () => {
    const colony = createTestColony()
    const rng = createRNG(999)

    for (let i = 0; i < 100; i++) {
      addLivingPerson(colony.population, colony.lineages, {
        age: 20,
        sex: i % 2,
        cohesion: 50,
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
    }

    const before = colony.population.size
    applyDepartures(colony, rng, 1960)
    const after = colony.population.size

    expect(after).toBeLessThan(before)
  })

  it('respects doctrine.smartphones increasing departure', () => {
    const colony1 = createTestColony()
    const colony2 = createTestColony()
    colony2.doctrine.smartphones = true

    const prob1 = departureProbability(
      { age: 20, cohesion: 100 },
      null,
      colony1.doctrine,
    )
    const prob2 = departureProbability(
      { age: 20, cohesion: 100 },
      null,
      colony2.doctrine,
    )

    expect(prob2).toBeGreaterThan(prob1)
  })

  it('partner with high cohesion suppresses departure', () => {
    const baseDoc = { ...DEFAULT_DOCTRINE, smartphones: false, englishSchool: false }

    const baseProb = departureProbability(
      { age: 20, cohesion: 100 },
      null,
      baseDoc,
    )

    const suppressed = departureProbability(
      { age: 20, cohesion: 100 },
      { age: 22, cohesion: 240 },
      baseDoc,
    )

    expect(suppressed).toBeLessThan(baseProb)
  })

  it('marks partner as single on departure', () => {
    const colony = createTestColony()
    const rng = createRNG(111)

    const partnerId = addLivingPerson(colony.population, colony.lineages, {
      age: 25,
      sex: 1,
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
      age: 20,
      sex: 0,
      cohesion: 30,
      married: 1,
      partnerId: partnerId,
      paternalLineage: 1,
      maternalLineage: 1,
      fatherId: -1,
      motherId: -1,
      origin: 0,
      arrivalYear: 1960,
      firstNameId: 0,
    })

    expect(colony.population.married[partnerId]).toBe(1)

    const events = applyDepartures(colony, rng, 1960)

    if (events.length > 0) {
      expect(colony.population.married[partnerId]).toBe(0)
      expect(colony.population.partnerId[partnerId]).toBe(-1)
    }
  })

  it('decrements lineage counts on departure', () => {
    const colony = createTestColony()
    const rng = createRNG(222)

    for (let i = 0; i < 50; i++) {
      addLivingPerson(colony.population, colony.lineages, {
        age: 20,
        sex: 0,
        cohesion: 50,
        married: 0,
        partnerId: -1,
        paternalLineage: 5,
        maternalLineage: 10,
        fatherId: -1,
        motherId: -1,
        origin: 0,
        arrivalYear: 1960,
        firstNameId: 0,
      })
    }

    const countBefore5 = colony.lineages.livingCount[5]
    const countBefore10 = colony.lineages.livingCount[10]

    applyDepartures(colony, rng, 1960)

    const countAfter5 = colony.lineages.livingCount[5]
    const countAfter10 = colony.lineages.livingCount[10]

    expect(countAfter5).toBeLessThan(countBefore5)
    expect(countAfter10).toBeLessThan(countBefore10)
  })

  it('peaks departure probability for young adults', () => {
    const base = { ...DEFAULT_DOCTRINE }

    const age20 = departureProbability({ age: 20, cohesion: 100 }, null, base)
    const age15 = departureProbability({ age: 15, cohesion: 100 }, null, base)
    const age40 = departureProbability({ age: 40, cohesion: 100 }, null, base)

    expect(age20).toBeGreaterThan(age15)
    expect(age20).toBeGreaterThan(age40)
  })
})
