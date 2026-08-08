import {
  getMapSearchValue,
  isValidHttpUrl,
  ITEM_TYPES,
  naverMapSearchUrl,
  type ItineraryItem as Item,
  type ItemType,
} from '../types'
import type { LiveRole } from '../utils/liveStatus'
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
  liveRole?: LiveRole | null
  liveCountdown?: string | null
  highlighted?: boolean
  onChange: (patch: Partial<Item>) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

export function ItineraryItemView({
  item,
  isEditing,
  isFirst,
  isLast,
  liveRole = null,
  liveCountdown = null,
  highlighted = false,
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
            className="edit-field--address"
            label="정확한 주소 (선택)"
            value={item.address ?? ''}
            onChange={(address) => onChange({ address })}
            placeholder="제주특별자치도 제주시 조천읍..."
            hint="주소가 입력되어 있으면 주소를 우선 사용하고, 없으면 기존 지도 검색어를 사용합니다."
          />
          <EditField
            className="edit-field--reservation"
            label="예약/관련 링크"
            value={item.reservationUrl ?? ''}
            onChange={(reservationUrl) => onChange({ reservationUrl })}
            placeholder="https://..."
          />
          <EditField
            className="edit-field--travel"
            label="이동시간"
            value={item.travelTime ?? ''}
            onChange={(travelTime) => onChange({ travelTime })}
            placeholder="예: 숙소에서 약 20분"
          />
          <EditField
            className="edit-field--preparation"
            label="준비물 · 메모"
            value={item.preparation ?? ''}
            onChange={(preparation) => onChange({ preparation })}
            placeholder="예: 수영복, 아쿠아슈즈, 선크림"
            multiline
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

  const searchValue = getMapSearchValue(item)
  const reservationUrl = item.reservationUrl?.trim() ?? ''
  const showReservation = isValidHttpUrl(reservationUrl)
  const travelTime = item.travelTime?.trim() ?? ''
  const preparation = item.preparation?.trim() ?? ''
  const mapHref = searchValue ? naverMapSearchUrl(searchValue) : ''

  const liveClass =
    liveRole === 'current'
      ? ' item--live-current'
      : liveRole === 'next'
        ? ' item--live-next'
        : ''

  return (
    <li
      id={`item-${item.id}`}
      className={`item${item.completed ? ' item--done' : ''}${liveClass}${highlighted ? ' item--flash' : ''}`}
    >
      <div className="item__time">
        <span className="item__icon" aria-hidden="true">
          {TYPE_ICON[item.type]}
        </span>
        <time dateTime={item.time}>{item.time}</time>
      </div>
      <div className="item__body">
        <div className="item__heading">
          <div className="item__title-row">
            {liveRole === 'current' && (
              <span className="item__live-badge item__live-badge--now no-print">
                ● 지금
              </span>
            )}
            {liveRole === 'next' && (
              <span className="item__live-badge item__live-badge--next no-print">
                {liveCountdown ? `다음 · ${liveCountdown}` : '다음'}
              </span>
            )}
            <h4 className="item__title">{item.title}</h4>
          </div>
          {(searchValue || showReservation) && (
            <div className="item__actions no-print">
              {searchValue && (
                <a
                  className="item__action"
                  href={mapHref}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  지도
                </a>
              )}
              {searchValue && (
                <a
                  className="item__action"
                  href={mapHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="네이버지도에서 목적지를 연 뒤 길찾기를 이용할 수 있습니다"
                >
                  길찾기
                </a>
              )}
              {showReservation && (
                <a
                  className="item__action item__action--reserve"
                  href={reservationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  예약 확인
                </a>
              )}
            </div>
          )}
        </div>
        {travelTime && (
          <p className="item__travel">
            <span aria-hidden="true">🚗 </span>
            {travelTime}
          </p>
        )}
        {item.description && <p className="item__desc">{item.description}</p>}
        {preparation && <p className="item__prep">준비 · {preparation}</p>}
      </div>
    </li>
  )
}
