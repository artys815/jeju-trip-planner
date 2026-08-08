import { isValidHttpUrl, type Itinerary } from '../types'
import {
  isValidTimeOrBlank,
  parseMonthDay,
  parseTripDateParts,
} from './dateFormat'

export interface ValidationIssue {
  message: string
  /** Optional element id for focus/scroll */
  fieldId?: string
}

export function validateItineraryDraft(draft: Itinerary): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  if (!draft.title.trim()) {
    issues.push({ message: '여행 제목을 입력해 주세요.', fieldId: 'field-여행-제목' })
  }

  const start = parseTripDateParts(draft.startDate)
  if (!start) {
    issues.push({
      message: '시작일이 올바르지 않습니다. 날짜를 다시 선택해 주세요.',
      fieldId: 'field-시작일',
    })
  }

  const end = parseTripDateParts(draft.endDate)
  if (!end) {
    issues.push({
      message: '종료일이 올바르지 않습니다. 날짜를 다시 선택해 주세요.',
      fieldId: 'field-종료일',
    })
  }

  if (start && end) {
    const startMs = new Date(start.year, start.month - 1, start.day).getTime()
    const endMs = new Date(end.year, end.month - 1, end.day).getTime()
    if (endMs < startMs) {
      issues.push({
        message: '종료일은 시작일보다 빠를 수 없습니다.',
        fieldId: 'field-종료일',
      })
    }
  }

  draft.days.forEach((day, dayIndex) => {
    if (!parseMonthDay(day.date)) {
      issues.push({
        message: `DAY ${dayIndex + 1} 날짜가 올바르지 않습니다.`,
        fieldId: `day-date-${day.id}`,
      })
    }

    day.items.forEach((item) => {
      if (!isValidTimeOrBlank(item.time)) {
        issues.push({
          message: `「${item.title || '일정'}」 시간 형식이 올바르지 않습니다. (예: 09:30)`,
          fieldId: `item-time-${item.id}`,
        })
      }

      const reservation = item.reservationUrl?.trim() ?? ''
      if (reservation && !isValidHttpUrl(reservation)) {
        issues.push({
          message: `「${item.title || '일정'}」 예약 링크는 http:// 또는 https:// 로 시작해야 합니다.`,
          fieldId: `item-reservation-${item.id}`,
        })
      }
    })
  })

  return issues
}
