import { Colony, ColonyMetrics, PopulationStore, YearSnapshot } from './types'
import { getAlive } from './population'

export function computeMetrics(colony: Colony): ColonyMetrics {
  const pop = colony.population
  const total = pop.size

  let females = 0
  let males = 0
  let cohesionSum = 0

  for (const id of getAlive(pop)) {
    if (pop.sex[id] === 0) females++
    else males++
    cohesionSum += pop.cohesion[id]
  }

  const cohesionAvg = total > 0 ? cohesionSum / total : 0
  const cohesionBand = cohesionAvg < 85 ? ('low' as const) : cohesionAvg < 170 ? ('medium' as const) : ('high' as const)
  const medianAge = computeMedianAge(pop)

  // Rolling 5-year average of annual (births / reproductive-age female count).
  // The annual ratio is stored on each YearSnapshot at end-of-tick.
  const tfr = computeRollingTFR(colony.history)

  const birthsThisYear = lastSnapshotBirths(colony.history)
  const deathsThisYear = lastSnapshotDeaths(colony.history)
  const departuresThisYear = lastSnapshotDepartures(colony.history)

  return {
    totalPopulation: total,
    femaleCount: females,
    maleCount: males,
    medianAge,
    tfr,
    cohesionAvg,
    cohesionBand,
    treasury: colony.treasury,
    birthsThisYear,
    deathsThisYear,
    departuresThisYear,
  }
}

export function computeMedianAge(pop: PopulationStore): number {
  const ages: number[] = []
  for (const id of getAlive(pop)) {
    ages.push(pop.age[id])
  }
  ages.sort((a, b) => a - b)
  if (ages.length === 0) return 0
  const mid = Math.floor(ages.length / 2)
  return ages.length % 2 === 0 ? (ages[mid - 1] + ages[mid]) / 2 : ages[mid]
}

export function computeRollingTFR(history: YearSnapshot[]): number {
  if (history.length === 0) return 0
  const start = Math.max(0, history.length - 5)
  let sum = 0
  for (let i = start; i < history.length; i++) {
    sum += history[i].tfr
  }
  return sum / (history.length - start)
}

export function countReproductiveFemales(pop: PopulationStore): number {
  let count = 0
  for (const id of getAlive(pop)) {
    const age = pop.age[id]
    if (pop.sex[id] === 0 && age >= 15 && age <= 49) count++
  }
  return count
}

export function computeAnnualTFR(pop: PopulationStore, births: number): number {
  const denom = countReproductiveFemales(pop)
  return denom > 0 ? births / denom : 0
}

function lastSnapshotBirths(history: YearSnapshot[]): number {
  return history.length > 0 ? history[history.length - 1].births : 0
}

function lastSnapshotDeaths(history: YearSnapshot[]): number {
  return history.length > 0 ? history[history.length - 1].deaths : 0
}

function lastSnapshotDepartures(history: YearSnapshot[]): number {
  return history.length > 0 ? history[history.length - 1].departures : 0
}

export function toSnapshot(
  colony: Colony,
  metrics: ColonyMetrics,
  year: number,
  births: number,
  deaths: number,
  departures: number,
): YearSnapshot {
  const annualTfr = computeAnnualTFR(colony.population, births)

  return {
    year,
    population: metrics.totalPopulation,
    tfr: annualTfr,
    cohesionAvg: metrics.cohesionAvg,
    treasury: metrics.treasury,
    births,
    deaths,
    departures,
  }
}
