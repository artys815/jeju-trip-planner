import { useEffect, useMemo, useState } from 'react'
import type { Day, Itinerary, ItineraryItem } from '../types'
import { dayDateToIsoInput } from '../utils/dateFormat'
import { resolveGeocode } from '../utils/geocodeResolve'
import { getMapDestination } from '../utils/maps'
import { fetchOpenMeteoForecast } from '../utils/weatherApi'
import {
  getCachedWeather,
  weatherCoordKey,
  type WeatherForecastBundle,
} from '../utils/weatherCache'
import {
  findDailyForecast,
  findNearestHourlyForecast,
  toDayWeatherView,
  toItemWeatherView,
  type DayWeatherView,
  type ItemWeatherView,
} from '../utils/weatherMatch'

export type { DayWeatherView, ItemWeatherView }

function preferOutdoorFirst(items: readonly ItineraryItem[]): ItineraryItem[] {
  const outdoor = items.filter(
    (item) => item.type === 'activity' || item.type === 'travel',
  )
  const rest = items.filter(
    (item) => item.type !== 'activity' && item.type !== 'travel',
  )
  return [...outdoor, ...rest]
}

async function resolveItemCoords(
  item: ItineraryItem,
): Promise<{ lat: number; lng: number } | null> {
  const destination = getMapDestination(item)
  if (!destination) return null
  const geo = await resolveGeocode(destination)
  if (!geo) return null
  return { lat: geo.lat, lng: geo.lng }
}

/**
 * Day-level location strategy:
 * 1) first outdoor/travel item with geocodable address/mapQuery
 * 2) else first geocodable item
 * Never invents a generic Jeju coordinate.
 */
async function resolveDayCoords(
  day: Day,
): Promise<{ lat: number; lng: number } | null> {
  for (const item of preferOutdoorFirst(day.items)) {
    const coords = await resolveItemCoords(item)
    if (coords) return coords
  }
  return null
}

export function useItineraryWeather(itinerary: Itinerary, enabled: boolean) {
  const [itemWeather, setItemWeather] = useState<
    Record<string, ItemWeatherView | null>
  >({})
  const [dayWeather, setDayWeather] = useState<Record<string, DayWeatherView>>(
    {},
  )
  const [loading, setLoading] = useState(false)

  const signature = useMemo(() => {
    return itinerary.days
      .map((day) => {
        const items = day.items
          .map(
            (item) =>
              `${item.id}:${item.time}:${item.mapQuery}:${item.address ?? ''}:${item.type}`,
          )
          .join('|')
        return `${day.id}:${day.date}:${items}`
      })
      .join('||')
  }, [itinerary.days])

  useEffect(() => {
    if (!enabled) {
      setItemWeather({})
      setDayWeather({})
      setLoading(false)
      return
    }

    const controller = new AbortController()
    let cancelled = false

    const run = async () => {
      setLoading(true)

      const nextItemWeather: Record<string, ItemWeatherView | null> = {}
      const nextDayWeather: Record<string, DayWeatherView> = {}
      const bundleByKey = new Map<string, WeatherForecastBundle | null>()

      const ensureBundle = async (
        lat: number,
        lng: number,
      ): Promise<WeatherForecastBundle | null> => {
        const key = weatherCoordKey(lat, lng)
        if (bundleByKey.has(key)) return bundleByKey.get(key) ?? null

        const cached = getCachedWeather(lat, lng)
        if (cached) {
          bundleByKey.set(key, cached)
          return cached
        }

        try {
          const fetched = await fetchOpenMeteoForecast(
            lat,
            lng,
            controller.signal,
          )
          bundleByKey.set(key, fetched)
          return fetched
        } catch {
          bundleByKey.set(key, null)
          return null
        }
      }

      for (const day of itinerary.days) {
        if (cancelled) return
        const isoDate = dayDateToIsoInput(day.date, itinerary.startDate)
        if (!isoDate) {
          nextDayWeather[day.id] = {
            status: 'unavailable',
            icon: '🌤',
            label: '날씨',
            minC: 0,
            maxC: 0,
            precipProbMax: 0,
          }
          continue
        }

        const dayCoords = await resolveDayCoords(day)
        if (!dayCoords) {
          // No geocodable location — omit Day weather entirely.
          continue
        }

        const dayBundle = await ensureBundle(dayCoords.lat, dayCoords.lng)
        if (!dayBundle) {
          nextDayWeather[day.id] = {
            status: 'unavailable',
            icon: '🌤',
            label: '날씨',
            minC: 0,
            maxC: 0,
            precipProbMax: 0,
          }
        } else {
          const daily = findDailyForecast(dayBundle.daily, isoDate)
          if (!daily) {
            nextDayWeather[day.id] = {
              status: 'out_of_range',
              icon: '🌤',
              label: '날씨',
              minC: 0,
              maxC: 0,
              precipProbMax: 0,
            }
          } else {
            nextDayWeather[day.id] = toDayWeatherView(daily)
          }
        }

        for (const item of day.items) {
          if (cancelled) return
          const coords = await resolveItemCoords(item)
          if (!coords) {
            nextItemWeather[item.id] = null
            continue
          }
          const bundle = await ensureBundle(coords.lat, coords.lng)
          if (!bundle) {
            nextItemWeather[item.id] = null
            continue
          }
          const hourly = findNearestHourlyForecast(
            bundle.hourly,
            isoDate,
            item.time,
          )
          nextItemWeather[item.id] = hourly ? toItemWeatherView(hourly) : null
        }

        // Progressive UI update per day
        if (!cancelled) {
          setDayWeather((prev) => ({ ...prev, ...nextDayWeather }))
          setItemWeather((prev) => ({ ...prev, ...nextItemWeather }))
        }
      }

      if (!cancelled) {
        setDayWeather(nextDayWeather)
        setItemWeather(nextItemWeather)
        setLoading(false)
      }
    }

    void run()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [enabled, itinerary.startDate, signature])

  return { itemWeather, dayWeather, loading }
}
