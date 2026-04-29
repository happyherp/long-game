import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GameOverScreen } from '../../src/components/GameOverScreen'
import { useGameStore } from '../../src/store/gameStore'
import { makeFederation } from './testUtils'

vi.mock('../../src/store/gameStore')
const mockStore = vi.mocked(useGameStore)

beforeEach(() => { vi.clearAllMocks() })

describe('GameOverScreen', () => {
  it('renders nothing when there is no game over reason', () => {
    const federation = makeFederation()
    mockStore.mockReturnValue({ federation, selectedColonyId: federation.colonies[0].id, gameOverReason: null, newGame: vi.fn() } as any)
    const { container } = render(<GameOverScreen />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when federation is null', () => {
    mockStore.mockReturnValue({ federation: null, selectedColonyId: null, gameOverReason: 'collapse', newGame: vi.fn() } as any)
    const { container } = render(<GameOverScreen />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows collapse message', () => {
    const federation = makeFederation()
    mockStore.mockReturnValue({ federation, selectedColonyId: federation.colonies[0].id, gameOverReason: 'collapse', newGame: vi.fn() } as any)
    render(<GameOverScreen />)
    expect(screen.getByText('Game Over')).toBeInTheDocument()
    expect(screen.getByText(/Population Collapse/)).toBeInTheDocument()
  })

  it('shows financial ruin message', () => {
    const federation = makeFederation()
    mockStore.mockReturnValue({ federation, selectedColonyId: federation.colonies[0].id, gameOverReason: 'loss', newGame: vi.fn() } as any)
    render(<GameOverScreen />)
    expect(screen.getByText(/Financial Ruin/)).toBeInTheDocument()
  })

  it('shows simulation complete message', () => {
    const federation = makeFederation()
    mockStore.mockReturnValue({ federation, selectedColonyId: federation.colonies[0].id, gameOverReason: 'year', newGame: vi.fn() } as any)
    render(<GameOverScreen />)
    expect(screen.getByText(/Simulation Complete/)).toBeInTheDocument()
  })

  it('displays final statistics', () => {
    const federation = makeFederation()
    federation.colonies[0].year = 2100
    federation.colonies[0].treasury = 99000
    mockStore.mockReturnValue({ federation, selectedColonyId: federation.colonies[0].id, gameOverReason: 'year', newGame: vi.fn() } as any)
    render(<GameOverScreen />)
    expect(screen.getByText('2100')).toBeInTheDocument()
    expect(screen.getByText('$99,000')).toBeInTheDocument()
  })

  it('calls newGame when New Game button is clicked', () => {
    const newGame = vi.fn()
    const federation = makeFederation()
    mockStore.mockReturnValue({ federation, selectedColonyId: federation.colonies[0].id, gameOverReason: 'collapse', newGame } as any)
    render(<GameOverScreen />)
    fireEvent.click(screen.getByRole('button', { name: 'New Game' }))
    expect(newGame).toHaveBeenCalledOnce()
  })
})