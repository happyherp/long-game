import { Colony, Federation, DEFAULT_DOCTRINE, Doctrine, YearSnapshot } from './types'
import { createFederation } from './federation'
import { createStore } from './population'

export interface V1Colony {
  name?: string
  population?: {
    age?: Uint8Array
    sex?: Uint8Array
    cohesion?: Uint8Array
    married?: Uint8Array
    partnerId?: Int32Array
    paternalLineage?: Uint16Array
    maternalLineage?: Uint16Array
    firstNameId?: Uint8Array
    size: number
  }
  doctrine?: {
    smartphones?: boolean
    englishSchool?: boolean
    plainDress?: boolean
    marriageAge?: number
  }
  lineages?: { surnames: string[]; livingCount: Uint32Array }
  treasury?: number
  year?: number
  history?: YearSnapshot[]
}

export interface SaveStateV1 {
  version: 1
  seed: number
  colony: V1Colony
}

export interface SaveStateV2 {
  version: 2
  seed: number
  federation: Federation
}

function migrateV1Colony(v1Colony: V1Colony, currentYear: number): Colony {
  const size = v1Colony.population?.size ?? 0
  const oldPop = v1Colony.population ?? { size: 0 }

  // Build a new store with stable IDs
  const capacity = Math.max(size * 2, 64)
  const newPop = createStore(capacity)

  // Assign stable IDs: slotToId[i] = i, idToSlot.set(i, i) for all live slots
  newPop.size = size
  newPop.nextId = size

  for (let i = 0; i < size; i++) {
    newPop.age[i] = oldPop.age?.[i] ?? 0
    newPop.sex[i] = oldPop.sex?.[i] ?? 0
    newPop.cohesion[i] = oldPop.cohesion?.[i] ?? 200
    newPop.married[i] = oldPop.married?.[i] ?? 0
    // partnerId was slot index in v1; since slotToId[i]=i, they're already stable IDs
    newPop.partnerId[i] = oldPop.partnerId?.[i] ?? -1
    newPop.paternalLineage[i] = oldPop.paternalLineage?.[i] ?? 0
    newPop.maternalLineage[i] = oldPop.maternalLineage?.[i] ?? 0
    newPop.fatherId[i] = -1   // founders in v1 have no parent data
    newPop.motherId[i] = -1
    newPop.origin[i] = 0
    newPop.arrivalYear[i] = 1960
    newPop.firstNameId[i] = oldPop.firstNameId?.[i] ?? 0

    // Set up stable ID maps
    newPop.slotToId[i] = i
    newPop.idToSlot.set(i, i)
  }

  // Convert v1 doctrine (4 fields) to full Doctrine using DEFAULT_DOCTRINE as base
  const v1Doctrine = v1Colony.doctrine ?? {}
  const fullDoctrine: Doctrine = {
    ...DEFAULT_DOCTRINE,
    smartphones: v1Doctrine.smartphones ?? DEFAULT_DOCTRINE.smartphones,
    englishSchool: v1Doctrine.englishSchool ?? DEFAULT_DOCTRINE.englishSchool,
    plainDress: v1Doctrine.plainDress ?? DEFAULT_DOCTRINE.plainDress,
    marriageAge: v1Doctrine.marriageAge ?? DEFAULT_DOCTRINE.marriageAge,
  }

  // Compute parcel productivity from years elapsed since 1960
  const yearsElapsed = Math.max(0, currentYear - 1960)
  let productivity = 0.4
  for (let y = 0; y < yearsElapsed; y++) {
    productivity = Math.min(1.0, productivity + (1.0 - productivity) * 0.07)
  }

  return {
    id: 'cayo',
    name: v1Colony.name ?? 'Cayo',
    population: newPop,
    doctrine: fullDoctrine,
    lineages: v1Colony.lineages ?? { surnames: [], livingCount: new Uint32Array(0) },
    treasury: v1Colony.treasury ?? 50000,
    year: v1Colony.year ?? 1960,
    history: v1Colony.history ?? [],
    modernityPressure: 0,
    economy: {
      parcels: [
        {
          id: 'parcel-0',
          type: 'jungleClearing',
          hectares: 3000,
          productivity,
          purchaseYear: 1960,
        },
      ],
      buildings: [],
    },
    pairingCoefficients: new Map(),
    flags: {},
  }
}

export function migrateV1ToV2(v1Save: SaveStateV1): SaveStateV2 {
  const currentYear = v1Save.colony?.year ?? 1960
  const migratedColony = migrateV1Colony(v1Save.colony, currentYear)
  const federation = createFederation(migratedColony)
  // Sync federation year to colony year
  federation.year = migratedColony.year

  return {
    version: 2,
    seed: v1Save.seed,
    federation,
  }
}

export function migrate(save: SaveStateV1 | SaveStateV2): SaveStateV2 {
  if (save.version === 2) {
    // Idempotent: already v2
    return save as SaveStateV2
  }
  return migrateV1ToV2(save as SaveStateV1)
}
