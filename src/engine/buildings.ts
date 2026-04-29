import { Colony } from './types'

export function canBuildClinic(colony: Colony): boolean {
  return colony.treasury >= 25000
}

export function canBuildDairyPlant(colony: Colony): boolean {
  const { doctrine } = colony
  return doctrine.englishSchool ||
    doctrine.higherEdMen === 'tradeOnly' ||
    doctrine.higherEdMen === 'permitted' ||
    doctrine.higherEdMen === 'encouraged'
}

export function buildClinic(colony: Colony): void {
  colony.treasury -= 25000
  if (!colony.economy.buildings.includes('clinic')) {
    colony.economy.buildings.push('clinic')
  }
}

export function buildDairyPlant(colony: Colony): void {
  colony.treasury -= 60000
  if (!colony.economy.buildings.includes('dairyPlant')) {
    colony.economy.buildings.push('dairyPlant')
  }
}
