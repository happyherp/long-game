import { Colony } from '../engine/types'
import { getFirstName } from '../engine/names'

interface PersonRow {
  index: number
  firstName: string
  surname: string
  sex: number
  age: number
  cohesion: number
  married: boolean
}

interface Props {
  person: PersonRow
  colony: Colony
  onClose: () => void
  onSelectPerson: (index: number) => void
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

export function PersonDetail({ person, colony, onClose, onSelectPerson }: Props) {
  const { population, lineages } = colony

  const paternalSurname = lineages.surnames[population.paternalLineage[person.index]] ?? '?'
  const maternalSurname = lineages.surnames[population.maternalLineage[person.index]] ?? '?'

  const partnerId = population.partnerId[person.index]
  const hasSpouse = person.married && partnerId >= 0 && partnerId < population.size
  let spouse: { index: number; name: string } | null = null
  if (hasSpouse) {
    const spouseSex = population.sex[partnerId]
    const spouseFirstName = getFirstName(spouseSex, population.firstNameId[partnerId])
    const spouseSurname = lineages.surnames[population.paternalLineage[partnerId]] ?? '?'
    spouse = { index: partnerId, name: `${spouseFirstName} ${spouseSurname}` }
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
            {person.firstName} {person.surname}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            ×
          </button>
        </div>

        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">Gender</dt>
            <dd>{person.sex === 1 ? 'Male' : 'Female'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Age</dt>
            <dd>{person.age}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Cohesion</dt>
            <dd className={cohesionColor(person.cohesion)}>
              {cohesionLabel(person.cohesion)} ({person.cohesion})
            </dd>
          </div>

          <div className="border-t pt-2 mt-2">
            <dt className="text-gray-500 mb-1">Spouse</dt>
            <dd>
              {spouse ? (
                <button
                  className="text-blue-600 hover:underline"
                  onClick={() => onSelectPerson(spouse!.index)}
                >
                  {spouse.name}
                </button>
              ) : (
                <span className="text-gray-400">Unmarried</span>
              )}
            </dd>
          </div>

          <div className="border-t pt-2 mt-2">
            <dt className="text-gray-500 mb-1">Lineage</dt>
            <dd className="space-y-0.5">
              <div>
                <span className="text-gray-400">Paternal: </span>
                <span>{paternalSurname} family</span>
              </div>
              <div>
                <span className="text-gray-400">Maternal: </span>
                <span>{maternalSurname} family</span>
              </div>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
