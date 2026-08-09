import type { Day, ItineraryItem } from '../types'
import type { LiveAssistSnapshot } from '../hooks/useLiveTravelAssistant'
import type { ItemWeatherView } from '../hooks/useItineraryWeather'
import { formatCountdown } from '../utils/liveStatus'
import { LiveWeatherSnippet } from './WeatherChip'

interface TodayShortcutProps {
  day: Day
  dayNumber: number
  currentItem: ItineraryItem | null
  nextItem: ItineraryItem | null
  minutesUntilNext: number | null
  onGoToLive: () => void
  liveEnabled: boolean
  liveLoading: boolean
  liveError: string | null
  liveSnapshot: LiveAssistSnapshot | null
  onEnableLive: () => void
  onRefreshLive: () => void
  onDisableLive: () => void
  isTestMode?: boolean
  currentWeather?: ItemWeatherView | null
  nextWeather?: ItemWeatherView | null
}

export function TodayShortcut({
  day,
  dayNumber,
  currentItem,
  nextItem,
  minutesUntilNext,
  onGoToLive,
  liveEnabled,
  liveLoading,
  liveError,
  liveSnapshot,
  onEnableLive,
  onRefreshLive,
  onDisableLive,
  isTestMode = false,
  currentWeather = null,
  nextWeather = null,
}: TodayShortcutProps) {
  const countdown =
    minutesUntilNext === null ? null : formatCountdown(minutesUntilNext)

  const buttonLabel = currentItem ? '현재 일정 보기' : '오늘 일정 보기'

  return (
    <aside className="today-shortcut no-print" aria-label="오늘 일정 상태">
      <div className="today-shortcut__copy">
        <p className="today-shortcut__label">
          DAY {dayNumber} · {isTestMode ? '테스트 일정' : '오늘의 일정'}
          {day.area ? ` · ${day.area}` : ''}
        </p>

        {currentItem ? (
          <div className="today-status">
            <div className="today-status__block">
              <span className="today-status__badge today-status__badge--now">지금</span>
              <p className="today-status__title">{currentItem.title}</p>
              <p className="today-status__time">{currentItem.time}</p>
              <LiveWeatherSnippet weather={currentWeather} />
            </div>
            <div className="today-status__block">
              {nextItem ? (
                <>
                  <span className="today-status__badge">다음</span>
                  <p className="today-status__title">
                    {nextItem.title}
                    <span className="today-status__sep"> · </span>
                    {nextItem.time}
                  </p>
                  {countdown && (
                    <p className="today-status__countdown">{countdown}</p>
                  )}
                  <LiveWeatherSnippet weather={nextWeather} />
                </>
              ) : (
                <p className="today-status__quiet">오늘의 마지막 일정입니다.</p>
              )}
            </div>
          </div>
        ) : nextItem ? (
          <div className="today-status">
            <div className="today-status__block">
              <span className="today-status__badge">첫 일정</span>
              <p className="today-status__title">
                {nextItem.title}
                <span className="today-status__sep"> · </span>
                {nextItem.time}
              </p>
              {countdown && <p className="today-status__countdown">{countdown}</p>}
              <LiveWeatherSnippet weather={nextWeather} />
            </div>
          </div>
        ) : (
          <p className="today-shortcut__title">
            {isTestMode ? '테스트' : '오늘'}은 DAY {dayNumber}
            {day.area ? ` · ${day.area}` : ''}
          </p>
        )}

        {nextItem && (
          <div className="live-assist">
            <p className="live-assist__privacy">
              현재 위치는 다음 일정까지의 이동시간 계산에만 사용하며 저장하지 않습니다.
              {isTestMode
                ? ' 테스트 모드에서는 실제 GPS와 시뮬레이션 시각을 함께 사용합니다.'
                : ''}
            </p>

            {!liveEnabled ? (
              <button
                type="button"
                className="btn btn--ghost live-assist__enable"
                onClick={onEnableLive}
              >
                현재 위치로 이동시간 확인
              </button>
            ) : (
              <>
                {liveLoading && !liveSnapshot && (
                  <p className="live-assist__loading">이동시간을 계산하는 중…</p>
                )}

                {liveError && <p className="live-assist__error">{liveError}</p>}

                {liveSnapshot && (
                  <div className="live-assist__result">
                    <p className="live-assist__eta">
                      🚗 다음 장소까지 약 {liveSnapshot.etaMinutes}분
                    </p>
                    <p className="live-assist__distance">
                      📏 {liveSnapshot.distanceLabel}
                    </p>
                    <p className="live-assist__depart">
                      ⏰ {liveSnapshot.recommendedDepartureLabel}까지 출발 권장
                      {isTestMode ? ' (시뮬레이션 시각 기준)' : ''}
                    </p>
                    <p
                      className={`live-assist__status live-assist__status--${liveSnapshot.status.toLowerCase()}`}
                    >
                      {liveSnapshot.statusMessage}
                      {isTestMode ? ' · 테스트' : ''}
                    </p>
                  </div>
                )}

                <div className="live-assist__actions">
                  {liveSnapshot?.directionsUrl && (
                    <a
                      className="btn btn--primary"
                      href={liveSnapshot.directionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      길찾기
                    </a>
                  )}
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={onRefreshLive}
                    disabled={liveLoading}
                  >
                    {liveLoading ? '새로고침 중…' : '새로고침'}
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={onDisableLive}
                  >
                    끄기
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        className="btn btn--primary today-shortcut__button"
        onClick={onGoToLive}
      >
        {buttonLabel}
      </button>
    </aside>
  )
}
