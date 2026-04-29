import { Colony, PopulationStore } from './types'
import { createStore, addLivingPerson, getSlot } from './population'
import { createLineageRegistry } from './lineage'
import { RNG } from './rng'
import { FOUNDER_SURNAMES } from './names'

const FOUNDING_POPULATION = 280
const FOUNDING_YEAR = 1960
const FOUNDING_TREASURY = 150000

interface AgeGroup {
  minAge: number
  maxAge: number
  count: number
}

const AGE_DISTRIBUTION: AgeGroup[] = [
  { minAge: 0, maxAge: 5, count: 60 },
  { minAge: 6, maxAge: 12, count: 50 },
  { minAge: 13, maxAge: 17, count: 30 },
  { minAge: 18, maxAge: 35, count: 80 },
  { minAge: 36, maxAge: 50, count: 40 },
  { minAge: 51, maxAge: 65, count: 18 },
  { minAge: 66, maxAge: 100, count: 2 },
]

export function generateFoundingColony(rng: RNG, colonyName: string): Colony {
  const population = createStore(FOUNDING_POPULATION + 10)
  const lineages = createLineageRegistry()

  const rngPersonAttrs = rng.fork('person-attrs')
  const rngPairing = rng.fork('pairing')
  const rngLineage = rng.fork('lineage')
  const rngCohesion = rng.fork('cohesion')

  const people: Array<{ stableId: number; age: number; sex: number }> = []

  for (const group of AGE_DISTRIBUTION) {
    for (let i = 0; i < group.count; i++) {
      const age = group.minAge + rngPersonAttrs.nextInt(group.maxAge - group.minAge + 1)
      const sex = rngPersonAttrs.nextInt(2)

      const paternalLineage = rngLineage.nextInt(FOUNDER_SURNAMES.length)
      const maternalLineage = rngLineage.nextInt(FOUNDER_SURNAMES.length)
      const firstNameId = rngPersonAttrs.nextInt(255)

      const isCohesionHigh = age >= 18
      let cohesion: number
      if (isCohesionHigh) {
        cohesion = 220 + rngCohesion.nextInt(31)
      } else {
        cohesion = 200 + rngCohesion.nextInt(31)
      }

      const stableId = addLivingPerson(population, lineages, {
        age,
        sex,
        cohesion,
        married: 0,
        partnerId: -1,
        paternalLineage,
        maternalLineage,
        fatherId: -1,
        motherId: -1,
        origin: 0,
        arrivalYear: FOUNDING_YEAR,
        firstNameId,
      })

      if (age >= 18) {
        people.push({ stableId, age, sex })
      }
    }
  }

  pairUnmarriedAdults(population, people, rngPairing)

  return {
    id: 0,
    name: colonyName,
    population,
    doctrine: {
      // Marriage
      marriageDoctrine: 'courtship',
      marriageAge: 19,
      marriageOutside: 'forbidden',
      // Religion / visible markers
      baptismAge: 'infant',
      shunning: true,
      worshipLanguage: 'plautdietsch',
      plainDress: true,
      headCovering: true,
      beardForMarried: true,
      sundayObservance: true,
      // Education
      englishSchool: false,
      higherEdMen: 'forbidden',
      higherEdWomen: 'forbidden',
      // Technology
      smartphones: false,
      motorizedFarming: false,
      gridElectricity: false,
      // Outside contact
      outsideTrade: 'restricted',
      inflowPolicy: 'closed',
    },
    lineages,
    treasury: FOUNDING_TREASURY,
    year: FOUNDING_YEAR,
    history: [],
    foundingYear: FOUNDING_YEAR,
    modernityPressure: 0,
    economy: {
      parcels: [
        {
          id: 'founding-land',
          type: 'jungleClearing',
          hectares: 3000,
          productivity: 0.4,
          purchaseYear: FOUNDING_YEAR,
        },
      ],
      buildings: [],
    },
    pairingRecords: new Map(),
    flags: {},
  }
}

function pairUnmarriedAdults(
  population: PopulationStore,
  adults: Array<{ stableId: number; age: number; sex: number }>,
  rng: RNG,
): void {
  const males = adults.filter((a) => a.sex === 1)
  const females = adults.filter((a) => a.sex === 0)

  const pairCount = Math.min(males.length, females.length)

  for (let i = 0; i < pairCount; i++) {
    const maleIdx = rng.nextInt(males.length - i)
    const femaleIdx = rng.nextInt(females.length - i)

    const male = males[maleIdx]
    const female = females[femaleIdx]

    const maleSlot = getSlot(population, male.stableId)
    const femaleSlot = getSlot(population, female.stableId)

    population.married[maleSlot] = 1
    population.partnerId[maleSlot] = female.stableId

    population.married[femaleSlot] = 1
    population.partnerId[femaleSlot] = male.stableId

    const lastMaleIdx = males.length - 1 - i
    const temp1 = males[maleIdx]
    males[maleIdx] = males[lastMaleIdx]
    males[lastMaleIdx] = temp1

    const lastFemaleIdx = females.length - 1 - i
    const temp2 = females[femaleIdx]
    females[femaleIdx] = females[lastFemaleIdx]
    females[lastFemaleIdx] = temp2
  }
}
