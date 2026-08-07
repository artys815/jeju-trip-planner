import { ITEM_TYPES, type ItineraryItem as Item, type ItemType } from '../types'
import { EditField } from './EditField'

const TYPE_ICON: Record<ItemType, string> = {
  travel: '🚗',
  meal: '🍜',
  activity: '🌊',
  stay: '🏠',
  shopping: '🛒',
  other: '✦',
}

interface ItineraryItemProps {
  item: Item
  isEditing: boolean
  isFirst: boolean
  isLast: boolean
  onChange: (patch: Partial<Item>) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

function mapUrl(query: string) {
  return `https://map.naver.com/p/search/${encodeURIComponent(query)}`
}

export function ItineraryItemView({
  item,
  isEditing,
  isFirst,
  isLast,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}: ItineraryItemProps) {
  if (isEditing) {
    return (
      <li className="item item--edit">
        <div className="item__edit-grid">
          <EditField
            className="edit-field--time"
            label="시간"
            value={item.time}
            onChange={(time) => onChange({ time })}
          />
          <label className="edit-field edit-field--type">
            <span className="edit-field__label">유형</span>
            <select
              className="edit-field__input"
              value={item.type}
              onChange={(e) => onChange({ type: e.target.value as ItemType })}
            >
              {ITEM_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <EditField
            className="edit-field--title"
            label="제목"
            value={item.title}
            onChange={(title) => onChange({ title })}
          />
          <EditField
            className="edit-field--map"
            label="지도 검색어"
            value={item.mapQuery}
            onChange={(mapQuery) => onChange({ mapQuery })}
            placeholder="예: 협재해수욕장"
          />
          <EditField
            className="edit-field--description"
            label="설명"
            value={item.description}
            onChange={(description) => onChange({ description })}
            multiline
          />
          <div className="item__edit-actions no-print">
            <button type="button" className="btn btn--small" onClick={onMoveUp} disabled={isFirst}>
              위로
            </button>
            <button type="button" className="btn btn--small" onClick={onMoveDown} disabled={isLast}>
              아래로
            </button>
            <button
              type="button"
              className="btn btn--small btn--danger"
              onClick={() => {
                if (window.confirm('이 일정을 삭제할까요?')) onDelete()
              }}
            >
              삭제
            </button>
          </div>
        </div>
      </li>
    )
  }

  return (
    <li className={`item ${item.completed ? 'item--done' : ''}`}>
      <div className="item__time">
        <span className="item__icon" aria-hidden="true">
          {TYPE_ICON[item.type]}
        </span>
        <time dateTime={item.time}>{item.time}</time>
      </div>
      <div className="item__body">
        <div className="item__heading">
          <h4 className="item__title">{item.title}</h4>
          {item.mapQuery.trim() && (
            <a
              className="item__map"
              href={mapUrl(item.mapQuery.trim())}
              target="_blank"
              rel="noopener noreferrer"
            >
              지도
            </a>
          )}
        </div>
        <p className="item__desc">{item.description}</p>
      </div>
    </li>
  )
}
