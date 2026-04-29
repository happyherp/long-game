import { describe, it, expect } from 'vitest'
import {
  FOUNDER_SURNAMES,
  MALE_FIRST_NAMES,
  FEMALE_FIRST_NAMES,
  getFirstName,
  getSurname,
  getDisplayName,
} from '../../src/engine/names'

describe('Names', () => {
  it('has 30 founder surnames', () => {
    expect(FOUNDER_SURNAMES).toHaveLength(30)
  })

  it('has ~50 male first names', () => {
    expect(MALE_FIRST_NAMES.length).toBeGreaterThan(40)
  })

  it('has ~50 female first names', () => {
    expect(FEMALE_FIRST_NAMES.length).toBeGreaterThan(40)
  })

  it('getFirstName returns female name for sex=0', () => {
    const name = getFirstName(0, 0)
    expect(FEMALE_FIRST_NAMES).toContain(name)
  })

  it('getFirstName returns male name for sex=1', () => {
    const name = getFirstName(1, 0)
    expect(MALE_FIRST_NAMES).toContain(name)
  })

  it('getFirstName wraps around with modulo', () => {
    const nameA = getFirstName(0, 0)
    const nameB = getFirstName(0, FEMALE_FIRST_NAMES.length)
    expect(nameA).toBe(nameB)
  })

  it('getSurname returns a valid surname', () => {
    const surname = getSurname(0)
    expect(FOUNDER_SURNAMES).toContain(surname)
  })

  it('getSurname wraps around with modulo', () => {
    const surnameA = getSurname(0)
    const surnameB = getSurname(FOUNDER_SURNAMES.length)
    expect(surnameA).toBe(surnameB)
  })

  it('getDisplayName combines first and last name', () => {
    const display = getDisplayName('Helena', 'Penner')
    expect(display).toBe('Helena Penner')
  })
})
