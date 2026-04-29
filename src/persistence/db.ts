import { DBSchema, openDB } from 'idb'
import { Colony } from '../engine/types'

interface GameDB extends DBSchema {
  saves: {
    key: 'latest'
    value: SaveState
  }
}

export interface SaveState {
  version: 1
  seed: number
  colony: Colony
}

const DB_NAME = 'long-game'
const DB_VERSION = 1
const STORE_NAME = 'saves'

export async function loadGame(): Promise<SaveState | null> {
  try {
    const db = await openDB<GameDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME)
        }
      },
    })

    const save = await db.get(STORE_NAME, 'latest')
    return save || null
  } catch (error) {
    console.error('Failed to load game from IndexedDB:', error)
    return null
  }
}

export async function saveGame(seed: number, colony: Colony): Promise<void> {
  try {
    const db = await openDB<GameDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME)
        }
      },
    })

    const saveState: SaveState = {
      version: 1,
      seed,
      colony,
    }

    await db.put(STORE_NAME, saveState, 'latest')
  } catch (error) {
    console.error('Failed to save game to IndexedDB:', error)
  }
}

export async function deleteGame(): Promise<void> {
  try {
    const db = await openDB<GameDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME)
        }
      },
    })

    await db.delete(STORE_NAME, 'latest')
  } catch (error) {
    console.error('Failed to delete game from IndexedDB:', error)
  }
}
