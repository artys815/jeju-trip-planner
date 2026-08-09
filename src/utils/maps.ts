import type { ItineraryItem } from '../types'

/**
 * Destination text for map actions.
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
