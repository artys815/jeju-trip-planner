import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Day } from '../types'
import { dayDateToIsoInput, timeToInputValue } from '../utils/dateFormat'

export const LIVE_TEST_MODE_KEY = 'jeju-trip-live-test-mode-v1'

export interface LiveTestModeState {
  enabled: boolean
  dayId: string
  time: string
}

function readState(): LiveTestModeState {
  try {
    const raw = sessionStorage.getItem(LIVE_TEST_MODE_KEY)
    if (!raw) return { enabled: false, dayId: '', time: '11:00' }
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') {
      return { enabled: false, dayId: '', time: '11:00' }
    }
    const body = parsed as Record<string, unknown>
    return {
      enabled: body.enabled === true,
      dayId: typeof body.dayId === 'string' ? body.dayId : '',
      time: typeof body.time === 'string' ? body.time : '11:00',
    }
  } catch {
    return { enabled: false, dayId: '', time: '11:00' }
  }
}

function writeState(state: LiveTestModeState) {
  try {
    if (!state.enabled) {
      sessionStorage.removeItem(LIVE_TEST_MODE_KEY)
      return
    }
    sessionStorage.setItem(LIVE_TEST_MODE_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}

/** Build a Date from itinerary day + HH:mm using trip startDate year. */
export function buildSimulatedNow(
  day: Day,
  startDate: string,
  time: string,
): Date | null {
  const iso = dayDateToIsoInput(day.date, startDate)
  const clock = timeToInputValue(time)
  if (!iso || !clock) return null
  const [year, month, dayNum] = iso.split('-').map(Number)
  const [hours, minutes] = clock.split(':').map(Number)
  const date = new Date(year, month - 1, dayNum, hours, minutes, 0, 0)
  if (Number.isNaN(date.getTime())) return null
  return date
}

export function useLiveTestMode(days: readonly Day[]) {
  const [state, setState] = useState<LiveTestModeState>(readState)

  useEffect(() => {
    writeState(state)
  }, [state])

  // Keep dayId valid if days change
  useEffect(() => {
    if (!state.enabled) return
    if (days.some((d) => d.id === state.dayId)) return
    setState((prev) => ({
      ...prev,
      dayId: days[0]?.id ?? '',
      enabled: Boolean(days[0]),
    }))
  }, [days, state.dayId, state.enabled])

  const enable = useCallback(
    (dayId?: string, time?: string) => {
      setState({
        enabled: true,
        dayId: dayId || days[0]?.id || '',
        time: time || '11:00',
      })
    },
    [days],
  )

  const disable = useCallback(() => {
    setState({ enabled: false, dayId: '', time: '11:00' })
  }, [])

  const setDayId = useCallback((dayId: string) => {
    setState((prev) => ({ ...prev, dayId }))
  }, [])

  const setTime = useCallback((time: string) => {
    setState((prev) => ({ ...prev, time }))
  }, [])

  const selectedDay = useMemo(
    () => days.find((d) => d.id === state.dayId) ?? null,
    [days, state.dayId],
  )

  return {
    enabled: state.enabled,
    dayId: state.dayId,
    time: state.time,
    selectedDay,
    enable,
    disable,
    setDayId,
    setTime,
  }
}
