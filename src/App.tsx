import { useEffect } from 'react'
import { useGameStore } from './store/gameStore'
import { Header } from './components/Header'
import { ColonySummary } from './components/ColonySummary'
import { DoctrineSheet } from './components/DoctrineSheet'
import { PopulationChart } from './components/PopulationChart'
import { loadGame, saveGame, deleteGame } from './persistence/db'

export default function App() {
  const { colony, seed, newGame, loadGame: loadGameState } = useGameStore()

  useEffect(() => {
    const initGame = async () => {
      const saved = await loadGame()
      if (saved) {
        loadGameState(saved.colony, saved.seed)
      } else {
        newGame()
      }
    }
    initGame()
  }, [newGame, loadGameState])

  useEffect(() => {
    if (colony) {
      saveGame(seed, colony)
    }
  }, [colony, seed])

  if (!colony) {
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
    </div>
  )
}
