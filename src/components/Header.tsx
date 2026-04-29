import { useGameStore } from '../store/gameStore'

export function Header() {
  const { federation, selectedColonyId, tick, gameOver } = useGameStore()

  if (!federation) return null;

  const selectedColony = federation.colonies.find(c => c.id === selectedColonyId)
  const totalPop = federation.colonies.reduce((sum, c) => sum + c.population.size, 0)
  const totalTreasury = federation.colonies.reduce((sum, c) => sum + c.treasury, 0)
  const avgModernityPressure = federation.colonies.length > 0
    ? federation.colonies.reduce((sum, c) => sum + c.modernityPressure, 0) / federation.colonies.length
    : 0

  return (
    <header className="bg-white shadow p-4 mb-4">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-bold">
            {selectedColony ? selectedColony.name : 'Federation'}
          </h1>
          <p className="text-gray-600">
            Year: {federation.year} | Total Population: {totalPop}
          </p>
        </div>
        <button
          onClick={tick}
          disabled={gameOver}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {gameOver ? 'Game Over' : 'Next Year'}
        </button>
      </div>

      <div className="flex gap-4 text-sm text-gray-700 border-t pt-2">
        <div className="flex items-center gap-1">
          <span className="font-semibold">Avg MP:</span>
          <span className={avgModernityPressure > 300 ? 'text-red-600 font-bold' : ''}>
            {Math.round(avgModernityPressure)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-semibold">Treasury:</span>
          <span className={totalTreasury < 0 ? 'text-red-600 font-bold' : ''}>
            ${totalTreasury.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-semibold">Colonies:</span>
          <span>{federation.colonies.length}</span>
        </div>
        {federation.pendingSchisms.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="font-semibold text-orange-600">Pending Schisms:</span>
            <span className="text-orange-600">{federation.pendingSchisms.length}</span>
          </div>
        )}
      </div>
    </header>
  )
}
