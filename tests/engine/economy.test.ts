import { describe, it, expect } from 'vitest'
import { updateTreasury } from '../../src/engine/economy'
import { createStore, addPerson } from '../../src/engine/population'
import { createLineageRegistry, incrementLivingCount } from '../../src/engine/lineage'
import { Colony } from '../../src/engine/types'

describe('Economy', () => {
  function createTestColony(): Colony {
    return {
      name: 'Test',
      population: createStore(300),
      doctrine: {
        smartphones: false,
        englishSchool: false,
        plainDress: true,
        marriageAge: 19,
      },
      lineages: createLineageRegistry(),
      treasury: 50000,
      year: 1960,
      history: [],
    }
  }

  it('adds output from adults 18-65', () => {
    const colony = createTestColony()

    for (let i = 0; i < 50; i++) {
      addPerson(colony.population, {
        age: 40,
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

    const before = colony.treasury
    updateTreasury(colony)
    const after = colony.treasury

    expect(after).toBeGreaterThan(before)
  })

  it('subtracts expenses from all population', () => {
    const colony = createTestColony()

    for (let i = 0; i < 50; i++) {
      addPerson(colony.population, {
        age: 10,
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

    const before = colony.treasury
    updateTreasury(colony)
    const after = colony.treasury

    expect(after).toBeLessThan(before)
  })

  it('applies enforcement cost based on strictness', () => {
    const colony1 = createTestColony()
    colony1.doctrine.smartphones = true
    colony1.doctrine.englishSchool = true
    colony1.doctrine.plainDress = false
    colony1.doctrine.marriageAge = 20

    const colony2 = createTestColony()
    colony2.doctrine.smartphones = false
    colony2.doctrine.englishSchool = false
    colony2.doctrine.plainDress = true
    colony2.doctrine.marriageAge = 17

    for (let i = 0; i < 280; i++) {
      addPerson(colony1.population, {
        age: 40,
        sex: i % 2,
        cohesion: 150,
        married: 0,
        partnerId: -1,
        paternalLineage: 0,
        maternalLineage: 0,
        firstNameId: 0,
      })
      incrementLivingCount(colony1.lineages, 0)
      incrementLivingCount(colony1.lineages, 0)

      addPerson(colony2.population, {
        age: 40,
        sex: i % 2,
        cohesion: 150,
        married: 0,
        partnerId: -1,
        paternalLineage: 0,
        maternalLineage: 0,
        firstNameId: 0,
      })
      incrementLivingCount(colony2.lineages, 0)
      incrementLivingCount(colony2.lineages, 0)
    }

    updateTreasury(colony1)
    updateTreasury(colony2)

    expect(colony1.treasury).toBeGreaterThan(colony2.treasury)
  })
})
