import type { DayWeatherView, ItemWeatherView } from '../hooks/useItineraryWeather'

interface ItemWeatherChipProps {
  weather: ItemWeatherView
}

export function ItemWeatherChip({ weather }: ItemWeatherChipProps) {
  return (
    <div className="weather-chip" aria-label={`날씨 ${weather.label}`}>
      <p className="weather-chip__line">
        <span aria-hidden="true">{weather.icon}</span> {weather.tempC}° · 체감{' '}
        {weather.apparentC}° · 비 {weather.precipProb}%
      </p>
      <p className="weather-chip__line weather-chip__line--soft">
        바람 {weather.windKmh}km/h
        {weather.warnings.length > 0
          ? ` · ${weather.warnings.join(' · ')}`
          : ''}
      </p>
    </div>
  )
}

interface DayWeatherChipProps {
  weather: DayWeatherView
}

export function DayWeatherChip({ weather }: DayWeatherChipProps) {
  if (weather.status === 'out_of_range') {
    return (
      <p className="weather-day weather-day--muted">상세 예보 준비 중</p>
    )
  }
  if (weather.status === 'unavailable') {
    return null
  }

  return (
    <p className="weather-day" aria-label={`하루 날씨 ${weather.label}`}>
      <span aria-hidden="true">{weather.icon}</span> 최저 {weather.minC}° · 최고{' '}
      {weather.maxC}° · 비 {weather.precipProbMax}%
    </p>
  )
}

interface LiveWeatherSnippetProps {
  weather: ItemWeatherView | null | undefined
}

export function LiveWeatherSnippet({ weather }: LiveWeatherSnippetProps) {
  if (!weather) return null
  return (
    <p className="weather-live-snip">
      <span aria-hidden="true">{weather.icon}</span> {weather.tempC}° · 비{' '}
      {weather.precipProb}%
      {weather.warnings[0] ? ` · ${weather.warnings[0]}` : ''}
    </p>
  )
}
