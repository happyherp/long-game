import { describe, it, expect } from 'vitest'
import { updateTreasury } from '../../src/engine/economy'
import { createStore, addLivingPerson } from '../../src/engine/population'
import { createLineageRegistry } from '../../src/engine/lineage'
import { Colony, DEFAULT_DOCTRINE } from '../../src/engine/types'

function createColonyWithParcel(hectares: number, type: 'jungleClearing' | 'farmland' | 'pasture', productivity: number, adults: number): Colony {
  const colony: Colony = {
    id: 'test',
    name: 'Test',
    population: createStore(1000),
    doctrine: { ...DEFAULT_DOCTRINE },
    lineages: createLineageRegistry(),
    treasury: 0,
    year: 1960,
    history: [],
    modernityPressure: 0,
    economy: {
      parcels: [{
        id: 'parcel-0',
        type,
        hectares,
        productivity,
        purchaseYear: 1960,
      }],
      buildings: [],
    },
    pairingCoefficients: new Map(),
    flags: {},
  }

  for (let i = 0; i < adults; i++) {
    addLivingPerson(colony.population, colony.lineages, {
      age: 35, sex: i % 2, cohesion: 200, married: 0, partnerId: -1,
      paternalLineage: 0, maternalLineage: 0, fatherId: -1, motherId: -1,
      origin: 0, arrivalYear: 1960, firstNameId: 0,
    })
  }

  return colony
}

describe('Economy Parcels', () => {
  it('1000ha farmland at productivity 0.5 with 50 adults gets positive output', () => {
    const colony = createColonyWithParcel(1000, 'farmland', 0.5, 50)
    const before = colony.treasury
    updateTreasury(colony)
    const after = colony.treasury

    // Should generate more than simple adults*1200 if parcel output > 50*1200=60000
    // Farmland: 1000ha * 100$/ha * 0.5 productivity * laborMult * techMult
    // laborMult = min(1, (50/1000)/0.05) = min(1, 1) = 1
    // techMult = 1.0 (no motorizedFarming, no sundayObservance in default)
    // Wait, DEFAULT_DOCTRINE has sundayObservance=true → techMult = 6/7
    // output = 1000 * 100 * 0.5 * 1 * (6/7) = ~42857
    // expenses = 50 * 600 = 30000
    // enforcement = 50^2 * strictness * 0.0003
    // Net: positive
    expect(after).toBeGreaterThan(before - 50 * 600 - 50 * 50 * 16 * 0.0003)
  })

  it('pasture with dairy plant gets 1.5x multiplier', () => {
    const colony = createColonyWithParcel(1000, 'pasture', 1.0, 50)
    colony.economy.buildings = []
    const colonyWithDairy = createColonyWithParcel(1000, 'pasture', 1.0, 50)
    colonyWithDairy.economy.buildings = ['dairyPlant']

    const treasuryBefore = colony.treasury
    const dairyBefore = colonyWithDairy.treasury

    updateTreasury(colony)
    updateTreasury(colonyWithDairy)

    const baseChange = colony.treasury - treasuryBefore
    const dairyChange = colonyWithDairy.treasury - dairyBefore

    // The dairy plant boosts pasture output by 1.5x; the difference should be ~50% more output
    expect(dairyChange).toBeGreaterThan(baseChange)
  })

  it('falls back to adults*1200 with no parcels', () => {
    const colony: Colony = {
      id: 'test',
      name: 'Test',
      population: createStore(200),
      doctrine: { ...DEFAULT_DOCTRINE, sundayObservance: false },  // remove 6/7 factor
      lineages: createLineageRegistry(),
      treasury: 0,
      year: 1960,
      history: [],
      modernityPressure: 0,
      economy: { parcels: [], buildings: [] },
      pairingCoefficients: new Map(),
      flags: {},
    }

    const adults = 50
    for (let i = 0; i < adults; i++) {
      addLivingPerson(colony.population, colony.lineages, {
        age: 35, sex: i % 2, cohesion: 200, married: 0, partnerId: -1,
        paternalLineage: 0, maternalLineage: 0, fatherId: -1, motherId: -1,
        origin: 0, arrivalYear: 1960, firstNameId: 0,
      })
    }

    updateTreasury(colony)
    // Output = 50 * 1200 = 60000, expenses = 50 * 600 = 30000
    // Enforcement = 50^2 * strictness * 0.0003
    // Net positive since output > expenses + enforcement
    expect(colony.treasury).toBeGreaterThan(0)
  })

  it('motorizedFarming doctrine gives 1.3x multiplier', () => {
    const base = createColonyWithParcel(1000, 'farmland', 1.0, 50)
    base.doctrine = { ...DEFAULT_DOCTRINE, motorizedFarming: false, sundayObservance: false }

    const motorized = createColonyWithParcel(1000, 'farmland', 1.0, 50)
    motorized.doctrine = { ...DEFAULT_DOCTRINE, motorizedFarming: true, sundayObservance: false }

    updateTreasury(base)
    updateTreasury(motorized)

    expect(motorized.treasury).toBeGreaterThan(base.treasury)
  })
})
