import type { ItineraryItem } from '../types'

/**
 * Destination text for map/navigation actions.
 * Priority: non-empty address, then mapQuery.
 * Ready for Phase 2 lat/lng without changing call sites.
 */
export function getMapDestination(
  item: Pick<ItineraryItem, 'mapQuery' | 'address'>,
): string {
  const address = item.address?.trim() ?? ''
  if (address) return address
  return item.mapQuery.trim()
}

/**
 * Kakao Map search — official web URL pattern:
 * https://map.kakao.com/link/search/{검색어}
 * Works on desktop/mobile HTTPS; may hand off to the Kakao Map app.
 */
export function getKakaoMapUrl(destination: string): string {
  return `https://map.kakao.com/link/search/${encodeURIComponent(destination)}`
}

/**
 * Kakao directions for text destinations (Phase 1).
 *
 * Official `/link/to/{name},{lat},{lng}` requires coordinates.
 * Without lat/lng we use the documented search URL so the destination
 * opens in Kakao Map, where the user can start 길찾기.
 * Phase 2 can switch this to `/link/to/` once coordinates exist.
 */
export function getKakaoDirectionsUrl(destination: string): string {
  return getKakaoMapUrl(destination)
}
