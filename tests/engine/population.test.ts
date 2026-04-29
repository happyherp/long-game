import { describe, it, expect } from 'vitest'
import { createStore, addPerson, removePerson, getAlive } from '../../src/engine/population'
import { PersonAttrs } from '../../src/engine/population'

describe('Population Store', () => {
  it('createStore allocates arrays with given capacity', () => {
    const store = createStore(100)
    expect(store.capacity).toBe(100)
    expect(store.size).toBe(0)
    expect(store.age.length).toBe(100)
    expect(store.sex.length).toBe(100)
  })

  it('addPerson appends and returns ID', () => {
    const store = createStore(10)
    const attrs: PersonAttrs = {
      age: 25,
      sex: 1,
      cohesion: 200,
      married: 1,
      partnerId: 1,
      paternalLineage: 5,
      maternalLineage: 3,
      firstNameId: 7,
    }

    const id = addPerson(store, attrs)
    expect(id).toBe(0)
    expect(store.size).toBe(1)
    expect(store.age[0]).toBe(25)
    expect(store.sex[0]).toBe(1)
  })

  it('addPerson increments size', () => {
    const store = createStore(10)
    const attrs: PersonAttrs = {
      age: 20, sex: 0, cohesion: 150, married: 0, partnerId: -1,
      paternalLineage: 0, maternalLineage: 0, firstNameId: 0,
    }

    addPerson(store, attrs)
    expect(store.size).toBe(1)
    addPerson(store, attrs)
    expect(store.size).toBe(2)
  })

  it('addPerson grows capacity when full', () => {
    const store = createStore(2)
    const attrs: PersonAttrs = {
      age: 20, sex: 0, cohesion: 150, married: 0, partnerId: -1,
      paternalLineage: 0, maternalLineage: 0, firstNameId: 0,
    }

    addPerson(store, attrs)
    addPerson(store, attrs)
    expect(store.capacity).toBe(2)

    addPerson(store, attrs)
    expect(store.capacity).toBe(4)
    expect(store.size).toBe(3)
  })

  it('removePerson uses swap-and-pop', () => {
    const store = createStore(10)
    const makeAttrs = (age: number): PersonAttrs => ({
      age, sex: 0, cohesion: 150, married: 0, partnerId: -1,
      paternalLineage: 0, maternalLineage: 0, firstNameId: 0,
    })

    const id0 = addPerson(store, makeAttrs(10))
    const id1 = addPerson(store, makeAttrs(20))
    const id2 = addPerson(store, makeAttrs(30))

    expect(store.size).toBe(3)
    expect(store.age[0]).toBe(10)
    expect(store.age[1]).toBe(20)
    expect(store.age[2]).toBe(30)

    removePerson(store, 1)
    expect(store.size).toBe(2)
    expect(store.age[1]).toBe(30)
  })

  it('removePerson decrements size', () => {
    const store = createStore(10)
    const attrs: PersonAttrs = {
      age: 20, sex: 0, cohesion: 150, married: 0, partnerId: -1,
      paternalLineage: 0, maternalLineage: 0, firstNameId: 0,
    }

    addPerson(store, attrs)
    addPerson(store, attrs)
    expect(store.size).toBe(2)

    removePerson(store, 0)
    expect(store.size).toBe(1)
  })

  it('removePerson last element does not swap', () => {
    const store = createStore(10)
    const makeAttrs = (age: number): PersonAttrs => ({
      age, sex: 0, cohesion: 150, married: 0, partnerId: -1,
      paternalLineage: 0, maternalLineage: 0, firstNameId: 0,
    })

    addPerson(store, makeAttrs(10))
    addPerson(store, makeAttrs(20))
    addPerson(store, makeAttrs(30))

    removePerson(store, 2)
    expect(store.size).toBe(2)
    expect(store.age[0]).toBe(10)
    expect(store.age[1]).toBe(20)
  })

  it('getAlive yields indices 0 to size-1', () => {
    const store = createStore(10)
    const attrs: PersonAttrs = {
      age: 20, sex: 0, cohesion: 150, married: 0, partnerId: -1,
      paternalLineage: 0, maternalLineage: 0, firstNameId: 0,
    }

    addPerson(store, attrs)
    addPerson(store, attrs)
    addPerson(store, attrs)

    const alive = Array.from(getAlive(store))
    expect(alive).toEqual([0, 1, 2])
  })

  it('getAlive reflects removals', () => {
    const store = createStore(10)
    const attrs: PersonAttrs = {
      age: 20, sex: 0, cohesion: 150, married: 0, partnerId: -1,
      paternalLineage: 0, maternalLineage: 0, firstNameId: 0,
    }

    addPerson(store, attrs)
    addPerson(store, attrs)
    addPerson(store, attrs)

    removePerson(store, 1)
    const alive = Array.from(getAlive(store))
    expect(alive).toEqual([0, 1])
  })

  it('no tombstones after removal', () => {
    const store = createStore(10)
    const makeAttrs = (age: number): PersonAttrs => ({
      age, sex: 0, cohesion: 150, married: 0, partnerId: -1,
      paternalLineage: 0, maternalLineage: 0, firstNameId: 0,
    })

    addPerson(store, makeAttrs(10))
    addPerson(store, makeAttrs(20))
    addPerson(store, makeAttrs(30))

    removePerson(store, 0)

    expect(store.age[0]).toBe(30)
    expect(store.age[1]).toBe(20)
  })

  it('throws on invalid ID', () => {
    const store = createStore(10)
    const attrs: PersonAttrs = {
      age: 20, sex: 0, cohesion: 150, married: 0, partnerId: -1,
      paternalLineage: 0, maternalLineage: 0, firstNameId: 0,
    }

    addPerson(store, attrs)

    expect(() => removePerson(store, -1)).toThrow()
    expect(() => removePerson(store, 5)).toThrow()
  })
})
