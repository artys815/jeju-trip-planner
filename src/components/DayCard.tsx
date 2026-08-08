import { createId, type Day, type ItineraryItem } from '../types'
import {
  formatCountdown,
  type LiveDayStatus,
  type LiveRole,
} from '../utils/liveStatus'
import { ItineraryItemView } from './ItineraryItem'

interface DayCardProps {
  day: Day
  dayNumber: number
  isEditing: boolean
  isFirst: boolean
  isLast: boolean
  canDelete: boolean
  highlighted?: boolean
  highlightedItemId?: string | null
  collapsed?: boolean
  onToggleCollapse?: () => void
  liveStatus?: LiveDayStatus | null
  onChangeDay: (patch: Partial<Day>) => void
  onChangeItems: (items: ItineraryItem[]) => void
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
}

export function DayCard({
  day,
  dayNumber,
  isEditing,
  isFirst,
  isLast,
  canDelete,
  highlighted = false,
  highlightedItemId = null,
  collapsed = false,
  onToggleCollapse,
  liveStatus = null,
  onChangeDay,
  onChangeItems,
  onMoveUp,
  onMoveDown,
  onDelete,
}: DayCardProps) {
  const updateItem = (index: number, patch: Partial<ItineraryItem>) => {
    const next = day.items.map((item, i) => (i === index ? { ...item, ...patch } : item))
    onChangeItems(next)
  }

  const deleteItem = (index: number) => {
    onChangeItems(day.items.filter((_, i) => i !== index))
  }

  const moveItem = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= day.items.length) return
    const next = [...day.items]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChangeItems(next)
  }

  const addItem = () => {
    onChangeItems([
      ...day.items,
      {
        id: createId('item'),
        time: '12:00',
        title: '새 일정',
        description: '',
        type: 'other',
        mapQuery: '',
        completed: false,
      },
    ])
  }

  const handleDeleteDay = () => {
    if (!canDelete) return
    const label = day.date.trim() || day.area.trim() || `DAY ${dayNumber}`
    if (
      window.confirm(
        `「${label}」 날짜 일정을 삭제할까요? 이 날짜의 모든 일정도 함께 삭제됩니다.`,
      )
    ) {
      onDelete()
    }
  }

  const isCollapsed = !isEditing && collapsed

  const getLiveRole = (itemId: string): LiveRole | null => {
    if (!liveStatus) return null
    if (liveStatus.currentItemId === itemId) return 'current'
    if (liveStatus.nextItemId === itemId) return 'next'
    return null
  }

  return (
    <article
      id={`day-${day.id}`}
      className={`day-card day-card--${day.accent}${highlighted ? ' day-card--flash' : ''}${isCollapsed ? ' day-card--collapsed' : ''}`}
    >
      <header className="day-card__header">
        <div className="day-card__badge" aria-hidden="true">
          DAY {dayNumber}
        </div>
        <div className="day-card__meta">
          {isEditing ? (
            <>
              <div className="day-card__edit-meta">
                <label>
                  <span>날짜</span>
                  <input
                    value={day.date}
                    onChange={(e) => onChangeDay({ date: e.target.value })}
                  />
                </label>
                <label>
                  <span>요일</span>
                  <input
                    value={day.weekday}
                    onChange={(e) => onChangeDay({ weekday: e.target.value })}
                  />
                </label>
                <label>
                  <span>지역</span>
                  <input
                    value={day.area}
                    onChange={(e) => onChangeDay({ area: e.target.value })}
                  />
                </label>
                <label>
                  <span>테마</span>
                  <input
                    value={day.theme}
                    onChange={(e) => onChangeDay({ theme: e.target.value })}
                  />
                </label>
              </div>
              <div className="day-card__day-actions no-print">
                <button
                  type="button"
                  className="btn btn--small"
                  onClick={onMoveUp}
                  disabled={isFirst}
                >
                  이전 날짜로
                </button>
                <button
                  type="button"
                  className="btn btn--small"
                  onClick={onMoveDown}
                  disabled={isLast}
                >
                  다음 날짜로
                </button>
                <button
                  type="button"
                  className="btn btn--small btn--danger"
                  onClick={handleDeleteDay}
                  disabled={!canDelete}
                  title={!canDelete ? '최소 하루는 남겨야 합니다' : undefined}
                >
                  날짜 삭제
                </button>
              </div>
            </>
          ) : (
            <div className="day-card__view-top">
              <div>
                <p className="day-card__date">
                  {day.date} <span>({day.weekday})</span>
                </p>
                <h3 className="day-card__theme">{day.theme}</h3>
                <p className="day-card__area">{day.area}</p>
                {isCollapsed && (
                  <p className="day-card__count">일정 {day.items.length}개</p>
                )}
              </div>
              {onToggleCollapse && (
                <button
                  type="button"
                  className="day-card__collapse no-print"
                  onClick={onToggleCollapse}
                  aria-expanded={!isCollapsed}
                  aria-controls={`day-items-${day.id}`}
                >
                  {isCollapsed ? '펼치기' : '접기'}
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <ol id={`day-items-${day.id}`} className="day-card__items">
        {day.items.map((item, index) => {
          const role = getLiveRole(item.id)
          return (
            <ItineraryItemView
              key={item.id}
              item={item}
              isEditing={isEditing}
              isFirst={index === 0}
              isLast={index === day.items.length - 1}
              liveRole={role}
              liveCountdown={
                role === 'next' && liveStatus?.minutesUntilNext != null
                  ? formatCountdown(liveStatus.minutesUntilNext)
                  : null
              }
              highlighted={highlightedItemId === item.id}
              onChange={(patch) => updateItem(index, patch)}
              onDelete={() => deleteItem(index)}
              onMoveUp={() => moveItem(index, -1)}
              onMoveDown={() => moveItem(index, 1)}
            />
          )
        })}
      </ol>

      {isEditing && (
        <button type="button" className="btn btn--add no-print" onClick={addItem}>
          + 일정 추가
        </button>
      )}
    </article>
  )
}
