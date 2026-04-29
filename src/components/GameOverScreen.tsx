import { useGameStore } from '../store/gameStore'
import { computeMetrics } from '../engine/metrics'

export function GameOverScreen() {
  const { colony, gameOverReason, newGame } = useGameStore()

  if (!colony || !gameOverReason) return null

  const metrics = computeMetrics(colony)

  const messages: Record<string, string> = {
    collapse: 'Population Collapse - The community has ceased to exist.',
    loss: 'Financial Ruin - The colony bankrupt beyond recovery.',
    year: 'Simulation Complete - Year 2100 reached.',
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white shadow-lg p-8 rounded max-w-md">
        <h2 className="text-2xl font-bold mb-4">Game Over</h2>
        <p className="text-lg mb-6">{messages[gameOverReason]}</p>

        <div className="mb-6 p-4 bg-gray-100 rounded">
          <p className="text-sm text-gray-600">Final Statistics</p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <p className="text-xs text-gray-600">Population</p>
              <p className="font-bold">{metrics.totalPopulation}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Year</p>
              <p className="font-bold">{colony.year}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Cohesion</p>
              <p className="font-bold">{metrics.cohesionBand}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Treasury</p>
              <p className="font-bold">${metrics.treasury.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <button
          onClick={newGame}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          New Game
        </button>
      </div>
    </div>
  )
}
