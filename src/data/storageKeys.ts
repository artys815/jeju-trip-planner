/**
 * Storage keys for the travel planner.
 *
 * LEGACY_ITINERARY_KEY (`jeju-trip-itinerary-v1`):
 *   Pre-multi-trip single itinerary. COPY-ONLY migration source.
 *   Never delete, rename, or overwrite after migration.
 *   Post-migration edits go only to TRIPS_STORAGE_KEY.
 *
 * LEGACY_ITINERARY_BACKUP_KEY:
 *   One-time safety copy of the legacy blob before first migration.
 *
 * TRIPS_STORAGE_KEY (`travel-planner-trips-v1`):
 *   TripCollection { version: 1, activeTripId, trips[] }.
 */
export const LEGACY_ITINERARY_KEY = 'jeju-trip-itinerary-v1'
export const LEGACY_ITINERARY_BACKUP_KEY = 'jeju-trip-itinerary-v1-backup-202608'
export const TRIPS_STORAGE_KEY = 'travel-planner-trips-v1'

/** @deprecated Use LEGACY_ITINERARY_KEY — kept so existing imports keep resolving. */
export const STORAGE_KEY = LEGACY_ITINERARY_KEY
