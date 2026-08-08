import type { ItineraryItem } from '../types'
import { getCachedGeocode } from './geocodeCache'
import { resolveGeocode } from './geocodeResolve'

/**
 * Destination text for map/navigation actions.
 * Priority: non-empty address, then mapQuery.
 */
export function getMapDestination(
  item: Pick<ItineraryItem, 'mapQuery' | 'address'>,
): string {
  const address = item.address?.trim() ?? ''
  if (address) return address
  return item.mapQuery.trim()
}

/**
 * Kakao Map search — official web URL:
 * https://map.kakao.com/link/search/{검색어}
 */
export function getKakaoMapUrl(destination: string): string {
  return `https://map.kakao.com/link/search/${encodeURIComponent(destination)}`
}

/**
 * Kakao directions destination link.
 * With coordinates: official /link/to/{name},{lat},{lng}
 * Without coordinates: fall back to search (same as 지도).
 */
export function getKakaoDirectionsUrl(
  destination: string,
  coords?: { lat: number; lng: number } | null,
  placeName?: string,
): string {
  if (coords && Number.isFinite(coords.lat) && Number.isFinite(coords.lng)) {
    const name = encodeURIComponent((placeName || destination).trim() || '목적지')
    return `https://map.kakao.com/link/to/${name},${coords.lat},${coords.lng}`
  }
  return getKakaoMapUrl(destination)
}

/** Sync helper — uses cache only (no network). Prefer resolveKakaoDirectionsUrl. */
export function getKakaoDirectionsUrlForItem(
  item: Pick<ItineraryItem, 'mapQuery' | 'address' | 'title'>,
): string {
  const destination = getMapDestination(item)
  if (!destination) return ''
  const cached = getCachedGeocode(destination)
  return getKakaoDirectionsUrl(
    destination,
    cached ? { lat: cached.lat, lng: cached.lng } : null,
    item.title,
  )
}

/**
 * Resolve destination coordinates (cache → /api/geocode), then build
 * Kakao /link/to URL. Falls back to search if geocode fails.
 */
export async function resolveKakaoDirectionsUrl(
  item: Pick<ItineraryItem, 'mapQuery' | 'address' | 'title'>,
): Promise<string> {
  const destination = getMapDestination(item)
  if (!destination) return ''

  const geo = await resolveGeocode(destination)
  return getKakaoDirectionsUrl(
    destination,
    geo ? { lat: geo.lat, lng: geo.lng } : null,
    item.title,
  )
}
