import { create } from 'zustand'
import { Federation, Colony, Doctrine } from '../engine/types'
import { createRNG } from '../engine/rng'
import { generateFoundingColony } from '../engine/founding'
import { federationTick } from '../engine/federation'
import { grantSchism, refuseSchism } from '../engine/schism'
import { buyLandParcel, convertLandParcel } from '../engine/land'
import { buildClinic, buildDairyPlant } from '../engine/buildings'
import { migrateV1toV2 } from '../engine/migrate'

interface GameState {
  federation: Federation | null
  seed: number
  selectedColonyId: number | null
  gameOver: boolean
  gameOverReason: 'collapse' | 'loss' | 'year' | null

  // Actions
  newGame: () => void
  tick: () => void
  setDoctrineForColony: (colonyId: number, doctrine: Partial<Doctrine>) => void
  selectColony: (colonyId: number) => void
  grantSchism: (schismIndex: number) => void
  refuseSchism: (schismIndex: number) => void
  buyParcel: (colonyId: number, type: 'jungleClearing' | 'farmland' | 'pasture', hectares: number) => void
  convertParcel: (colonyId: number, parcelId: string, newType: 'farmland' | 'pasture') => void
  buildClinic: (colonyId: number) => void
  buildDairyPlant: (colonyId: number) => void
  loadGame: (federation: Federation, seed: number) => void
  migrateAndLoad: (saveV1: { version: 1; seed: number; colony: Colony }) => void
}

export const useGameStore = create<GameState>((set, get) => ({
  federation: null,
  seed: 0,
  selectedColonyId: null,
  gameOver: false,
  gameOverReason: null,

  newGame: () => {
    const seed = Math.floor(Math.random() * 2147483647)
    const rng = createRNG(seed)
    const colony = generateFoundingColony(rng.fork('founding'), 'Cayo')
    
    const federation: Federation = {
      year: 1960,
      colonies: [colony],
      modernWest: { willingness: 1.0 },
      pendingSchisms: [],
      history: [],
    }
    
    set({
      federation,
      seed,
      selectedColonyId: colony.id,
      gameOver: false,
      gameOverReason: null,
    })
  },

  tick: () => {
    const state = get()
    if (!state.federation || state.gameOver) return

    const rng = createRNG(state.seed)
    const result = federationTick(state.federation, rng)
    
    checkGameOver(result.federation)
    
    set({
      federation: result.federation,
      selectedColonyId: state.selectedColonyId,
    })
  },

  setDoctrineForColony: (colonyId: number, doctrine: Partial<Doctrine>) => {
    set((state) => {
      if (!state.federation) return state

      const colony = state.federation.colonies.find(c => c.id === colonyId)
      if (!colony) return state

      // Create new doctrine object and update state for proper reactivity
      const newDoctrine = { ...colony.doctrine, ...doctrine }

      return {
        federation: {
          ...state.federation,
          colonies: state.federation.colonies.map(c =>
            c.id === colonyId ? { ...c, doctrine: newDoctrine } : c
          ),
        }
      }
    })
  },

  selectColony: (colonyId: number) => {
    set({ selectedColonyId: colonyId })
  },

  grantSchism: (schismIndex: number) => {
    const state = get()
    if (!state.federation) return

    const schism = state.federation.pendingSchisms[schismIndex]
    if (!schism) return

    grantSchism(state.federation, schism)
    
    // Remove from pending
    state.federation.pendingSchisms.splice(schismIndex, 1)
    
    // Auto-select new colony if available
    if (state.federation.colonies.length > 0 && !state.federation.colonies.find(c => c.id === state.selectedColonyId)) {
      set({ selectedColonyId: state.federation.colonies[state.federation.colonies.length - 1].id })
    }
  },

  refuseSchism: (schismIndex: number) => {
    const state = get()
    if (!state.federation) return

    const schism = state.federation.pendingSchisms[schismIndex]
    if (!schism) return

    refuseSchism(state.federation, schism)
    
    // Remove from pending
    state.federation.pendingSchisms.splice(schismIndex, 1)
  },

  buyParcel: (colonyId: number, type: 'jungleClearing' | 'farmland' | 'pasture', hectares: number) => {
    const state = get()
    if (!state.federation) return

    const colony = state.federation.colonies.find(c => c.id === colonyId)
    if (!colony) return

    buyLandParcel(colony, type, hectares, state.federation.year)
  },

  convertParcel: (colonyId: number, parcelId: string, newType: 'farmland' | 'pasture') => {
    const state = get()
    if (!state.federation) return

    const colony = state.federation.colonies.find(c => c.id === colonyId)
    if (!colony) return

    convertLandParcel(colony, parcelId, newType)
  },

  buildClinic: (colonyId: number) => {
    const state = get()
    if (!state.federation) return

    const colony = state.federation.colonies.find(c => c.id === colonyId)
    if (!colony) return

    buildClinic(colony)
  },

  buildDairyPlant: (colonyId: number) => {
    const state = get()
    if (!state.federation) return

    const colony = state.federation.colonies.find(c => c.id === colonyId)
    if (!colony) return

    buildDairyPlant(colony)
  },

  loadGame: (federation: Federation, seed: number) => {
    set({
      federation,
      seed,
      selectedColonyId: federation.colonies.length > 0 ? federation.colonies[0].id : null,
      gameOver: false,
      gameOverReason: null,
    })
  },

  migrateAndLoad: (saveV1: { version: 1; seed: number; colony: Colony }) => {
    const v2 = migrateV1toV2(saveV1)
    set({
      federation: v2.federation,
      seed: v2.seed,
      selectedColonyId: v2.federation.colonies.length > 0 ? v2.federation.colonies[0].id : null,
      gameOver: false,
      gameOverReason: null,
    })
  },
}))

function checkGameOver(federation: Federation): void {
  // Check if all colonies collapsed
  const totalPop = federation.colonies.reduce((sum, c) => sum + c.population.size, 0)
  if (totalPop === 0) {
    useGameStore.setState({ gameOver: true, gameOverReason: 'collapse' })
    return
  }

  // Check if all colonies insolvent for 5 consecutive years
  let allInsolvent = true
  for (const colony of federation.colonies) {
    if (colony.treasury >= 0) {
      allInsolvent = false
      break
    }
  }
  
  // Simplified check - full implementation would track consecutive years
  if (allInsolvent && federation.year >= 1965) {
    useGameStore.setState({ gameOver: true, gameOverReason: 'loss' })
    return
  }

  // Check if reached 2100
  if (federation.year > 2100) {
    useGameStore.setState({ gameOver: true, gameOverReason: 'year' })
  }
}