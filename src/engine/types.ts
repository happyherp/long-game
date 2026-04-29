export interface PopulationStore {
  age: Uint8Array
  sex: Uint8Array
  cohesion: Uint8Array
  married: Uint8Array
  partnerId: Int32Array      // stores stable ID; -1 if single
  paternalLineage: Uint16Array
  maternalLineage: Uint16Array
  fatherId: Int32Array       // stable ID; -1 if founder/unknown
  motherId: Int32Array       // stable ID; -1 if founder/unknown
  origin: Uint8Array         // 0 = born-in, 1 = inflow
  arrivalYear: Int16Array    // birth year for born-in, arrival year for inflow
  firstNameId: Uint8Array

  // stable-ID infrastructure
  idToSlot: Map<number, number>  // stable id -> current slot
  slotToId: Int32Array           // slot -> stable id
  nextId: number                 // monotonically increasing

  capacity: number
  size: number
}

export interface LineageRegistry {
  surnames: string[]
  livingCount: Uint32Array
}

export interface Doctrine {
  smartphones: boolean
  englishSchool: boolean
  plainDress: boolean
  marriageAge: number
}

export interface Colony {
  name: string
  population: PopulationStore
  doctrine: Doctrine
  lineages: LineageRegistry
  treasury: number
  year: number
  history: YearSnapshot[]
}

export interface YearSnapshot {
  year: number
  population: number
  tfr: number
  cohesionAvg: number
  treasury: number
  births: number
  deaths: number
  departures: number
}

export interface ColonyMetrics {
  totalPopulation: number
  femaleCount: number
  maleCount: number
  medianAge: number
  tfr: number
  cohesionAvg: number
  cohesionBand: 'low' | 'medium' | 'high'
  treasury: number
  birthsThisYear: number
  deathsThisYear: number
  departuresThisYear: number
}

export type GameEventType = 'birth' | 'death' | 'departure' | 'pairing'

export interface GameEvent {
  type: GameEventType
  personId: number
  year: number
  payload?: unknown
}

export interface TickResult {
  colony: Colony
  events: GameEvent[]
  metrics: ColonyMetrics
}
