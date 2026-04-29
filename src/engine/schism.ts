import { Colony, Doctrine, Federation, SchismEvent } from './types'
import { getAlive, getSlot, removePerson, addLivingPerson } from './population'
import { decrementLivingCount } from './lineage'
import { createStore } from './population'
import { createLineageRegistry } from './lineage'
import { RNG } from './rng'
import { computeMetrics } from './metrics'

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Derive a new doctrine from the parent that is one step stricter (conservative)
 * or one step laxer (liberal).
 */
function deriveSchismDoctrine(parentDoctrine: Doctrine, direction: 'conservative' | 'liberal'): Doctrine {
  const d = { ...parentDoctrine }

  if (direction === 'conservative') {
    d.smartphones = false
    d.englishSchool = false
    d.plainDress = true
    d.headCovering = true
    d.beardForMarried = true
    d.shunning = true
    d.worshipLanguage = 'plautdietsch'
    d.sundayObservance = true
    d.inflowPolicy = 'closed'
    d.marriageOutside = 'forbidden'
    d.marriageDoctrine = 'courtship'
    d.higherEdMen = 'forbidden'
    d.higherEdWomen = 'forbidden'
    d.motorizedFarming = false
    d.gridElectricity = false
    d.marriageAge = Math.min(d.marriageAge, 19)
  } else {
    // liberal: one step laxer
    d.smartphones = true
    d.englishSchool = true
    d.inflowPolicy = 'open'
    d.marriageOutside = 'permitted'
    d.marriageDoctrine = 'modern'
    d.higherEdMen = 'permitted'
    d.higherEdWomen = 'permitted'
    d.motorizedFarming = true
    d.gridElectricity = true
    d.outsideTrade = 'open'
    d.shunning = false
    d.marriageAge = Math.max(d.marriageAge, 20)
  }

  return d
}

