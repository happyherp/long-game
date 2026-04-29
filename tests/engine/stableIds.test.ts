import { describe, it, expect } from 'vitest'
import { createStore, addPerson, removePerson, getSlot, getAlive } from '../../src/engine/population'
import { PersonAttrs } from '../../src/engine/population'

function makeAttrs(age: number): PersonAttrs {
  return {
    age, sex: 0, cohesion: 150, married: 0, partnerId: -1,
    paternalLineage: 0, maternalLineage: 0,
    fatherId: -1, motherId: -1, origin: 0, arrivalYear: 1960,
    firstNameId: 0,
  }
}

describe('Stable IDs', () => {
  it('addPerson returns monotonically increasing stable IDs starting at 0', () => {
    const store = createStore(10)
    const id0 = addPerson(store, makeAttrs(10))
    const id1 = addPerson(store, makeAttrs(20))
    const id2 = addPerson(store, makeAttrs(30))
    expect(id0).toBe(0)
    expect(id1).toBe(1)
    expect(id2).toBe(2)
  })

  it('getSlot returns current slot for a stable ID', () => {
    const store = createStore(10)
    const id0 = addPerson(store, makeAttrs(10))
    const id1 = addPerson(store, makeAttrs(20))
    expect(getSlot(store, id0)).toBe(0)
    expect(getSlot(store, id1)).toBe(1)
  })

  it('getSlot returns -1 for unknown IDs', () => {
    const store = createStore(10)
    expect(getSlot(store, 0)).toBe(-1)
    expect(getSlot(store, 999)).toBe(-1)
  })

  it('stable ID survives another person being removed', () => {
    const store = createStore(10)
    const id0 = addPerson(store, makeAttrs(10))
    const id1 = addPerson(store, makeAttrs(20))
    const id2 = addPerson(store, makeAttrs(30))

    removePerson(store, id0)  // removes slot 0; id2 swaps into slot 0

    // id1 and id2 should still resolve correctly
    expect(getSlot(store, id1)).toBeGreaterThanOrEqual(0)
    expect(getSlot(store, id2)).toBeGreaterThanOrEqual(0)

    // data integrity: age at id1's slot is still 20
    expect(store.age[getSlot(store, id1)]).toBe(20)
    // data integrity: age at id2's slot is still 30
    expect(store.age[getSlot(store, id2)]).toBe(30)
  })

  it('stable ID survives N consecutive removes', () => {
    const store = createStore(20)
    const ids: number[] = []
    for (let i = 0; i < 10; i++) ids.push(addPerson(store, makeAttrs(i * 5)))

    // Remove every other person
    for (let i = 0; i < 10; i += 2) removePerson(store, ids[i])

    // Remaining IDs (odd) should still resolve
    for (let i = 1; i < 10; i += 2) {
      const slot = getSlot(store, ids[i])
      expect(slot).toBeGreaterThanOrEqual(0)
      expect(store.age[slot]).toBe(i * 5)
    }
  })

  it('retired stable ID is not reused', () => {
    const store = createStore(10)
    const id0 = addPerson(store, makeAttrs(10))
    removePerson(store, id0)
    const id1 = addPerson(store, makeAttrs(20))
    expect(id1).not.toBe(id0)
    expect(id1).toBe(1)
  })

  it('getSlot returns -1 for a retired ID', () => {
    const store = createStore(10)
    const id0 = addPerson(store, makeAttrs(10))
    addPerson(store, makeAttrs(20))
    removePerson(store, id0)
    expect(getSlot(store, id0)).toBe(-1)
  })

  it('removePerson throws on unknown stable ID', () => {
    const store = createStore(10)
    expect(() => removePerson(store, 999)).toThrow()
  })

  it('size decrements after remove', () => {
    const store = createStore(10)
    const id0 = addPerson(store, makeAttrs(10))
    addPerson(store, makeAttrs(20))
    expect(store.size).toBe(2)
    removePerson(store, id0)
    expect(store.size).toBe(1)
  })

  it('getAlive yields contiguous slots 0..size-1 after removes', () => {
    const store = createStore(10)
    const id0 = addPerson(store, makeAttrs(10))
    addPerson(store, makeAttrs(20))
    addPerson(store, makeAttrs(30))

    removePerson(store, id0)

    const slots = Array.from(getAlive(store))
    expect(slots).toEqual([0, 1])
  })

  it('slotToId and idToSlot are consistent after multiple removes', () => {
    const store = createStore(20)
    const ids: number[] = []
    for (let i = 0; i < 8; i++) ids.push(addPerson(store, makeAttrs(i)))

    removePerson(store, ids[3])
    removePerson(store, ids[1])
    removePerson(store, ids[6])

    // For all live slots, the round-trip slot→id→slot must hold
    for (let slot = 0; slot < store.size; slot++) {
      const stableId = store.slotToId[slot]
      expect(stableId).toBeGreaterThanOrEqual(0)
      expect(store.idToSlot.get(stableId)).toBe(slot)
    }
  })

  it('capacity grows automatically and stable IDs remain valid', () => {
    const store = createStore(2)
    const id0 = addPerson(store, makeAttrs(10))
    const id1 = addPerson(store, makeAttrs(20))
    expect(store.capacity).toBe(2)

    // This triggers growth
    const id2 = addPerson(store, makeAttrs(30))
    expect(store.capacity).toBe(4)

    expect(store.age[getSlot(store, id0)]).toBe(10)
    expect(store.age[getSlot(store, id1)]).toBe(20)
    expect(store.age[getSlot(store, id2)]).toBe(30)
  })
})
