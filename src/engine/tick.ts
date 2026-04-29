import { Colony, PopulationStore, TickResult } from './types'
import { RNG } from './rng'
import { getAlive } from './population'
import { applyDeaths } from './deaths'
import { pairUp } from './pairUp'
import { applyBirths } from './births'
import { applyCohesionDrift } from './cohesion'
import { applyDepartures } from './departures'
import { updateTreasury } from './economy'
import { computeMetrics, toSnapshot } from './metrics'

export function tick(colony: Colony, rng: RNG): TickResult {
  const year = colony.year

  ageEveryone(colony.population)

  const deathEvents = applyDeaths(colony.population, colony.lineages, rng.fork('deaths'), year)

  const pairEvents = pairUp(colony, rng.fork('pairing'))

  const birthEvents = applyBirths(colony, rng.fork('births'), year)

  applyCohesionDrift(colony, rng.fork('cohesion'))

  const departureEvents = applyDepartures(colony, rng.fork('departures'), year)

  updateTreasury(colony)

  const metrics = computeMetrics(colony)

  colony.history.push(
    toSnapshot(colony, metrics, year, birthEvents.length, deathEvents.length, departureEvents.length),
  )

  colony.year++

  return {
    colony,
    events: [...deathEvents, ...pairEvents, ...birthEvents, ...departureEvents],
    metrics,
  }
}

function ageEveryone(population: PopulationStore): void {
  for (const id of getAlive(population)) {
    if (population.age[id] < 255) {
      population.age[id]++
    }
  }
}
