import { Colony, Doctrine, PopulationStore, LineageRegistry } from '../../src/engine/types'

export function makePopulation(size = 3): PopulationStore {
  const capacity = Math.max(size, 10)
  const pop: PopulationStore = {
    age: new Uint8Array(capacity),
    sex: new Uint8Array(capacity),
    cohesion: new Uint8Array(capacity),
    married: new Uint8Array(capacity),
    partnerId: new Int32Array(capacity).fill(-1),
    paternalLineage: new Uint16Array(capacity),
    maternalLineage: new Uint16Array(capacity),
    firstNameId: new Uint8Array(capacity),
    capacity,
    size,
  }
  for (let i = 0; i < size; i++) {
    pop.age[i] = 30
    pop.sex[i] = i % 2
    pop.cohesion[i] = 200
  }
  return pop
}

export function makeDoctrine(overrides: Partial<Doctrine> = {}): Doctrine {
  return {
    smartphones: false,
    englishSchool: false,
    plainDress: true,
    marriageAge: 19,
    ...overrides,
  }
}

export function makeLineages(): LineageRegistry {
  return { surnames: ['Miller'], livingCount: new Uint32Array(1).fill(3) }
}

export function makeColony(overrides: Partial<Colony> = {}): Colony {
  return {
    name: 'Cayo',
    year: 1975,
    treasury: 50000,
    population: makePopulation(),
    doctrine: makeDoctrine(),
    lineages: makeLineages(),
    history: [],
    ...overrides,
  }
}
