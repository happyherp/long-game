import { useEffect } from 'react'
import { useGameStore } from './store/gameStore'
import { Header } from './components/Header'
import { ColonySummary } from './components/ColonySummary'
import { DoctrineSheet } from './components/DoctrineSheet'
import { PopulationChart } from './components/PopulationChart'
import { GameOverScreen } from './components/GameOverScreen'
import { PeopleList } from './components/PeopleList'
import { loadGame, saveGame, deleteGame } from './persistence/db'

export default function App() {
  const { colony, seed, newGame } = useGameStore()

  useEffect(() => {
    const initGame = async () => {
      const { newGame: start, loadGame: restore } = useGameStore.getState()
      try {
        const saved = await loadGame()
        if (saved) {
          restore(saved.colony, saved.seed)
        } else {
          start()
        }
      } catch (error) {
        console.error('Failed to load saved game:', error)
        start()
      }
    }
    initGame()
  }, [])

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

      <PeopleList />

      <div className="bg-white shadow p-4 rounded mt-4">
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
