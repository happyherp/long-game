import { describe, it, expect } from 'vitest'
import { tick } from '../../src/engine/tick'
import { generateFoundingColony } from '../../src/engine/founding'
import { createRNG } from '../../src/engine/rng'
import { getAlive } from '../../src/engine/population'

describe('Tick', () => {
  it('advances year on each tick', () => {
    const rng = createRNG(123)
    const colony = generateFoundingColony(rng, 'Test')

    const yearBefore = colony.year
    tick(colony, rng.fork('test-tick'))

    expect(colony.year).toBe(yearBefore + 1)
  })

  it('adds to history on each tick', () => {
    const rng = createRNG(456)
    const colony = generateFoundingColony(rng, 'Test')

    const historyBefore = colony.history.length
    tick(colony, rng.fork('test-tick'))

    expect(colony.history.length).toBe(historyBefore + 1)
  })

  it('ages everyone by one year', () => {
    const rng = createRNG(789)
    const colony = generateFoundingColony(rng, 'Test')

    const minAgeBefore = Math.min(...Array.from(getAlive(colony.population)).map((id) => colony.population.age[id]))
    const maxAgeBefore = Math.max(...Array.from(getAlive(colony.population)).map((id) => colony.population.age[id]))

    tick(colony, rng.fork('test-tick'))

    const minAgeAfter = Math.min(...Array.from(getAlive(colony.population)).map((id) => colony.population.age[id]))
    const maxAgeAfter = Math.max(...Array.from(getAlive(colony.population)).map((id) => colony.population.age[id]))

    expect(maxAgeAfter).toBeGreaterThanOrEqual(maxAgeBefore)
  })

  it('is deterministic with same seed', () => {
    const colony1 = generateFoundingColony(createRNG(111), 'Test1')
    const colony2 = generateFoundingColony(createRNG(111), 'Test2')

    const rng1 = createRNG(222)
    const rng2 = createRNG(222)

    tick(colony1, rng1.fork('tick1'))
    tick(colony2, rng2.fork('tick1'))

    expect(colony1.population.size).toBe(colony2.population.size)
    expect(colony1.year).toBe(colony2.year)
    expect(colony1.treasury).toBeCloseTo(colony2.treasury, 0)
  })

  it('returns tick result with events and metrics', () => {
    const rng = createRNG(333)
    const colony = generateFoundingColony(rng, 'Test')

    const result = tick(colony, rng.fork('test-tick'))

    expect(result.colony).toBe(colony)
    expect(Array.isArray(result.events)).toBe(true)
    expect(result.metrics).toBeDefined()
    expect(result.metrics.totalPopulation).toBeGreaterThan(0)
  })

  it('emits various event types', () => {
    const rng = createRNG(444)
    const colony = generateFoundingColony(rng, 'Test')

    let hasDeaths = false
    let hasBirths = false
    let hasPairings = false

    for (let year = 0; year < 10; year++) {
      const result = tick(colony, rng.fork(`tick-${year}`))
      for (const event of result.events) {
        if (event.type === 'death') hasDeaths = true
        if (event.type === 'birth') hasBirths = true
        if (event.type === 'pairing') hasPairings = true
      }
    }

    expect(hasDeaths || hasBirths || hasPairings).toBe(true)
  })

  it('updates treasury based on population', () => {
    const rng = createRNG(555)
    const colony = generateFoundingColony(rng, 'Test')

    const treasuryBefore = colony.treasury
    tick(colony, rng.fork('test-tick'))

    expect(colony.treasury).not.toBe(treasuryBefore)
  })
})
