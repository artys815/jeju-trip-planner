/** Korean weekday labels — index matches Date#getDay(). */
export const KOREAN_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const

export function parseTripYear(startDate: string): number | null {
  const match = startDate.trim().match(/(\d{4})/)
  if (!match) return null
  const year = Number(match[1])
  return Number.isFinite(year) ? year : null
}

/** Parse stored day date "8.16" → month/day. */
export function parseMonthDay(
  date: string,
): { month: number; day: number } | null {
  const match = date.trim().match(/^(\d{1,2})\.(\d{1,2})$/)
  if (!match) return null
  const month = Number(match[1])
  const day = Number(match[2])
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  return { month, day }
}

/** Parse trip start/end display "2026.08.14" → Date parts. */
export function parseTripDateParts(
  value: string,
): { year: number; month: number; day: number } | null {
  const match = value.trim().match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})$/)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (
    !Number.isFinite(year) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null
  }
  const dt = new Date(year, month - 1, day)
  if (
    Number.isNaN(dt.getTime()) ||
    dt.getFullYear() !== year ||
    dt.getMonth() !== month - 1 ||
    dt.getDate() !== day
  ) {
    return null
  }
  return { year, month, day }
}

export function formatMonthDay(month: number, day: number): string {
  return `${month}.${day}`
}

export function formatTripDateDisplay(year: number, month: number, day: number): string {
  return `${year}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}`
}

export function formatIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function weekdayFromDate(date: Date): string {
  return KOREAN_WEEKDAYS[date.getDay()]
}

/** Day.date + trip startDate year → value for <input type="date">. */
export function dayDateToIsoInput(dayDate: string, startDate: string): string {
  const parts = parseMonthDay(dayDate)
  const year = parseTripYear(startDate)
  if (!parts || year === null) return ''
  const dt = new Date(year, parts.month - 1, parts.day)
  if (
    Number.isNaN(dt.getTime()) ||
    dt.getMonth() !== parts.month - 1 ||
    dt.getDate() !== parts.day
  ) {
    return ''
  }
  return formatIsoDate(dt.getFullYear(), dt.getMonth() + 1, dt.getDate())
}

/** ISO date from picker → stored day.date + weekday (keeps M.D format). */
export function isoInputToDayFields(iso: string): {
  date: string
  weekday: string
} | null {
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
  return {
    date: formatMonthDay(month, day),
    weekday: weekdayFromDate(dt),
  }
}

export function tripDateToIsoInput(tripDate: string): string {
  const parts = parseTripDateParts(tripDate)
  if (!parts) return ''
  return formatIsoDate(parts.year, parts.month, parts.day)
}

export function isoInputToTripDate(iso: string): string | null {
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
  return formatTripDateDisplay(year, month, day)
}

/** Normalize "9:30" / "09:30" for <input type="time">; invalid → ''. */
export function timeToInputValue(time: string): string {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return ''
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
    return ''
  }
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function isValidTimeOrBlank(time: string): boolean {
  const trimmed = time.trim()
  if (!trimmed) return true
  return timeToInputValue(trimmed) !== ''
}
