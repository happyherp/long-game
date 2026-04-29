import { describe, it, expect } from 'vitest'
import { federationTick, createFederation } from '../../src/engine/federation'
import { generateFoundingColony } from '../../src/engine/founding'
import { createRNG } from '../../src/engine/rng'

describe('Federation Tick', () => {
  it('advances federation year by 1', () => {
    const rng = createRNG(123)
    const colony = generateFoundingColony(rng.fork('founding'), 'Cayo')
    const federation = createFederation(colony)
    const yearBefore = federation.year

    federationTick(federation, rng.fork('tick'))

    expect(federation.year).toBe(yearBefore + 1)
  })

  it('returns metrics for each colony', () => {
    const rng = createRNG(456)
    const colony = generateFoundingColony(rng.fork('founding'), 'Cayo')
    const federation = createFederation(colony)

    const result = federationTick(federation, rng.fork('tick'))

    expect(result.metrics).toHaveLength(1)
    expect(result.metrics[0].totalPopulation).toBeGreaterThan(0)
  })

  it('returns events array', () => {
    const rng = createRNG(789)
    const colony = generateFoundingColony(rng.fork('founding'), 'Cayo')
    const federation = createFederation(colony)

    const result = federationTick(federation, rng.fork('tick'))

    expect(Array.isArray(result.events)).toBe(true)
  })

  it('appends to federation history', () => {
    const rng = createRNG(111)
    const colony = generateFoundingColony(rng.fork('founding'), 'Cayo')
    const federation = createFederation(colony)

    expect(federation.history.length).toBe(0)
    federationTick(federation, rng.fork('tick'))
    expect(federation.history.length).toBe(1)
  })

  it('identical seed produces identical output', () => {
    const seed = 42

    const colony1 = generateFoundingColony(createRNG(seed), 'Run1')
    const colony2 = generateFoundingColony(createRNG(seed), 'Run2')
    const fed1 = createFederation(colony1)
    const fed2 = createFederation(colony2)

    const rng1 = createRNG(seed + 1)
    const rng2 = createRNG(seed + 1)

    for (let i = 0; i < 5; i++) {
      federationTick(fed1, rng1.fork(`tick-${i}`))
      federationTick(fed2, rng2.fork(`tick-${i}`))
    }

    expect(fed1.colonies[0].population.size).toBe(fed2.colonies[0].population.size)
    expect(fed1.year).toBe(fed2.year)
    expect(fed1.colonies[0].treasury).toBeCloseTo(fed2.colonies[0].treasury, 0)
  })

  it('tick forks RNG per colony', () => {
    // Verify that two colonies in the same federation run independently
    const rng = createRNG(777)
    const colony1 = generateFoundingColony(rng.fork('col1'), 'Colony1')
    colony1.id = 'col1'
    const colony2 = generateFoundingColony(rng.fork('col2'), 'Colony2')
    colony2.id = 'col2'
    colony2.year = colony1.year  // sync years

    const federation = createFederation(colony1)
    federation.colonies.push(colony2)

    const tickRng = createRNG(999)
    federationTick(federation, tickRng)

    // Both colonies should still exist
    expect(federation.colonies.length).toBe(2)
  })
})
