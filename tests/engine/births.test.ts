import { describe, it, expect } from 'vitest'
import { applyBirths, birthProbability } from '../../src/engine/births'
import { createStore, addPerson, getAlive } from '../../src/engine/population'
import { createLineageRegistry, incrementLivingCount, getLivingCount } from '../../src/engine/lineage'
import { createRNG } from '../../src/engine/rng'
import { Colony } from '../../src/engine/types'

describe('Births', () => {
  function createTestColony(): Colony {
    return {
      name: 'Test',
      population: createStore(1000),
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

  it('does not produce births for unmarried women', () => {
    const colony = createTestColony()
    const rng = createRNG(123)

    addPerson(colony.population, {
      age: 25,
      sex: 0,
      cohesion: 240,
      married: 0,
      partnerId: -1,
      paternalLineage: 0,
      maternalLineage: 0,
      firstNameId: 0,
    })
    incrementLivingCount(colony.lineages, 0)
    incrementLivingCount(colony.lineages, 0)

    const events = applyBirths(colony, rng, 1960)
    expect(events).toHaveLength(0)
    expect(colony.population.size).toBe(1)
  })

  it('does not produce births for women outside reproductive years', () => {
    const colony = createTestColony()
    const rng = createRNG(456)

    const youngGirlId = addPerson(colony.population, {
      age: 14,
      sex: 0,
      cohesion: 240,
      married: 0,
      partnerId: -1,
      paternalLineage: 0,
      maternalLineage: 0,
      firstNameId: 0,
    })
    incrementLivingCount(colony.lineages, 0)
    incrementLivingCount(colony.lineages, 0)

    const malePaid = addPerson(colony.population, {
      age: 25,
      sex: 1,
      cohesion: 240,
      married: 1,
      partnerId: youngGirlId,
      paternalLineage: 1,
      maternalLineage: 1,
      firstNameId: 0,
    })
    incrementLivingCount(colony.lineages, 1)
    incrementLivingCount(colony.lineages, 1)

    colony.population.married[youngGirlId] = 1
    colony.population.partnerId[youngGirlId] = malePaid

    const events = applyBirths(colony, rng, 1960)
    expect(events).toHaveLength(0)
  })

  it('produces births for married women with high cohesion', () => {
    const colony = createTestColony()
    const rng = createRNG(123)

    let totalBirths = 0
    for (let i = 0; i < 10; i++) {
      const motherId = addPerson(colony.population, {
        age: 25,
        sex: 0,
        cohesion: 240,
        married: 1,
        partnerId: 100 + i,
        paternalLineage: 0,
        maternalLineage: 0,
        firstNameId: 0,
      })
      incrementLivingCount(colony.lineages, 0)
      incrementLivingCount(colony.lineages, 0)

      addPerson(colony.population, {
        age: 27,
        sex: 1,
        cohesion: 235,
        married: 1,
        partnerId: motherId,
        paternalLineage: 1,
        maternalLineage: 1,
        firstNameId: 0,
      })
      incrementLivingCount(colony.lineages, 1)
      incrementLivingCount(colony.lineages, 1)
    }

    const events = applyBirths(colony, rng, 1960)
    totalBirths = events.length

    expect(totalBirths).toBeGreaterThan(0)
    expect(colony.population.size).toBeGreaterThan(20)
  })

  it('child has correct lineages', () => {
    const colony = createTestColony()
    const rng = createRNG(111)

    const motherId = addPerson(colony.population, {
      age: 25,
      sex: 0,
      cohesion: 240,
      married: 1,
      partnerId: 1,
      paternalLineage: 5,
      maternalLineage: 10,
      firstNameId: 0,
    })
    incrementLivingCount(colony.lineages, 5)
    incrementLivingCount(colony.lineages, 10)

    const fatherId = addPerson(colony.population, {
      age: 27,
      sex: 1,
      cohesion: 235,
      married: 1,
      partnerId: motherId,
      paternalLineage: 7,
      maternalLineage: 12,
      firstNameId: 0,
    })
    incrementLivingCount(colony.lineages, 7)
    incrementLivingCount(colony.lineages, 12)

    const events = applyBirths(colony, rng, 1960)

    if (events.length > 0) {
      const childId = events[0].personId
      expect(colony.population.paternalLineage[childId]).toBe(7)
      expect(colony.population.maternalLineage[childId]).toBe(5)
    }
  })

  it('child cohesion averages parents with jitter', () => {
    const colony = createTestColony()
    const rng = createRNG(222)

    const motherId = addPerson(colony.population, {
      age: 25,
      sex: 0,
      cohesion: 200,
      married: 1,
      partnerId: 1,
      paternalLineage: 0,
      maternalLineage: 0,
      firstNameId: 0,
    })
    incrementLivingCount(colony.lineages, 0)
    incrementLivingCount(colony.lineages, 0)

    const fatherId = addPerson(colony.population, {
      age: 27,
      sex: 1,
      cohesion: 240,
      married: 1,
      partnerId: motherId,
      paternalLineage: 1,
      maternalLineage: 1,
      firstNameId: 0,
    })
    incrementLivingCount(colony.lineages, 1)
    incrementLivingCount(colony.lineages, 1)

    const events = applyBirths(colony, rng, 1960)

    if (events.length > 0) {
      const childId = events[0].personId
      const childCohesion = colony.population.cohesion[childId]
      const expectedAvg = (200 + 240) / 2

      expect(childCohesion).toBeGreaterThanOrEqual(expectedAvg - 25)
      expect(childCohesion).toBeLessThanOrEqual(expectedAvg + 25)
    }
  })

  it('increments lineage living counts', () => {
    const colony = createTestColony()
    const rng = createRNG(333)

    const motherId = addPerson(colony.population, {
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

    const fatherId = addPerson(colony.population, {
      age: 27,
      sex: 1,
      cohesion: 235,
      married: 1,
      partnerId: motherId,
      paternalLineage: 1,
      maternalLineage: 1,
      firstNameId: 0,
    })
    incrementLivingCount(colony.lineages, 1)
    incrementLivingCount(colony.lineages, 1)

    const countBefore0 = getLivingCount(colony.lineages, 0)
    const countBefore1 = getLivingCount(colony.lineages, 1)

    applyBirths(colony, rng, 1960)

    const countAfter0 = getLivingCount(colony.lineages, 0)
    const countAfter1 = getLivingCount(colony.lineages, 1)

    if (colony.population.size > 2) {
      expect(countAfter1).toBeGreaterThan(countBefore1)
    }
  })

  it('birthProbability increases with cohesion', () => {
    const low = birthProbability(100, 25)
    const medium = birthProbability(170, 25)
    const high = birthProbability(240, 25)

    expect(low).toBeLessThan(medium)
    expect(medium).toBeLessThan(high)
  })

  it('birthProbability peaks around age 25', () => {
    const age20 = birthProbability(220, 20)
    const age25 = birthProbability(220, 25)
    const age30 = birthProbability(220, 30)
    const age40 = birthProbability(220, 40)

    expect(age25).toBeGreaterThan(age20)
    expect(age25).toBeGreaterThan(age30)
    expect(age30).toBeGreaterThan(age40)
  })

  it('reproduces TFR approximately for high cohesion group', () => {
    const colony = createTestColony()
    const rng = createRNG(444)

    const numWomen = 100
    const womenIds: number[] = []

    for (let i = 0; i < numWomen; i++) {
      const womenId = addPerson(colony.population, {
        age: 25,
        sex: 0,
        cohesion: 235,
        married: 1,
        partnerId: 100 + i,
        paternalLineage: 0,
        maternalLineage: 0,
        firstNameId: 0,
      })
      womenIds.push(womenId)
      incrementLivingCount(colony.lineages, 0)
      incrementLivingCount(colony.lineages, 0)

      addPerson(colony.population, {
        age: 27,
        sex: 1,
        cohesion: 230,
        married: 1,
        partnerId: womenId,
        paternalLineage: 1,
        maternalLineage: 1,
        firstNameId: 0,
      })
      incrementLivingCount(colony.lineages, 1)
      incrementLivingCount(colony.lineages, 1)
    }

    let totalBirths = 0
    for (let year = 0; year < 30; year++) {
      const events = applyBirths(colony, rng.fork(`births-${year}`), 1960 + year)
      totalBirths += events.length

      for (const id of getAlive(colony.population)) {
        const age = colony.population.age[id]
        if (age >= 16 && age < 45) {
          colony.population.age[id]++
        }
      }
    }

    const tfr = totalBirths / numWomen
    expect(tfr).toBeGreaterThan(1.0)
    expect(tfr).toBeLessThan(4.0)
  })
})
