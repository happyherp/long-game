import { LineageRegistry, PopulationStore } from './types'
import { incrementLivingCount } from './lineage'

export interface PersonAttrs {
  age: number
  sex: number
  cohesion: number
  married: number
  partnerId: number      // stable ID; -1 if single
  paternalLineage: number
  maternalLineage: number
  fatherId: number       // stable ID; -1 if founder/unknown
  motherId: number       // stable ID; -1 if founder/unknown
  origin: number         // 0 = born-in, 1 = inflow
  arrivalYear: number    // birth year for born-in, arrival year for inflow
  firstNameId: number
}

export function createStore(capacity: number): PopulationStore {
  return {
    age: new Uint8Array(capacity),
    sex: new Uint8Array(capacity),
    cohesion: new Uint8Array(capacity),
    married: new Uint8Array(capacity),
    partnerId: new Int32Array(capacity).fill(-1),
    paternalLineage: new Uint16Array(capacity),
    maternalLineage: new Uint16Array(capacity),
    fatherId: new Int32Array(capacity).fill(-1),
    motherId: new Int32Array(capacity).fill(-1),
    origin: new Uint8Array(capacity),
    arrivalYear: new Int16Array(capacity),
    firstNameId: new Uint8Array(capacity),
    idToSlot: new Map(),
    slotToId: new Int32Array(capacity).fill(-1),
    nextId: 0,
    capacity,
    size: 0,
  }
}

// Returns the stable ID of the added person.
export function addPerson(store: PopulationStore, attrs: PersonAttrs): number {
  if (store.size >= store.capacity) {
    growCapacity(store)
  }

  const slot = store.size
  const stableId = store.nextId++

  store.age[slot] = attrs.age
  store.sex[slot] = attrs.sex
  store.cohesion[slot] = attrs.cohesion
  store.married[slot] = attrs.married
  store.partnerId[slot] = attrs.partnerId
  store.paternalLineage[slot] = attrs.paternalLineage
  store.maternalLineage[slot] = attrs.maternalLineage
  store.fatherId[slot] = attrs.fatherId
  store.motherId[slot] = attrs.motherId
  store.origin[slot] = attrs.origin
  store.arrivalYear[slot] = attrs.arrivalYear
  store.firstNameId[slot] = attrs.firstNameId

  store.idToSlot.set(stableId, slot)
  store.slotToId[slot] = stableId
  store.size++

  return stableId
}

export function addLivingPerson(
  store: PopulationStore,
  lineages: LineageRegistry,
  attrs: PersonAttrs,
): number {
  const stableId = addPerson(store, attrs)
  incrementLivingCount(lineages, attrs.paternalLineage)
  incrementLivingCount(lineages, attrs.maternalLineage)
  return stableId
}

// Takes a stable ID. Removes the person, fixing up ID maps via swap-and-pop.
export function removePerson(store: PopulationStore, stableId: number): void {
  const slot = store.idToSlot.get(stableId)
  if (slot === undefined) {
    throw new Error(`Invalid stable ID: ${stableId}`)
  }

  store.size--
  const lastSlot = store.size

  store.idToSlot.delete(stableId)

  if (slot !== lastSlot) {
    // Move last person into the freed slot
    copySlot(store, lastSlot, slot)

    const movedId = store.slotToId[lastSlot]
    store.slotToId[slot] = movedId
    store.idToSlot.set(movedId, slot)
  }

  store.slotToId[lastSlot] = -1
}

// Returns the current slot for a stable ID, or -1 if not alive.
export function getSlot(store: PopulationStore, stableId: number): number {
  return store.idToSlot.get(stableId) ?? -1
}

export function* getAlive(store: PopulationStore): Iterable<number> {
  for (let i = 0; i < store.size; i++) {
    yield i
  }
}

function copySlot(store: PopulationStore, from: number, to: number): void {
  store.age[to] = store.age[from]
  store.sex[to] = store.sex[from]
  store.cohesion[to] = store.cohesion[from]
  store.married[to] = store.married[from]
  store.partnerId[to] = store.partnerId[from]
  store.paternalLineage[to] = store.paternalLineage[from]
  store.maternalLineage[to] = store.maternalLineage[from]
  store.fatherId[to] = store.fatherId[from]
  store.motherId[to] = store.motherId[from]
  store.origin[to] = store.origin[from]
  store.arrivalYear[to] = store.arrivalYear[from]
  store.firstNameId[to] = store.firstNameId[from]
}

function growCapacity(store: PopulationStore): void {
  const newCapacity = store.capacity * 2
  const newArrays = {
    age: new Uint8Array(newCapacity),
    sex: new Uint8Array(newCapacity),
    cohesion: new Uint8Array(newCapacity),
    married: new Uint8Array(newCapacity),
    partnerId: new Int32Array(newCapacity).fill(-1),
    paternalLineage: new Uint16Array(newCapacity),
    maternalLineage: new Uint16Array(newCapacity),
    fatherId: new Int32Array(newCapacity).fill(-1),
    motherId: new Int32Array(newCapacity).fill(-1),
    origin: new Uint8Array(newCapacity),
    arrivalYear: new Int16Array(newCapacity),
    firstNameId: new Uint8Array(newCapacity),
    slotToId: new Int32Array(newCapacity).fill(-1),
  }

  for (let i = 0; i < store.size; i++) {
    newArrays.age[i] = store.age[i]
    newArrays.sex[i] = store.sex[i]
    newArrays.cohesion[i] = store.cohesion[i]
    newArrays.married[i] = store.married[i]
    newArrays.partnerId[i] = store.partnerId[i]
    newArrays.paternalLineage[i] = store.paternalLineage[i]
    newArrays.maternalLineage[i] = store.maternalLineage[i]
    newArrays.fatherId[i] = store.fatherId[i]
    newArrays.motherId[i] = store.motherId[i]
    newArrays.origin[i] = store.origin[i]
    newArrays.arrivalYear[i] = store.arrivalYear[i]
    newArrays.firstNameId[i] = store.firstNameId[i]
    newArrays.slotToId[i] = store.slotToId[i]
  }

  store.age = newArrays.age
  store.sex = newArrays.sex
  store.cohesion = newArrays.cohesion
  store.married = newArrays.married
  store.partnerId = newArrays.partnerId
  store.paternalLineage = newArrays.paternalLineage
  store.maternalLineage = newArrays.maternalLineage
  store.fatherId = newArrays.fatherId
  store.motherId = newArrays.motherId
  store.origin = newArrays.origin
  store.arrivalYear = newArrays.arrivalYear
  store.firstNameId = newArrays.firstNameId
  store.slotToId = newArrays.slotToId
  store.capacity = newCapacity
}
