import { Colony, LandParcel, LandType } from './types'

/**
 * Update productivity of all parcels — each parcel climbs toward 1.0 over ~15 years.
 * Uses asymptotic approach: productivity += (1 - productivity) * 0.07
 */
export function updateLandProductivity(colony: Colony): void {
  for (const parcel of colony.economy.parcels) {
    parcel.productivity = Math.min(1.0, parcel.productivity + (1.0 - parcel.productivity) * 0.07)
  }
}

/**
 * Check if a jungle clearing parcel can be converted (after 10 years of cultivation).
 */
export function canConvertParcel(parcel: LandParcel, currentYear: number): boolean {
  if (parcel.type !== 'jungleClearing') return false
  return currentYear - parcel.purchaseYear >= 10
}

/**
 * Convert a jungle clearing parcel to farmland or pasture.
 */
export function convertParcel(parcel: LandParcel, toType: 'farmland' | 'pasture'): void {
  parcel.type = toType
}

/**
 * Buy a new parcel of land (deducts from treasury).
 * Prices: jungleClearing $10/ha, farmland $50/ha, pasture $40/ha.
 */
const PARCEL_PRICE_PER_HA: Record<LandType, number> = {
  jungleClearing: 10,
  farmland: 50,
  pasture: 40,
}

export function buyParcel(colony: Colony, type: LandType, hectares: number, year: number): void {
  const cost = PARCEL_PRICE_PER_HA[type] * hectares
  colony.treasury -= cost
  const id = `parcel-${colony.economy.parcels.length}`
  colony.economy.parcels.push({
    id,
    type,
    hectares,
    productivity: 0.4,
    purchaseYear: year,
  })
}
