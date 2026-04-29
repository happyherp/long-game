import { Colony, LandParcel, LandType } from './types'

export function buyLandParcel(colony: Colony, type: LandType, hectares: number, year: number): boolean {
  // Check if colony has enough treasury
  const cost = hectares * getLandCost(type)
  if (colony.treasury < cost) return false

  // Check geographic capacity (10,000 hectares max per colony in P2)
  const totalHectares = colony.economy.parcels.reduce((sum, p) => sum + p.hectares, 0)
  if (totalHectares + hectares > 10_000) return false

  colony.treasury -= cost

  const parcel: LandParcel = {
    id: `parcel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    hectares,
    productivity: 0.4, // Starting productivity
    purchaseYear: year,
  }

  colony.economy.parcels.push(parcel)
  return true
}

export function convertLandParcel(colony: Colony, parcelId: string, newType: 'farmland' | 'pasture'): boolean {
  const parcel = colony.economy.parcels.find(p => p.id === parcelId)
  if (!parcel) return false
  if (parcel.type !== 'jungleClearing') return false

  // Must have been cultivated for 10 years
  const currentYear = colony.year
  if (currentYear - parcel.purchaseYear < 10) return false

  parcel.type = newType
  return true
}

export function updateLandProductivity(colony: Colony): void {
  const totalAdults = countAdults(colony)

  for (const parcel of colony.economy.parcels) {
    // Productivity climbs from 0.4 toward 1.0 over ~15 years of consistent labor
    const laborPerHectare = totalAdults / Math.max(1, getTotalHectares(colony))
    const laborFactor = Math.min(1, laborPerHectare / 0.1) // 0.1 adults per hectare = full productivity

    if (laborFactor > 0.5 && parcel.productivity < 1.0) {
      parcel.productivity = Math.min(1.0, parcel.productivity + 0.04) // ~15 years to max
    }
  }
}

function getLandCost(type: LandType): number {
  switch (type) {
    case 'jungleClearing': return 50
    case 'farmland': return 100
    case 'pasture': return 80
  }
}

function countAdults(colony: Colony): number {
  let adults = 0
  for (let i = 0; i < colony.population.size; i++) {
    if (colony.population.age[i] >= 18 && colony.population.age[i] <= 65) {
      adults++
    }
  }
  return adults
}

function getTotalHectares(colony: Colony): number {
  return colony.economy.parcels.reduce((sum, p) => sum + p.hectares, 0)
}