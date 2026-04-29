import { PopulationStore } from './types'

export interface PersonAttrs {
  age: number
  sex: number
  cohesion: number
  married: number
  partnerId: number
  paternalLineage: number
  maternalLineage: number
  firstNameId: number
}

export function createStore(capacity: number): PopulationStore {
  return {
    age: new Uint8Array(capacity),
    sex: new Uint8Array(capacity),
    cohesion: new Uint8Array(capacity),
    married: new Uint8Array(capacity),
    partnerId: new Int32Array(capacity),
    paternalLineage: new Uint16Array(capacity),
    maternalLineage: new Uint16Array(capacity),
    firstNameId: new Uint8Array(capacity),
    capacity,
    size: 0,
  }
}

export function addPerson(store: PopulationStore, attrs: PersonAttrs): number {
  if (store.size >= store.capacity) {
    growCapacity(store)
  }

  const id = store.size
  store.age[id] = attrs.age
  store.sex[id] = attrs.sex
  store.cohesion[id] = attrs.cohesion
  store.married[id] = attrs.married
  store.partnerId[id] = attrs.partnerId
  store.paternalLineage[id] = attrs.paternalLineage
  store.maternalLineage[id] = attrs.maternalLineage
  store.firstNameId[id] = attrs.firstNameId

  store.size++
  return id
}

export function removePerson(store: PopulationStore, id: number): void {
  if (id < 0 || id >= store.size) {
    throw new Error(`Invalid person ID: ${id}`)
  }

  store.size--

  if (id !== store.size) {
    swapWithLast(store, id, store.size)
  }
}

export function* getAlive(store: PopulationStore): Iterable<number> {
  for (let i = 0; i < store.size; i++) {
    yield i
  }
}

function swapWithLast(store: PopulationStore, id: number, lastId: number): void {
  store.age[id] = store.age[lastId]
  store.sex[id] = store.sex[lastId]
  store.cohesion[id] = store.cohesion[lastId]
  store.married[id] = store.married[lastId]
  store.partnerId[id] = store.partnerId[lastId]
  store.paternalLineage[id] = store.paternalLineage[lastId]
  store.maternalLineage[id] = store.maternalLineage[lastId]
  store.firstNameId[id] = store.firstNameId[lastId]
}

function growCapacity(store: PopulationStore): void {
  const newCapacity = store.capacity * 2
  const newStore = createStore(newCapacity)

  for (const id of getAlive(store)) {
    newStore.age[id] = store.age[id]
    newStore.sex[id] = store.sex[id]
    newStore.cohesion[id] = store.cohesion[id]
    newStore.married[id] = store.married[id]
    newStore.partnerId[id] = store.partnerId[id]
    newStore.paternalLineage[id] = store.paternalLineage[id]
    newStore.maternalLineage[id] = store.maternalLineage[id]
    newStore.firstNameId[id] = store.firstNameId[id]
  }

  newStore.size = store.size

  Object.assign(store, newStore)
}
