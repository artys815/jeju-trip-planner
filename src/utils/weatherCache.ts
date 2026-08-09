import type { DailyForecastPoint, HourlyForecastPoint } from './weatherMatch'

export const WEATHER_CACHE_KEY = 'jeju-trip-weather-cache-v1'
/** Cache weather responses for 45 minutes. */
export const WEATHER_CACHE_TTL_MS = 45 * 60 * 1000

export interface WeatherForecastBundle {
  lat: number
  lng: number
  fetchedAt: number
  hourly: HourlyForecastPoint[]
  daily: DailyForecastPoint[]
}

type CacheMap = Record<string, WeatherForecastBundle>

export function weatherCoordKey(lat: number, lng: number): string {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`
}

function readCache(): CacheMap {
  try {
    const raw = localStorage.getItem(WEATHER_CACHE_KEY)
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
    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // ignore quota
  }
}

export function getCachedWeather(
  lat: number,
  lng: number,
  now = Date.now(),
): WeatherForecastBundle | null {
  const key = weatherCoordKey(lat, lng)
  const entry = readCache()[key]
  if (!entry) return null
  if (!Array.isArray(entry.hourly) || !Array.isArray(entry.daily)) return null
  if (now - entry.fetchedAt > WEATHER_CACHE_TTL_MS) return null
  return entry
}

export function setCachedWeather(
  bundle: WeatherForecastBundle,
): WeatherForecastBundle {
  const key = weatherCoordKey(bundle.lat, bundle.lng)
  const cache = readCache()
  cache[key] = bundle
  writeCache(cache)
  return bundle
}
