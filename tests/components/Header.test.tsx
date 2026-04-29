import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Header } from '../../src/components/Header'
import { useGameStore } from '../../src/store/gameStore'
import { makeColony } from './testUtils'

vi.mock('../../src/store/gameStore')
const mockStore = vi.mocked(useGameStore)

beforeEach(() => { vi.clearAllMocks() })

describe('Header', () => {
  it('renders nothing when colony is null', () => {
    mockStore.mockReturnValue({ colony: null, tick: vi.fn(), gameOver: false } as any)
    const { container } = render(<Header />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders colony name and year', () => {
    mockStore.mockReturnValue({ colony: makeColony(), tick: vi.fn(), gameOver: false } as any)
    render(<Header />)
    expect(screen.getByText('Cayo')).toBeInTheDocument()
    expect(screen.getByText('Year 1975')).toBeInTheDocument()
  })

  it('shows Next Year button when game is not over', () => {
    mockStore.mockReturnValue({ colony: makeColony(), tick: vi.fn(), gameOver: false } as any)
    render(<Header />)
    expect(screen.getByRole('button', { name: 'Next Year' })).toBeEnabled()
  })

  it('shows disabled Game Over button when game is over', () => {
    mockStore.mockReturnValue({ colony: makeColony(), tick: vi.fn(), gameOver: true } as any)
    render(<Header />)
    expect(screen.getByRole('button', { name: 'Game Over' })).toBeDisabled()
  })

  it('calls tick when Next Year is clicked', () => {
    const tick = vi.fn()
    mockStore.mockReturnValue({ colony: makeColony(), tick, gameOver: false } as any)
    render(<Header />)
    fireEvent.click(screen.getByRole('button', { name: 'Next Year' }))
    expect(tick).toHaveBeenCalledOnce()
  })
})
