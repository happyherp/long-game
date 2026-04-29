export interface PopulationStore {
  age: Uint8Array
  sex: Uint8Array
  cohesion: Uint8Array
  married: Uint8Array
  partnerId: Int32Array
  paternalLineage: Uint16Array
  maternalLineage: Uint16Array
  firstNameId: Uint8Array

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
