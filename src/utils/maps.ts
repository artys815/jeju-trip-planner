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
 * Official Kakao web “directions destination” link (PC / HTTPS fallback).
 * Sets the destination; Kakao UI may still ask the user to confirm 길찾기.
 * https://map.kakao.com/link/to/{name},{lat},{lng}
 */
export function getKakaoWebDirectionsUrl(
  destination: string,
  coords: { lat: number; lng: number },
  placeName?: string,
): string {
  const name = encodeURIComponent((placeName || destination).trim() || '목적지')
  return `https://map.kakao.com/link/to/${name},${coords.lat},${coords.lng}`
}

/**
 * Official Kakao Map mobile/app route scheme with destination only.
 * Documented pattern: kakaomap://route?sp=…&ep=…&by=car
 * and mobile web: http://m.map.kakao.com/scheme/route?…
 *
 * Using `ep` (end point) alone is the practical destination-first handoff
 * so Kakao Map can use the device’s current location as the start.
 * We do not invent undocumented query keys.
 *
 * @see https://apis.map.kakao.com/android_v2/docs/api-guide/urlscheme/
 */
export function getKakaoAppRouteUrl(coords: {
  lat: number
  lng: number
}): string {
  return `kakaomap://route?ep=${coords.lat},${coords.lng}&by=car`
}

export function getKakaoMobileWebRouteUrl(coords: {
  lat: number
  lng: number
}): string {
  return `https://m.map.kakao.com/scheme/route?ep=${coords.lat},${coords.lng}&by=car`
}

export function getKakaoDirectionsUrl(
  destination: string,
  coords?: { lat: number; lng: number } | null,
  placeName?: string,
): string {
  if (coords && Number.isFinite(coords.lat) && Number.isFinite(coords.lng)) {
    return getKakaoWebDirectionsUrl(destination, coords, placeName)
  }
  return getKakaoMapUrl(destination)
}

/** Sync helper — uses cache only (no network). */
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

function isMobileUserAgent(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
}

/**
 * Open Kakao directions for a destination.
 *
 * Mobile: prefer official scheme route URLs so Kakao Map opens a directions
 * flow with the destination pre-filled (start = current location in the app).
 * Desktop / fallback: official /link/to HTTPS destination link.
 * Geocode failure: Kakao search (same as 지도) — never invent coordinates.
 */
export async function openKakaoDirections(
  item: Pick<ItineraryItem, 'mapQuery' | 'address' | 'title'>,
): Promise<void> {
  const destination = getMapDestination(item)
  if (!destination) return

  const geo = await resolveGeocode(destination)
  if (!geo) {
    window.open(getKakaoMapUrl(destination), '_blank', 'noopener,noreferrer')
    return
  }

  const coords = { lat: geo.lat, lng: geo.lng }
  const webFallback = getKakaoWebDirectionsUrl(destination, coords, item.title)

  if (isMobileUserAgent()) {
    // Official mobile-web scheme → hands off to Kakao Map app when installed.
    // Destination-only `ep` lets Kakao use the device current location as start.
    // Open in a new tab so this itinerary SPA is not navigated away.
    // Fallback: HTTPS /link/to destination directions page.
    const opened = window.open(
      getKakaoMobileWebRouteUrl(coords),
      '_blank',
      'noopener,noreferrer',
    )
    if (!opened) {
      window.open(webFallback, '_blank', 'noopener,noreferrer')
    }
    return
  }

  window.open(webFallback, '_blank', 'noopener,noreferrer')
}

/** @deprecated Prefer openKakaoDirections — kept for callers that need a URL string. */
export async function resolveKakaoDirectionsUrl(
  item: Pick<ItineraryItem, 'mapQuery' | 'address' | 'title'>,
): Promise<string> {
  const destination = getMapDestination(item)
  if (!destination) return ''
  const geo = await resolveGeocode(destination)
  if (!geo) return getKakaoMapUrl(destination)
  if (isMobileUserAgent()) {
    return getKakaoMobileWebRouteUrl(geo)
  }
  return getKakaoWebDirectionsUrl(destination, geo, item.title)
}
