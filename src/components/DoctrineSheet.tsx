import { useGameStore } from '../store/gameStore'
import { Doctrine } from '../engine/types'

export function DoctrineSheet() {
  const { federation, selectedColonyId, setDoctrineForColony, grantSchism, refuseSchism } = useGameStore()

  if (!federation || selectedColonyId === null) return null

  const colony = federation.colonies.find(c => c.id === selectedColonyId)
  if (!colony) return null

  const doctrine = colony.doctrine
  const pendingSchism = federation.pendingSchisms.find(s => s.parentColonyId === selectedColonyId)

  const handleDoctrineChange = (changes: Partial<Doctrine>) => {
    setDoctrineForColony(selectedColonyId, changes)
  }

  const handleMarriageDoctrineChange = (value: 'courtship' | 'lateMarriage' | 'modern') => {
    handleDoctrineChange({ marriageDoctrine: value })
  }

  return (
    <div className="bg-white shadow p-4 rounded mb-4">
      <h2 className="text-xl font-bold mb-4">The Fence Around the Community</h2>

      {/* Marriage Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Marriage</h3>
        <div className="space-y-3">
          <MarriageDoctrineRadio
            label="Courtship"
            description="Traditional pairing with community oversight."
            value="courtship"
            currentValue={doctrine.marriageDoctrine}
            onChange={handleMarriageDoctrineChange}
          />
          <MarriageDoctrineRadio
            label="Late Marriage"
            description="Marriage delayed to 22+ for better stewardship."
            value="lateMarriage"
            currentValue={doctrine.marriageDoctrine}
            onChange={handleMarriageDoctrineChange}
          />
          <MarriageDoctrineRadio
            label="Modern Dating"
            description="Individual choice in marriage partners."
            value="modern"
            currentValue={doctrine.marriageDoctrine}
            onChange={handleMarriageDoctrineChange}
          />
          <div className="flex items-center justify-between pb-3 border-b">
            <div>
              <p className="font-bold">Marriage Age</p>
              <p className="text-sm text-gray-600">Earlier marriage compounds generations faster.</p>
            </div>
            <select
              value={doctrine.marriageAge}
              onChange={(e) => handleDoctrineChange({ marriageAge: parseInt(e.target.value) })}
              className="px-3 py-1 border rounded"
            >
              {[17, 18, 19, 20, 21, 22].map((age) => (
                <option key={age} value={age}>{age}</option>
              ))}
            </select>
          </div>
          <DoctrineToggle
            label="Marriage Outside"
            description="Allow marriage with outsiders."
            value={doctrine.marriageOutside === 'permitted'}
            onChange={(val) => handleDoctrineChange({ marriageOutside: val ? 'permitted' : 'forbidden' })}
          />
        </div>
      </div>

      {/* Religion / Visible Markers */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Religion & Appearance</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-3 border-b">
            <div>
              <p className="font-bold">Baptism Age</p>
              <p className="text-sm text-gray-600">When children are baptized.</p>
            </div>
            <select
              value={doctrine.baptismAge}
              onChange={(e) => handleDoctrineChange({ baptismAge: e.target.value as 'infant' | 'sixteen' | 'believer' })}
              className="px-3 py-1 border rounded"
            >
              <option value="infant">Infant</option>
              <option value="sixteen">16 Years</option>
              <option value="believer">Believer's Baptism</option>
            </select>
          </div>
          <DoctrineToggle
            label="Shunning"
            description="Excommunicated members are shunned by the community."
            value={doctrine.shunning}
            onChange={(val) => handleDoctrineChange({ shunning: val })}
          />
          <div className="flex items-center justify-between pb-3 border-b">
            <div>
              <p className="font-bold">Worship Language</p>
              <p className="text-sm text-gray-600">Language used in church services.</p>
            </div>
            <select
              value={doctrine.worshipLanguage}
              onChange={(e) => handleDoctrineChange({ worshipLanguage: e.target.value as 'plautdietsch' | 'highGerman' | 'english' })}
              className="px-3 py-1 border rounded"
            >
              <option value="plautdietsch">Plautdietsch</option>
              <option value="highGerman">High German</option>
              <option value="english">English</option>
            </select>
          </div>
          <DoctrineToggle
            label="Plain Dress"
            description="We mark ourselves visibly as a people apart."
            value={doctrine.plainDress}
            onChange={(val) => handleDoctrineChange({ plainDress: val })}
          />
          <DoctrineToggle
            label="Head Covering"
            description="Women wear head coverings in worship and public."
            value={doctrine.headCovering}
            onChange={(val) => handleDoctrineChange({ headCovering: val })}
          />
          <DoctrineToggle
            label="Beard for Married Men"
            description="Married men grow beards as a sign of covenant."
            value={doctrine.beardForMarried}
            onChange={(val) => handleDoctrineChange({ beardForMarried: val })}
          />
          <DoctrineToggle
            label="Sunday Observance"
            description="Strict rest on Sundays, no labor or commerce."
            value={doctrine.sundayObservance}
            onChange={(val) => handleDoctrineChange({ sundayObservance: val })}
          />
        </div>
      </div>

      {/* Education */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Education</h3>
        <div className="space-y-3">
          <DoctrineToggle
            label="English School"
            description="We protect the children's identity from the outside language."
            value={doctrine.englishSchool}
            onChange={(val) => handleDoctrineChange({ englishSchool: val })}
          />
          <div className="flex items-center justify-between pb-3 border-b">
            <div>
              <p className="font-bold">Higher Ed (Men)</p>
              <p className="text-sm text-gray-600">Post-secondary education for men.</p>
            </div>
            <select
              value={doctrine.higherEdMen}
              onChange={(e) => handleDoctrineChange({ higherEdMen: e.target.value as 'forbidden' | 'tradeOnly' | 'permitted' | 'encouraged' })}
              className="px-3 py-1 border rounded"
            >
              <option value="forbidden">Forbidden</option>
              <option value="tradeOnly">Trade Only</option>
              <option value="permitted">Permitted</option>
              <option value="encouraged">Encouraged</option>
            </select>
          </div>
          <div className="flex items-center justify-between pb-3 border-b">
            <div>
              <p className="font-bold">Higher Ed (Women)</p>
              <p className="text-sm text-gray-600">Post-secondary education for women.</p>
            </div>
            <select
              value={doctrine.higherEdWomen}
              onChange={(e) => handleDoctrineChange({ higherEdWomen: e.target.value as 'forbidden' | 'tradeOnly' | 'permitted' | 'encouraged' })}
              className="px-3 py-1 border rounded"
            >
              <option value="forbidden">Forbidden</option>
              <option value="tradeOnly">Trade Only</option>
              <option value="permitted">Permitted</option>
              <option value="encouraged">Encouraged</option>
            </select>
          </div>
        </div>
      </div>

      {/* Technology */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Technology</h3>
        <div className="space-y-3">
          <DoctrineToggle
            label="Smartphones"
            description="We protect the household from outside coordination."
            value={doctrine.smartphones}
            onChange={(val) => handleDoctrineChange({ smartphones: val })}
          />
          <DoctrineToggle
            label="Motorized Farming"
            description="Modern machinery for increased productivity."
            value={doctrine.motorizedFarming}
            onChange={(val) => handleDoctrineChange({ motorizedFarming: val })}
          />
          <DoctrineToggle
            label="Grid Electricity"
            description="Connection to the modern power grid."
            value={doctrine.gridElectricity}
            onChange={(val) => handleDoctrineChange({ gridElectricity: val })}
          />
        </div>
      </div>

      {/* Outside Contact */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Outside Contact</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-3 border-b">
            <div>
              <p className="font-bold">Outside Trade</p>
              <p className="text-sm text-gray-600">How the colony trades with the outside world.</p>
            </div>
            <select
              value={doctrine.outsideTrade}
              onChange={(e) => handleDoctrineChange({ outsideTrade: e.target.value as 'open' | 'restricted' | 'closed' })}
              className="px-3 py-1 border rounded"
            >
              <option value="open">Open</option>
              <option value="restricted">Restricted</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className="flex items-center justify-between pb-3 border-b">
            <div>
              <p className="font-bold">Inflow Policy</p>
              <p className="text-sm text-gray-600">Who may join the colony from outside.</p>
            </div>
            <select
              value={doctrine.inflowPolicy}
              onChange={(e) => handleDoctrineChange({ inflowPolicy: e.target.value as 'open' | 'vetted' | 'closed' })}
              className="px-3 py-1 border rounded"
            >
              <option value="open">Open</option>
              <option value="vetted">Vetted</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Schism Section */}
      {pendingSchism && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded">
          <h3 className="text-lg font-semibold mb-2 text-orange-800">Schism Pending</h3>
          <p className="text-sm text-orange-700 mb-3">
            A faction wants to split off as "{pendingSchism.proposedName}" with different doctrines.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const index = federation.pendingSchisms.indexOf(pendingSchism)
                if (index >= 0) grantSchism(index)
              }}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Grant Schism
            </button>
            <button
              onClick={() => {
                const index = federation.pendingSchisms.indexOf(pendingSchism)
                if (index >= 0) refuseSchism(index)
              }}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Refuse Schism
            </button>
          </div>
        </div>
      )}

      {/* Land & Buildings Section (Placeholder) */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Land & Buildings</h3>
        <p className="text-sm text-gray-600">Land and building management coming soon...</p>
      </div>
    </div>
  )
}

function DoctrineToggle({ label, description, value, onChange }: {
  label: string
  description: string
  value: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between pb-3 border-b">
      <div>
        <p className="font-bold">{label}</p>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`px-3 py-1 rounded font-bold ${
          value
            ? 'bg-red-500 text-white'
            : 'bg-green-500 text-white'
        }`}
      >
        {value ? 'Yes' : 'No'}
      </button>
    </div>
  )
}

function MarriageDoctrineRadio({ label, description, value, currentValue, onChange }: {
  label: string
  description: string
  value: 'courtship' | 'lateMarriage' | 'modern'
  currentValue: string
  onChange: (value: 'courtship' | 'lateMarriage' | 'modern') => void
}) {
  const isSelected = currentValue === value
  return (
    <div className="flex items-center justify-between pb-3 border-b">
      <div>
        <p className="font-bold">{label}</p>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <button
        onClick={() => onChange(value)}
        className={`px-3 py-1 rounded font-bold ${
          isSelected
            ? 'bg-blue-600 text-white'
            : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
        }`}
      >
        {isSelected ? '✓ Selected' : 'Select'}
      </button>
    </div>
  )
}
