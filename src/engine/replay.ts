import { Federation, Doctrine } from './types'
import { generateFoundingColony } from './founding'
import { federationTick } from './federation'
import { createRNG } from './rng'

interface ReplayHook {
  year: number
  type: string
  data: unknown
}

export function replay(
  seed: number,
  doctrineSequence: Array<{ year: number; doctrine: Doctrine }>,
  inflowEvents?: ReplayHook[],
  untilYear: number = 2100,
): Federation {
  const rng = createRNG(seed)
  const colony = generateFoundingColony(rng.fork('founding'), 'Cayo')

  let federation: Federation = {
    year: 1960,
    colonies: [colony],
    modernWest: { willingness: 1.0 },
    pendingSchisms: [],
    history: [],
  }

  // Apply doctrine sequence
  const doctrineMap = new Map<number, Doctrine>()
  for (const entry of doctrineSequence) {
    doctrineMap.set(entry.year, entry.doctrine)
  }

  // Apply inflow events if provided
  const inflowMap = new Map<number, ReplayHook[]>()
  if (inflowEvents) {
    for (const event of inflowEvents) {
      if (!inflowMap.has(event.year)) {
        inflowMap.set(event.year, [])
      }
      inflowMap.get(event.year)!.push(event)
    }
  }

  while (federation.year < untilYear) {
    // Apply doctrine for this year if exists
    const doctrine = doctrineMap.get(federation.year)
    if (doctrine) {
      for (const colony of federation.colonies) {
        colony.doctrine = { ...doctrine }
      }
    }

    // Process federation tick
    const result = federationTick(federation, rng.fork(`tick-${federation.year}`))
    federation = result.federation

    // Apply inflow events for this year if exists
    const yearInflows = inflowMap.get(federation.year - 1) // federation.year was just incremented
    if (yearInflows) {
      // Process inflow events (simplified - in reality would modify the federation)
    }
  }

  return federation
}