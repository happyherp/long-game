import { describe, it, expect } from 'vitest'
import { createRNG } from '../../src/engine/rng'

describe('RNG', () => {
  it('produces consistent values from the same seed', () => {
    const rng1 = createRNG(12345)
    const rng2 = createRNG(12345)

    for (let i = 0; i < 100; i++) {
      expect(rng1.next()).toBe(rng2.next())
    }
  })

  it('produces different values from different seeds', () => {
    const rng1 = createRNG(12345)
    const rng2 = createRNG(54321)

    const vals1 = Array.from({ length: 10 }, () => rng1.next())
    const vals2 = Array.from({ length: 10 }, () => rng2.next())

    expect(vals1).not.toEqual(vals2)
  })

  it('next() produces values in [0, 1)', () => {
    const rng = createRNG(9999)
    for (let i = 0; i < 1000; i++) {
      const val = rng.next()
      expect(val).toBeGreaterThanOrEqual(0)
      expect(val).toBeLessThan(1)
    }
  })

  it('nextInt() produces values in [0, maxExclusive)', () => {
    const rng = createRNG(9999)
    const max = 10
    for (let i = 0; i < 1000; i++) {
      const val = rng.nextInt(max)
      expect(val).toBeGreaterThanOrEqual(0)
      expect(val).toBeLessThan(max)
      expect(Number.isInteger(val)).toBe(true)
    }
  })

  it('fork creates deterministic sub-streams', () => {
    const rng1 = createRNG(12345)
    const rng2 = createRNG(12345)

    const forked1 = rng1.fork('test-label')
    const forked2 = rng2.fork('test-label')

    for (let i = 0; i < 50; i++) {
      expect(forked1.next()).toBe(forked2.next())
    }
  })

  it('different fork labels produce different streams', () => {
    const rng = createRNG(12345)
    const fork1 = rng.fork('label1')
    const fork2 = rng.fork('label2')

    const vals1 = Array.from({ length: 10 }, () => fork1.next())
    const vals2 = Array.from({ length: 10 }, () => fork2.next())

    expect(vals1).not.toEqual(vals2)
  })

  it('maintains sequence integrity after fork', () => {
    const rng1 = createRNG(999)
    const rng2 = createRNG(999)

    rng1.fork('detour')
    const after1 = rng1.next()
    const after2 = rng2.next()

    expect(after1).toBe(after2)
  })

  it('fork().fork() produces deterministic nested streams', () => {
    const rng1 = createRNG(777)
    const rng2 = createRNG(777)

    const nested1 = rng1.fork('outer').fork('inner')
    const nested2 = rng2.fork('outer').fork('inner')

    for (let i = 0; i < 30; i++) {
      expect(nested1.next()).toBe(nested2.next())
    }
  })

  it('fork does not advance parent state', () => {
    const rng1 = createRNG(999)
    const rng2 = createRNG(999)

    // Calling fork on rng1 must not shift its internal state relative to rng2.
    rng1.fork('detour-a')
    rng1.fork('detour-b')

    for (let i = 0; i < 20; i++) {
      expect(rng1.next()).toBe(rng2.next())
    }
  })

  it('same parent seed + same label always yields the same child stream', () => {
    // This property is what makes deterministic replay possible: a replay
    // tool can re-derive any per-tick RNG by forking a fresh root RNG with
    // the same seed and label without replaying all prior ticks.
    const child1 = createRNG(42).fork('tick-7')
    const child2 = createRNG(42).fork('tick-7')

    for (let i = 0; i < 50; i++) {
      expect(child1.next()).toBe(child2.next())
    }
  })

  it('distributes nextInt() evenly across range', () => {
    const rng = createRNG(555)
    const max = 5
    const counts: number[] = [0, 0, 0, 0, 0]

    for (let i = 0; i < 10000; i++) {
      counts[rng.nextInt(max)]++
    }

    for (let i = 0; i < max; i++) {
      expect(counts[i]).toBeGreaterThan(1500)
      expect(counts[i]).toBeLessThan(2500)
    }
  })
})
