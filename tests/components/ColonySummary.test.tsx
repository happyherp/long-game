import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ColonySummary } from '../../src/components/ColonySummary'
import { useGameStore } from '../../src/store/gameStore'
import { makeColony } from './testUtils'
import { Federation } from '../../src/engine/types'

vi.mock('../../src/store/gameStore')
const mockStore = vi.mocked(useGameStore)

beforeEach(() => { vi.clearAllMocks() })

function makeFederation(overrides = {}) {
  const colony = makeColony(overrides)
  return {
    year: 1975,
    colonies: [colony],
    modernWest: { willingness: 1.0 },
    pendingSchisms: [],
    history: [],
  } as Federation
}

describe('ColonySummary', () => {
  it('renders nothing when federation is null', () => {
    mockStore.mockReturnValue({ federation: null, selectedColonyId: null } as any)
    const { container } = render(<ColonySummary />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when selectedColonyId is null', () => {
    const federation = makeFederation()
    mockStore.mockReturnValue({ federation, selectedColonyId: null } as any)
    const { container } = render(<ColonySummary />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders colony summary', () => {
    const federation = makeFederation()
    mockStore.mockReturnValue({
      federation,
      selectedColonyId: federation.colonies[0].id,
    } as any)
    render(<ColonySummary />)
    expect(screen.getByText('Colony Summary')).toBeInTheDocument()
    expect(screen.getByText('Colony Population')).toBeInTheDocument()
    expect(screen.getByText('Federation Total')).toBeInTheDocument()
  })

  it('renders treasury value', () => {
    const federation = makeFederation({ treasury: 75000 })
    mockStore.mockReturnValue({
      federation,
      selectedColonyId: federation.colonies[0].id,
    } as any)
    render(<ColonySummary />)
    // Should find 2 elements: Colony Treasury and Federation Treasury
    const treasuryElements = screen.getAllByText('$75,000')
    expect(treasuryElements).toHaveLength(2)
  })

  it('does not show last year section when history is empty', () => {
    const federation = makeFederation({ history: [] })
    mockStore.mockReturnValue({
      federation,
      selectedColonyId: federation.colonies[0].id,
    } as any)
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
    const federation = makeFederation({ history })
    mockStore.mockReturnValue({
      federation,
      selectedColonyId: federation.colonies[0].id,
    } as any)
    render(<ColonySummary />)
    expect(screen.getByText('Last Year')).toBeInTheDocument()
    expect(screen.getByText('Births')).toBeInTheDocument()
  })
})