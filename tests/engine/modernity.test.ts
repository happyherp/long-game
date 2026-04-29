import { describe, it, expect } from 'vitest'
import { updateModernityPressure, countInflow } from '../../src/engine/modernity'
import { createStore, addLivingPerson } from '../../src/engine/population'
import { createLineageRegistry } from '../../src/engine/lineage'
import { Colony, DEFAULT_DOCTRINE } from '../../src/engine/types'

function createColony(): Colony {
  return {
    id: 'test',
    name: 'Test',
    population: createStore(2000),
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

describe('Modernity Pressure', () => {
  it('rises with population size', () => {
    const smallColony = createColony()
    const largeColony = createColony()

    for (let i = 0; i < 50; i++) {
      addLivingPerson(smallColony.population, smallColony.lineages, {
        age: 30, sex: i % 2, cohesion: 200, married: 0, partnerId: -1,
        paternalLineage: 0, maternalLineage: 0, fatherId: -1, motherId: -1,
        origin: 0, arrivalYear: 1960, firstNameId: 0,
      })
    }
    for (let i = 0; i < 1000; i++) {
      addLivingPerson(largeColony.population, largeColony.lineages, {
        age: 30, sex: i % 2, cohesion: 200, married: 0, partnerId: -1,
        paternalLineage: 0, maternalLineage: 0, fatherId: -1, motherId: -1,
        origin: 0, arrivalYear: 1960, firstNameId: 0,
      })
    }

    updateModernityPressure(smallColony)
    updateModernityPressure(largeColony)

    expect(largeColony.modernityPressure).toBeGreaterThan(smallColony.modernityPressure)
  })

  it('rises with permitted tech (smartphones)', () => {
    const conservativeColony = createColony()
    const modernColony = createColony()
    modernColony.doctrine = { ...DEFAULT_DOCTRINE, smartphones: true }

    for (let i = 0; i < 100; i++) {
      addLivingPerson(conservativeColony.population, conservativeColony.lineages, {
        age: 30, sex: i % 2, cohesion: 200, married: 0, partnerId: -1,
        paternalLineage: 0, maternalLineage: 0, fatherId: -1, motherId: -1,
        origin: 0, arrivalYear: 1960, firstNameId: 0,
      })
      addLivingPerson(modernColony.population, modernColony.lineages, {
        age: 30, sex: i % 2, cohesion: 200, married: 0, partnerId: -1,
        paternalLineage: 0, maternalLineage: 0, fatherId: -1, motherId: -1,
        origin: 0, arrivalYear: 1960, firstNameId: 0,
      })
    }

    updateModernityPressure(conservativeColony)
    updateModernityPressure(modernColony)

    expect(modernColony.modernityPressure).toBeGreaterThan(conservativeColony.modernityPressure)
  })

  it('rises with open trade', () => {
    const closedColony = createColony()
    const openColony = createColony()
    openColony.doctrine = { ...DEFAULT_DOCTRINE, outsideTrade: 'open' }

    for (let i = 0; i < 100; i++) {
      addLivingPerson(closedColony.population, closedColony.lineages, {
        age: 30, sex: i % 2, cohesion: 200, married: 0, partnerId: -1,
        paternalLineage: 0, maternalLineage: 0, fatherId: -1, motherId: -1,
        origin: 0, arrivalYear: 1960, firstNameId: 0,
      })
      addLivingPerson(openColony.population, openColony.lineages, {
        age: 30, sex: i % 2, cohesion: 200, married: 0, partnerId: -1,
        paternalLineage: 0, maternalLineage: 0, fatherId: -1, motherId: -1,
        origin: 0, arrivalYear: 1960, firstNameId: 0,
      })
    }

    updateModernityPressure(closedColony)
    updateModernityPressure(openColony)

    expect(openColony.modernityPressure).toBeGreaterThan(closedColony.modernityPressure)
  })

  it('is bounded at 0–500', () => {
    const colony = createColony()
    colony.doctrine = {
      ...DEFAULT_DOCTRINE,
      smartphones: true,
      motorizedFarming: true,
      gridElectricity: true,
      englishSchool: true,
      outsideTrade: 'open',
      higherEdMen: 'encouraged',
      higherEdWomen: 'encouraged',
    }
    colony.treasury = 10_000_000

    for (let i = 0; i < 1500; i++) {
      addLivingPerson(colony.population, colony.lineages, {
        age: 30, sex: i % 2, cohesion: 200, married: 0, partnerId: -1,
        paternalLineage: 0, maternalLineage: 0, fatherId: -1, motherId: -1,
        origin: 1, arrivalYear: 1960, firstNameId: 0,
      })
    }

    updateModernityPressure(colony)
    expect(colony.modernityPressure).toBeGreaterThanOrEqual(0)
    expect(colony.modernityPressure).toBeLessThanOrEqual(500)
  })

  it('countInflow counts only persons with origin=1', () => {
    const colony = createColony()
    addLivingPerson(colony.population, colony.lineages, {
      age: 30, sex: 0, cohesion: 200, married: 0, partnerId: -1,
      paternalLineage: 0, maternalLineage: 0, fatherId: -1, motherId: -1,
      origin: 0, arrivalYear: 1960, firstNameId: 0,
    })
    addLivingPerson(colony.population, colony.lineages, {
      age: 25, sex: 1, cohesion: 150, married: 0, partnerId: -1,
      paternalLineage: 0, maternalLineage: 0, fatherId: -1, motherId: -1,
      origin: 1, arrivalYear: 1960, firstNameId: 0,
    })
    addLivingPerson(colony.population, colony.lineages, {
      age: 28, sex: 0, cohesion: 120, married: 0, partnerId: -1,
      paternalLineage: 0, maternalLineage: 0, fatherId: -1, motherId: -1,
      origin: 1, arrivalYear: 1960, firstNameId: 0,
    })

    expect(countInflow(colony.population)).toBe(2)
  })
})
