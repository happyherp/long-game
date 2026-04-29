import { describe, it, expect } from 'vitest'
import { updateTreasury } from '../../src/engine/economy'
import { createStore, addLivingPerson } from '../../src/engine/population'
import { createLineageRegistry } from '../../src/engine/lineage'
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
      addLivingPerson(colony.population, colony.lineages, {
        age: 40,
        sex: i % 2,
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
    }

    const before = colony.treasury
    updateTreasury(colony)
    const after = colony.treasury

    expect(after).toBeGreaterThan(before)
  })

  it('subtracts expenses from all population', () => {
    const colony = createTestColony()

    for (let i = 0; i < 50; i++) {
      addLivingPerson(colony.population, colony.lineages, {
        age: 10,
        sex: i % 2,
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
      addLivingPerson(colony1.population, colony1.lineages, {
        age: 40,
        sex: i % 2,
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

      addLivingPerson(colony2.population, colony2.lineages, {
        age: 40,
        sex: i % 2,
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
    }

    updateTreasury(colony1)
    updateTreasury(colony2)

    expect(colony1.treasury).toBeGreaterThan(colony2.treasury)
  })
})
