/** Open-Meteo / WMO weather code → compact Korean label + icon. */

export interface WeatherCodeInfo {
  icon: string
  label: string
}

export function mapWeatherCode(code: number): WeatherCodeInfo {
  if (!Number.isFinite(code)) return { icon: '🌤', label: '날씨' }

  if (code === 0) return { icon: '☀️', label: '맑음' }
  if (code === 1 || code === 2) return { icon: '🌤', label: '구름 조금' }
  if (code === 3) return { icon: '☁️', label: '흐림' }
  if (code === 45 || code === 48) return { icon: '🌫', label: '안개' }
  if (code === 51 || code === 53 || code === 55 || code === 56 || code === 57) {
    return { icon: '🌦', label: '약한 비' }
  }
  if (code === 61 || code === 63 || code === 66 || code === 80 || code === 81) {
    return { icon: '🌧', label: '비' }
  }
  if (code === 65 || code === 67 || code === 82) {
    return { icon: '🌧', label: '강한 비' }
  }
  if (code === 71 || code === 73 || code === 75 || code === 77 || code === 85 || code === 86) {
    return { icon: '🌨', label: '눈' }
  }
  if (code === 95 || code === 96 || code === 99) {
    return { icon: '⛈', label: '뇌우' }
  }
  return { icon: '🌤', label: '날씨' }
}

export const PRECIP_WARN_THRESHOLD = 70
export const HEAT_WARN_THRESHOLD = 33
export const WIND_WARN_THRESHOLD_KMH = 40

export function buildWeatherWarnings(input: {
  precipProb?: number | null
  apparentC?: number | null
  windKmh?: number | null
}): string[] {
  const warnings: string[] = []
  if (
    typeof input.precipProb === 'number' &&
    input.precipProb >= PRECIP_WARN_THRESHOLD
  ) {
    warnings.push('비 가능성 높음')
  }
  if (
    typeof input.apparentC === 'number' &&
    input.apparentC >= HEAT_WARN_THRESHOLD
  ) {
    warnings.push('더위 주의')
  }
  if (
    typeof input.windKmh === 'number' &&
    input.windKmh >= WIND_WARN_THRESHOLD_KMH
  ) {
    warnings.push('바람 강함')
  }
  return warnings
}
