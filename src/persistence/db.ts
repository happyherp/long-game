import { DBSchema, openDB } from 'idb'
import { Federation } from '../engine/types'
import { migrateV1toV2 } from '../engine/migrate'

const DB_NAME = 'long-game'
const DB_VERSION = 2
const STORE_NAME = 'saves'

// V1 types (for migration)
interface SaveStateV1 {
  version: 1
  seed: number
  colony: any // Colony with limited doctrine
}

// V2 types
interface SaveStateV2 {
  version: 2
  seed: number
  federation: Federation
}

interface GameDBV2 extends DBSchema {
  saves: {
    key: 'latest'
    value: SaveStateV2
  }
}

export async function loadGame(): Promise<SaveStateV2 | null> {
  try {
    const db = await openDB<GameDBV2>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore(STORE_NAME)
        }
        // Note: We don't do V1->V2 migration here because we need to read the V1 data first
      },
    })

    const save = await db.get(STORE_NAME, 'latest')

    if (!save) return null

    // Check if it's V1 and migrate
    if (save.version === 1) {
      const v1Save = save as unknown as SaveStateV1
      const v2Save = migrateV1toV2(v1Save)
      // Save the migrated version
      await db.put(STORE_NAME, v2Save, 'latest')
      return v2Save
    }

    return save as SaveStateV2
  } catch (error) {
    console.error('Failed to load game from IndexedDB:', error)
    return null
  }
}

export async function saveGame(federation: Federation, seed: number): Promise<void> {
  try {
    const db = await openDB<GameDBV2>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore(STORE_NAME)
        }
      },
    })

    const saveState: SaveStateV2 = {
      version: 2,
      seed,
      federation,
    }

    await db.put(STORE_NAME, saveState, 'latest')
  } catch (error) {
    console.error('Failed to save game to IndexedDB:', error)
  }
}

export async function deleteGame(): Promise<void> {
  try {
    const db = await openDB<GameDBV2>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore(STORE_NAME)
        }
      },
    })

    await db.delete(STORE_NAME, 'latest')
  } catch (error) {
    console.error('Failed to delete game from IndexedDB:', error)
  }
}