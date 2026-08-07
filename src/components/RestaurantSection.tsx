import { createId, type Restaurant } from '../types'
import { EditField } from './EditField'

interface RestaurantSectionProps {
  restaurants: Restaurant[]
  isEditing: boolean
  onChange: (restaurants: Restaurant[]) => void
}

export function RestaurantSection({
  restaurants,
  isEditing,
  onChange,
}: RestaurantSectionProps) {
  const update = (index: number, patch: Partial<Restaurant>) => {
    onChange(restaurants.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  const remove = (index: number) => {
    if (!window.confirm('이 맛집 카드를 삭제할까요?')) return
    onChange(restaurants.filter((_, i) => i !== index))
  }

  const add = () => {
    onChange([
      ...restaurants,
      {
        id: createId('rest'),
        name: '새 맛집',
        menu: '',
        note: '',
      },
    ])
  }

  return (
    <section className="section" aria-labelledby="restaurant-heading">
      <h2 id="restaurant-heading" className="section__title">
        맛집 · 메뉴
      </h2>
      <p className="section__lead">현장 대기와 동선에 따라 골라 먹는 후보 리스트</p>

      <a
        className="map-reco no-print"
        href="https://naver.me/FdCCr5WD"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="제주맨 맛집지도 — 네이버지도에서 새 탭으로 열기"
      >
        <span className="map-reco__icon" aria-hidden="true">
          📍
        </span>
        <span className="map-reco__copy">
          <span className="map-reco__eyebrow">제주 맛집을 한눈에</span>
          <span className="map-reco__title">제주맨 맛집지도</span>
          <span className="map-reco__badge">네이버지도</span>
        </span>
        <span className="map-reco__action">
          지도 열기
          <span aria-hidden="true"> ↗</span>
        </span>
      </a>

      <ul className="restaurant-grid">
        {restaurants.map((restaurant, index) => (
          <li key={restaurant.id} className="restaurant-card">
            {isEditing ? (
              <div className="restaurant-card__edit">
                <EditField
                  label="이름"
                  value={restaurant.name}
                  onChange={(name) => update(index, { name })}
                />
                <EditField
                  label="메뉴"
                  value={restaurant.menu}
                  onChange={(menu) => update(index, { menu })}
                />
                <EditField
                  label="메모"
                  value={restaurant.note}
                  onChange={(note) => update(index, { note })}
                  multiline
                />
                <button
                  type="button"
                  className="btn btn--small btn--danger no-print"
                  onClick={() => remove(index)}
                >
                  삭제
                </button>
              </div>
            ) : (
              <>
                <h3 className="restaurant-card__name">{restaurant.name}</h3>
                <p className="restaurant-card__menu">{restaurant.menu}</p>
                <p className="restaurant-card__note">{restaurant.note}</p>
              </>
            )}
          </li>
        ))}
      </ul>
      {isEditing && (
        <button type="button" className="btn btn--add no-print" onClick={add}>
          + 맛집 추가
        </button>
      )}
    </section>
  )
}
