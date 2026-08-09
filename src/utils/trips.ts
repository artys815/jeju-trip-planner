import {
  createId,
  type Day,
  type Itinerary,
  type Trip,
  type TripCollection,
  type TripQuickLink,
} from '../types'
import {
  formatMonthDay,
  formatTripDateDisplay,
  parseTripDateParts,
  weekdayFromDate,
} from './dateFormat'
import { DAY_ACCENTS } from './days'

export const JEJU_MAN_MAP_LINK: TripQuickLink = {
  label: '제주맨 맛집지도',
  url: 'https://naver.me/FdCCr5WD',
}

export type TripStatusKind = 'upcoming' | 'active' | 'past'

export interface TripStatus {
  kind: TripStatusKind
  label: string
}

function isoToLocalDate(iso: string): Date | null {
  const match = iso.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const dt = new Date(year, month - 1, day)
  if (
    Number.isNaN(dt.getTime()) ||
    dt.getFullYear() !== year ||
    dt.getMonth() !== month - 1 ||
    dt.getDate() !== day
  ) {
    return null
  }
  return dt
}

function tripDateToLocalDate(tripDate: string): Date | null {
  const parts = parseTripDateParts(tripDate)
  if (!parts) return null
  return new Date(parts.year, parts.month - 1, parts.day)
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function generateDaysForIsoRange(
  startIso: string,
  endIso: string,
): Day[] {
  const start = isoToLocalDate(startIso)
  const end = isoToLocalDate(endIso)
  if (!start || !end || end < start) return []

  const days: Day[] = []
  const cursor = new Date(start)
  let index = 0
  while (cursor <= end) {
    days.push({
      id: createId('day'),
      date: formatMonthDay(cursor.getMonth() + 1, cursor.getDate()),
      weekday: weekdayFromDate(cursor),
      area: '',
      theme: '',
      accent: DAY_ACCENTS[index % DAY_ACCENTS.length],
      items: [],
    })
    cursor.setDate(cursor.getDate() + 1)
    index += 1
  }
  return days
}

export function createBlankItinerary(input: {
  name: string
  startIso: string
  endIso: string
  accommodation?: string
  vehicle?: string
  travelers?: string
}): Itinerary {
  const start = isoToLocalDate(input.startIso)
  const end = isoToLocalDate(input.endIso)
  if (!start || !end) {
    throw new Error('INVALID_DATE_RANGE')
  }

  return {
    title: input.name.trim(),
    subtitle: '',
    startDate: formatTripDateDisplay(
      start.getFullYear(),
      start.getMonth() + 1,
      start.getDate(),
    ),
    endDate: formatTripDateDisplay(
      end.getFullYear(),
      end.getMonth() + 1,
      end.getDate(),
    ),
    accommodation: input.accommodation?.trim() ?? '',
    vehicle: input.vehicle?.trim() ?? '',
    travelers: input.travelers?.trim() ?? '',
    tags: [],
    days: generateDaysForIsoRange(input.startIso, input.endIso),
    restaurants: [],
    checklist: [],
    notices: [],
  }
}

export function wrapItineraryAsTrip(
  itinerary: Itinerary,
  options: {
    protected?: boolean
    quickLinks?: TripQuickLink[]
    name?: string
    id?: string
    createdAt?: string
    updatedAt?: string
  } = {},
): Trip {
  const now = new Date().toISOString()
  return {
    id: options.id ?? createId('trip'),
    name: (options.name ?? itinerary.title).trim() || '새 여행',
    createdAt: options.createdAt ?? now,
    updatedAt: options.updatedAt ?? now,
    protected: options.protected ?? false,
    quickLinks: options.quickLinks,
    itinerary,
  }
}

export function regenerateIdsInItinerary(itinerary: Itinerary): Itinerary {
  const cloned = structuredClone(itinerary)
  cloned.days = cloned.days.map((day) => ({
    ...day,
    id: createId('day'),
    items: day.items.map((item) => ({
      ...item,
      id: createId('item'),
    })),
  }))
  cloned.restaurants = cloned.restaurants.map((restaurant) => ({
    ...restaurant,
    id: createId('rest'),
  }))
  cloned.checklist = cloned.checklist.map((item) => ({
    ...item,
    id: createId('check'),
  }))
  return cloned
}

export function duplicateTrip(trip: Trip): Trip {
  const now = new Date().toISOString()
  return {
    id: createId('trip'),
    name: `${trip.name} 복사본`,
    createdAt: now,
    updatedAt: now,
    protected: false,
    quickLinks: trip.quickLinks
      ? structuredClone(trip.quickLinks)
      : undefined,
    itinerary: regenerateIdsInItinerary(trip.itinerary),
  }
}

export function getTripStatus(trip: Trip, now = new Date()): TripStatus {
  const start = tripDateToLocalDate(trip.itinerary.startDate)
  const end = tripDateToLocalDate(trip.itinerary.endDate)
  const today = startOfLocalDay(now)

  if (!start || !end) {
    return { kind: 'upcoming', label: '일정 미정' }
  }

  const startDay = startOfLocalDay(start)
  const endDay = startOfLocalDay(end)

  if (today >= startDay && today <= endDay) {
    return { kind: 'active', label: '여행 중' }
  }

  if (today > endDay) {
    return { kind: 'past', label: '지난 여행' }
  }

  const msPerDay = 24 * 60 * 60 * 1000
  const diff = Math.round((startDay.getTime() - today.getTime()) / msPerDay)
  return { kind: 'upcoming', label: `D-${diff}` }
}

export function sortTripsForHome(trips: Trip[], now = new Date()): Trip[] {
  const decorated = trips.map((trip, index) => {
    const status = getTripStatus(trip, now)
    const start = tripDateToLocalDate(trip.itinerary.startDate)
    const end = tripDateToLocalDate(trip.itinerary.endDate)
    return { trip, index, status, start, end }
  })

  decorated.sort((a, b) => {
    const rank = (kind: TripStatusKind) =>
      kind === 'active' ? 0 : kind === 'upcoming' ? 1 : 2
    const rankDiff = rank(a.status.kind) - rank(b.status.kind)
    if (rankDiff !== 0) return rankDiff

    if (a.status.kind === 'upcoming') {
      const aTime = a.start?.getTime() ?? Number.POSITIVE_INFINITY
      const bTime = b.start?.getTime() ?? Number.POSITIVE_INFINITY
      if (aTime !== bTime) return aTime - bTime
    }

    if (a.status.kind === 'past') {
      const aTime = a.end?.getTime() ?? 0
      const bTime = b.end?.getTime() ?? 0
      if (aTime !== bTime) return bTime - aTime
    }

    return a.index - b.index
  })

  return decorated.map((entry) => entry.trip)
}

export function findActiveTrip(
  collection: TripCollection,
): Trip | null {
  if (collection.trips.length === 0) return null
  const byId = collection.activeTripId
    ? collection.trips.find((trip) => trip.id === collection.activeTripId)
    : null
  return byId ?? collection.trips[0]
}

export function updateTripInCollection(
  collection: TripCollection,
  tripId: string,
  updater: (trip: Trip) => Trip,
): TripCollection {
  const now = new Date().toISOString()
  return {
    ...collection,
    trips: collection.trips.map((trip) => {
      if (trip.id !== tripId) return trip
      const next = updater(trip)
      return { ...next, updatedAt: now }
    }),
  }
}

/** Rough Korea bounding box (includes Jeju). Kakao routing is Korea-only. */
export function isLikelyKoreaCoords(lat: number, lng: number): boolean {
  return lat >= 33 && lat <= 38.9 && lng >= 124.5 && lng <= 132
}
