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

export function arrivalStatusMessage(status: ArrivalStatus): string {
  switch (status) {
    case 'SAFE':
      return '여유 있음'
    case 'LEAVE_SOON':
      return '곧 출발 권장'
    case 'LEAVE_NOW':
      return '지금 출발 권장'
    case 'LATE_RISK':
      return '늦을 가능성 있음'
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
