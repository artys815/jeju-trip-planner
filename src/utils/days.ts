import { createId, type Day, type DayAccent } from '../types'
import {
  formatMonthDay,
  parseMonthDay,
  parseTripYear,
  weekdayFromDate,
} from './dateFormat'

export const DAY_ACCENTS: DayAccent[] = ['orange', 'blue', 'teal', 'coral']

export { parseTripYear, parseMonthDay } from './dateFormat'

/** Returns the matching day index when device date equals a trip day; otherwise -1. */
export function findTodayDayIndex(
  days: Day[],
  startDate: string,
  now = new Date(),
): number {
  const year = parseTripYear(startDate)
  if (year === null) return -1
  if (now.getFullYear() !== year) return -1

  const month = now.getMonth() + 1
  const dayNum = now.getDate()

  return days.findIndex((day) => {
    const parsed = parseMonthDay(day.date)
    return Boolean(parsed && parsed.month === month && parsed.day === dayNum)
  })
}

export function nextDayFromPrevious(
  previousDate: string,
  startDate: string,
): { date: string; weekday: string } {
  const year = parseTripYear(startDate)
  const parsed = parseMonthDay(previousDate)
  if (year === null || !parsed) {
    return { date: '', weekday: '' }
  }

  const current = new Date(year, parsed.month - 1, parsed.day)
  if (
    Number.isNaN(current.getTime()) ||
    current.getFullYear() !== year ||
    current.getMonth() !== parsed.month - 1 ||
    current.getDate() !== parsed.day
  ) {
    return { date: '', weekday: '' }
  }

  current.setDate(current.getDate() + 1)
  return {
    date: formatMonthDay(current.getMonth() + 1, current.getDate()),
    weekday: weekdayFromDate(current),
  }
}

export function createNextDay(days: Day[], startDate: string): Day {
  const previous = days[days.length - 1]
  const { date, weekday } = previous
    ? nextDayFromPrevious(previous.date, startDate)
    : { date: '', weekday: '' }

  return {
    id: createId('day'),
    date,
    weekday,
    area: '새 일정',
    theme: '여행 일정',
    accent: DAY_ACCENTS[days.length % DAY_ACCENTS.length],
    items: [],
  }
}
