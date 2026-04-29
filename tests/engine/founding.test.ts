import { describe, it, expect } from 'vitest'
import { generateFoundingColony } from '../../src/engine/founding'
import { createRNG } from '../../src/engine/rng'
import { getAlive } from '../../src/engine/population'

describe('Founding Colony', () => {
  it('generates colony with correct population', () => {
    const rng = createRNG(12345)
    const colony = generateFoundingColony(rng, 'Cayo')

    expect(colony.population.size).toBe(280)
  })

  it('generates colony at year 1960', () => {
    const rng = createRNG(12345)
    const colony = generateFoundingColony(rng, 'Cayo')

    expect(colony.year).toBe(1960)
  })

  it('generates correct starting treasury', () => {
    const rng = createRNG(12345)
    const colony = generateFoundingColony(rng, 'Cayo')

    expect(colony.treasury).toBe(50000)
  })

  it('has approximately 50/50 sex ratio', () => {
    const rng = createRNG(12345)
    const colony = generateFoundingColony(rng, 'Cayo')

    let maleCount = 0
    let femaleCount = 0
    for (const id of getAlive(colony.population)) {
      if (colony.population.sex[id] === 1) maleCount++
      else femaleCount++
    }

    const ratio = maleCount / (maleCount + femaleCount)
    expect(ratio).toBeGreaterThan(0.45)
    expect(ratio).toBeLessThan(0.55)
  })

  it('pairs most marriageable adults (allowing for sex imbalance)', () => {
    const rng = createRNG(12345)
    const colony = generateFoundingColony(rng, 'Cayo')

    let unmarriedAdults = 0
    let totalAdults = 0
    for (const id of getAlive(colony.population)) {
      const age = colony.population.age[id]
      if (age >= 18) {
        totalAdults++
        if (colony.population.married[id] === 0) {
          unmarriedAdults++
        }
      }
    }

    const pairedRatio = (totalAdults - unmarriedAdults) / totalAdults
    expect(pairedRatio).toBeGreaterThan(0.80)
  })

  it('sets correct initial doctrine', () => {
    const rng = createRNG(12345)
    const colony = generateFoundingColony(rng, 'Cayo')

    expect(colony.doctrine.smartphones).toBe(false)
    expect(colony.doctrine.englishSchool).toBe(false)
    expect(colony.doctrine.plainDress).toBe(true)
    expect(colony.doctrine.marriageAge).toBe(19)
  })

  it('has empty history', () => {
    const rng = createRNG(12345)
    const colony = generateFoundingColony(rng, 'Cayo')

    expect(colony.history).toHaveLength(0)
  })

  it('distributes cohesion correctly', () => {
    const rng = createRNG(12345)
    const colony = generateFoundingColony(rng, 'Cayo')

    let adultCohesionValues: number[] = []
    let childCohesionValues: number[] = []

    for (const id of getAlive(colony.population)) {
      const age = colony.population.age[id]
      const cohesion = colony.population.cohesion[id]

      if (age >= 18) {
        adultCohesionValues.push(cohesion)
      } else {
        childCohesionValues.push(cohesion)
      }
    }

    const adultMin = Math.min(...adultCohesionValues)
    const adultMax = Math.max(...adultCohesionValues)
    const childMin = Math.min(...childCohesionValues)
    const childMax = Math.max(...childCohesionValues)

    expect(adultMin).toBeGreaterThanOrEqual(220)
    expect(adultMax).toBeLessThanOrEqual(250)
    expect(childMin).toBeGreaterThanOrEqual(200)
    expect(childMax).toBeLessThanOrEqual(230)
  })

  it('initializes all lineages', () => {
    const rng = createRNG(12345)
    const colony = generateFoundingColony(rng, 'Cayo')

    let totalLiving = 0
    for (let i = 0; i < colony.lineages.livingCount.length; i++) {
      totalLiving += colony.lineages.livingCount[i]
    }

    expect(totalLiving).toBe(280 * 2)
  })

  it('is deterministic given same seed', () => {
    const rng1 = createRNG(999)
    const colony1 = generateFoundingColony(rng1, 'Cayo')

    const rng2 = createRNG(999)
    const colony2 = generateFoundingColony(rng2, 'Cayo')

    const getState = (colony: any) => {
      const state = []
      for (const id of getAlive(colony.population)) {
        state.push({
          age: colony.population.age[id],
          sex: colony.population.sex[id],
          cohesion: colony.population.cohesion[id],
          married: colony.population.married[id],
          partnerId: colony.population.partnerId[id],
        })
      }
      return state
    }

    expect(getState(colony1)).toEqual(getState(colony2))
  })

  it('produces different results with different seeds', () => {
    const rng1 = createRNG(111)
    const colony1 = generateFoundingColony(rng1, 'Cayo')

    const rng2 = createRNG(222)
    const colony2 = generateFoundingColony(rng2, 'Cayo')

    let same = true
    for (const id of getAlive(colony1.population)) {
      if (colony1.population.age[id] !== colony2.population.age[id]) {
        same = false
        break
      }
    }

    expect(same).toBe(false)
  })

  it('stores colony name', () => {
    const rng = createRNG(12345)
    const colony = generateFoundingColony(rng, 'New Caledonia')

    expect(colony.name).toBe('New Caledonia')
  })
})
