import { Colony, Federation, FederationSnapshot, ColonyMetrics, GameEvent, TickResult } from './types'
import { RNG } from './rng'
import { ageEveryone } from './tick'
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
import { computeMetrics, toSnapshot } from './metrics'

export function createFederation(colony: Colony): Federation {
  return {
    year: colony.year,
    colonies: [colony],
    modernWest: { willingness: 1.0 },
    pendingSchisms: [],
    history: [],
  }
}

export function federationTick(federation: Federation, rng: RNG): TickResult {
  const year = federation.year
  const allEvents: GameEvent[] = []
  const allMetrics: ColonyMetrics[] = []

  for (const colony of federation.colonies) {
    const cRng = rng.fork(`colony:${colony.id}`)

    ageEveryone(colony.population)

    const deathEvents = applyDeaths(colony.population, colony.lineages, cRng.fork('deaths'), year)
    const pairEvents = pairUp(colony, cRng.fork('pairing'), year)
    const birthEvents = applyBirths(colony, cRng.fork('births'), year)

    if (colony.doctrine.marriageDoctrine === 'modern') {
      const sepEvents = applySeparations(colony, cRng.fork('separations'), year)
      allEvents.push(...sepEvents)
    }

    applyCohesionDrift(colony, year, cRng.fork('cohesion'))

    const departureEvents = applyDepartures(colony, cRng.fork('departures'), year)
    const inflowEvents = applyInflow(colony, year, cRng.fork('inflow'))

    updateLandProductivity(colony)
    updateTreasury(colony)
    updateModernityPressure(colony)

    const metrics = computeMetrics(colony)
    colony.history.push(
      toSnapshot(colony, metrics, year, birthEvents.length, deathEvents.length, departureEvents.length),
    )

    allEvents.push(...deathEvents, ...pairEvents, ...birthEvents, ...departureEvents, ...inflowEvents)
    allMetrics.push(metrics)
  }

  // Federation-level schism check
  for (const colony of federation.colonies) {
    const schism = detectSchism(colony, rng.fork(`schism:${colony.id}`))
    if (schism) {
      federation.pendingSchisms.push(schism)
      allEvents.push({ type: 'schism', personId: -1, year, payload: schism })
    }
  }

  // Append federation snapshot
  const totalPop = federation.colonies.reduce((sum, c) => sum + c.population.size, 0)
  const totalTreasury = federation.colonies.reduce((sum, c) => sum + c.treasury, 0)
  const snap: FederationSnapshot = {
    year,
    totalPopulation: totalPop,
    colonyCount: federation.colonies.length,
    totalTreasury,
  }
  federation.history.push(snap)

  federation.year++

  return {
    federation,
    events: allEvents,
    metrics: allMetrics,
  }
}

export function computeFederationMetrics(federation: Federation): ColonyMetrics[] {
  return federation.colonies.map(colony => computeMetrics(colony))
}
