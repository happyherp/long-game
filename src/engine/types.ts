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
  // Marriage
  marriageDoctrine: 'courtship' | 'lateMarriage' | 'modern'
  marriageAge: number          // 17–22; meaningful for courtship & modern
  marriageOutside: 'forbidden' | 'permitted'

  // Religion / visible markers
  baptismAge: 'infant' | 'sixteen' | 'believer'
  shunning: boolean
  worshipLanguage: 'plautdietsch' | 'highGerman' | 'english'
  plainDress: boolean
  headCovering: boolean
  beardForMarried: boolean
  sundayObservance: boolean

  // Education
  englishSchool: boolean
  higherEdMen: 'forbidden' | 'tradeOnly' | 'permitted' | 'encouraged'
  higherEdWomen: 'forbidden' | 'tradeOnly' | 'permitted' | 'encouraged'

  // Technology
  smartphones: boolean
  motorizedFarming: boolean
  gridElectricity: boolean

  // Outside contact
  outsideTrade: 'open' | 'restricted' | 'closed'
  inflowPolicy: 'open' | 'vetted' | 'closed'
}

export type LandType = 'jungleClearing' | 'farmland' | 'pasture'

export interface LandParcel {
  id: string
  type: LandType
  hectares: number
  productivity: number    // 0..1, improves over time
  purchaseYear: number
}

export type Building = 'clinic' | 'dairyPlant'

export interface ColonyEconomy {
  parcels: LandParcel[]
  buildings: Building[]
}

export interface ColonyFlags {
  recentRefusedSchism?: { year: number; multiplierUntil: number }
}

export interface Colony {
  id: string
  name: string
  population: PopulationStore
  doctrine: Doctrine
  lineages: LineageRegistry
  treasury: number
  year: number
  history: YearSnapshot[]
  modernityPressure: number
  economy: ColonyEconomy
  // Inbreeding coefficient at pairing: maps stableId of one partner -> coefficient
  pairingCoefficients: Map<number, number>
  flags: ColonyFlags
}

export interface Federation {
  year: number
  colonies: Colony[]
  modernWest: { willingness: number }
  pendingSchisms: SchismEvent[]
  history: FederationSnapshot[]
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

export interface FederationSnapshot {
  year: number
  totalPopulation: number
  colonyCount: number
  totalTreasury: number
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
  modernityPressure: number
  birthsThisYear: number
  deathsThisYear: number
  departuresThisYear: number
}

export type GameEventType =
  | 'birth'
  | 'death'
  | 'departure'
  | 'pairing'
  | 'separation'
  | 'inflow'
  | 'schism'

export interface GameEvent {
  type: GameEventType
  personId: number
  year: number
  payload?: unknown
}

export interface SchismEvent {
  type: 'schism'
  parentColonyId: string
  direction: 'conservative' | 'liberal'
  memberIds: number[]          // stable IDs
  proposedDoctrine: Doctrine
  proposedName: string
}

export interface TickResult {
  federation: Federation
  events: GameEvent[]
  metrics: ColonyMetrics[]
}

// Default conservative Cayo founding doctrine
export const DEFAULT_DOCTRINE: Doctrine = {
  marriageDoctrine: 'courtship',
  marriageAge: 19,
  marriageOutside: 'forbidden',
  baptismAge: 'infant',
  shunning: true,
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
  inflowPolicy: 'closed',
}
