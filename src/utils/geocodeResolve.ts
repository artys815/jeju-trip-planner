import { getCachedGeocode, setCachedGeocode } from './geocodeCache'

export interface ResolvedGeocode {
  lat: number
  lng: number
  addressName?: string
}

/**
 * Resolve destination coordinates via cache, then /api/geocode.
 * Never fabricates coordinates.
 */
export async function resolveGeocode(
  query: string,
): Promise<ResolvedGeocode | null> {
  const key = query.trim()
  if (!key) return null

  const cached = getCachedGeocode(key)
  if (cached) {
    return {
      lat: cached.lat,
      lng: cached.lng,
      addressName: cached.addressName,
    }
  }

  const url = `/api/geocode?${new URLSearchParams({ address: key }).toString()}`
  const res = await fetch(url)
  const data: unknown = await res.json().catch(() => null)
  if (!res.ok || !data || typeof data !== 'object') return null

  const body = data as Record<string, unknown>
  if (body.ok !== true) return null

  const lat = Number(body.lat)
  const lng = Number(body.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

  const addressName =
    typeof body.addressName === 'string' ? body.addressName : undefined

  return setCachedGeocode(key, lat, lng, addressName)
}
