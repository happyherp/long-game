import { PopulationStore } from './types'

// Walk ancestors via fatherId/motherId, depth-bounded at 6 generations
export function inbreedingCoefficient(a: number, b: number, store: PopulationStore): number {
  const ancestorsA = walkAncestors(a, store, 6)
  const ancestorsB = walkAncestors(b, store, 6)

  let kinship = 0
  for (const [ancestor, depthA] of ancestorsA.entries()) {
    const depthB = ancestorsB.get(ancestor)
    if (depthB !== undefined) {
      kinship += Math.pow(0.5, depthA + depthB + 1)
    }
  }

  return clamp(kinship, 0, 0.5)
}

// Returns a Map of stableId -> depth from the starting person
function walkAncestors(
  stableId: number,
  store: PopulationStore,
  maxDepth: number,
): Map<number, number> {
  const result = new Map<number, number>()
  const queue: Array<{ id: number; depth: number }> = [{ id: stableId, depth: 0 }]

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!

    if (depth > maxDepth) continue
    if (result.has(id)) continue

    result.set(id, depth)

    const slot = store.idToSlot.get(id)
    if (slot === undefined) continue

    const fatherId = store.fatherId[slot]
    const motherId = store.motherId[slot]

    if (fatherId >= 0 && depth + 1 <= maxDepth) {
      queue.push({ id: fatherId, depth: depth + 1 })
    }
    if (motherId >= 0 && depth + 1 <= maxDepth) {
      queue.push({ id: motherId, depth: depth + 1 })
    }
  }

  return result
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}