import { Colony, Doctrine } from './types'
import { getAlive } from './population'

export function updateTreasury(colony: Colony): void {
  let adults = 0

  for (const id of getAlive(colony.population)) {
    const age = colony.population.age[id]
    if (age >= 18 && age <= 65) {
      adults++
    }
  }

  const output = adults * 1200
  const expenses = colony.population.size * 600
  const strictness = countStrictness(colony.doctrine)
  const enforcement = colony.population.size * colony.population.size * strictness * 0.001

  colony.treasury += output - expenses - enforcement
}

function countStrictness(doctrine: Doctrine): number {
  let s = 0
  if (!doctrine.smartphones) s++
  if (!doctrine.englishSchool) s++
  if (doctrine.plainDress) s++
  if (doctrine.marriageAge <= 19) s++
  return s
}
