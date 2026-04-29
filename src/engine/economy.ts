import { Colony, Doctrine, LandType } from './types'
import { getAlive } from './population'
import { hasDairyPlant, hasClinic } from './buildings'

const BASE_YIELD: Record<LandType, number> = {
  jungleClearing: 30,
  farmland: 100,
  pasture: 70,
}

export function updateTreasury(colony: Colony): void {
  const adults = countAdults(colony)
  const totalHectares = getTotalHectares(colony)

  // Land-driven output
  let output = 0
  for (const parcel of colony.economy.parcels) {
    const baseYield = BASE_YIELD[parcel.type]
    const productivity = parcel.productivity
    const laborMult = laborMultiplier(adults, totalHectares)
    const techMult = techMultiplier(colony.doctrine, colony.economy.buildings, parcel.type)

    output += parcel.hectares * baseYield * productivity * laborMult * techMult
  }

  // Sunday observance: 6/7 multiplier on all output
  if (colony.doctrine.sundayObservance) {
    output *= 6 / 7
  }

  const expenses = colony.population.size * 200
  const strictness = countStrictness(colony.doctrine)
  const enforcement = colony.population.size * colony.population.size * strictness * 0.0001

  colony.treasury += Math.floor(output - expenses - enforcement)
}

function laborMultiplier(adults: number, totalHectares: number): number {
  if (totalHectares === 0) return 0
  const laborPerHectare = adults / totalHectares
  return Math.min(1, laborPerHectare / 0.1) // 0.1 adults per hectare = full productivity
}

function techMultiplier(doctrine: Doctrine, buildings: Colony['economy']['buildings'], landType: LandType): number {
  let mult = 1.0

  // Motorized farming: 1.3× on farmland and pasture
  if (doctrine.motorizedFarming && (landType === 'farmland' || landType === 'pasture')) {
    mult *= 1.3
  }

  // Dairy plant: 1.5× on pasture
  if (landType === 'pasture' && buildings.includes('dairyPlant')) {
    mult *= 1.5
  }

  return mult
}

function countStrictness(doctrine: Doctrine): number {
  let s = 0

  // Marriage strictness
  if (doctrine.marriageDoctrine === 'courtship') s++
  if (doctrine.marriageAge <= 19) s++
  if (doctrine.marriageOutside === 'forbidden') s++

  // Religion / visible markers
  if (doctrine.baptismAge === 'infant') s++
  if (doctrine.shunning) s++
  if (doctrine.worshipLanguage === 'plautdietsch') s++
  if (doctrine.plainDress) s++
  if (doctrine.headCovering) s++
  if (doctrine.beardForMarried) s++
  if (doctrine.sundayObservance) s++

  // Education
  if (!doctrine.englishSchool) s++
  if (doctrine.higherEdMen === 'forbidden') s++
  if (doctrine.higherEdWomen === 'forbidden') s++

  // Technology
  if (!doctrine.smartphones) s++
  if (!doctrine.motorizedFarming) s++
  if (!doctrine.gridElectricity) s++

  // Outside contact
  if (doctrine.outsideTrade === 'closed') s++
  if (doctrine.inflowPolicy === 'closed') s++

  return s
}

function countAdults(colony: Colony): number {
  let adults = 0
  for (let i = 0; i < colony.population.size; i++) {
    const age = colony.population.age[i]
    if (age >= 18 && age <= 65) {
      adults++
    }
  }
  return adults
}

function getTotalHectares(colony: Colony): number {
  return colony.economy.parcels.reduce((sum, p) => sum + p.hectares, 0)
}