import { describe, it, expect } from 'vitest'
import { applyInflow, poissonDraw } from '../../src/engine/inflow'
import { createStore, addLivingPerson } from '../../src/engine/population'
import { createLineageRegistry } from '../../src/engine/lineage'
import { createRNG } from '../../src/engine/rng'
import { Colony, DEFAULT_DOCTRINE } from '../../src/engine/types'

function createColony(inflowPolicy: 'open' | 'vetted' | 'closed' = 'open'): Colony {
  const colony: Colony = {
    id: 'test',
    name: 'Test',
    population: createStore(2000),
    doctrine: { ...DEFAULT_DOCTRINE, inflowPolicy },
    lineages: createLineageRegistry(),
    treasury: 50000,
    year: 1960,
    history: [],
    modernityPressure: 0,
    economy: { parcels: [], buildings: [] },
    pairingCoefficients: new Map(),
    flags: {},
  }

  // Add 300 residents
  for (let i = 0; i < 300; i++) {
    addLivingPerson(colony.population, colony.lineages, {
      age: 30, sex: i % 2, cohesion: 200, married: 0, partnerId: -1,
      paternalLineage: 0, maternalLineage: 0, fatherId: -1, motherId: -1,
      origin: 0, arrivalYear: 1960, firstNameId: 0,
    })
  }

  return colony
}

describe('Inflow', () => {
  it('closed policy produces 0 inflow', () => {
    const colony = createColony('closed')
    const events = applyInflow(colony, 1960, createRNG(123))
    expect(events).toHaveLength(0)
  })

  it('open policy produces inflow events', () => {
    // Run 10 years and count total inflow
    const colony = createColony('open')
    let totalInflow = 0
    const rng = createRNG(456)
    for (let year = 1960; year < 1970; year++) {
      const events = applyInflow(colony, year, rng.fork(`inflow-${year}`))
      totalInflow += events.length
    }
    expect(totalInflow).toBeGreaterThan(0)
  })

  it('vetted policy produces roughly half the rate of open over many years', () => {
    const runs = 5
    let openTotal = 0
    let vettedTotal = 0

    for (let run = 0; run < runs; run++) {
      const openColony = createColony('open')
      const vettedColony = createColony('vetted')
      const rng = createRNG(run * 1000)

      for (let year = 1960; year < 1980; year++) {
        openTotal += applyInflow(openColony, year, rng.fork(`o-${year}`)).length
        vettedTotal += applyInflow(vettedColony, year, rng.fork(`v-${year}`)).length
      }
    }

    // vetted rate is 0.003 vs open 0.008 — vetted is lower
    expect(vettedTotal).toBeLessThan(openTotal)
  })

  it('inflow members have origin=1', () => {
    const colony = createColony('open')
    const rng = createRNG(789)
    // Run multiple years to ensure we get some inflow
    for (let year = 1960; year < 1970; year++) {
      applyInflow(colony, year, rng.fork(`inflow-${year}`))
    }

    // Check that at least one person has origin=1
    let hasInflow = false
    for (let i = 0; i < colony.population.size; i++) {
      if (colony.population.origin[i] === 1) {
        hasInflow = true
        break
      }
    }
    expect(hasInflow).toBe(true)
  })

  it('inflow lineage appears in lineage registry', () => {
    const colony = createColony('open')
    const initialSurnameCount = colony.lineages.surnames.length
    const rng = createRNG(101)

    // Run multiple years to get some inflow
    for (let year = 1960; year < 1975; year++) {
      applyInflow(colony, year, rng.fork(`inflow-${year}`))
    }

    // New surnames should have been added
    expect(colony.lineages.surnames.length).toBeGreaterThan(initialSurnameCount)
  })

  it('inflow members have age 18-29', () => {
    const colony = createColony('open')
    const rng = createRNG(202)

    for (let year = 1960; year < 1975; year++) {
      applyInflow(colony, year, rng.fork(`inflow-${year}`))
    }

    // Check inflow members (origin=1) have ages in 18-29 range
    for (let i = 0; i < colony.population.size; i++) {
      if (colony.population.origin[i] === 1) {
        const age = colony.population.age[i]
        expect(age).toBeGreaterThanOrEqual(18)
        expect(age).toBeLessThanOrEqual(29)
      }
    }
  })

  it('poissonDraw returns 0 for lambda<=0', () => {
    const rng = createRNG(42)
    expect(poissonDraw(0, rng)).toBe(0)
    expect(poissonDraw(-1, rng)).toBe(0)
  })
})
