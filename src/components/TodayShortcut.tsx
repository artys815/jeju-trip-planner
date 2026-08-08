import type { Day } from '../types'

interface TodayShortcutProps {
  day: Day
  dayNumber: number
  onGoToDay: (dayId: string) => void
}

export function TodayShortcut({ day, dayNumber, onGoToDay }: TodayShortcutProps) {
  return (
    <aside className="today-shortcut no-print" aria-label="오늘 일정">
      <div className="today-shortcut__copy">
        <p className="today-shortcut__label">오늘 일정</p>
        <p className="today-shortcut__title">
          오늘은 DAY {dayNumber}
          {day.area ? ` · ${day.area}` : ''}
        </p>
      </div>
      <button
        type="button"
        className="btn btn--primary today-shortcut__button"
        onClick={() => onGoToDay(day.id)}
      >
        오늘 일정 보기
      </button>
    </aside>
  )
}
