import type { ItineraryItem } from '../types'
import { getCachedGeocode } from './geocodeCache'
import { resolveGeocode } from './geocodeResolve'

export type OpenDirectionsResult = {
  /** True when a Kakao URL was opened. */
  opened: boolean
  /**
   * Optional short UI message (e.g. permission denied).
   * Never includes GPS coordinates.
   */
  message?: string
  /** Exact URL opened, for diagnostics — no origin stored elsewhere. */
  url?: string
}

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
 * Official Kakao web “directions destination” link (HTTPS fallback).
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
 * Official Kakao Map app route scheme (start + end).
 * kakaomap://route?sp={lat},{lng}&ep={lat},{lng}&by=car
 *
 * @see https://apis.map.kakao.com/android_v2/docs/api-guide/urlscheme/
 */
export function getKakaoAppRouteUrl(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): string {
  return `kakaomap://route?sp=${origin.lat},${origin.lng}&ep=${destination.lat},${destination.lng}&by=car`
}

/**
 * Official Kakao Map mobile-web route scheme (start + end).
 * https://m.map.kakao.com/scheme/route?sp={lat},{lng}&ep={lat},{lng}&by=car
 */
export function getKakaoMobileWebRouteUrl(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): string {
  return `https://m.map.kakao.com/scheme/route?sp=${origin.lat},${origin.lng}&ep=${destination.lat},${destination.lng}&by=car`
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

function getBrowserPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(Object.assign(new Error('UNSUPPORTED'), { code: -1 }))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 12_000,
      maximumAge: 60_000,
    })
  })
}

function openUrl(url: string): boolean {
  const opened = window.open(url, '_blank', 'noopener,noreferrer')
  return Boolean(opened)
}

/**
 * Open Kakao car directions: current device location → destination.
 *
 * 1. Resolve destination (cache → /api/geocode)
 * 2. Request browser GPS (not stored)
 * 3. Open official route scheme with both sp and ep
 * 4. Permission denied → /link/to destination-only fallback
 * 5. Geocode failure → Kakao search
 */
export async function openKakaoDirections(
  item: Pick<ItineraryItem, 'mapQuery' | 'address' | 'title'>,
): Promise<OpenDirectionsResult> {
  const destination = getMapDestination(item)
  if (!destination) return { opened: false }

  const geo = await resolveGeocode(destination)
  if (!geo) {
    const url = getKakaoMapUrl(destination)
    openUrl(url)
    return { opened: true, url }
  }

  const dest = { lat: geo.lat, lng: geo.lng }

  try {
    const position = await getBrowserPosition()
    const origin = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    }

    // GPS is used only to build this URL — never persisted.
    const routeUrl = getKakaoMobileWebRouteUrl(origin, dest)
    const opened = openUrl(routeUrl)
    if (!opened) {
      // Popup blocked — try app scheme as last gesture-tied attempt.
      openUrl(getKakaoAppRouteUrl(origin, dest))
    }
    return { opened: true, url: routeUrl }
  } catch (err) {
    const geoErr = err as GeolocationPositionError
    const denied = typeof geoErr?.code === 'number' && geoErr.code === 1
    const url = getKakaoWebDirectionsUrl(destination, dest, item.title)
    openUrl(url)
    return {
      opened: true,
      url,
      message: denied
        ? '현재 위치 권한이 없어 목적지만 열었습니다.'
        : '현재 위치를 가져오지 못해 목적지만 열었습니다.',
    }
  }
}

/** Resolve a directions URL string (destination-only; no GPS). */
export async function resolveKakaoDirectionsUrl(
  item: Pick<ItineraryItem, 'mapQuery' | 'address' | 'title'>,
): Promise<string> {
  const destination = getMapDestination(item)
  if (!destination) return ''
  const geo = await resolveGeocode(destination)
  if (!geo) return getKakaoMapUrl(destination)
  return getKakaoWebDirectionsUrl(destination, geo, item.title)
}
