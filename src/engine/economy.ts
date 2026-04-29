import { Colony, Doctrine, LandType, Building } from './types'
import { getAlive } from './population'

const BASE_YIELD: Record<LandType, number> = {
  jungleClearing: 30,
  farmland: 100,
  pasture: 70,
}

function laborMultiplier(adults: number, totalHectares: number): number {
  if (totalHectares === 0) return 0
  const ratio = adults / totalHectares
  return Math.min(1, ratio / 0.05)  // optimal at 1 adult per 20 hectares
}

function techMultiplier(doctrine: Doctrine, buildings: Building[]): number {
  let m = 1.0
  if (doctrine.motorizedFarming) m *= 1.3
  if (doctrine.sundayObservance) m *= (6 / 7)
  return m
}

export function updateTreasury(colony: Colony): void {
  let adults = 0

  for (const id of getAlive(colony.population)) {
    const age = colony.population.age[id]
    if (age >= 18 && age <= 65) {
      adults++
    }
  }

  const { economy, doctrine } = colony
  let output: number

  if (economy.parcels.length > 0) {
    const totalHectares = economy.parcels.reduce((sum, p) => sum + p.hectares, 0)
    const lm = laborMultiplier(adults, totalHectares)
    const tm = techMultiplier(doctrine, economy.buildings)
    const hasDairyPlant = economy.buildings.includes('dairyPlant')

    output = 0
    for (const parcel of economy.parcels) {
      let parcelMultiplier = 1.0
      if (hasDairyPlant && parcel.type === 'pasture') {
        parcelMultiplier = 1.5
      }
      output += parcel.hectares * BASE_YIELD[parcel.type] * parcel.productivity * lm * tm * parcelMultiplier
    }
  } else {
    // Fallback: compatibility with no-parcel colonies
    output = adults * 1200
  }

  const expenses = colony.population.size * 600
  const strictness = countStrictness(colony.doctrine)
  const enforcement = colony.population.size * colony.population.size * strictness * 0.0003

  colony.treasury += output - expenses - enforcement
}

export function countStrictness(doctrine: Doctrine): number {
  let s = 0
  if (!doctrine.smartphones) s++
  if (!doctrine.englishSchool) s++
  if (doctrine.plainDress) s++
  if (doctrine.headCovering) s++
  if (doctrine.beardForMarried) s++
  if (doctrine.sundayObservance) s++
  if (doctrine.worshipLanguage === 'plautdietsch') s++
  if (doctrine.shunning) s++
  if (doctrine.marriageOutside === 'forbidden') s++
  if (doctrine.inflowPolicy === 'closed') s++
  if (doctrine.marriageDoctrine === 'courtship') s++
  if (doctrine.higherEdMen === 'forbidden') s++
  if (doctrine.higherEdWomen === 'forbidden') s++
  if (!doctrine.motorizedFarming) s++
  if (!doctrine.gridElectricity) s++
  if (doctrine.marriageAge <= 19) s++
  return s
}
