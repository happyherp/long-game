import { Colony, Building } from './types'

export function canBuildClinic(colony: Colony): boolean {
  return colony.treasury >= 25_000
}

export function canBuildDairyPlant(colony: Colony): boolean {
  if (colony.treasury < 60_000) return false
  // Requires englishSchool OR higherEdMen = tradeOnly/permitted/encouraged
  return colony.doctrine.englishSchool ||
    (colony.doctrine.higherEdMen !== 'forbidden')
}

export function buildClinic(colony: Colony): boolean {
  if (!canBuildClinic(colony)) return false

  colony.treasury -= 25_000
  colony.economy.buildings.push('clinic')
  return true
}

export function buildDairyPlant(colony: Colony): boolean {
  if (!canBuildDairyPlant(colony)) return false

  colony.treasury -= 60_000
  colony.economy.buildings.push('dairyPlant')
  return true
}

export function hasClinic(colony: Colony): boolean {
  return colony.economy.buildings.includes('clinic')
}

export function hasDairyPlant(colony: Colony): boolean {
  return colony.economy.buildings.includes('dairyPlant')
}

// Calculate building multipliers for output
export function getBuildingOutputMultiplier(colony: Colony): number {
  let multiplier = 1.0

  if (hasDairyPlant(colony)) {
    // Dairy plant only affects pasture output
    // This is handled in the economy calculation
  }

  return multiplier
}

// Get infant mortality multiplier from clinic
export function getInfantMortalityMultiplier(colony: Colony): number {
  return hasClinic(colony) ? 0.5 : 1.0
}

// Get birth probability bonus from clinic
export function getBirthBonus(colony: Colony): number {
  return hasClinic(colony) ? 1.05 : 1.0
}