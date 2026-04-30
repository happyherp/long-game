import { Colony, SchismEvent, GameEvent, Federation } from './types'
import { getAlive, getSlot } from './population'
import { RNG } from './rng'
import { computeMetrics } from './metrics'

export function detectSchism(colony: Colony, rng: RNG): SchismEvent | null {
  if (colony.modernityPressure <= computeMetrics(colony).cohesionAvg) return null

  // Identify factions
  const conservative: number[] = []
  const liberal: number[] = []

  for (const slot of getAlive(colony.population)) {
    const stableId = colony.population.slotToId[slot]
    if (stableId === undefined) continue

    const cohesion = colony.population.cohesion[slot]
    if (cohesion >= 200) {
      conservative.push(stableId)
    } else if (cohesion < 120) {
      liberal.push(stableId)
    }
  }

  // Schism direction: smaller faction splits off
  const splittingFaction = conservative.length < liberal.length ? 'conservative' : 'liberal'
  const splittingMembers = splittingFaction === 'conservative' ? conservative : liberal

  // Threshold: at least 30 members and < 40% of total
  if (splittingMembers.length < 30) return null
  if (splittingMembers.length / colony.population.size > 0.4) return null

  return {
    type: 'schism',
    parentColonyId: colony.id,
    direction: splittingFaction,
    memberIds: splittingMembers,
    proposedDoctrine: deriveSchismDoctrine(colony.doctrine, splittingFaction),
    proposedName: deriveSchismName(colony.name, splittingFaction, rng),
  }
}

export function grantSchism(
  federation: Federation,
  schism: SchismEvent,
): GameEvent[] {
  const events: GameEvent[] = []
  const parentColony = federation.colonies.find(c => c.id === schism.parentColonyId)
  if (!parentColony) return events

  // Create new daughter colony
  const daughterColony: Colony = {
    id: federation.colonies.length,
    name: schism.proposedName,
    population: createDaughterPopulation(parentColony),
    doctrine: schism.proposedDoctrine,
    lineages: createDaughterLineageRegistry(parentColony.lineages),
    treasury: Math.floor(parentColony.treasury * (schism.memberIds.length / parentColony.population.size)),
    year: parentColony.year,
    history: [],
    foundingYear: parentColony.year,
    modernityPressure: 0,
    economy: {
      parcels: [],
      buildings: [],
    },
    pairingRecords: new Map(),
    flags: {},
  }

  // Transfer treasury
  parentColony.treasury -= 30_000
  daughterColony.treasury += 30_000

  // Remove members from parent colony
  for (const stableId of schism.memberIds) {
    // Also remove partner if they're not in the splitting faction
    const slot = parentColony.population.idToSlot.get(stableId)
    if (slot !== undefined) {
      const partnerId = parentColony.population.partnerId[slot]
      if (partnerId >= 0 && !schism.memberIds.includes(partnerId)) {
        // Partner stays in parent but becomes single
        const partnerSlot = getSlot(parentColony.population, partnerId)
        if (partnerSlot >= 0) {
          parentColony.population.married[partnerSlot] = 0
          parentColony.population.partnerId[partnerSlot] = -1
        }
      }
      // Remove the person
      // Note: Would need to implement removePerson from population.ts
    }
  }

  federation.colonies.push(daughterColony)

  events.push({
    type: 'schism',
    personId: -1,
    year: parentColony.year,
    payload: { granted: true, daughterColonyId: daughterColony.id, name: daughterColony.name },
  })

  return events
}

export function refuseSchism(
  federation: Federation,
  schism: SchismEvent,
): GameEvent[] {
  const events: GameEvent[] = []
  const parentColony = federation.colonies.find(c => c.id === schism.parentColonyId)
  if (!parentColony) return events

  // Refused schism: cohesion drop and departure multiplier
  for (const stableId of schism.memberIds) {
    const slot = getSlot(parentColony.population, stableId)
    if (slot >= 0) {
      parentColony.population.cohesion[slot] = Math.max(0, parentColony.population.cohesion[slot] - 20)
    }
  }

  parentColony.flags['recentRefusedSchism'] = { year: parentColony.year, multiplier: 1.5 }

  events.push({
    type: 'schism',
    personId: -1,
    year: parentColony.year,
    payload: { granted: false, cohesionDrop: 20, departureMultiplier: 1.5 },
  })

  return events
}

function deriveSchismDoctrine(
  doctrine: Colony['doctrine'],
  direction: 'conservative' | 'liberal',
): Colony['doctrine'] {
  const newDoctrine = { ...doctrine }

  if (direction === 'conservative') {
    // Make one item more strict
    if (newDoctrine.smartphones) newDoctrine.smartphones = false
    else if (!newDoctrine.englishSchool) newDoctrine.englishSchool = true
    else if (newDoctrine.marriageDoctrine !== 'courtship') newDoctrine.marriageDoctrine = 'courtship'
  } else {
    // Make one item more lax
    if (!newDoctrine.smartphones) newDoctrine.smartphones = true
    else if (newDoctrine.englishSchool) newDoctrine.englishSchool = false
    else if (newDoctrine.marriageDoctrine === 'courtship') newDoctrine.marriageDoctrine = 'lateMarriage'
  }

  return newDoctrine
}

function deriveSchismName(
  parentName: string,
  direction: 'conservative' | 'liberal',
  rng: RNG,
): string {
  const suffixes = direction === 'conservative'
    ? ['Traditional', 'Conservative', 'Old Order']
    : ['Progressive', 'Modern', 'New']
  return `${parentName} ${suffixes[Math.floor(rng.next() * suffixes.length)]}`
}

function createDaughterPopulation(parent: Colony): Colony['population'] {
  // This is a placeholder - would need to implement population transfer logic
  return parent.population // Simplified for now
}

function createDaughterLineageRegistry(
  parentRegistry: Colony['lineages'],
): Colony['lineages'] {
  // This is a placeholder - would need to copy relevant lineages
  return parentRegistry // Simplified for now
}
