import { Colony, Federation } from './types'

// P1 Save format (simplified)
interface SaveStateV1 {
  version: 1
  seed: number
  colony: Colony // P1 colony with limited doctrine
}

// P2 Save format
interface SaveStateV2 {
  version: 2
  seed: number
  federation: Federation
}

export function migrateV1toV2(saveV1: SaveStateV1): SaveStateV2 {
  const colony = saveV1.colony

  // 1. Wrap the P1 colony in a federation with one entry
  const federation: Federation = {
    year: colony.year || 1960,
    colonies: [colony],
    modernWest: { willingness: 1.0 },
    pendingSchisms: [],
    history: [], // Start fresh; federation snapshots will be generated on ticks
  }

  // 2. Generate stable IDs for current population
  const population = colony.population
  population.nextId = population.size
  for (let slot = 0; slot < population.size; slot++) {
    const stableId = slot // For migration, stable ID = original slot
    population.slotToId[slot] = stableId
    population.idToSlot.set(stableId, slot)
  }

  // 3. Convert P1 doctrine to full doctrine, defaulting new items to conservative position
  colony.doctrine = {
    // Marriage (defaults)
    marriageDoctrine: 'courtship',
    marriageAge: colony.doctrine.marriageAge || 19,
    marriageOutside: 'forbidden',

    // Religion / visible markers (defaults)
    baptismAge: 'infant',
    shunning: true,
    worshipLanguage: 'plautdietsch',
    plainDress: colony.doctrine.plainDress || true,
    headCovering: true,
    beardForMarried: true,
    sundayObservance: true,

    // Education (defaults)
    englishSchool: colony.doctrine.englishSchool || false,
    higherEdMen: 'forbidden',
    higherEdWomen: 'forbidden',

    // Technology (defaults)
    smartphones: colony.doctrine.smartphones || false,
    motorizedFarming: false,
    gridElectricity: false,

    // Outside contact (defaults)
    outsideTrade: 'restricted',
    inflowPolicy: 'closed',
  }

  // 4. Generate 3,000 hectares jungle clearing parcel with productivity computed from years elapsed since 1960
  const currentYear = colony.year || 1960
  const yearsElapsed = currentYear - 1960
  const productivity = Math.min(1.0, 0.4 + (yearsElapsed / 15) * 0.6)

  if (!colony.economy) {
    colony.economy = {
      parcels: [],
      buildings: [],
    }
  }

  colony.economy.parcels = [
    {
      id: 'migrated-land',
      type: 'jungleClearing',
      hectares: 3000,
      productivity,
      purchaseYear: 1960,
    },
  ]

  // 5. Set MP from current state (will be computed in next tick)
  colony.modernityPressure = 0

  // 6. Initialize new fields if missing
  if (!colony.foundingYear) colony.foundingYear = 1960
  if (!colony.pairingRecords) colony.pairingRecords = new Map()
  if (!colony.flags) colony.flags = {}

  // 7. Bump version to 2
  return {
    version: 2,
    seed: saveV1.seed,
    federation,
  }
}

// Test helper: Verify migration is idempotent
export function verifyIdempotentMigration(saveV1: SaveStateV1): boolean {
  const migrated1 = migrateV1toV2(saveV1)
  const migrated2 = migrateV1toV2(saveV1)

  // Compare federation state (simplified check)
  const fed1 = JSON.stringify(migrated1.federation)
  const fed2 = JSON.stringify(migrated2.federation)

  return fed1 === fed2
}