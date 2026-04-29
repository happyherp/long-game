import { useGameStore } from '../store/gameStore'

export function Header() {
  const { colony, tick, gameOver } = useGameStore()

  if (!colony) return null

  return (
    <div className="bg-white shadow p-4 mb-4 flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold">{colony.name}</h1>
        <p className="text-gray-600">Year {colony.year}</p>
      </div>
      <button
        onClick={tick}
        disabled={gameOver}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {gameOver ? 'Game Over' : 'Next Year'}
      </button>
    </div>
  )
}
