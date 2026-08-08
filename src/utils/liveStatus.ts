import type { ItineraryItem } from '../types'

export type LiveRole = 'current' | 'next'

export interface LiveDayStatus {
  currentItemId: string | null
  nextItemId: string | null
  currentItem: ItineraryItem | null
  nextItem: ItineraryItem | null
  minutesUntilNext: number | null
}

/** Parse "09:00" / "9:30" into minutes from midnight. Invalid times return null. */
export function parseTimeToMinutes(time: string): number | null {
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

export function formatCountdown(minutesUntil: number): string {
  if (minutesUntil <= 0) return '곧 시작'
  const hours = Math.floor(minutesUntil / 60)
  const minutes = minutesUntil % 60
  if (hours === 0) return `${minutes}분 후`
  if (minutes === 0) return `${hours}시간 후`
  return `${hours}시간 ${minutes}분 후`
}

/**
 * Derive current/next items from a temporary timed list.
 * Never mutates or reorders the original day.items array.
 */
export function getLiveDayStatus(
  items: readonly ItineraryItem[],
  now: Date,
): LiveDayStatus {
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  const timed = items
    .map((item, index) => {
      const minutes = parseTimeToMinutes(item.time)
      if (minutes === null) return null
      return { item, minutes, index }
    })
    .filter((entry): entry is { item: ItineraryItem; minutes: number; index: number } =>
      Boolean(entry),
    )

  const sorted = [...timed].sort(
    (a, b) => a.minutes - b.minutes || a.index - b.index,
  )

  let current: (typeof sorted)[number] | null = null
  let next: (typeof sorted)[number] | null = null

  for (const entry of sorted) {
    if (entry.minutes <= nowMinutes) {
      current = entry
    } else if (!next) {
      next = entry
    }
  }

  return {
    currentItemId: current?.item.id ?? null,
    nextItemId: next?.item.id ?? null,
    currentItem: current?.item ?? null,
    nextItem: next?.item ?? null,
    minutesUntilNext: next ? next.minutes - nowMinutes : null,
  }
}
