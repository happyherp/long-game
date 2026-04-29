import { create } from 'zustand'
import { Colony, Doctrine } from '../engine/types'
import { generateFoundingColony } from '../engine/founding'
import { tick } from '../engine/tick'
import { createRNG } from '../engine/rng'

interface GameState {
  colony: Colony | null
  seed: number
  gameOver: boolean
  gameOverReason: 'collapse' | 'loss' | 'year' | null

  tick: () => void
  setDoctrine: (doctrine: Doctrine) => void
  newGame: () => void
  loadGame: (colony: Colony, seed: number) => void
}

export const useGameStore = create<GameState>((set, get) => ({
  colony: null,
  seed: 0,
  gameOver: false,
  gameOverReason: null,

  tick: () => {
    const state = get()
    if (!state.colony || state.gameOver) return

    const rng = createRNG(state.seed).fork(`year-${state.colony.year}`)
    const result = tick(state.colony, rng)

    checkGameOver(result.colony)
    set({ colony: { ...result.colony } })
  },

  setDoctrine: (doctrine: Doctrine) => {
    const state = get()
    if (!state.colony) return
    set({ colony: { ...state.colony, doctrine } })
  },

  newGame: () => {
    const seed = Math.floor(Math.random() * 2147483647)
    const colony = generateFoundingColony(createRNG(seed), 'Cayo')
    set({
      colony,
      seed,
      gameOver: false,
      gameOverReason: null,
    })
  },

  loadGame: (colony: Colony, seed: number) => {
    set({
      colony,
      seed,
      gameOver: false,
      gameOverReason: null,
    })
  },
}))

function checkGameOver(colony: Colony): void {
  if (colony.population.size === 0) {
    useGameStore.setState({ gameOver: true, gameOverReason: 'collapse' })
  }

  if (colony.year >= 2100) {
    useGameStore.setState({ gameOver: true, gameOverReason: 'year' })
  }

  let negativeYears = 0
  for (let i = Math.max(0, colony.history.length - 5); i < colony.history.length; i++) {
    if (colony.history[i].treasury < -50000) {
      negativeYears++
    }
  }

  if (negativeYears >= 5) {
    useGameStore.setState({ gameOver: true, gameOverReason: 'loss' })
  }
}
