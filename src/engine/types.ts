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

// Full V1 Doctrine from Phase 2
export interface Doctrine {
  // Marriage
  marriageDoctrine: 'courtship' | 'lateMarriage' | 'modern'
  marriageAge: number      // 17–22
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
  productivity: number    // 0..1
  purchaseYear: number
}

export type Building = 'clinic' | 'dairyPlant'

export interface ColonyEconomy {
  parcels: LandParcel[]
  buildings: Building[]
}

export interface Colony {
  id: number
  name: string
  population: PopulationStore
  doctrine: Doctrine
  lineages: LineageRegistry
  treasury: number
  year: number
  history: YearSnapshot[]
  foundingYear: number
  modernityPressure: number
  economy: ColonyEconomy
  pairingRecords: Map<number, { coefficient: number }> // stableId -> inbreeding coefficient at pairing
  flags: Record<string, unknown>
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

export type GameEventType = 'birth' | 'death' | 'departure' | 'pairing' | 'inflow' | 'schism'

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

// Federation types
export interface Federation {
  year: number
  colonies: Colony[]
  modernWest: { willingness: number }
  pendingSchisms: SchismEvent[]
  history: FederationSnapshot[]
}

export interface FederationSnapshot {
  year: number
  totalPopulation: number
  colonyCount: number
  totalTreasury: number
}

export interface SchismEvent {
  type: 'schism'
  parentColonyId: number
  direction: 'conservative' | 'liberal'
  memberIds: number[] // stable IDs
  proposedDoctrine: Doctrine
  proposedName: string
}

// Save state V2
export interface SaveStateV2 {
  version: 2
  seed: number
  federation: Federation
}
