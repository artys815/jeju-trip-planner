import { setCachedWeather, type WeatherForecastBundle } from './weatherCache'
import type { DailyForecastPoint, HourlyForecastPoint } from './weatherMatch'

const FORECAST_DAYS = 16

function asNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  return value.map((v) => Number(v))
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((v) => String(v))
}

/**
 * Fetch Open-Meteo forecast for destination coordinates.
 * Does not use device GPS. No API key.
 */
export async function fetchOpenMeteoForecast(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<WeatherForecastBundle | null> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    hourly: [
      'temperature_2m',
      'apparent_temperature',
      'precipitation_probability',
      'weather_code',
      'wind_speed_10m',
    ].join(','),
    daily: [
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_probability_max',
      'weather_code',
    ].join(','),
    timezone: 'Asia/Seoul',
    forecast_days: String(FORECAST_DAYS),
    wind_speed_unit: 'kmh',
  })

  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`
  const res = await fetch(url, { signal })
  if (!res.ok) return null

  const data: unknown = await res.json().catch(() => null)
  if (!data || typeof data !== 'object') return null
  const body = data as Record<string, unknown>
  const hourlyRaw = body.hourly
  const dailyRaw = body.daily
  if (!hourlyRaw || typeof hourlyRaw !== 'object') return null
  if (!dailyRaw || typeof dailyRaw !== 'object') return null

  const hourlyObj = hourlyRaw as Record<string, unknown>
  const dailyObj = dailyRaw as Record<string, unknown>

  const times = asStringArray(hourlyObj.time)
  const temps = asNumberArray(hourlyObj.temperature_2m)
  const apparents = asNumberArray(hourlyObj.apparent_temperature)
  const precips = asNumberArray(hourlyObj.precipitation_probability)
  const codes = asNumberArray(hourlyObj.weather_code)
  const winds = asNumberArray(hourlyObj.wind_speed_10m)

  const hourly: HourlyForecastPoint[] = []
  for (let i = 0; i < times.length; i += 1) {
    if (
      !Number.isFinite(temps[i]) ||
      !Number.isFinite(apparents[i]) ||
      !Number.isFinite(precips[i]) ||
      !Number.isFinite(codes[i]) ||
      !Number.isFinite(winds[i])
    ) {
      continue
    }
    hourly.push({
      time: times[i],
      temperature: temps[i],
      apparent: apparents[i],
      precipProb: precips[i],
      weatherCode: codes[i],
      windKmh: winds[i],
    })
  }

  const dates = asStringArray(dailyObj.time)
  const maxes = asNumberArray(dailyObj.temperature_2m_max)
  const mins = asNumberArray(dailyObj.temperature_2m_min)
  const dayPrecips = asNumberArray(dailyObj.precipitation_probability_max)
  const dayCodes = asNumberArray(dailyObj.weather_code)

  const daily: DailyForecastPoint[] = []
  for (let i = 0; i < dates.length; i += 1) {
    if (
      !Number.isFinite(maxes[i]) ||
      !Number.isFinite(mins[i]) ||
      !Number.isFinite(dayPrecips[i]) ||
      !Number.isFinite(dayCodes[i])
    ) {
      continue
    }
    daily.push({
      date: dates[i],
      tempMax: maxes[i],
      tempMin: mins[i],
      precipProbMax: dayPrecips[i],
      weatherCode: dayCodes[i],
    })
  }

  if (hourly.length === 0 && daily.length === 0) return null

  return setCachedWeather({
    lat,
    lng,
    fetchedAt: Date.now(),
    hourly,
    daily,
  })
}
