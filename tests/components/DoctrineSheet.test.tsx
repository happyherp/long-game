import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DoctrineSheet } from '../../src/components/DoctrineSheet'
import { useGameStore } from '../../src/store/gameStore'
import { makeColony, makeDoctrine } from './testUtils'

vi.mock('../../src/store/gameStore')
const mockStore = vi.mocked(useGameStore)

beforeEach(() => vi.clearAllMocks())

describe('DoctrineSheet', () => {
  it('renders nothing when colony is null', () => {
    mockStore.mockReturnValue({ colony: null, setDoctrine: vi.fn() } as any)
    const { container } = render(<DoctrineSheet />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders doctrine controls', () => {
    mockStore.mockReturnValue({ colony: makeColony(), setDoctrine: vi.fn() } as any)
    render(<DoctrineSheet />)
    expect(screen.getByText('Smartphones')).toBeInTheDocument()
    expect(screen.getByText('English Schooling')).toBeInTheDocument()
    expect(screen.getByText('Plain Dress')).toBeInTheDocument()
    expect(screen.getByText('Age of Marriage')).toBeInTheDocument()
  })

  it('shows No for smartphones when off', () => {
    mockStore.mockReturnValue({
      colony: makeColony({ doctrine: makeDoctrine({ smartphones: false }) }),
      setDoctrine: vi.fn(),
    } as any)
    render(<DoctrineSheet />)
    expect(screen.getAllByRole('button')[0]).toHaveTextContent('No')
  })

  it('shows Yes for smartphones when on', () => {
    mockStore.mockReturnValue({
      colony: makeColony({ doctrine: makeDoctrine({ smartphones: true }) }),
      setDoctrine: vi.fn(),
    } as any)
    render(<DoctrineSheet />)
    expect(screen.getAllByRole('button')[0]).toHaveTextContent('Yes')
  })

  it('calls setDoctrine with toggled smartphones when clicked', () => {
    const setDoctrine = vi.fn()
    const doctrine = makeDoctrine({ smartphones: false })
    mockStore.mockReturnValue({ colony: makeColony({ doctrine }), setDoctrine } as any)
    render(<DoctrineSheet />)
    fireEvent.click(screen.getAllByRole('button')[0])
    expect(setDoctrine).toHaveBeenCalledWith({ ...doctrine, smartphones: true })
  })

  it('calls setDoctrine with new marriageAge when select changes', () => {
    const setDoctrine = vi.fn()
    const doctrine = makeDoctrine({ marriageAge: 19 })
    mockStore.mockReturnValue({ colony: makeColony({ doctrine }), setDoctrine } as any)
    render(<DoctrineSheet />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '21' } })
    expect(setDoctrine).toHaveBeenCalledWith({ ...doctrine, marriageAge: 21 })
  })
})
