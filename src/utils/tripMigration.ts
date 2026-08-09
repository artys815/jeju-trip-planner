import { defaultItinerary } from '../data/defaultItinerary'
import {
  LEGACY_ITINERARY_BACKUP_KEY,
  LEGACY_ITINERARY_KEY,
  TRIPS_STORAGE_KEY,
} from '../data/storageKeys'
import {
  isItinerary,
  isTripCollection,
  type Itinerary,
  type TripCollection,
} from '../types'
import { JEJU_MAN_MAP_LINK, wrapItineraryAsTrip } from './trips'

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export interface MigrationResult {
  collection: TripCollection
  /** True when a new TripCollection was written to TRIPS_STORAGE_KEY. */
  didMigrate: boolean
  /** True when legacy blob was cloned into a protected Jeju trip. */
  usedLegacy: boolean
  /** Snapshot of legacy itinerary used for migration (for tests). */
  legacySnapshot: Itinerary | null
}

function readJson(storage: StorageLike, key: string): unknown | null {
  try {
    const raw = storage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

function writeJson(storage: StorageLike, key: string, value: unknown): boolean {
  try {
    storage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

function ensureLegacyBackup(storage: StorageLike, legacyRaw: string) {
  try {
    if (storage.getItem(LEGACY_ITINERARY_BACKUP_KEY)) return
    storage.setItem(LEGACY_ITINERARY_BACKUP_KEY, legacyRaw)
  } catch {
    // Backup is best-effort; never throw.
  }
}

export function createDefaultTripCollection(
  seed: Itinerary = structuredClone(defaultItinerary),
): TripCollection {
  const trip = wrapItineraryAsTrip(structuredClone(seed), {
    protected: true,
    quickLinks: [JEJU_MAN_MAP_LINK],
  })
  return {
    version: 1,
    activeTripId: trip.id,
    trips: [trip],
  }
}

export function createCollectionFromLegacy(
  legacy: Itinerary,
): TripCollection {
  const trip = wrapItineraryAsTrip(structuredClone(legacy), {
    protected: true,
    quickLinks: [JEJU_MAN_MAP_LINK],
    name: legacy.title,
  })
  return {
    version: 1,
    activeTripId: trip.id,
    trips: [trip],
  }
}

/**
 * Load TripCollection from the new key, or COPY-ONLY migrate from legacy.
 *
 * NEVER modifies or deletes LEGACY_ITINERARY_KEY.
 * Idempotent: if TRIPS_STORAGE_KEY already has a valid collection, return it.
 */
export function loadOrMigrateTripCollection(
  storage: StorageLike,
): MigrationResult {
  const existing = readJson(storage, TRIPS_STORAGE_KEY)
  if (isTripCollection(existing) && existing.trips.length > 0) {
    return {
      collection: existing,
      didMigrate: false,
      usedLegacy: false,
      legacySnapshot: null,
    }
  }

  let legacyRaw: string | null = null
  try {
    legacyRaw = storage.getItem(LEGACY_ITINERARY_KEY)
  } catch {
    legacyRaw = null
  }

  if (legacyRaw) {
    ensureLegacyBackup(storage, legacyRaw)
    try {
      const parsed: unknown = JSON.parse(legacyRaw)
      if (isItinerary(parsed)) {
        const legacySnapshot = structuredClone(parsed)
        const collection = createCollectionFromLegacy(legacySnapshot)
        writeJson(storage, TRIPS_STORAGE_KEY, collection)
        // Intentionally do NOT touch LEGACY_ITINERARY_KEY.
        return {
          collection,
          didMigrate: true,
          usedLegacy: true,
          legacySnapshot,
        }
      }
    } catch {
      // Fall through to default seed.
    }
  }

  const collection = createDefaultTripCollection()
  writeJson(storage, TRIPS_STORAGE_KEY, collection)
  return {
    collection,
    didMigrate: true,
    usedLegacy: false,
    legacySnapshot: null,
  }
}

export function persistTripCollection(
  storage: StorageLike,
  collection: TripCollection,
): boolean {
  if (!isTripCollection(collection)) return false
  return writeJson(storage, TRIPS_STORAGE_KEY, collection)
}

/** Read legacy itinerary without mutating anything (recovery helper). */
export function readLegacyItinerary(
  storage: StorageLike,
): Itinerary | null {
  const parsed = readJson(storage, LEGACY_ITINERARY_KEY)
  return isItinerary(parsed) ? parsed : null
}
