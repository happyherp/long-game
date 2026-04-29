import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PopulationChart } from '../../src/components/PopulationChart'
import { useGameStore } from '../../src/store/gameStore'
import { makeColony } from './testUtils'

vi.mock('../../src/store/gameStore')
const mockStore = vi.mocked(useGameStore)

beforeEach(() => vi.clearAllMocks())

describe('PopulationChart', () => {
  it('renders nothing when colony is null', () => {
    mockStore.mockReturnValue({ colony: null } as any)
    const { container } = render(<PopulationChart />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the chart container and heading', () => {
    mockStore.mockReturnValue({ colony: makeColony() } as any)
    render(<PopulationChart />)
    expect(screen.getByText('Population over Time')).toBeInTheDocument()
  })

  it('renders an SVG element', () => {
    mockStore.mockReturnValue({ colony: makeColony() } as any)
    const { container } = render(<PopulationChart />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders with history data without throwing', () => {
    const history = [
      { year: 1960, population: 50, tfr: 7, cohesionAvg: 200, treasury: 10000, births: 5, deaths: 1, departures: 0 },
      { year: 1961, population: 54, tfr: 7, cohesionAvg: 200, treasury: 11000, births: 6, deaths: 1, departures: 1 },
    ]
    mockStore.mockReturnValue({ colony: makeColony({ history }) } as any)
    expect(() => render(<PopulationChart />)).not.toThrow()
  })
})
