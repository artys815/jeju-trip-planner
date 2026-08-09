import { getCachedGeocode, setCachedGeocode } from './geocodeCache'

export interface ResolvedGeocode {
  lat: number
  lng: number
  addressName?: string
}

export type GeocodeErrorCode =
  | 'SERVER_MISCONFIGURED'
  | 'GEOCODE_UPSTREAM_ERROR'
  | 'ADDRESS_NOT_FOUND'
  | 'GEOCODE_FAILED'
  | 'ADDRESS_REQUIRED'
  | 'ADDRESS_TOO_LONG'

export type ResolveGeocodeResult =
  | { ok: true; lat: number; lng: number; addressName?: string }
  | { ok: false; error: GeocodeErrorCode; upstreamStatus?: number }

const KNOWN_ERRORS = new Set<GeocodeErrorCode>([
  'SERVER_MISCONFIGURED',
  'GEOCODE_UPSTREAM_ERROR',
  'ADDRESS_NOT_FOUND',
  'GEOCODE_FAILED',
  'ADDRESS_REQUIRED',
  'ADDRESS_TOO_LONG',
])

function asGeocodeError(value: unknown): GeocodeErrorCode | null {
  return typeof value === 'string' && KNOWN_ERRORS.has(value as GeocodeErrorCode)
    ? (value as GeocodeErrorCode)
    : null
}

/**
 * Resolve destination coordinates via cache, then /api/geocode.
 * Never fabricates coordinates. Preserves structured server error codes.
 */
export async function resolveGeocodeDetailed(
  query: string,
): Promise<ResolveGeocodeResult> {
  const key = query.trim()
  if (!key) return { ok: false, error: 'ADDRESS_REQUIRED' }

  const cached = getCachedGeocode(key)
  if (cached) {
    return {
      ok: true,
      lat: cached.lat,
      lng: cached.lng,
      addressName: cached.addressName,
    }
  }

  const url = `/api/geocode?${new URLSearchParams({ address: key }).toString()}`
  let res: Response
  try {
    res = await fetch(url)
  } catch {
    return { ok: false, error: 'GEOCODE_FAILED' }
  }

  const data: unknown = await res.json().catch(() => null)
  if (!data || typeof data !== 'object') {
    return { ok: false, error: 'GEOCODE_FAILED' }
  }

  const body = data as Record<string, unknown>
  if (body.ok === true) {
    const lat = Number(body.lat)
    const lng = Number(body.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return { ok: false, error: 'GEOCODE_FAILED' }
    }
    const addressName =
      typeof body.addressName === 'string' ? body.addressName : undefined
    const saved = setCachedGeocode(key, lat, lng, addressName)
    return {
      ok: true,
      lat: saved.lat,
      lng: saved.lng,
      addressName: saved.addressName,
    }
  }

  const coded = asGeocodeError(body.error)
  if (coded) {
    const upstreamStatus =
      typeof body.upstreamStatus === 'number' ? body.upstreamStatus : undefined
    return { ok: false, error: coded, upstreamStatus }
  }

  return { ok: false, error: 'GEOCODE_FAILED' }
}

/**
 * Resolve destination coordinates via cache, then /api/geocode.
 * Never fabricates coordinates.
 */
export async function resolveGeocode(
  query: string,
): Promise<ResolvedGeocode | null> {
  const result = await resolveGeocodeDetailed(query)
  if (!result.ok) return null
  return {
    lat: result.lat,
    lng: result.lng,
    addressName: result.addressName,
  }
}
