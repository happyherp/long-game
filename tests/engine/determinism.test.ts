import { describe, it, expect } from 'vitest'
import { generateFoundingColony } from '../../src/engine/founding'
import { tick } from '../../src/engine/tick'
import { createRNG } from '../../src/engine/rng'
import { getAlive } from '../../src/engine/population'

describe('Determinism', () => {
  it('same seed produces identical state after 10 ticks', () => {
    const seed = 12345
    const doctrineSequence = [
      { smartphones: false, englishSchool: false, plainDress: true, marriageAge: 19 },
      { smartphones: false, englishSchool: false, plainDress: true, marriageAge: 19 },
      { smartphones: true, englishSchool: false, plainDress: true, marriageAge: 19 },
      { smartphones: true, englishSchool: false, plainDress: true, marriageAge: 19 },
      { smartphones: true, englishSchool: false, plainDress: true, marriageAge: 19 },
      { smartphones: true, englishSchool: true, plainDress: true, marriageAge: 19 },
      { smartphones: true, englishSchool: true, plainDress: true, marriageAge: 19 },
      { smartphones: true, englishSchool: true, plainDress: false, marriageAge: 19 },
      { smartphones: true, englishSchool: true, plainDress: false, marriageAge: 20 },
      { smartphones: false, englishSchool: false, plainDress: true, marriageAge: 17 },
    ]

    const run1 = generateFoundingColony(createRNG(seed), 'Test1')
    const run2 = generateFoundingColony(createRNG(seed), 'Test2')

    const rng1 = createRNG(seed)
    const rng2 = createRNG(seed)

    for (let year = 0; year < 10; year++) {
      run1.doctrine = { ...doctrineSequence[year] }
      run2.doctrine = { ...doctrineSequence[year] }

      tick(run1, rng1.fork(`tick-${year}`))
      tick(run2, rng2.fork(`tick-${year}`))
    }

    compareColonies(run1, run2)
  })

  it('same seed produces identical state with static doctrine to year 50', () => {
    const seed = 54321

    const run1 = generateFoundingColony(createRNG(seed), 'Test1')
    const run2 = generateFoundingColony(createRNG(seed), 'Test2')

    const rng1 = createRNG(seed)
    const rng2 = createRNG(seed)

    for (let year = 0; year < 50; year++) {
      tick(run1, rng1.fork(`tick-${year}`))
      tick(run2, rng2.fork(`tick-${year}`))
    }

    compareColonies(run1, run2)
  })

  it('different seeds produce different results', () => {
    const run1 = generateFoundingColony(createRNG(111), 'Test1')
    const run2 = generateFoundingColony(createRNG(222), 'Test2')

    const rng1 = createRNG(111)
    const rng2 = createRNG(222)

    for (let year = 0; year < 20; year++) {
      tick(run1, rng1.fork(`tick-${year}`))
      tick(run2, rng2.fork(`tick-${year}`))
    }

    let different = false
    const size1 = run1.population.size
    const size2 = run2.population.size

    if (size1 !== size2) {
      different = true
    } else {
      for (let id = 0; id < Math.min(size1, size2); id++) {
        if (run1.population.age[id] !== run2.population.age[id]) {
          different = true
          break
        }
      }
    }

    expect(different).toBe(true)
  })

  it('produces same history snapshots with same seed', () => {
    const seed = 777

    const run1 = generateFoundingColony(createRNG(seed), 'Test1')
    const run2 = generateFoundingColony(createRNG(seed), 'Test2')

    const rng1 = createRNG(seed)
    const rng2 = createRNG(seed)

    for (let year = 0; year < 15; year++) {
      tick(run1, rng1.fork(`tick-${year}`))
      tick(run2, rng2.fork(`tick-${year}`))
    }

    expect(run1.history.length).toBe(run2.history.length)

    for (let i = 0; i < run1.history.length; i++) {
      expect(run1.history[i].year).toBe(run2.history[i].year)
      expect(run1.history[i].population).toBe(run2.history[i].population)
      expect(run1.history[i].births).toBe(run2.history[i].births)
      expect(run1.history[i].deaths).toBe(run2.history[i].deaths)
      expect(run1.history[i].departures).toBe(run2.history[i].departures)
    }
  })
})

function compareColonies(colony1: any, colony2: any): void {
  expect(colony1.population.size).toBe(colony2.population.size)
  expect(colony1.year).toBe(colony2.year)
  expect(colony1.treasury).toBeCloseTo(colony2.treasury, 1)

  for (let id = 0; id < colony1.population.size; id++) {
    expect(colony1.population.age[id]).toBe(colony2.population.age[id])
    expect(colony1.population.sex[id]).toBe(colony2.population.sex[id])
    expect(colony1.population.cohesion[id]).toBe(colony2.population.cohesion[id])
    expect(colony1.population.married[id]).toBe(colony2.population.married[id])
    expect(colony1.population.partnerId[id]).toBe(colony2.population.partnerId[id])
    expect(colony1.population.paternalLineage[id]).toBe(colony2.population.paternalLineage[id])
    expect(colony1.population.maternalLineage[id]).toBe(colony2.population.maternalLineage[id])
  }

  expect(colony1.history.length).toBe(colony2.history.length)
}
