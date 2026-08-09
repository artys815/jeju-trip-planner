import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { defaultItinerary } from '../data/defaultItinerary'
import type { Itinerary, Trip, TripCollection } from '../types'
import {
  loadOrMigrateTripCollection,
  persistTripCollection,
  readLegacyItinerary,
} from '../utils/tripMigration'
import { tripDateToIsoInput } from '../utils/dateFormat'
import {
  createBlankItinerary,
  duplicateTrip,
  findActiveTrip,
  JEJU_MAN_MAP_LINK,
  updateTripInCollection,
  wrapItineraryAsTrip,
} from '../utils/trips'

export type AppScreen = 'home' | 'trip'

export function useTripCollection() {
  const initial = useMemo(() => loadOrMigrateTripCollection(localStorage), [])
  const [collection, setCollection] = useState<TripCollection>(
    () => initial.collection,
  )
  const [screen, setScreen] = useState<AppScreen>(() =>
    initial.collection.trips.length === 1 ? 'trip' : 'home',
  )
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [saveFlash, setSaveFlash] = useState(false)
  const isFirst = useRef(true)

  const activeTrip = useMemo(
    () => findActiveTrip(collection),
    [collection],
  )

  const itinerary = activeTrip?.itinerary ?? structuredClone(defaultItinerary)

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false
      return
    }
    const ok = persistTripCollection(localStorage, collection)
    if (!ok) return
    setSavedAt(new Date())
    setSaveFlash(true)
    const timer = window.setTimeout(() => setSaveFlash(false), 1600)
    return () => window.clearTimeout(timer)
  }, [collection])

  const commitCollection = useCallback((next: TripCollection) => {
    setCollection(next)
  }, [])

  const setItinerary = useCallback(
    (next: Itinerary | ((prev: Itinerary) => Itinerary)) => {
      setCollection((prev) => {
        const trip = findActiveTrip(prev)
        if (!trip) return prev
        const resolved =
          typeof next === 'function' ? next(trip.itinerary) : next
        return updateTripInCollection(prev, trip.id, (current) => ({
          ...current,
          name: resolved.title.trim() || current.name,
          itinerary: resolved,
        }))
      })
    },
    [],
  )

  const selectTrip = useCallback((tripId: string) => {
    setCollection((prev) => {
      if (!prev.trips.some((trip) => trip.id === tripId)) return prev
      return { ...prev, activeTripId: tripId }
    })
    setScreen('trip')
  }, [])

  const goHome = useCallback(() => {
    setScreen('home')
  }, [])

  const createTrip = useCallback(
    (input: {
      name: string
      startIso: string
      endIso: string
      accommodation?: string
      vehicle?: string
      travelers?: string
    }) => {
      const itineraryData = createBlankItinerary(input)
      const trip = wrapItineraryAsTrip(itineraryData, {
        protected: false,
        name: input.name.trim(),
      })
      setCollection((prev) => ({
        ...prev,
        activeTripId: trip.id,
        trips: [...prev.trips, trip],
      }))
      setScreen('trip')
      return trip
    },
    [],
  )

  const duplicateActiveOrId = useCallback((tripId: string) => {
    setCollection((prev) => {
      const source = prev.trips.find((trip) => trip.id === tripId)
      if (!source) return prev
      const copy = duplicateTrip(source)
      return {
        ...prev,
        activeTripId: copy.id,
        trips: [...prev.trips, copy],
      }
    })
    setScreen('trip')
  }, [])

  const deleteTrip = useCallback((tripId: string): { ok: boolean; reason?: string } => {
    const target = collection.trips.find((trip) => trip.id === tripId)
    if (!target) return { ok: false, reason: 'NOT_FOUND' }
    if (target.protected) {
      return { ok: false, reason: 'PROTECTED' }
    }
    if (collection.trips.length <= 1) {
      return { ok: false, reason: 'LAST_TRIP' }
    }

    setCollection((prev) => {
      const trips = prev.trips.filter((trip) => trip.id !== tripId)
      const activeTripId =
        prev.activeTripId === tripId
          ? (trips[0]?.id ?? null)
          : prev.activeTripId
      return { version: 1, activeTripId, trips }
    })
    return { ok: true }
  }, [collection.trips])

  const resetActiveItinerary = useCallback(() => {
    setCollection((prev) => {
      const trip = findActiveTrip(prev)
      if (!trip) return prev

      if (trip.protected) {
        const restored = structuredClone(defaultItinerary)
        return updateTripInCollection(prev, trip.id, (current) => ({
          ...current,
          name: restored.title,
          quickLinks: current.quickLinks?.length
            ? current.quickLinks
            : [JEJU_MAN_MAP_LINK],
          itinerary: restored,
        }))
      }

      const startIso = tripDateToIsoInput(trip.itinerary.startDate)
      const endIso = tripDateToIsoInput(trip.itinerary.endDate)
      if (!startIso || !endIso) return prev

      try {
        const blank = createBlankItinerary({
          name: trip.name,
          startIso,
          endIso,
          accommodation: trip.itinerary.accommodation,
          vehicle: trip.itinerary.vehicle,
          travelers: trip.itinerary.travelers,
        })
        return updateTripInCollection(prev, trip.id, (current) => ({
          ...current,
          itinerary: blank,
        }))
      } catch {
        return prev
      }
    })
  }, [])

  const recoverLegacyIntoActive = useCallback((): {
    ok: boolean
    reason?: string
  } => {
    const legacy = readLegacyItinerary(localStorage)
    if (!legacy) return { ok: false, reason: 'NO_LEGACY' }

    setCollection((prev) => {
      const trip = findActiveTrip(prev)
      if (!trip || !trip.protected) return prev
      return updateTripInCollection(prev, trip.id, (current) => ({
        ...current,
        name: legacy.title,
        quickLinks: current.quickLinks?.length
          ? current.quickLinks
          : [JEJU_MAN_MAP_LINK],
        itinerary: structuredClone(legacy),
      }))
    })
    return { ok: true }
  }, [])

  return {
    collection,
    activeTrip: activeTrip as Trip | null,
    itinerary,
    setItinerary,
    screen,
    setScreen,
    goHome,
    selectTrip,
    createTrip,
    duplicateTrip: duplicateActiveOrId,
    deleteTrip,
    resetActiveItinerary,
    recoverLegacyIntoActive,
    savedAt,
    saveFlash,
    commitCollection,
  }
}
