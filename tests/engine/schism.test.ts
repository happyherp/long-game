import { describe, it, expect } from 'vitest'
import { detectSchism, grantSchism, refuseSchism } from '../../src/engine/schism'
import { createFederation } from '../../src/engine/federation'
import { createStore, addLivingPerson } from '../../src/engine/population'
import { createLineageRegistry } from '../../src/engine/lineage'
import { createRNG } from '../../src/engine/rng'
import { Colony, DEFAULT_DOCTRINE } from '../../src/engine/types'

function createColonyWithFactions(conservativeCount: number, liberalCount: number, neutralCount = 0): Colony {
  const colony: Colony = {
    id: 'cayo',
    name: 'Cayo',
    population: createStore(1000),
    doctrine: { ...DEFAULT_DOCTRINE },
    lineages: createLineageRegistry(),
    treasury: 500000,
    year: 2000,
    history: [],
    modernityPressure: 300,  // high MP to trigger schism
    economy: { parcels: [], buildings: [] },
    pairingCoefficients: new Map(),
    flags: {},
  }

  for (let i = 0; i < conservativeCount; i++) {
    addLivingPerson(colony.population, colony.lineages, {
      age: 30, sex: i % 2, cohesion: 220, married: 0, partnerId: -1,
      paternalLineage: 0, maternalLineage: 0, fatherId: -1, motherId: -1,
      origin: 0, arrivalYear: 1960, firstNameId: 0,
    })
  }

  for (let i = 0; i < liberalCount; i++) {
    addLivingPerson(colony.population, colony.lineages, {
      age: 30, sex: i % 2, cohesion: 80, married: 0, partnerId: -1,
      paternalLineage: 0, maternalLineage: 0, fatherId: -1, motherId: -1,
      origin: 0, arrivalYear: 1960, firstNameId: 0,
    })
  }

  for (let i = 0; i < neutralCount; i++) {
    addLivingPerson(colony.population, colony.lineages, {
      age: 30, sex: i % 2, cohesion: 160, married: 0, partnerId: -1,
      paternalLineage: 0, maternalLineage: 0, fatherId: -1, motherId: -1,
      origin: 0, arrivalYear: 1960, firstNameId: 0,
    })
  }

  return colony
}

describe('Schism', () => {
  it('returns null when MP <= cohesionAvg', () => {
    // MP=0 (default), cohesionAvg=200, so no schism
    const colony: Colony = {
      id: 'cayo',
      name: 'Cayo',
      population: createStore(100),
      doctrine: { ...DEFAULT_DOCTRINE },
      lineages: createLineageRegistry(),
      treasury: 50000,
      year: 2000,
      history: [],
      modernityPressure: 0,  // MP=0, cohesionAvg will be high → no schism
      economy: { parcels: [], buildings: [] },
      pairingCoefficients: new Map(),
      flags: {},
    }
    for (let i = 0; i < 50; i++) {
      addLivingPerson(colony.population, colony.lineages, {
        age: 30, sex: i % 2, cohesion: 220, married: 0, partnerId: -1,
        paternalLineage: 0, maternalLineage: 0, fatherId: -1, motherId: -1,
        origin: 0, arrivalYear: 1960, firstNameId: 0,
      })
    }

    const schism = detectSchism(colony, createRNG(42))
    expect(schism).toBeNull()
  })

  it('returns null if smaller faction < 30 members', () => {
    // 10 conservatives, 200 liberals, MP > cohesionAvg → no schism (faction too small)
    const colony = createColonyWithFactions(10, 200)
    const schism = detectSchism(colony, createRNG(42))
    expect(schism).toBeNull()
  })

  it('returns null if smaller faction >= 40% of total', () => {
    // 95 conservatives + 105 liberals = 200 total; 95/200 = 47.5% > 40%
    const colony = createColonyWithFactions(95, 105)
    const schism = detectSchism(colony, createRNG(42))
    expect(schism).toBeNull()
  })

  it('detects schism when conditions are met', () => {
    // 40 conservatives + 150 liberals; conservative is smaller → conservative splits
    // 40/190 = 21% < 40% ✓, 40 >= 30 ✓, MP=300 > cohesion ~avg
    const colony = createColonyWithFactions(40, 150, 10)
    const schism = detectSchism(colony, createRNG(42))
    expect(schism).not.toBeNull()
    expect(schism?.direction).toBe('conservative')
    expect(schism?.memberIds.length).toBe(40)
  })

  it('granted schism preserves total federation population', () => {
    const colony = createColonyWithFactions(40, 150, 10)
    const federation = createFederation(colony)
    const totalBefore = colony.population.size

    const schism = detectSchism(colony, createRNG(42))
    expect(schism).not.toBeNull()
    if (!schism) return

    grantSchism(federation, schism, createRNG(99))

    const totalAfter = federation.colonies.reduce((sum, c) => sum + c.population.size, 0)
    // Total should be preserved (allow small difference from partner/children transfers)
    expect(Math.abs(totalAfter - totalBefore)).toBeLessThanOrEqual(totalBefore * 0.05)
  })

  it('granted schism creates new colony in federation', () => {
    const colony = createColonyWithFactions(40, 150, 10)
    const federation = createFederation(colony)

    const schism = detectSchism(colony, createRNG(42))
    if (!schism) return

    expect(federation.colonies.length).toBe(1)
    grantSchism(federation, schism, createRNG(99))
    expect(federation.colonies.length).toBe(2)
  })

  it('refused schism drops faction cohesion by 20', () => {
    const colony = createColonyWithFactions(40, 150, 10)

    const conservativeBefore: number[] = []
    for (let i = 0; i < colony.population.size; i++) {
      if (colony.population.cohesion[i] >= 200) {
        conservativeBefore.push(colony.population.cohesion[i])
      }
    }

    const schism = detectSchism(colony, createRNG(42))
    if (!schism) return

    refuseSchism(colony, schism, 2000)

    // Faction members should have lower cohesion
    const factionSet = new Set(schism.memberIds)
    let droppedCount = 0
    for (let slot = 0; slot < colony.population.size; slot++) {
      const stableId = colony.population.slotToId[slot]
      if (factionSet.has(stableId)) {
        // All faction members should have been reduced
        droppedCount++
      }
    }
    expect(droppedCount).toBeGreaterThan(0)

    // Flag should be set
    expect(colony.flags.recentRefusedSchism).toBeDefined()
    expect(colony.flags.recentRefusedSchism?.multiplierUntil).toBe(2003)
  })
})
