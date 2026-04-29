import { useGameStore } from '../store/gameStore'

export function DoctrineSheet() {
  const { colony, setDoctrine } = useGameStore()

  if (!colony) return null

  const doctrine = colony.doctrine

  return (
    <div className="bg-white shadow p-4 rounded mb-4">
      <h2 className="text-xl font-bold mb-4">The Fence Around the Community</h2>

      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b">
          <div>
            <p className="font-bold">Smartphones</p>
            <p className="text-sm text-gray-600">
              We protect the household from outside coordination.
            </p>
          </div>
          <button
            onClick={() =>
              setDoctrine({ ...doctrine, smartphones: !doctrine.smartphones })
            }
            className={`px-3 py-1 rounded font-bold ${
              doctrine.smartphones
                ? 'bg-red-500 text-white'
                : 'bg-green-500 text-white'
            }`}
          >
            {doctrine.smartphones ? 'Yes' : 'No'}
          </button>
        </div>

        <div className="flex items-center justify-between pb-3 border-b">
          <div>
            <p className="font-bold">English Schooling</p>
            <p className="text-sm text-gray-600">
              We protect the children&apos;s identity from the outside language.
            </p>
          </div>
          <button
            onClick={() =>
              setDoctrine({ ...doctrine, englishSchool: !doctrine.englishSchool })
            }
            className={`px-3 py-1 rounded font-bold ${
              doctrine.englishSchool
                ? 'bg-red-500 text-white'
                : 'bg-green-500 text-white'
            }`}
          >
            {doctrine.englishSchool ? 'Yes' : 'No'}
          </button>
        </div>

        <div className="flex items-center justify-between pb-3 border-b">
          <div>
            <p className="font-bold">Plain Dress</p>
            <p className="text-sm text-gray-600">
              We mark ourselves visibly as a people apart.
            </p>
          </div>
          <button
            onClick={() =>
              setDoctrine({ ...doctrine, plainDress: !doctrine.plainDress })
            }
            className={`px-3 py-1 rounded font-bold ${
              doctrine.plainDress
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            {doctrine.plainDress ? 'Yes' : 'No'}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold">Age of Marriage</p>
            <p className="text-sm text-gray-600">
              Earlier marriage compounds generations faster.
            </p>
          </div>
          <select
            value={doctrine.marriageAge}
            onChange={(e) =>
              setDoctrine({ ...doctrine, marriageAge: parseInt(e.target.value) })
            }
            className="px-3 py-1 border rounded"
          >
            {[17, 18, 19, 20, 21, 22].map((age) => (
              <option key={age} value={age}>
                {age}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
