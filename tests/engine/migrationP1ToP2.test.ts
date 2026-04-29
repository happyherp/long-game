import { describe, it, expect } from 'vitest'
import { migrate, migrateV1ToV2, SaveStateV1 } from '../../src/engine/migrate'
import { getSlot } from '../../src/engine/population'

function makeV1Save(populationSize = 50, year = 1980): SaveStateV1 {
  // Simulate a v1 colony save with minimal structure
  const pop = {
    age: new Uint8Array(populationSize).fill(30),
    sex: new Uint8Array(populationSize).map((_, i) => i % 2),
    cohesion: new Uint8Array(populationSize).fill(200),
    married: new Uint8Array(populationSize),
    partnerId: new Int32Array(populationSize).fill(-1),
    paternalLineage: new Uint16Array(populationSize),
    maternalLineage: new Uint16Array(populationSize),
    firstNameId: new Uint8Array(populationSize),
    size: populationSize,
  }

  // Pair up some adults
  for (let i = 0; i < populationSize - 1; i += 2) {
    pop.married[i] = 1
    pop.married[i + 1] = 1
    pop.partnerId[i] = i + 1
    pop.partnerId[i + 1] = i
  }

  return {
    version: 1,
    seed: 12345,
    colony: {
      name: 'Cayo',
      population: pop,
      doctrine: {
        smartphones: false,
        englishSchool: false,
        plainDress: true,
        marriageAge: 19,
      },
      lineages: {
        surnames: ['Penner', 'Reimer'],
        livingCount: new Uint32Array(2).fill(25),
      },
      treasury: 100000,
      year,
      history: [],
    },
  }
}

describe('Migration P1 → P2', () => {
  it('migrates a v1 save to v2', () => {
    const v1 = makeV1Save()
    const v2 = migrateV1ToV2(v1)

    expect(v2.version).toBe(2)
    expect(v2.federation).toBeDefined()
    expect(v2.federation.colonies).toHaveLength(1)
    expect(v2.federation.colonies[0].id).toBe('cayo')
  })

  it('assigns stable IDs to all persons', () => {
    const v1 = makeV1Save(50)
    const v2 = migrateV1ToV2(v1)
    const pop = v2.federation.colonies[0].population

    expect(pop.size).toBe(50)
    expect(pop.nextId).toBe(50)

    for (let i = 0; i < pop.size; i++) {
      expect(pop.slotToId[i]).toBe(i)
      expect(pop.idToSlot.get(i)).toBe(i)
    }
  })

  it('migrated state has valid partnerId resolution', () => {
    const v1 = makeV1Save(20)
    const v2 = migrateV1ToV2(v1)
    const pop = v2.federation.colonies[0].population

    // All paired persons should have valid partner references
    for (let slot = 0; slot < pop.size; slot++) {
      const partnerId = pop.partnerId[slot]
      if (partnerId >= 0) {
        const partnerSlot = getSlot(pop, partnerId)
        expect(partnerSlot).toBeGreaterThanOrEqual(0)
        // Partner's partner should point back
        expect(pop.partnerId[partnerSlot]).toBe(pop.slotToId[slot])
      }
    }
  })

  it('migration is idempotent', () => {
    const v1 = makeV1Save()
    const v2First = migrateV1ToV2(v1)
    const v2Again = migrate(v2First)

    // Running migrate on v2 returns it as-is
    expect(v2Again.version).toBe(2)
    expect(v2Again.federation.colonies.length).toBe(v2First.federation.colonies.length)
    expect(v2Again.federation.colonies[0].population.size).toBe(
      v2First.federation.colonies[0].population.size
    )
  })

  it('converts v1 doctrine to full Doctrine with defaults', () => {
    const v1 = makeV1Save()
    const v2 = migrateV1ToV2(v1)
    const doctrine = v2.federation.colonies[0].doctrine

    // V1 fields preserved
    expect(doctrine.smartphones).toBe(false)
    expect(doctrine.englishSchool).toBe(false)
    expect(doctrine.plainDress).toBe(true)
    expect(doctrine.marriageAge).toBe(19)

    // New fields defaulted from DEFAULT_DOCTRINE
    expect(doctrine.marriageDoctrine).toBe('courtship')
    expect(doctrine.marriageOutside).toBe('forbidden')
    expect(doctrine.shunning).toBe(true)
    expect(doctrine.worshipLanguage).toBe('plautdietsch')
    expect(doctrine.higherEdMen).toBe('forbidden')
    expect(doctrine.higherEdWomen).toBe('forbidden')
    expect(doctrine.inflowPolicy).toBe('closed')
  })

  it('adds 3000ha jungle clearing parcel', () => {
    const v1 = makeV1Save(50, 1985)
    const v2 = migrateV1ToV2(v1)
    const colony = v2.federation.colonies[0]

    expect(colony.economy.parcels).toHaveLength(1)
    expect(colony.economy.parcels[0].type).toBe('jungleClearing')
    expect(colony.economy.parcels[0].hectares).toBe(3000)
    // After 25 years (1960→1985), productivity should be > 0.4
    expect(colony.economy.parcels[0].productivity).toBeGreaterThan(0.4)
  })

  it('initializes new colony fields', () => {
    const v1 = makeV1Save()
    const v2 = migrateV1ToV2(v1)
    const colony = v2.federation.colonies[0]

    expect(colony.modernityPressure).toBe(0)
    expect(colony.pairingCoefficients).toBeInstanceOf(Map)
    expect(colony.flags).toBeDefined()
    expect(colony.economy.buildings).toHaveLength(0)
  })
})
