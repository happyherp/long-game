import { Colony, Doctrine, PopulationStore, LineageRegistry, YearSnapshot, Federation } from '../../src/engine/types'

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
    fatherId: new Int32Array(capacity).fill(-1),
    motherId: new Int32Array(capacity).fill(-1),
    origin: new Uint8Array(capacity),
    arrivalYear: new Int16Array(capacity),
    firstNameId: new Uint8Array(capacity),
    idToSlot: new Map(),
    slotToId: new Int32Array(capacity).fill(-1),
    nextId: size,
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
  const base: Doctrine = {
    marriageDoctrine: 'courtship',
    marriageAge: 19,
    marriageOutside: 'forbidden',
    baptismAge: 'infant',
    shunning: false,
    worshipLanguage: 'plautdietsch',
    plainDress: true,
    headCovering: true,
    beardForMarried: true,
    sundayObservance: true,
    englishSchool: false,
    higherEdMen: 'forbidden',
    higherEdWomen: 'forbidden',
    smartphones: false,
    motorizedFarming: false,
    gridElectricity: false,
    outsideTrade: 'restricted',
    inflowPolicy: 'vetted',
  }
  return { ...base, ...overrides }
}

export function makeLineages(numSurnames = 10): LineageRegistry {
  return { surnames: Array(numSurnames).fill('Surname'), livingCount: new Uint32Array(numSurnames).fill(3) }
}

export function makeColony(overrides: Partial<Colony> = {}): Colony {
  const base: Colony = {
    id: 1,
    name: 'Cayo',
    population: makePopulation(),
    doctrine: makeDoctrine(),
    lineages: makeLineages(),
    treasury: 50000,
    year: 1975,
    history: [],
    foundingYear: 1960,
    modernityPressure: 100,
    economy: {
      parcels: [],
      buildings: [],
    },
    pairingRecords: new Map(),
    flags: {},
  }
  return { ...base, ...overrides } as Colony
}

export function makeFederation(overrides: Partial<Federation> = {}): Federation {
  const base: Federation = {
    year: 1975,
    colonies: [makeColony()],
    modernWest: { willingness: 1.0 },
    pendingSchisms: [],
    history: [],
  }
  return { ...base, ...overrides }
}