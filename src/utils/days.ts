import { createId, type Day, type DayAccent } from '../types'

export const DAY_ACCENTS: DayAccent[] = ['orange', 'blue', 'teal', 'coral']

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const

export function parseTripYear(startDate: string): number | null {
  const match = startDate.trim().match(/(\d{4})/)
  if (!match) return null
  const year = Number(match[1])
  return Number.isFinite(year) ? year : null
}

export function parseMonthDay(date: string): { month: number; day: number } | null {
  const match = date.trim().match(/^(\d{1,2})\.(\d{1,2})$/)
  if (!match) return null
  const month = Number(match[1])
  const day = Number(match[2])
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  return { month, day }
}

/** Returns the matching day index when device date equals a trip day; otherwise -1. */
export function findTodayDayIndex(days: Day[], startDate: string, now = new Date()): number {
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

function formatMonthDay(month: number, day: number): string {
  return `${month}.${day}`
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
    weekday: WEEKDAYS[current.getDay()],
  }
}

export function createNextDay(
  days: Day[],
  startDate: string,
): Day {
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
