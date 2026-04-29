import { Colony, PopulationStore } from './types'
import { createStore, addPerson } from './population'
import { createLineageRegistry, incrementLivingCount } from './lineage'
import { RNG } from './rng'
import { FOUNDER_SURNAMES } from './names'

const FOUNDING_POPULATION = 280
const FOUNDING_YEAR = 1960
const FOUNDING_TREASURY = 50000

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

  const people: Array<{ id: number; age: number; sex: number }> = []

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

      const id = addPerson(population, {
        age,
        sex,
        cohesion,
        married: 0,
        partnerId: -1,
        paternalLineage,
        maternalLineage,
        firstNameId,
      })

      incrementLivingCount(lineages, paternalLineage)
      incrementLivingCount(lineages, maternalLineage)

      if (age >= 18) {
        people.push({ id, age, sex })
      }
    }
  }

  pairUnmarriedAdults(population, people, rngPairing)

  return {
    name: colonyName,
    population,
    doctrine: {
      smartphones: false,
      englishSchool: false,
      plainDress: true,
      marriageAge: 19,
    },
    lineages,
    treasury: FOUNDING_TREASURY,
    year: FOUNDING_YEAR,
    history: [],
  }
}

function pairUnmarriedAdults(
  population: PopulationStore,
  adults: Array<{ id: number; age: number; sex: number }>,
  rng: RNG,
): void {
  const males = adults.filter((a) => a.sex === 1)
  const females = adults.filter((a) => a.sex === 0)

  const malesFemales = Math.min(males.length, females.length)

  for (let i = 0; i < malesFemales; i++) {
    const maleIdx = rng.nextInt(males.length - i)
    const femaleIdx = rng.nextInt(females.length - i)

    const male = males[maleIdx]
    const female = females[femaleIdx]

    population.married[male.id] = 1
    population.partnerId[male.id] = female.id

    population.married[female.id] = 1
    population.partnerId[female.id] = male.id

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
