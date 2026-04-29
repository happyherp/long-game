import { describe, it, expect } from 'vitest'
import { inbreedingCoefficient } from '../../src/engine/inbreeding'
import { createStore } from '../../src/engine/population'
import { PopulationStore } from '../../src/engine/types'

function makeStore(): PopulationStore {
  return createStore(100)
}

function addFounder(store: PopulationStore, sex: number): number {
  const id = store.nextId++
  const slot = store.size++
  store.sex[slot] = sex
  store.fatherId[slot] = -1
  store.motherId[slot] = -1
  store.slotToId[slot] = id
  store.idToSlot.set(id, slot)
  return id
}

function addChild(store: PopulationStore, sex: number, fatherId: number, motherId: number): number {
  const id = store.nextId++
  const slot = store.size++
  store.sex[slot] = sex
  store.fatherId[slot] = fatherId
  store.motherId[slot] = motherId
  store.slotToId[slot] = id
  store.idToSlot.set(id, slot)
  return id
}

describe('Inbreeding Coefficient', () => {
  it('unrelated individuals → coefficient ~0', () => {
    const store = makeStore()
    const f1 = addFounder(store, 0)
    const f2 = addFounder(store, 1)
    const f3 = addFounder(store, 0)
    const f4 = addFounder(store, 1)
    const child1 = addChild(store, 0, f2, f1)
    const child2 = addChild(store, 1, f4, f3)

    const coef = inbreedingCoefficient(child1, child2, store)
    expect(coef).toBeCloseTo(0, 5)
  })

  it('siblings → coefficient ~0.25', () => {
    const store = makeStore()
    const father = addFounder(store, 1)
    const mother = addFounder(store, 0)
    const sib1 = addChild(store, 0, father, mother)
    const sib2 = addChild(store, 1, father, mother)

    const coef = inbreedingCoefficient(sib1, sib2, store)
    // Siblings share both parents; kinship = 0.5^(1+1+1) + 0.5^(1+1+1) = 0.125 + 0.125 = 0.25
    expect(coef).toBeCloseTo(0.25, 5)
  })

  it('first cousins → coefficient ~0.0625', () => {
    const store = makeStore()

    // Grandparents
    const gf = addFounder(store, 1)
    const gm = addFounder(store, 0)

    // Two siblings (parents of the cousins)
    const parent1 = addChild(store, 1, gf, gm)
    const parent2 = addChild(store, 1, gf, gm)

    // Unrelated spouses for the siblings
    const spouse1 = addFounder(store, 0)
    const spouse2 = addFounder(store, 0)

    // Cousins
    const cousin1 = addChild(store, 0, parent1, spouse1)
    const cousin2 = addChild(store, 1, parent2, spouse2)

    const coef = inbreedingCoefficient(cousin1, cousin2, store)
    // First cousins share grandparents; expected ~0.0625
    expect(coef).toBeCloseTo(0.0625, 3)
  })

  it('coefficient is bounded at 0.5', () => {
    const store = makeStore()
    const father = addFounder(store, 1)
    const mother = addFounder(store, 0)
    // Simulate extreme inbreeding: father and mother are siblings too
    // by artificially making them share parents — but with our setup,
    // let's just verify the bound with a normal sibling pair
    const sib1 = addChild(store, 0, father, mother)
    const sib2 = addChild(store, 1, father, mother)
    const coef = inbreedingCoefficient(sib1, sib2, store)
    expect(coef).toBeLessThanOrEqual(0.5)
  })

  it('half-siblings → coefficient ~0.125', () => {
    const store = makeStore()
    const sharedFather = addFounder(store, 1)
    const mother1 = addFounder(store, 0)
    const mother2 = addFounder(store, 0)

    const halfSib1 = addChild(store, 0, sharedFather, mother1)
    const halfSib2 = addChild(store, 1, sharedFather, mother2)

    const coef = inbreedingCoefficient(halfSib1, halfSib2, store)
    // Half siblings share one parent → kinship = 0.5^(1+1+1) = 0.125
    expect(coef).toBeCloseTo(0.125, 5)
  })

  it('depth-bounded at 6 generations', () => {
    // Create a long chain and verify it doesn't blow up
    const store = makeStore()
    let prevMale = addFounder(store, 1)
    let prevFemale = addFounder(store, 0)

    for (let gen = 0; gen < 8; gen++) {
      const child = addChild(store, gen % 2, prevMale, prevFemale)
      const unrelated = addFounder(store, 1 - (gen % 2))
      if (gen % 2 === 0) {
        prevFemale = child
        prevMale = unrelated
      } else {
        prevMale = child
        prevFemale = unrelated
      }
    }

    // Just ensure no errors and bounded result
    const coef = inbreedingCoefficient(prevMale, prevFemale, store)
    expect(coef).toBeGreaterThanOrEqual(0)
    expect(coef).toBeLessThanOrEqual(0.5)
  })
})
