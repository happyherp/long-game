import { describe, it, expect } from 'vitest'
import {
  createLineageRegistry,
  incrementLivingCount,
  decrementLivingCount,
  getLivingCount,
  getSurnameBySurname,
  getSurnameById,
  getTotalLivingMembers,
} from '../../src/engine/lineage'
import { FOUNDER_SURNAMES } from '../../src/engine/names'

describe('Lineage Registry', () => {
  it('createLineageRegistry initializes with 30 surnames', () => {
    const registry = createLineageRegistry()
    expect(registry.surnames).toHaveLength(30)
    expect(registry.surnames).toEqual(FOUNDER_SURNAMES)
  })

  it('createLineageRegistry initializes living counts to 0', () => {
    const registry = createLineageRegistry()
    expect(registry.livingCount).toHaveLength(30)
    for (let i = 0; i < 30; i++) {
      expect(registry.livingCount[i]).toBe(0)
    }
  })

  it('incrementLivingCount increases count', () => {
    const registry = createLineageRegistry()
    incrementLivingCount(registry, 0)
    expect(registry.livingCount[0]).toBe(1)
    incrementLivingCount(registry, 0)
    expect(registry.livingCount[0]).toBe(2)
  })

  it('decrementLivingCount decreases count', () => {
    const registry = createLineageRegistry()
    incrementLivingCount(registry, 5)
    incrementLivingCount(registry, 5)
    expect(registry.livingCount[5]).toBe(2)

    decrementLivingCount(registry, 5)
    expect(registry.livingCount[5]).toBe(1)
    decrementLivingCount(registry, 5)
    expect(registry.livingCount[5]).toBe(0)
  })

  it('decrementLivingCount throws when going below 0', () => {
    const registry = createLineageRegistry()
    expect(() => decrementLivingCount(registry, 0)).toThrow()
  })

  it('getLivingCount returns current count', () => {
    const registry = createLineageRegistry()
    expect(getLivingCount(registry, 3)).toBe(0)
    incrementLivingCount(registry, 3)
    incrementLivingCount(registry, 3)
    expect(getLivingCount(registry, 3)).toBe(2)
  })

  it('getSurnameBySurname returns lineage ID', () => {
    const registry = createLineageRegistry()
    const id = getSurnameBySurname(registry, 'Penner')
    expect(id).toBe(0)
    const id2 = getSurnameBySurname(registry, 'Reimer')
    expect(id2).toBe(1)
  })

  it('getSurnameById returns surname', () => {
    const registry = createLineageRegistry()
    const surname = getSurnameById(registry, 0)
    expect(surname).toBe('Penner')
  })

  it('getTotalLivingMembers sums all living counts', () => {
    const registry = createLineageRegistry()
    expect(getTotalLivingMembers(registry)).toBe(0)

    incrementLivingCount(registry, 0)
    expect(getTotalLivingMembers(registry)).toBe(1)

    incrementLivingCount(registry, 0)
    incrementLivingCount(registry, 5)
    expect(getTotalLivingMembers(registry)).toBe(3)

    decrementLivingCount(registry, 5)
    expect(getTotalLivingMembers(registry)).toBe(2)
  })

  it('throws on invalid lineage ID', () => {
    const registry = createLineageRegistry()
    expect(() => incrementLivingCount(registry, -1)).toThrow()
    expect(() => incrementLivingCount(registry, 30)).toThrow()
    expect(() => getLivingCount(registry, -1)).toThrow()
    expect(() => getSurnameById(registry, -1)).toThrow()
  })

  it('throws when surname not found', () => {
    const registry = createLineageRegistry()
    expect(() => getSurnameBySurname(registry, 'NonExistent')).toThrow()
  })
})
