import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ColonySummary } from '../../src/components/ColonySummary'
import { useGameStore } from '../../src/store/gameStore'
import { makeColony } from './testUtils'

vi.mock('../../src/store/gameStore')
const mockStore = vi.mocked(useGameStore)

beforeEach(() => { vi.clearAllMocks() })

describe('ColonySummary', () => {
  it('renders nothing when colony is null', () => {
    mockStore.mockReturnValue({ colony: null } as any)
    const { container } = render(<ColonySummary />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders population count', () => {
    mockStore.mockReturnValue({ colony: makeColony() } as any)
    render(<ColonySummary />)
    expect(screen.getByText('Colony Summary')).toBeInTheDocument()
    expect(screen.getByText('Population')).toBeInTheDocument()
    // population size = 3 from makeColony()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('renders treasury value', () => {
    mockStore.mockReturnValue({ colony: makeColony({ treasury: 75000 }) } as any)
    render(<ColonySummary />)
    expect(screen.getByText('$75,000')).toBeInTheDocument()
  })

  it('does not show last year section when history is empty', () => {
    mockStore.mockReturnValue({ colony: makeColony({ history: [] }) } as any)
    render(<ColonySummary />)
    expect(screen.queryByText('Last Year')).not.toBeInTheDocument()
  })

  it('shows last year stats when history has entries', () => {
    const history = [{
      year: 1974,
      population: 3,
      tfr: 7.0,
      cohesionAvg: 200,
      treasury: 50000,
      births: 2,
      deaths: 1,
      departures: 0,
    }]
    mockStore.mockReturnValue({ colony: makeColony({ history }) } as any)
    render(<ColonySummary />)
    expect(screen.getByText('Last Year')).toBeInTheDocument()
    expect(screen.getByText('Births')).toBeInTheDocument()
  })
})
