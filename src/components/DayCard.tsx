import { createId, type Day, type ItineraryItem } from '../types'
import { ItineraryItemView } from './ItineraryItem'

interface DayCardProps {
  day: Day
  dayNumber: number
  isEditing: boolean
  onChangeDay: (patch: Partial<Day>) => void
  onChangeItems: (items: ItineraryItem[]) => void
}

export function DayCard({
  day,
  dayNumber,
  isEditing,
  onChangeDay,
  onChangeItems,
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

  return (
    <article className={`day-card day-card--${day.accent}`}>
      <header className="day-card__header">
        <div className="day-card__badge" aria-hidden="true">
          DAY {dayNumber}
        </div>
        <div className="day-card__meta">
          {isEditing ? (
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
          ) : (
            <>
              <p className="day-card__date">
                {day.date} <span>({day.weekday})</span>
              </p>
              <h3 className="day-card__theme">{day.theme}</h3>
              <p className="day-card__area">{day.area}</p>
            </>
          )}
        </div>
      </header>

      <ol className="day-card__items">
        {day.items.map((item, index) => (
          <ItineraryItemView
            key={item.id}
            item={item}
            isEditing={isEditing}
            isFirst={index === 0}
            isLast={index === day.items.length - 1}
            onChange={(patch) => updateItem(index, patch)}
            onDelete={() => deleteItem(index)}
            onMoveUp={() => moveItem(index, -1)}
            onMoveDown={() => moveItem(index, 1)}
          />
        ))}
      </ol>

      {isEditing && (
        <button type="button" className="btn btn--add no-print" onClick={addItem}>
          + 일정 추가
        </button>
      )}
    </article>
  )
}
