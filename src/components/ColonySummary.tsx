import { useGameStore } from '../store/gameStore'
import { computeMetrics } from '../engine/metrics'

export function ColonySummary() {
  const { colony } = useGameStore()

  if (!colony) return null

  const metrics = computeMetrics(colony)

  return (
    <div className="bg-white shadow p-4 rounded mb-4">
      <h2 className="text-xl font-bold mb-4">Colony Summary</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-gray-600">Population</p>
          <p className="text-2xl font-bold">{metrics.totalPopulation}</p>
        </div>
        <div>
          <p className="text-gray-600">Sex Ratio (M:F)</p>
          <p className="text-2xl font-bold">
            {metrics.maleCount}:{metrics.femaleCount}
          </p>
        </div>
        <div>
          <p className="text-gray-600">Median Age</p>
          <p className="text-2xl font-bold">{metrics.medianAge.toFixed(1)}</p>
        </div>
        <div>
          <p className="text-gray-600">TFR</p>
          <p className="text-2xl font-bold">{metrics.tfr.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-gray-600">Cohesion</p>
          <p className="text-2xl font-bold">
            {metrics.cohesionBand} ({metrics.cohesionAvg.toFixed(0)})
          </p>
        </div>
        <div>
          <p className="text-gray-600">Treasury</p>
          <p className="text-2xl font-bold">${metrics.treasury.toLocaleString()}</p>
        </div>
      </div>

      {colony.history.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-600 font-bold mb-2">Last Year</p>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Births</p>
              <p>{metrics.birthsThisYear}</p>
            </div>
            <div>
              <p className="text-gray-600">Deaths</p>
              <p>{metrics.deathsThisYear}</p>
            </div>
            <div>
              <p className="text-gray-600">Departures</p>
              <p>{metrics.departuresThisYear}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
