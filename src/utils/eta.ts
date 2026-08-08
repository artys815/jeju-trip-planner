export const DEFAULT_BUFFER_MINUTES = 10

export type ArrivalStatus = 'SAFE' | 'LEAVE_SOON' | 'LEAVE_NOW' | 'LATE_RISK'

export function getRecommendedDepartureMinutes(
  nextStartMinutes: number,
  etaMinutes: number,
  bufferMinutes = DEFAULT_BUFFER_MINUTES,
): number {
  return nextStartMinutes - etaMinutes - bufferMinutes
}

/** Format minutes-from-midnight as HH:MM (wraps across midnight). */
export function formatClockMinutes(totalMinutes: number): string {
  const day = 24 * 60
  const normalized = ((Math.round(totalMinutes) % day) + day) % day
  const hours = Math.floor(normalized / 60)
  const minutes = normalized % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function getArrivalStatus(
  nowMinutes: number,
  recommendedDepartureMinutes: number,
  nextStartMinutes: number,
  etaMinutes: number,
): ArrivalStatus {
  const projectedArrival = nowMinutes + etaMinutes
  if (projectedArrival > nextStartMinutes) return 'LATE_RISK'

  const untilDepart = recommendedDepartureMinutes - nowMinutes
  if (untilDepart > 20) return 'SAFE'
  if (untilDepart > 0) return 'LEAVE_SOON'
  return 'LEAVE_NOW'
}

export function arrivalStatusMessage(
  status: ArrivalStatus,
  nowMinutes: number,
  recommendedDepartureMinutes: number,
  nextStartMinutes: number,
  etaMinutes: number,
): string {
  switch (status) {
    case 'SAFE': {
      const spare = recommendedDepartureMinutes - nowMinutes
      return `아직 ${spare}분 여유 있어요`
    }
    case 'LEAVE_SOON':
      return '곧 출발하는 것이 좋아요'
    case 'LEAVE_NOW':
      return '지금 출발 권장'
    case 'LATE_RISK': {
      const lateBy = nowMinutes + etaMinutes - nextStartMinutes
      return `지금 출발하면 일정 시간보다 약 ${Math.max(1, lateBy)}분 늦을 수 있어요`
    }
  }
}

export function formatDistanceKm(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`
  const km = meters / 1000
  return `${km.toFixed(km >= 10 ? 0 : 1)}km`
}

export function formatEtaMinutes(seconds: number): number {
  return Math.max(1, Math.ceil(seconds / 60))
}
