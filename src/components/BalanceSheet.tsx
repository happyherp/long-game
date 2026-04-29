import { useGameStore } from '../store/gameStore'

export function BalanceSheet() {
  const { federation, selectedColonyId } = useGameStore()

  if (!federation || selectedColonyId === null) return null

  const colony = federation.colonies.find(c => c.id === selectedColonyId)
  if (!colony) return null

  const economy = colony.economy

  // Calculate income (simplified estimates)
  const dairyCount = economy.buildings.filter(b => b === 'dairyPlant').length
  const dairyIncome = dairyCount * 50000 // Rough estimate: $50k per dairy plant per year

  const farmlandHectares = economy.parcels
    .filter(p => p.type === 'farmland' || p.type === 'pasture')
    .reduce((sum, p) => sum + p.hectares, 0)
  const landIncome = farmlandHectares * 500 // Rough estimate: $500/hectare per year

  // Calculate expenses
  const buildingMaintenance = economy.buildings.length * 1000

  const totalIncome = dairyIncome + landIncome
  const totalExpenses = buildingMaintenance
  const netIncome = totalIncome - totalExpenses

  return (
    <div className="bg-white shadow p-4 rounded mb-4">
      <h2 className="text-xl font-bold mb-4">Balance Sheet ({colony.year})</h2>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-2xl font-bold">Treasury</span>
          <span className={`text-2xl font-bold ${colony.treasury >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${colony.treasury.toLocaleString()}
          </span>
        </div>
        <div className={`text-sm ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          Net Income: ${netIncome >= 0 ? '+' : ''}{netIncome.toLocaleString()}/year
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Income */}
        <div>
          <h3 className="font-semibold text-green-700 mb-2">Income</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Dairy Plants ({dairyCount})</span>
              <span>${dairyIncome.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Farmland ({economy.parcels.filter(p => p.type === 'farmland').length} parcels)</span>
              <span>${landIncome.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold border-t pt-1">
              <span>Total Income</span>
              <span>${totalIncome.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Expenses */}
        <div>
          <h3 className="font-semibold text-red-700 mb-2">Expenses</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Building Maintenance ({economy.buildings.length})</span>
              <span>${buildingMaintenance.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold border-t pt-1">
              <span>Total Expenses</span>
              <span>${totalExpenses.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Warnings */}
      {colony.treasury < 5000 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800 font-bold">⚠ Low Treasury Warning</p>
          <p className="text-sm text-red-700">Consider selling land or reducing expenses.</p>
        </div>
      )}

      {netIncome < 0 && (
        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-yellow-800 font-bold">⚠ Negative Cash Flow</p>
          <p className="text-sm text-yellow-700">Income is less than expenses. Build dairy plants or sell unused land.</p>
        </div>
      )}
    </div>
  )
}