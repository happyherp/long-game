import { Federation, Colony, FederationSnapshot, GameEvent, ColonyMetrics } from './types'
import { getAlive } from './population'
import { applyDeaths } from './deaths'
import { pairUp } from './pairUp'
import { applyBirths } from './births'
import { applySeparations } from './separations'
import { applyCohesionDrift } from './cohesion'
import { applyDepartures } from './departures'
import { applyInflow } from './inflow'
import { updateLandProductivity } from './land'
import { updateTreasury } from './economy'
import { updateModernityPressure } from './modernity'
import { detectSchism } from './schism'
import { RNG } from './rng'
import { computeMetrics } from './metrics'

export function federationTick(federation: Federation, rng: RNG): {
  federation: Federation
  events: GameEvent[]
  metrics: ColonyMetrics[]
} {
  const allEvents: GameEvent[] = []

  // Per-colony inner tick
  for (const colony of federation.colonies) {
    const cRng = rng.fork(`colony:${colony.id}`)

    // Age everyone
    for (const slot of getAlive(colony.population)) {
      colony.population.age[slot]++
    }

    allEvents.push(...applyDeaths(colony.population, colony.lineages, cRng.fork('deaths'), federation.year))
    allEvents.push(...pairUp(colony, cRng.fork('pairing')))
    allEvents.push(...applyBirths(colony, cRng.fork('births'), federation.year))
    if (colony.doctrine.marriageDoctrine === 'modern') {
      allEvents.push(...applySeparations(colony, cRng.fork('separations')))
    }
    applyCohesionDrift(colony, cRng.fork('cohesion'))
    allEvents.push(...applyDepartures(colony, cRng.fork('departures'), federation.year))
    allEvents.push(...applyInflow(colony, federation.year, cRng.fork('inflow')))
    updateLandProductivity(colony)
    updateTreasury(colony)
    updateModernityPressure(colony)
  }

  // Federation-level: schism check
  for (const colony of federation.colonies) {
    const schism = detectSchism(colony, rng.fork(`schism:${colony.id}`))
    if (schism) {
      allEvents.push(schism as unknown as GameEvent)
      federation.pendingSchisms.push(schism)
    }
  }

  // Save snapshots and increment year
  const metrics = federation.colonies.map(c => computeMetrics(c))
  federation.history.push(toFederationSnapshot(federation))
  federation.year += 1

  return { federation, events: allEvents, metrics }
}

function toFederationSnapshot(federation: Federation): FederationSnapshot {
  return {
    year: federation.year,
    totalPopulation: federation.colonies.reduce((sum, c) => sum + c.population.size, 0),
    colonyCount: federation.colonies.length,
    totalTreasury: federation.colonies.reduce((sum, c) => sum + c.treasury, 0),
  }
}

export function computeFederationMetrics(federation: Federation): {
  totalPopulation: number
  colonyCount: number
  totalTreasury: number
  averageCohesion: number
} {
  let totalPop = 0
  let totalCohesion = 0
  let totalPeople = 0

  for (const colony of federation.colonies) {
    totalPop += colony.population.size
    for (let i = 0; i < colony.population.size; i++) {
      totalCohesion += colony.population.cohesion[i]
      totalPeople++
    }
  }

  return {
    totalPopulation: totalPop,
    colonyCount: federation.colonies.length,
    totalTreasury: federation.colonies.reduce((sum, c) => sum + c.treasury, 0),
    averageCohesion: totalPeople > 0 ? totalCohesion / totalPeople : 0,
  }
}