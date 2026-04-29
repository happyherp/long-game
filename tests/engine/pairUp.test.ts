import { describe, it, expect } from 'vitest'
import { pairUp } from '../../src/engine/pairUp'
import { createStore, addLivingPerson, getAlive } from '../../src/engine/population'
import { createLineageRegistry } from '../../src/engine/lineage'
import { createRNG } from '../../src/engine/rng'
import { Colony, DEFAULT_DOCTRINE } from '../../src/engine/types'

describe('Pairing', () => {
  function createTestColony(): Colony {
    return {
      id: 'test',
      name: 'Test',
      population: createStore(100),
      doctrine: { ...DEFAULT_DOCTRINE, marriageAge: 18 },
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

  it('pairs unmarried adults of opposite sex', () => {
    const colony = createTestColony()
    const rng = createRNG(123)

    const maleId = addLivingPerson(colony.population, colony.lineages, {
      age: 25,
      sex: 1,
      cohesion: 220,
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

    const femaleId = addLivingPerson(colony.population, colony.lineages, {
      age: 22,
      sex: 0,
      cohesion: 210,
      married: 0,
      partnerId: -1,
      paternalLineage: 1,
      maternalLineage: 1,
      fatherId: -1,
      motherId: -1,
      origin: 0,
      arrivalYear: 1960,
      firstNameId: 0,
    })

    const events = pairUp(colony, rng, 1960)

    expect(events).toHaveLength(1)
    expect(events[0].type).toBe('pairing')
    expect(colony.population.married[maleId]).toBe(1)
    expect(colony.population.married[femaleId]).toBe(1)
    expect(colony.population.partnerId[maleId]).toBe(femaleId)
    expect(colony.population.partnerId[femaleId]).toBe(maleId)
  })

  it('respects marriage age doctrine', () => {
    const colony = createTestColony()
    colony.doctrine.marriageAge = 21
    const rng = createRNG(456)

    const youngMaleId = addLivingPerson(colony.population, colony.lineages, {
      age: 18,
      sex: 1,
      cohesion: 220,
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

    const oldMaleId = addLivingPerson(colony.population, colony.lineages, {
      age: 25,
      sex: 1,
      cohesion: 200,
      married: 0,
      partnerId: -1,
      paternalLineage: 1,
      maternalLineage: 1,
      fatherId: -1,
      motherId: -1,
      origin: 0,
      arrivalYear: 1960,
      firstNameId: 0,
    })

    const femaleId = addLivingPerson(colony.population, colony.lineages, {
      age: 22,
      sex: 0,
      cohesion: 210,
      married: 0,
      partnerId: -1,
      paternalLineage: 2,
      maternalLineage: 2,
      fatherId: -1,
      motherId: -1,
      origin: 0,
      arrivalYear: 1960,
      firstNameId: 0,
    })

    const events = pairUp(colony, rng, 1960)

    expect(events).toHaveLength(1)
    expect(colony.population.partnerId[oldMaleId]).toBe(femaleId)
    expect(colony.population.married[youngMaleId]).toBe(0)
  })

  it('pairs by cohesion rank (highest with highest)', () => {
    const colony = createTestColony()
    const rng = createRNG(789)

    const maleIds = [
      addLivingPerson(colony.population, colony.lineages, {
        age: 25,
        sex: 1,
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
      }),
      addLivingPerson(colony.population, colony.lineages, {
        age: 25,
        sex: 1,
        cohesion: 240,
        married: 0,
        partnerId: -1,
        paternalLineage: 1,
        maternalLineage: 1,
        fatherId: -1,
        motherId: -1,
        origin: 0,
        arrivalYear: 1960,
        firstNameId: 0,
      }),
      addLivingPerson(colony.population, colony.lineages, {
        age: 25,
        sex: 1,
        cohesion: 200,
        married: 0,
        partnerId: -1,
        paternalLineage: 2,
        maternalLineage: 2,
        fatherId: -1,
        motherId: -1,
        origin: 0,
        arrivalYear: 1960,
        firstNameId: 0,
      }),
    ]

    const femaleIds = [
      addLivingPerson(colony.population, colony.lineages, {
        age: 22,
        sex: 0,
        cohesion: 230,
        married: 0,
        partnerId: -1,
        paternalLineage: 3,
        maternalLineage: 3,
        fatherId: -1,
        motherId: -1,
        origin: 0,
        arrivalYear: 1960,
        firstNameId: 0,
      }),
      addLivingPerson(colony.population, colony.lineages, {
        age: 22,
        sex: 0,
        cohesion: 210,
        married: 0,
        partnerId: -1,
        paternalLineage: 4,
        maternalLineage: 4,
        fatherId: -1,
        motherId: -1,
        origin: 0,
        arrivalYear: 1960,
        firstNameId: 0,
      }),
      addLivingPerson(colony.population, colony.lineages, {
        age: 22,
        sex: 0,
        cohesion: 170,
        married: 0,
        partnerId: -1,
        paternalLineage: 5,
        maternalLineage: 5,
        fatherId: -1,
        motherId: -1,
        origin: 0,
        arrivalYear: 1960,
        firstNameId: 0,
      }),
    ]

    const events = pairUp(colony, rng, 1960)

    expect(events).toHaveLength(3)

    const maleCohesions = maleIds.map((id) => colony.population.cohesion[id]).sort((a, b) => b - a)
    const femaleCohesions = femaleIds.map((id) => colony.population.cohesion[id]).sort((a, b) => b - a)

    for (let i = 0; i < events.length; i++) {
      const maleId = events[i].personId
      const partnerId = (events[i].payload as any).partnerId
      expect(colony.population.cohesion[maleId]).toBe(maleCohesions[i])
      expect(colony.population.cohesion[partnerId]).toBe(femaleCohesions[i])
    }
  })

  it('handles unequal numbers (surplus unpaired)', () => {
    const colony = createTestColony()
    const rng = createRNG(111)

    const maleIds = [
      addLivingPerson(colony.population, colony.lineages, {
        age: 25,
        sex: 1,
        cohesion: 220,
        married: 0,
        partnerId: -1,
        paternalLineage: 0,
        maternalLineage: 0,
        fatherId: -1,
        motherId: -1,
        origin: 0,
        arrivalYear: 1960,
        firstNameId: 0,
      }),
      addLivingPerson(colony.population, colony.lineages, {
        age: 25,
        sex: 1,
        cohesion: 210,
        married: 0,
        partnerId: -1,
        paternalLineage: 1,
        maternalLineage: 1,
        fatherId: -1,
        motherId: -1,
        origin: 0,
        arrivalYear: 1960,
        firstNameId: 0,
      }),
      addLivingPerson(colony.population, colony.lineages, {
        age: 25,
        sex: 1,
        cohesion: 200,
        married: 0,
        partnerId: -1,
        paternalLineage: 2,
        maternalLineage: 2,
        fatherId: -1,
        motherId: -1,
        origin: 0,
        arrivalYear: 1960,
        firstNameId: 0,
      }),
    ]

    const femaleIds = [
      addLivingPerson(colony.population, colony.lineages, {
        age: 22,
        sex: 0,
        cohesion: 230,
        married: 0,
        partnerId: -1,
        paternalLineage: 3,
        maternalLineage: 3,
        fatherId: -1,
        motherId: -1,
        origin: 0,
        arrivalYear: 1960,
        firstNameId: 0,
      }),
      addLivingPerson(colony.population, colony.lineages, {
        age: 22,
        sex: 0,
        cohesion: 210,
        married: 0,
        partnerId: -1,
        paternalLineage: 4,
        maternalLineage: 4,
        fatherId: -1,
        motherId: -1,
        origin: 0,
        arrivalYear: 1960,
        firstNameId: 0,
      }),
    ]

    const events = pairUp(colony, rng, 1960)

    expect(events).toHaveLength(2)

    let pairedCount = 0
    for (const id of getAlive(colony.population)) {
      if (colony.population.married[id] === 1) pairedCount++
    }

    expect(pairedCount).toBe(4)

    const unpaired = maleIds.filter((id) => colony.population.married[id] === 0)
    expect(unpaired).toHaveLength(1)
  })

  it('does not pair already married people', () => {
    const colony = createTestColony()
    const rng = createRNG(222)

    const marriedMaleId = addLivingPerson(colony.population, colony.lineages, {
      age: 25,
      sex: 1,
      cohesion: 240,
      married: 1,
      partnerId: 99,
      paternalLineage: 0,
      maternalLineage: 0,
      fatherId: -1,
      motherId: -1,
      origin: 0,
      arrivalYear: 1960,
      firstNameId: 0,
    })

    const singleMaleId = addLivingPerson(colony.population, colony.lineages, {
      age: 25,
      sex: 1,
      cohesion: 200,
      married: 0,
      partnerId: -1,
      paternalLineage: 1,
      maternalLineage: 1,
      fatherId: -1,
      motherId: -1,
      origin: 0,
      arrivalYear: 1960,
      firstNameId: 0,
    })

    const femaleId = addLivingPerson(colony.population, colony.lineages, {
      age: 22,
      sex: 0,
      cohesion: 210,
      married: 0,
      partnerId: -1,
      paternalLineage: 2,
      maternalLineage: 2,
      fatherId: -1,
      motherId: -1,
      origin: 0,
      arrivalYear: 1960,
      firstNameId: 0,
    })

    const events = pairUp(colony, rng, 1960)

    expect(events).toHaveLength(1)
    expect(colony.population.partnerId[singleMaleId]).toBe(femaleId)
    expect(colony.population.partnerId[marriedMaleId]).toBe(99)
  })
})
