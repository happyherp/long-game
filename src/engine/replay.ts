import { Doctrine, Federation } from './types'
import { generateFoundingColony } from './founding'
import { createFederation, federationTick } from './federation'
import { grantSchism, refuseSchism } from './schism'
import { createRNG } from './rng'

export interface DoctrineChange {
  year: number
  colonyId: string
  doctrine: Doctrine
}

export interface SchismGrant {
  year: number
  grant: boolean
}

export function replay(
  seed: number,
  doctrineSequence: DoctrineChange[],
  grantSequence: SchismGrant[],
  untilYear: number,
): Federation {
  const rng = createRNG(seed)
  const foundingColony = generateFoundingColony(rng.fork('founding'), 'Cayo')
  const federation = createFederation(foundingColony)

  let grantIdx = 0

  while (federation.year < untilYear) {
    const year = federation.year

    // Apply doctrine changes for this year
    for (const change of doctrineSequence) {
      if (change.year === year) {
        const colony = federation.colonies.find(c => c.id === change.colonyId)
        if (colony) {
          colony.doctrine = { ...change.doctrine }
        }
      }
    }

    const tickRng = rng.fork(`tick-${year}`)
    federationTick(federation, tickRng)

    // Resolve pending schisms
    while (federation.pendingSchisms.length > 0) {
      const schism = federation.pendingSchisms.shift()!
      if (grantIdx < grantSequence.length) {
        const grantDecision = grantSequence[grantIdx++]
        if (grantDecision.grant) {
          grantSchism(federation, schism, rng.fork(`schism-grant-${year}`))
        } else {
          const colony = federation.colonies.find(c => c.id === schism.parentColonyId)
          if (colony) {
            refuseSchism(colony, schism, year)
          }
        }
      } else {
        // Default: grant all schisms if no decision provided
        grantSchism(federation, schism, rng.fork(`schism-grant-${year}`))
      }
    }
  }

  return federation
}
