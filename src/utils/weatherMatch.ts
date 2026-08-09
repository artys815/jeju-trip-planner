import { buildWeatherWarnings, mapWeatherCode } from './weatherCodes'

export interface HourlyForecastPoint {
  /** ISO local time e.g. 2026-08-16T09:00 */
  time: string
  temperature: number
  apparent: number
  precipProb: number
  weatherCode: number
  windKmh: number
}

export interface DailyForecastPoint {
  /** ISO date e.g. 2026-08-16 */
  date: string
  tempMax: number
  tempMin: number
  precipProbMax: number
  weatherCode: number
}

export interface ItemWeatherView {
  icon: string
  label: string
  tempC: number
  apparentC: number
  precipProb: number
  windKmh: number
  warnings: string[]
}

export interface DayWeatherView {
  status: 'ready' | 'out_of_range' | 'unavailable'
  icon: string
  label: string
  minC: number
  maxC: number
  precipProbMax: number
}

export function roundTemp(value: number): number {
  return Math.round(value)
}

export function roundWind(value: number): number {
  return Math.round(value)
}

/** Parse "09:30" → minutes from midnight; invalid → null. */
export function parseItemTimeMinutes(time: string): number | null {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null
  }
  return hours * 60 + minutes
}

function hourlyMinutes(isoLocal: string): number | null {
  const match = isoLocal.match(/T(\d{2}):(\d{2})/)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

function hourlyDate(isoLocal: string): string | null {
  const match = isoLocal.match(/^(\d{4}-\d{2}-\d{2})/)
  return match?.[1] ?? null
}

/**
 * Pick nearest hourly point for a day + item time.
 * Example: 09:30 between 09:00 and 10:00 → closer of the two.
 */
export function findNearestHourlyForecast(
  hourly: readonly HourlyForecastPoint[],
  isoDate: string,
  itemTime: string,
): HourlyForecastPoint | null {
  const target = parseItemTimeMinutes(itemTime)
  if (target === null) return null

  let best: HourlyForecastPoint | null = null
  let bestDist = Infinity

  for (const point of hourly) {
    if (hourlyDate(point.time) !== isoDate) continue
    const minutes = hourlyMinutes(point.time)
    if (minutes === null) continue
    const dist = Math.abs(minutes - target)
    if (dist < bestDist) {
      bestDist = dist
      best = point
    }
  }

  return best
}

export function toItemWeatherView(
  point: HourlyForecastPoint,
): ItemWeatherView {
  const code = mapWeatherCode(point.weatherCode)
  const tempC = roundTemp(point.temperature)
  const apparentC = roundTemp(point.apparent)
  const precipProb = Math.round(point.precipProb)
  const windKmh = roundWind(point.windKmh)
  return {
    icon: code.icon,
    label: code.label,
    tempC,
    apparentC,
    precipProb,
    windKmh,
    warnings: buildWeatherWarnings({
      precipProb,
      apparentC,
      windKmh,
    }),
  }
}

export function findDailyForecast(
  daily: readonly DailyForecastPoint[],
  isoDate: string,
): DailyForecastPoint | null {
  return daily.find((d) => d.date === isoDate) ?? null
}

export function toDayWeatherView(point: DailyForecastPoint): DayWeatherView {
  const code = mapWeatherCode(point.weatherCode)
  return {
    status: 'ready',
    icon: code.icon,
    label: code.label,
    minC: roundTemp(point.tempMin),
    maxC: roundTemp(point.tempMax),
    precipProbMax: Math.round(point.precipProbMax),
  }
}
