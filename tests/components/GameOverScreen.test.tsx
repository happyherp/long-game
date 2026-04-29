import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GameOverScreen } from '../../src/components/GameOverScreen'
import { useGameStore } from '../../src/store/gameStore'
import { makeColony } from './testUtils'

vi.mock('../../src/store/gameStore')
const mockStore = vi.mocked(useGameStore)

beforeEach(() => { vi.clearAllMocks() })

describe('GameOverScreen', () => {
  it('renders nothing when there is no game over reason', () => {
    mockStore.mockReturnValue({ colony: makeColony(), gameOverReason: null, newGame: vi.fn() } as any)
    const { container } = render(<GameOverScreen />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when colony is null', () => {
    mockStore.mockReturnValue({ colony: null, gameOverReason: 'collapse', newGame: vi.fn() } as any)
    const { container } = render(<GameOverScreen />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows collapse message', () => {
    mockStore.mockReturnValue({ colony: makeColony(), gameOverReason: 'collapse', newGame: vi.fn() } as any)
    render(<GameOverScreen />)
    expect(screen.getByText('Game Over')).toBeInTheDocument()
    expect(screen.getByText(/Population Collapse/)).toBeInTheDocument()
  })

  it('shows financial ruin message', () => {
    mockStore.mockReturnValue({ colony: makeColony(), gameOverReason: 'loss', newGame: vi.fn() } as any)
    render(<GameOverScreen />)
    expect(screen.getByText(/Financial Ruin/)).toBeInTheDocument()
  })

  it('shows simulation complete message', () => {
    mockStore.mockReturnValue({ colony: makeColony(), gameOverReason: 'year', newGame: vi.fn() } as any)
    render(<GameOverScreen />)
    expect(screen.getByText(/Simulation Complete/)).toBeInTheDocument()
  })

  it('displays final statistics', () => {
    mockStore.mockReturnValue({
      colony: makeColony({ year: 2100, treasury: 99000 }),
      gameOverReason: 'year',
      newGame: vi.fn(),
    } as any)
    render(<GameOverScreen />)
    expect(screen.getByText('2100')).toBeInTheDocument()
    expect(screen.getByText('$99,000')).toBeInTheDocument()
  })

  it('calls newGame when New Game button is clicked', () => {
    const newGame = vi.fn()
    mockStore.mockReturnValue({ colony: makeColony(), gameOverReason: 'collapse', newGame } as any)
    render(<GameOverScreen />)
    fireEvent.click(screen.getByRole('button', { name: 'New Game' }))
    expect(newGame).toHaveBeenCalledOnce()
  })
})
