export const GEOCODE_CACHE_KEY = 'jeju-trip-geocode-cache-v1'

export interface GeocodeCacheEntry {
  query: string
  lat: number
  lng: number
  addressName?: string
  timestamp: number
}

type CacheMap = Record<string, GeocodeCacheEntry>

function readCache(): CacheMap {
  try {
    const raw = localStorage.getItem(GEOCODE_CACHE_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as CacheMap
  } catch {
    return {}
  }
}

function writeCache(cache: CacheMap) {
  try {
    localStorage.setItem(GEOCODE_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // ignore quota errors
  }
}

export function getCachedGeocode(query: string): GeocodeCacheEntry | null {
  const key = query.trim()
  if (!key) return null
  const entry = readCache()[key]
  if (!entry) return null
  if (
    !Number.isFinite(entry.lat) ||
    !Number.isFinite(entry.lng) ||
    typeof entry.query !== 'string'
  ) {
    return null
  }
  return entry
}

export function setCachedGeocode(
  query: string,
  lat: number,
  lng: number,
  addressName?: string,
): GeocodeCacheEntry {
  const key = query.trim()
  const entry: GeocodeCacheEntry = {
    query: key,
    lat,
    lng,
    addressName,
    timestamp: Date.now(),
  }
  const cache = readCache()
  cache[key] = entry
  writeCache(cache)
  return entry
}
