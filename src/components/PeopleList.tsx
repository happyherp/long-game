import { useState, useMemo } from 'react'
import { useGameStore } from '../store/gameStore'
import { getFirstName } from '../engine/names'
import { PersonDetail } from './PersonDetail'

type SortKey = 'name' | 'age' | 'cohesion' | 'married'
type SortDir = 'asc' | 'desc'

export interface PersonRow {
  index: number
  firstName: string
  surname: string
  sex: number
  age: number
  cohesion: number
  married: boolean
}

const PAGE_SIZE = 50

export function PeopleList() {
  const colony = useGameStore((s) => s.colony)

  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all')
  const [marriedFilter, setMarriedFilter] = useState<'all' | 'yes' | 'no'>('all')
  const [minAge, setMinAge] = useState('')
  const [maxAge, setMaxAge] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [limit, setLimit] = useState(PAGE_SIZE)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const people = useMemo<PersonRow[]>(() => {
    if (!colony) return []
    const { population, lineages } = colony
    const rows: PersonRow[] = []
    for (let i = 0; i < population.size; i++) {
      const sex = population.sex[i]
      const surname = lineages.surnames[population.paternalLineage[i]] ?? '?'
      rows.push({
        index: i,
        firstName: getFirstName(sex, population.firstNameId[i]),
        surname,
        sex,
        age: population.age[i],
        cohesion: population.cohesion[i],
        married: population.married[i] === 1,
      })
    }
    return rows
  }, [colony])

  const filtered = useMemo(() => {
    let result = people
    if (genderFilter === 'male') result = result.filter((p) => p.sex === 1)
    if (genderFilter === 'female') result = result.filter((p) => p.sex === 0)
    if (marriedFilter === 'yes') result = result.filter((p) => p.married)
    if (marriedFilter === 'no') result = result.filter((p) => !p.married)
    const min = minAge !== '' ? parseInt(minAge, 10) : null
    const max = maxAge !== '' ? parseInt(maxAge, 10) : null
    if (min !== null && !isNaN(min)) result = result.filter((p) => p.age >= min)
    if (max !== null && !isNaN(max)) result = result.filter((p) => p.age <= max)
    return result
  }, [people, genderFilter, marriedFilter, minAge, maxAge])

  const sorted = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      if (sortKey === 'name') return `${a.surname} ${a.firstName}`.localeCompare(`${b.surname} ${b.firstName}`) * dir
      if (sortKey === 'age') return (a.age - b.age) * dir
      if (sortKey === 'cohesion') return (a.cohesion - b.cohesion) * dir
      if (sortKey === 'married') return (Number(a.married) - Number(b.married)) * dir
      return 0
    })
  }, [filtered, sortKey, sortDir])

  const visible = sorted.slice(0, limit)
  const hasMore = sorted.length > limit

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setLimit(PAGE_SIZE)
  }

  function resetFilters() {
    setGenderFilter('all')
    setMarriedFilter('all')
    setMinAge('')
    setMaxAge('')
    setLimit(PAGE_SIZE)
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span className="text-gray-300 ml-1">↕</span>
    return <span className="text-blue-500 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  function cohesionLabel(c: number) {
    if (c >= 170) return 'high'
    if (c >= 85) return 'med'
    return 'low'
  }

  function cohesionColor(c: number) {
    if (c >= 170) return 'text-green-700'
    if (c >= 85) return 'text-yellow-700'
    return 'text-red-700'
  }

  const selectedPerson = selectedIndex !== null ? people.find((p) => p.index === selectedIndex) ?? null : null

  if (!colony) return null

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4 text-sm items-center">
        <label className="flex items-center gap-1">
          Gender:
          <select
            value={genderFilter}
            onChange={(e) => { setGenderFilter(e.target.value as typeof genderFilter); setLimit(PAGE_SIZE) }}
            className="border rounded px-1 py-0.5"
          >
            <option value="all">All</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </label>

        <label className="flex items-center gap-1">
          Married:
          <select
            value={marriedFilter}
            onChange={(e) => { setMarriedFilter(e.target.value as typeof marriedFilter); setLimit(PAGE_SIZE) }}
            className="border rounded px-1 py-0.5"
          >
            <option value="all">All</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>

        <label className="flex items-center gap-1">
          Age:
          <input
            type="number"
            value={minAge}
            onChange={(e) => { setMinAge(e.target.value); setLimit(PAGE_SIZE) }}
            placeholder="min"
            className="border rounded px-1 py-0.5 w-14"
            min={0}
          />
          <span className="text-gray-400">–</span>
          <input
            type="number"
            value={maxAge}
            onChange={(e) => { setMaxAge(e.target.value); setLimit(PAGE_SIZE) }}
            placeholder="max"
            className="border rounded px-1 py-0.5 w-14"
            min={0}
          />
        </label>

        <button onClick={resetFilters} className="text-xs text-gray-400 hover:text-gray-600 underline">
          Reset
        </button>

        <span className="ml-auto text-gray-500 text-xs">
          {sorted.length} / {people.length} people
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              <th className="px-3 py-2 cursor-pointer select-none whitespace-nowrap" onClick={() => toggleSort('name')}>
                Name <SortIcon col="name" />
              </th>
              <th className="px-3 py-2">Sex</th>
              <th className="px-3 py-2 cursor-pointer select-none" onClick={() => toggleSort('age')}>
                Age <SortIcon col="age" />
              </th>
              <th className="px-3 py-2 cursor-pointer select-none" onClick={() => toggleSort('cohesion')}>
                Cohesion <SortIcon col="cohesion" />
              </th>
              <th className="px-3 py-2 cursor-pointer select-none" onClick={() => toggleSort('married')}>
                Married <SortIcon col="married" />
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-gray-400">
                  No people match the current filters.
                </td>
              </tr>
            )}
            {visible.map((p) => (
              <tr
                key={p.index}
                className="border-b hover:bg-blue-50 cursor-pointer"
                onClick={() => setSelectedIndex(p.index)}
              >
                <td className="px-3 py-1.5 font-medium text-blue-700 hover:underline">
                  {p.firstName} {p.surname}
                </td>
                <td className="px-3 py-1.5 text-gray-600">{p.sex === 1 ? 'M' : 'F'}</td>
                <td className="px-3 py-1.5">{p.age}</td>
                <td className={`px-3 py-1.5 ${cohesionColor(p.cohesion)}`}>
                  {cohesionLabel(p.cohesion)} ({p.cohesion})
                </td>
                <td className="px-3 py-1.5">{p.married ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="mt-2 text-center">
          <button
            onClick={() => setLimit((l) => l + PAGE_SIZE)}
            className="text-sm text-blue-600 hover:underline"
          >
            Show more ({sorted.length - limit} remaining)
          </button>
        </div>
      )}

      {selectedPerson && (
        <PersonDetail
          person={selectedPerson}
          colony={colony}
          onClose={() => setSelectedIndex(null)}
          onSelectPerson={(idx) => setSelectedIndex(idx)}
        />
      )}
    </div>
  )
}
