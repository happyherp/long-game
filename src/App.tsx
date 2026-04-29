import { useEffect, useState } from 'react'
import { useGameStore } from './store/gameStore'
import { Header } from './components/Header'
import { ColonySummary } from './components/ColonySummary'
import { DoctrineSheet } from './components/DoctrineSheet'
import { PopulationChart } from './components/PopulationChart'
import { GameOverScreen } from './components/GameOverScreen'
import { PeopleList } from './components/PeopleList'
import { loadGame, saveGame, deleteGame } from './persistence/db'

type Tab = 'chart' | 'people'

export default function App() {
  const { colony, seed, newGame } = useGameStore()
  const [tab, setTab] = useState<Tab>('chart')

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

      {/* Tabbed panel */}
      <div className="bg-white shadow rounded mb-4">
        <div className="flex border-b">
          <button
            onClick={() => setTab('chart')}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === 'chart'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Population over time
          </button>
          <button
            onClick={() => setTab('people')}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === 'people'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            People
          </button>
        </div>

        <div className="p-4">
          {tab === 'chart' && <PopulationChart />}
          {tab === 'people' && <PeopleList />}
        </div>
      </div>

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
