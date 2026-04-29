import { PopulationStore } from './types'
import { getSlot } from './population'

/**
 * Walk the ancestor tree of a person up to maxDepth generations.
 * Returns a Map from stableId to the minimum depth at which that ancestor appears.
 */
function walkAncestors(stableId: number, store: PopulationStore, maxDepth: number): Map<number, number> {
  const result = new Map<number, number>()

  function walk(id: number, depth: number): void {
    if (depth > maxDepth) return
    if (result.has(id)) return  // already visited at equal or shorter depth

    result.set(id, depth)

    const slot = getSlot(store, id)
    if (slot < 0) return  // founder / not in store

    const fatherId = store.fatherId[slot]
    const motherId = store.motherId[slot]

    if (fatherId >= 0) walk(fatherId, depth + 1)
    if (motherId >= 0) walk(motherId, depth + 1)
  }

  walk(stableId, 0)
  return result
}

/**
 * Compute the inbreeding coefficient (Wright's kinship path coefficient method)
 * between two individuals identified by stable IDs.
 *
 * Returns a value in [0, 0.5]:
 *   siblings => 0.25
 *   first cousins => 0.0625
 *   unrelated => 0
 */
export function inbreedingCoefficient(aId: number, bId: number, store: PopulationStore): number {
  const ancestorsA = walkAncestors(aId, store, 6)
  const ancestorsB = walkAncestors(bId, store, 6)

  let kinship = 0

  for (const [ancestor, depthA] of ancestorsA) {
    // Skip the individuals themselves (depth 0)
    if (depthA === 0) continue

    const depthB = ancestorsB.get(ancestor)
    if (depthB !== undefined && depthB > 0) {
      kinship += Math.pow(0.5, depthA + depthB + 1)
    }
  }

  return Math.max(0, Math.min(0.5, kinship))
}
