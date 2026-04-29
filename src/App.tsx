import { useEffect } from 'react'
import { useGameStore } from './store/gameStore'
import { Header } from './components/Header'
import { ColonySummary } from './components/ColonySummary'
import { DoctrineSheet } from './components/DoctrineSheet'
import { BalanceSheet } from './components/BalanceSheet'
import { PopulationChart } from './components/PopulationChart'
import { GameOverScreen } from './components/GameOverScreen'
import { loadGame, saveGame, deleteGame } from './persistence/db'

export default function App() {
  const { federation, seed, newGame, loadGame: loadToStore, gameOver } = useGameStore()

  useEffect(() => {
    const initGame = async () => {
      try {
        const saved = await loadGame()
        if (saved) {
          loadToStore(saved.federation, saved.seed)
        } else {
          newGame()
        }
      } catch (error) {
        console.error('Failed to load saved game:', error)
        newGame()
      }
    }
    initGame()
  }, [])

  useEffect(() => {
    if (federation) {
      saveGame(federation, seed)
    }
  }, [federation, seed])

  if (!federation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">The Long Game</h1>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Header />

      <div className="grid grid-cols-2 gap-4 mb-4">
        <ColonySummary />
        <DoctrineSheet />
      </div>

      <BalanceSheet />

      <PopulationChart />

      <div className="bg-white shadow p-4 rounded">
        <button
          onClick={async () => {
            await deleteGame()
            newGame()
          }}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          New Game
        </button>
      </div>

      <GameOverScreen />
    </div>
  )
}