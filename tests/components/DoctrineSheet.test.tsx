import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { DoctrineSheet } from '../../src/components/DoctrineSheet'
import { useGameStore } from '../../src/store/gameStore'
import { makeColony, makeDoctrine } from './testUtils'
import { Federation } from '../../src/engine/types'

vi.mock('../../src/store/gameStore')
const mockStore = vi.mocked(useGameStore)

beforeEach(() => { vi.clearAllMocks() })

function makeFederation(doctrineOverrides = {}) {
  const colony = makeColony({ doctrine: makeDoctrine(doctrineOverrides) })
  return {
    year: 1975,
    colonies: [colony],
    modernWest: { willingness: 1.0 },
    pendingSchisms: [],
    history: [],
  } as Federation
}

describe('DoctrineSheet', () => {
  it('renders nothing when federation is null', () => {
    mockStore.mockReturnValue({ federation: null, selectedColonyId: null } as any)
    const { container } = render(<DoctrineSheet />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when selectedColonyId is null', () => {
    const federation = makeFederation()
    mockStore.mockReturnValue({ federation, selectedColonyId: null } as any)
    const { container } = render(<DoctrineSheet />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders doctrine controls', () => {
    const federation = makeFederation()
    mockStore.mockReturnValue({
      federation,
      selectedColonyId: federation.colonies[0].id,
      setDoctrineForColony: vi.fn(),
    } as any)
    render(<DoctrineSheet />)
    expect(screen.getByText('Smartphones')).toBeInTheDocument()
    expect(screen.getByText('English Schooling')).toBeInTheDocument()
    expect(screen.getByText('Plain Dress')).toBeInTheDocument()
    expect(screen.getByText('Marriage Age')).toBeInTheDocument()
  })

  it('shows No for smartphones when off', () => {
    const federation = makeFederation({ smartphones: false })
    mockStore.mockReturnValue({
      federation,
      selectedColonyId: federation.colonies[0].id,
      setDoctrineForColony: vi.fn(),
    } as any)
    render(<DoctrineSheet />)
    // Find the Smartphones section, then get the button within it
    const smartphoneText = screen.getByText('Smartphones')
    const section = smartphoneText.closest('div')
    const button = within(section!).getByRole('button')
    expect(button).toHaveTextContent('No')
  })

  it('shows Yes for smartphones when on', () => {
    const federation = makeFederation({ smartphones: true })
    mockStore.mockReturnValue({
      federation,
      selectedColonyId: federation.colonies[0].id,
      setDoctrineForColony: vi.fn(),
    } as any)
    render(<DoctrineSheet />)
    const smartphoneText = screen.getByText('Smartphones')
    const section = smartphoneText.closest('div')
    const button = within(section!).getByRole('button')
    expect(button).toHaveTextContent('Yes')
  })

  it('calls setDoctrineForColony with toggled smartphones when clicked', () => {
    const setDoctrineForColony = vi.fn()
    const federation = makeFederation({ smartphones: false })
    mockStore.mockReturnValue({
      federation,
      selectedColonyId: federation.colonies[0].id,
      setDoctrineForColony,
    } as any)
    render(<DoctrineSheet />)
    const smartphoneText = screen.getByText('Smartphones')
    const section = smartphoneText.closest('div')
    const button = within(section!).getByRole('button')
    fireEvent.click(button)
    expect(setDoctrineForColony).toHaveBeenCalledWith(
      federation.colonies[0].id,
      { smartphones: true }
    )
  })

  it('calls setDoctrineForColony with new marriageAge when select changes', () => {
    const setDoctrineForColony = vi.fn()
    const federation = makeFederation({ marriageAge: 19 })
    mockStore.mockReturnValue({
      federation,
      selectedColonyId: federation.colonies[0].id,
      setDoctrineForColony,
    } as any)
    render(<DoctrineSheet />)
    // Find all selects and pick the one in the Marriage section (should be the first select)
    const selects = screen.getAllByRole('combobox')
    // The Marriage Age select should be the first one (after Baptism Age)
    // Actually, let's find it by looking for the select that has value 19
    const marriageAgeSelect = selects.find(s => (s as HTMLSelectElement).value === '19')
    expect(marriageAgeSelect).toBeDefined()
    fireEvent.change(marriageAgeSelect!, { target: { value: '21' } })
    expect(setDoctrineForColony).toHaveBeenCalledWith(
      federation.colonies[0].id,
      { marriageAge: 21 }
    )
  })
})