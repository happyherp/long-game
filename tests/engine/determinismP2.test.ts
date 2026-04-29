import { describe, it, expect } from 'vitest'
import { generateFoundingColony } from '../../src/engine/founding'
import { createFederation, federationTick } from '../../src/engine/federation'
import { createRNG } from '../../src/engine/rng'

function runFederation(seed: number, years: number) {
  const rng = createRNG(seed)
  const colony = generateFoundingColony(rng.fork('founding'), 'Cayo')
  const federation = createFederation(colony)
  const tickRng = createRNG(seed + 1)
  for (let i = 0; i < years; i++) {
    federationTick(federation, tickRng.fork(`tick-${i}`))
  }
  return federation
}

describe('Determinism P2', () => {
  it('1960→2020 with no schisms is deterministic across two identical runs', () => {
    // Use a closed colony (low MP, low inflow)
    const seed = 12345

    const fed1 = runFederation(seed, 60)
    const fed2 = runFederation(seed, 60)

    expect(fed1.year).toBe(fed2.year)
    expect(fed1.colonies[0].population.size).toBe(fed2.colonies[0].population.size)
    expect(fed1.colonies[0].treasury).toBeCloseTo(fed2.colonies[0].treasury, 0)

    for (let i = 0; i < fed1.colonies[0].population.size; i++) {
      expect(fed1.colonies[0].population.age[i]).toBe(fed2.colonies[0].population.age[i])
      expect(fed1.colonies[0].population.cohesion[i]).toBe(fed2.colonies[0].population.cohesion[i])
    }
  })

  it('different seeds produce different results', () => {
    const fed1 = runFederation(111, 20)
    const fed2 = runFederation(222, 20)

    let different = false
    if (fed1.colonies[0].population.size !== fed2.colonies[0].population.size) {
      different = true
    } else {
      const size = fed1.colonies[0].population.size
      for (let i = 0; i < Math.min(size, 10); i++) {
        if (fed1.colonies[0].population.age[i] !== fed2.colonies[0].population.age[i]) {
          different = true
          break
        }
      }
    }

    expect(different).toBe(true)
  })

  it('same seed produces identical history', () => {
    const seed = 54321

    const fed1 = runFederation(seed, 30)
    const fed2 = runFederation(seed, 30)

    expect(fed1.history.length).toBe(fed2.history.length)
    for (let i = 0; i < fed1.history.length; i++) {
      expect(fed1.history[i].year).toBe(fed2.history[i].year)
      expect(fed1.history[i].totalPopulation).toBe(fed2.history[i].totalPopulation)
    }
  })
})
