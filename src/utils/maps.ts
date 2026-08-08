import type { ItineraryItem } from '../types'
import { getCachedGeocode } from './geocodeCache'

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
 * Kakao directions.
 * With coordinates: official /link/to/{name},{lat},{lng}
 * Without coordinates: fall back to search.
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

/** Prefer cached geocoded coords for directions when available. */
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
