import type { Day, ItineraryItem } from '../types'
import { formatCountdown } from '../utils/liveStatus'

interface TodayShortcutProps {
  day: Day
  dayNumber: number
  currentItem: ItineraryItem | null
  nextItem: ItineraryItem | null
  minutesUntilNext: number | null
  onGoToLive: () => void
}

export function TodayShortcut({
  day,
  dayNumber,
  currentItem,
  nextItem,
  minutesUntilNext,
  onGoToLive,
}: TodayShortcutProps) {
  const countdown =
    minutesUntilNext === null ? null : formatCountdown(minutesUntilNext)

  const buttonLabel = currentItem ? '현재 일정 보기' : '오늘 일정 보기'

  return (
    <aside className="today-shortcut no-print" aria-label="오늘 일정 상태">
      <div className="today-shortcut__copy">
        <p className="today-shortcut__label">
          DAY {dayNumber} · 오늘의 일정
          {day.area ? ` · ${day.area}` : ''}
        </p>

        {currentItem ? (
          <div className="today-status">
            <div className="today-status__block">
              <span className="today-status__badge today-status__badge--now">지금</span>
              <p className="today-status__title">{currentItem.title}</p>
              <p className="today-status__time">{currentItem.time}</p>
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
            </div>
          </div>
        ) : (
          <p className="today-shortcut__title">
            오늘은 DAY {dayNumber}
            {day.area ? ` · ${day.area}` : ''}
          </p>
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
