import { useEffect, useRef, useState } from 'react'
import { defaultItinerary, STORAGE_KEY } from '../data/defaultItinerary'
import { isItinerary, type Itinerary } from '../types'

function loadInitial(): Itinerary {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return structuredClone(defaultItinerary)
    const parsed: unknown = JSON.parse(raw)
    if (isItinerary(parsed)) return parsed
  } catch {
    // fall through to default
  }
  return structuredClone(defaultItinerary)
}

export function useLocalStorage() {
  const [itinerary, setItinerary] = useState<Itinerary>(loadInitial)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [saveFlash, setSaveFlash] = useState(false)
  const isFirst = useRef(true)

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false
      return
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(itinerary))
      setSavedAt(new Date())
      setSaveFlash(true)
      const timer = window.setTimeout(() => setSaveFlash(false), 1600)
      return () => window.clearTimeout(timer)
    } catch {
      // storage full or unavailable
    }
  }, [itinerary])

  const resetToDefault = () => {
    const next = structuredClone(defaultItinerary)
    setItinerary(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setSavedAt(new Date())
    setSaveFlash(true)
  }

  return {
    itinerary,
    setItinerary,
    savedAt,
    saveFlash,
    resetToDefault,
  }
}
