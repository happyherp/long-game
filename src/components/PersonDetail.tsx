import { Colony } from '../engine/types'
import { getSlot } from '../engine/population'
import { getFirstName } from '../engine/names'

interface Props {
  stableId: number
  colony: Colony
  onClose: () => void
  onSelectPerson: (stableId: number) => void
}

function cohesionLabel(c: number) {
  if (c >= 170) return 'high'
  if (c >= 85) return 'medium'
  return 'low'
}

function cohesionColor(c: number) {
  if (c >= 170) return 'text-green-700'
  if (c >= 85) return 'text-yellow-700'
  return 'text-red-700'
}

interface ResolvedPerson {
  stableId: number
  name: string
  alive: true
}

function resolvePerson(colony: Colony, stableId: number): ResolvedPerson | null {
  if (stableId < 0) return null
  const slot = getSlot(colony.population, stableId)
  if (slot < 0) return null
  const { population, lineages } = colony
  const sex = population.sex[slot]
  const firstName = getFirstName(sex, population.firstNameId[slot])
  const surname = lineages.surnames[population.paternalLineage[slot]] ?? '?'
  return { stableId, name: `${firstName} ${surname}`, alive: true }
}

export function PersonDetail({ stableId, colony, onClose, onSelectPerson }: Props) {
  const slot = getSlot(colony.population, stableId)
  if (slot < 0) return null  // person no longer in colony

  const { population, lineages } = colony

  const sex = population.sex[slot]
  const age = population.age[slot]
  const cohesion = population.cohesion[slot]
  const married = population.married[slot] === 1
  const firstName = getFirstName(sex, population.firstNameId[slot])
  const surname = lineages.surnames[population.paternalLineage[slot]] ?? '?'

  const paternalSurname = lineages.surnames[population.paternalLineage[slot]] ?? '?'
  const maternalSurname = lineages.surnames[population.maternalLineage[slot]] ?? '?'

  const spouse = resolvePerson(colony, population.partnerId[slot])
  const father = resolvePerson(colony, population.fatherId[slot])
  const mother = resolvePerson(colony, population.motherId[slot])

  const fatherId = population.fatherId[slot]
  const motherId = population.motherId[slot]
  const partnerId = population.partnerId[slot]

  function PersonLink({ resolved, rawId }: { resolved: ResolvedPerson | null; rawId: number }) {
    if (rawId < 0) return <span className="text-gray-400">Unknown</span>
    if (!resolved) return <span className="text-gray-400">Deceased / departed</span>
    return (
      <button
        className="text-blue-600 hover:underline"
        onClick={() => onSelectPerson(resolved.stableId)}
      >
        {resolved.name}
      </button>
    )
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-80 max-w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-bold">
            {firstName} {surname}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            ×
          </button>
        </div>

        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">Gender</dt>
            <dd>{sex === 1 ? 'Male' : 'Female'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Age</dt>
            <dd>{age}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Cohesion</dt>
            <dd className={cohesionColor(cohesion)}>
              {cohesionLabel(cohesion)} ({cohesion})
            </dd>
          </div>

          <div className="border-t pt-2 mt-2">
            <dt className="text-gray-500 mb-1">Spouse</dt>
            <dd>
              {married
                ? <PersonLink resolved={spouse} rawId={partnerId} />
                : <span className="text-gray-400">Unmarried</span>}
            </dd>
          </div>

          <div className="border-t pt-2 mt-2">
            <dt className="text-gray-500 mb-1">Parents</dt>
            <dd className="space-y-0.5">
              <div>
                <span className="text-gray-400">Father: </span>
                <PersonLink resolved={father} rawId={fatherId} />
              </div>
              <div>
                <span className="text-gray-400">Mother: </span>
                <PersonLink resolved={mother} rawId={motherId} />
              </div>
            </dd>
          </div>

          <div className="border-t pt-2 mt-2">
            <dt className="text-gray-500 mb-1">Lineage</dt>
            <dd className="space-y-0.5 text-gray-600">
              <div>Paternal: {paternalSurname} family</div>
              <div>Maternal: {maternalSurname} family</div>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
