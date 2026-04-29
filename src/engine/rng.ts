export interface RNG {
  next(): number
  nextInt(maxExclusive: number): number
  fork(label: string): RNG
}

export function createRNG(seed: number): RNG {
  let state = seed >>> 0

  function mulberry32(): number {
    let t = state += 0x6d2b79f5
    t = Math.imul(t ^ (t >>> 15), 1 | t)
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  return {
    next(): number {
      return mulberry32()
    },

    nextInt(maxExclusive: number): number {
      return Math.floor(mulberry32() * maxExclusive)
    },

    fork(label: string): RNG {
      const newSeed = (state >>> 0) ^ hashString(label)
      return createRNG(newSeed)
    },
  }
}

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    const char = s.charCodeAt(i)
    h = ((h << 5) - h) + char
    h = h & h
  }
  return h >>> 0
}
