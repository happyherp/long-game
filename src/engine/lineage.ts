import { FOUNDER_SURNAMES } from './names'
import { LineageRegistry } from './types'

export function createLineageRegistry(): LineageRegistry {
  return {
    surnames: [...FOUNDER_SURNAMES],
    livingCount: new Uint32Array(FOUNDER_SURNAMES.length),
  }
}

export function incrementLivingCount(registry: LineageRegistry, lineageId: number): void {
  if (lineageId < 0 || lineageId >= registry.livingCount.length) {
    throw new Error(`Invalid lineage ID: ${lineageId}`)
  }
  registry.livingCount[lineageId]++
}

export function decrementLivingCount(registry: LineageRegistry, lineageId: number): void {
  if (lineageId < 0 || lineageId >= registry.livingCount.length) {
    throw new Error(`Invalid lineage ID: ${lineageId}`)
  }
  if (registry.livingCount[lineageId] === 0) {
    throw new Error(`Cannot decrement living count below 0 for lineage ${lineageId}`)
  }
  registry.livingCount[lineageId]--
}

export function getLivingCount(registry: LineageRegistry, lineageId: number): number {
  if (lineageId < 0 || lineageId >= registry.livingCount.length) {
    throw new Error(`Invalid lineage ID: ${lineageId}`)
  }
  return registry.livingCount[lineageId]
}

export function getSurnameBySurname(registry: LineageRegistry, surname: string): number {
  const index = registry.surnames.indexOf(surname)
  if (index === -1) {
    throw new Error(`Surname not found: ${surname}`)
  }
  return index
}

export function getSurnameById(registry: LineageRegistry, lineageId: number): string {
  if (lineageId < 0 || lineageId >= registry.surnames.length) {
    throw new Error(`Invalid lineage ID: ${lineageId}`)
  }
  return registry.surnames[lineageId]
}

export function getTotalLivingMembers(registry: LineageRegistry): number {
  let total = 0
  for (let i = 0; i < registry.livingCount.length; i++) {
    total += registry.livingCount[i]
  }
  return total
}

export function addInflowLineage(lineages: LineageRegistry, surname: string): number {
  lineages.surnames.push(surname)
  // Grow livingCount array to accommodate new surname
  const newArr = new Uint32Array(lineages.surnames.length)
  newArr.set(lineages.livingCount)
  lineages.livingCount = newArr
  return lineages.surnames.length - 1
}
