import { Colony, PopulationStore } from './types'
import { getAlive } from './population'

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function countInflow(population: PopulationStore): number {
  let count = 0
  for (const slot of getAlive(population)) {
    if (population.origin[slot] === 1) count++
  }
  return count
}

export function updateModernityPressure(colony: Colony): void {
  let mp = 0

  // Size pressure (compounds)
  mp += Math.log10(Math.max(10, colony.population.size)) * 30

  // Wealth pressure
  mp += Math.max(0, colony.treasury / 100_000) * 5

  // Tech adoption (each permitted item)
  if (colony.doctrine.smartphones) mp += 30
  if (colony.doctrine.motorizedFarming) mp += 20
  if (colony.doctrine.gridElectricity) mp += 15
  if (colony.doctrine.englishSchool) mp += 25
  if (colony.doctrine.outsideTrade === 'open') mp += 20

  // Outside contact accumulation
  const inflowMembers = countInflow(colony.population)
  mp += inflowMembers * 0.3

  // Higher ed
  if (colony.doctrine.higherEdMen === 'permitted') mp += 15
  if (colony.doctrine.higherEdMen === 'encouraged') mp += 25
  if (colony.doctrine.higherEdWomen === 'permitted') mp += 20
  if (colony.doctrine.higherEdWomen === 'encouraged') mp += 30

  colony.modernityPressure = clamp(mp, 0, 500)
}