function deriveSchismName(parentName: string, direction: 'conservative' | 'liberal'): string {
  const suffix = direction === 'conservative' ? ' (Conservative)' : ' (Reform)'
  return parentName + suffix
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function detectSchism(colony: Colony, rng: RNG): SchismEvent | null {
  const metrics = computeMetrics(colony)
  if (colony.modernityPressure <= metrics.cohesionAvg) return null

  // Identify factions
  const conservative: number[] = []
  const liberal: number[] = []

  for (const slot of getAlive(colony.population)) {
    const cohesion = colony.population.cohesion[slot]
    const stableId = colony.population.slotToId[slot]
    if (cohesion >= 200) conservative.push(stableId)
    else if (cohesion < 120) liberal.push(stableId)
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
    proposedName: deriveSchismName(colony.name, splittingFaction),
  }
}

/**
 * Transfer a member (and optionally partner, children) from parent colony to a new store.
 * Returns the set of stable IDs transferred.
 */
function buildTransferSet(colony: Colony, memberIds: number[]): Set<number> {
  const toTransfer = new Set<number>(memberIds)

  for (const memberId of memberIds) {
    const slot = getSlot(colony.population, memberId)
    if (slot < 0) continue

    // Add partner
    const partnerStableId = colony.population.partnerId[slot]
    if (partnerStableId >= 0) {
      toTransfer.add(partnerStableId)
    }
  }

  // Add unmarried children under 18 (those whose fatherId or motherId is in the set)
  for (const slot of getAlive(colony.population)) {
    const age = colony.population.age[slot]
    if (age >= 18) continue
    if (colony.population.married[slot] === 1) continue

    const fatherId = colony.population.fatherId[slot]
    const motherId = colony.population.motherId[slot]

    if ((fatherId >= 0 && toTransfer.has(fatherId)) ||
        (motherId >= 0 && toTransfer.has(motherId))) {
      toTransfer.add(colony.population.slotToId[slot])
    }
  }

  return toTransfer
}

export function grantSchism(federation: Federation, schism: SchismEvent, rng: RNG): void {
  const parentColony = federation.colonies.find(c => c.id === schism.parentColonyId)
  if (!parentColony) return

  const transferIds = buildTransferSet(parentColony, schism.memberIds)
  const transferCount = transferIds.size
  const parentSize = parentColony.population.size

  // Build new colony
  const newColonyId = rng.nextInt(999999).toString()
  const newStore = createStore(Math.max(transferCount + 10, 64))
  const newLineages = createLineageRegistry()

  // Copy persons to new colony
  const stableIdsToRemove: number[] = []

  for (const stableId of transferIds) {
    const slot = getSlot(parentColony.population, stableId)
    if (slot < 0) continue

    // Add to new store
    addLivingPerson(newStore, newLineages, {
      age: parentColony.population.age[slot],
      sex: parentColony.population.sex[slot],
      cohesion: parentColony.population.cohesion[slot],
      married: parentColony.population.married[slot],
      partnerId: parentColony.population.partnerId[slot],
      paternalLineage: parentColony.population.paternalLineage[slot],
      maternalLineage: parentColony.population.maternalLineage[slot],
      fatherId: parentColony.population.fatherId[slot],
      motherId: parentColony.population.motherId[slot],
      origin: parentColony.population.origin[slot],
      arrivalYear: parentColony.population.arrivalYear[slot],
      firstNameId: parentColony.population.firstNameId[slot],
    })

    // Track lineage decrement in parent
    decrementLivingCount(parentColony.lineages, parentColony.population.paternalLineage[slot])
    decrementLivingCount(parentColony.lineages, parentColony.population.maternalLineage[slot])

    stableIdsToRemove.push(stableId)
  }

  // Remove from parent store
  for (const stableId of stableIdsToRemove) {
    const slot = getSlot(parentColony.population, stableId)
    if (slot < 0) continue

    // Clear partner reference in parent if partner stayed
    const partnerStableId = parentColony.population.partnerId[slot]
    if (partnerStableId >= 0 && !transferIds.has(partnerStableId)) {
      const partnerSlot = getSlot(parentColony.population, partnerStableId)
      if (partnerSlot >= 0) {
        parentColony.population.married[partnerSlot] = 0
        parentColony.population.partnerId[partnerSlot] = -1
      }
    }

    removePerson(parentColony.population, stableId)
  }

  // Treasury split proportional to membership share
  const membershipShare = transferCount / parentSize
  const treasuryTransfer = Math.round(parentColony.treasury * membershipShare)
  const foundingGrant = 30000

  parentColony.treasury -= treasuryTransfer + foundingGrant

  const newColony: Colony = {
    id: newColonyId,
    name: schism.proposedName,
    population: newStore,
    doctrine: { ...schism.proposedDoctrine },
    lineages: newLineages,
    treasury: treasuryTransfer + foundingGrant,
    year: parentColony.year,
    history: [],
    modernityPressure: 0,
    economy: { parcels: [], buildings: [] },
    pairingCoefficients: new Map(),
    flags: {},
  }

  federation.colonies.push(newColony)
}

export function refuseSchism(colony: Colony, schism: SchismEvent, year: number): void {
  // Drop faction cohesion by 20
  const factionSet = new Set(schism.memberIds)

  for (const slot of getAlive(colony.population)) {
    const stableId = colony.population.slotToId[slot]
    if (factionSet.has(stableId)) {
      colony.population.cohesion[slot] = clamp(colony.population.cohesion[slot] - 20, 0, 255)
    }
  }

  // Set flag: boosts departure probability for 3 years
  colony.flags.recentRefusedSchism = {
    year,
    multiplierUntil: year + 3,
  }
}

/**
 * Force an uncontrolled schism: remove the faction members (they depart to Modern West).
 */
export function applyUncontrolledSchism(colony: Colony, schism: SchismEvent): void {
  const transferIds = buildTransferSet(colony, schism.memberIds)

  for (const stableId of transferIds) {
    const slot = getSlot(colony.population, stableId)
    if (slot < 0) continue

    decrementLivingCount(colony.lineages, colony.population.paternalLineage[slot])
    decrementLivingCount(colony.lineages, colony.population.maternalLineage[slot])

    const partnerStableId = colony.population.partnerId[slot]
    if (partnerStableId >= 0 && !transferIds.has(partnerStableId)) {
      const partnerSlot = getSlot(colony.population, partnerStableId)
      if (partnerSlot >= 0) {
        colony.population.married[partnerSlot] = 0
        colony.population.partnerId[partnerSlot] = -1
      }
    }

    removePerson(colony.population, stableId)
  }
}

// Re-export Colony type for use by other modules
export type { Colony }
