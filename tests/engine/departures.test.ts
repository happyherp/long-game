import { describe, it, expect } from 'vitest'
import { applyDepartures, departureProbability } from '../../src/engine/departures'
import { createStore, addPerson, getAlive } from '../../src/engine/population'
import { createLineageRegistry, incrementLivingCount } from '../../src/engine/lineage'
import { createRNG } from '../../src/engine/rng'
import { Colony } from '../../src/engine/types'

describe('Departures', () => {
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

  it('does not remove children', () => {
    const colony = createTestColony()
    const rng = createRNG(123)

    addPerson(colony.population, {
      age: 12,
      sex: 0,
      cohesion: 50,
      married: 0,
      partnerId: -1,
      paternalLineage: 0,
      maternalLineage: 0,
      firstNameId: 0,
    })
    incrementLivingCount(colony.lineages, 0)
    incrementLivingCount(colony.lineages, 0)

    const initialSize = colony.population.size
    applyDepartures(colony, rng, 1960)

    expect(colony.population.size).toBe(initialSize)
  })

  it('removes low-cohesion adolescents', () => {
    const colony = createTestColony()
    const rng = createRNG(999)

    for (let i = 0; i < 100; i++) {
      addPerson(colony.population, {
        age: 20,
        sex: i % 2,
        cohesion: 50,
        married: 0,
        partnerId: -1,
        paternalLineage: 0,
        maternalLineage: 0,
        firstNameId: 0,
      })
      incrementLivingCount(colony.lineages, 0)
      incrementLivingCount(colony.lineages, 0)
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

    const rng1 = createRNG(789)
    const rng2 = createRNG(789)

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
    const baseProb = departureProbability(
      { age: 20, cohesion: 100 },
      null,
      { smartphones: false, englishSchool: false, plainDress: true, marriageAge: 18 },
    )

    const suppressed = departureProbability(
      { age: 20, cohesion: 100 },
      { age: 22, cohesion: 240 },
      { smartphones: false, englishSchool: false, plainDress: true, marriageAge: 18 },
    )

    expect(suppressed).toBeLessThan(baseProb)
  })

  it('marks partner as single on departure', () => {
    const colony = createTestColony()
    const rng = createRNG(111)

    const partnerId = addPerson(colony.population, {
      age: 25,
      sex: 1,
      cohesion: 100,
      married: 1,
      partnerId: 1,
      paternalLineage: 0,
      maternalLineage: 0,
      firstNameId: 0,
    })
    incrementLivingCount(colony.lineages, 0)
    incrementLivingCount(colony.lineages, 0)

    const departerId = addPerson(colony.population, {
      age: 20,
      sex: 0,
      cohesion: 30,
      married: 1,
      partnerId: partnerId,
      paternalLineage: 1,
      maternalLineage: 1,
      firstNameId: 0,
    })
    incrementLivingCount(colony.lineages, 1)
    incrementLivingCount(colony.lineages, 1)

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
      addPerson(colony.population, {
        age: 20,
        sex: 0,
        cohesion: 50,
        married: 0,
        partnerId: -1,
        paternalLineage: 5,
        maternalLineage: 10,
        firstNameId: 0,
      })
      incrementLivingCount(colony.lineages, 5)
      incrementLivingCount(colony.lineages, 10)
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
    const base = { smartphones: false, englishSchool: false, plainDress: true, marriageAge: 18 }

    const age20 = departureProbability({ age: 20, cohesion: 100 }, null, base)
    const age15 = departureProbability({ age: 15, cohesion: 100 }, null, base)
    const age40 = departureProbability({ age: 40, cohesion: 100 }, null, base)

    expect(age20).toBeGreaterThan(age15)
    expect(age20).toBeGreaterThan(age40)
  })
})
