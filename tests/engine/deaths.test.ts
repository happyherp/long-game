import { describe, it, expect } from 'vitest'
import { applyDeaths } from '../../src/engine/deaths'
import { createStore, addLivingPerson, getAlive, getSlot } from '../../src/engine/population'
import { createLineageRegistry } from '../../src/engine/lineage'
import { createRNG } from '../../src/engine/rng'

describe('Deaths', () => {
  it('removes dead people from population', () => {
    const store = createStore(100)
    const lineages = createLineageRegistry()
    const rng = createRNG(123)

    for (let i = 0; i < 100; i++) {
      addLivingPerson(store, lineages, {
        age: 85,
        sex: 0,
        cohesion: 200,
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

    expect(store.size).toBe(100)

    const events = applyDeaths(store, lineages, rng, 1960)

    expect(events.length).toBeGreaterThan(0)
    expect(store.size).toBeLessThan(100)
  })

  it('emits death events for deceased', () => {
    const store = createStore(10)
    const lineages = createLineageRegistry()
    const rng = createRNG(456)

    addLivingPerson(store, lineages, {
      age: 90,
      sex: 0,
      cohesion: 200,
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

    const events = applyDeaths(store, lineages, rng, 1960)

    expect(events.length).toBe(1)
    expect(events[0].type).toBe('death')
    expect(events[0].year).toBe(1960)
  })

  it('marks partner as single when person dies', () => {
    const store = createStore(10)
    const lineages = createLineageRegistry()
    const rng = createRNG(789)

    const id1 = addLivingPerson(store, lineages, {
      age: 90,
      sex: 1,
      cohesion: 200,
      married: 1,
      partnerId: -1,
      paternalLineage: 0,
      maternalLineage: 0,
      fatherId: -1,
      motherId: -1,
      origin: 0,
      arrivalYear: 1960,
      firstNameId: 0,
    })

    const id2 = addLivingPerson(store, lineages, {
      age: 30,
      sex: 0,
      cohesion: 200,
      married: 1,
      partnerId: id1,
      paternalLineage: 1,
      maternalLineage: 1,
      fatherId: -1,
      motherId: -1,
      origin: 0,
      arrivalYear: 1960,
      firstNameId: 0,
    })

    store.partnerId[getSlot(store, id1)] = id2

    expect(store.married[getSlot(store, id2)]).toBe(1)
    expect(store.partnerId[getSlot(store, id2)]).toBe(id1)

    applyDeaths(store, lineages, rng, 1960)

    expect(store.married[getSlot(store, id2)]).toBe(0)
    expect(store.partnerId[getSlot(store, id2)]).toBe(-1)
  })

  it('decrements lineage living counts', () => {
    const store = createStore(10)
    const lineages = createLineageRegistry()
    const rng = createRNG(111)

    addLivingPerson(store, lineages, {
      age: 90,
      sex: 0,
      cohesion: 200,
      married: 0,
      partnerId: -1,
      paternalLineage: 5,
      maternalLineage: 10,
      fatherId: -1,
      motherId: -1,
      origin: 0,
      arrivalYear: 1960,
      firstNameId: 0,
    })

    expect(lineages.livingCount[5]).toBe(1)
    expect(lineages.livingCount[10]).toBe(1)

    applyDeaths(store, lineages, rng, 1960)

    expect(lineages.livingCount[5]).toBe(0)
    expect(lineages.livingCount[10]).toBe(0)
  })

  it('respects age-based death probabilities', () => {
    const rng = createRNG(222)

    const cases = [
      { age: 0, expectedProb: 0.02, tolerance: 0.01 },
      { age: 10, expectedProb: 0.001, tolerance: 0.001 },
      { age: 50, expectedProb: 0.003, tolerance: 0.002 },
      { age: 70, expectedProb: 0.03, tolerance: 0.015 },
      { age: 80, expectedProb: 0.08, tolerance: 0.03 },
    ]

    for (const testCase of cases) {
      const store = createStore(1000)
      const lineages = createLineageRegistry()

      for (let i = 0; i < 1000; i++) {
        addLivingPerson(store, lineages, {
          age: testCase.age,
          sex: i % 2,
          cohesion: 200,
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

      const localRng = rng.fork(`death-test-${testCase.age}`)
      const events = applyDeaths(store, lineages, localRng, 1960)
      const actualRate = events.length / 1000

      expect(actualRate).toBeGreaterThanOrEqual(testCase.expectedProb - testCase.tolerance)
      expect(actualRate).toBeLessThanOrEqual(testCase.expectedProb + testCase.tolerance)
    }
  })

  it('handles age 90 as 100% death', () => {
    const store = createStore(10)
    const lineages = createLineageRegistry()
    const rng = createRNG(333)

    for (let i = 0; i < 10; i++) {
      addLivingPerson(store, lineages, {
        age: 90,
        sex: 0,
        cohesion: 200,
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

    const events = applyDeaths(store, lineages, rng, 1960)

    expect(events.length).toBe(10)
    expect(store.size).toBe(0)
  })

  it('maintains consistency after removing multiple people', () => {
    const store = createStore(100)
    const lineages = createLineageRegistry()
    const rng = createRNG(444)

    for (let i = 0; i < 50; i++) {
      addLivingPerson(store, lineages, {
        age: 80 + Math.floor(i / 10),
        sex: i % 2,
        cohesion: 200,
        married: 0,
        partnerId: -1,
        paternalLineage: i % 30,
        maternalLineage: (i + 1) % 30,
        fatherId: -1,
        motherId: -1,
        origin: 0,
        arrivalYear: 1960,
        firstNameId: 0,
      })
    }

    const initialSize = store.size
    applyDeaths(store, lineages, rng, 1960)
    const finalSize = store.size

    expect(finalSize).toBeLessThanOrEqual(initialSize)

    let aliveCount = 0
    for (const _ of getAlive(store)) {
      aliveCount++
    }
    expect(aliveCount).toBe(finalSize)
  })
})
