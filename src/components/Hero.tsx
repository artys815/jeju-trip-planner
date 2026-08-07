import type { Itinerary } from '../types'
import { EditField } from './EditField'

interface HeroProps {
  itinerary: Itinerary
  isEditing: boolean
  onChange: (patch: Partial<Itinerary>) => void
}

export function Hero({ itinerary, isEditing, onChange }: HeroProps) {
  return (
    <header className="hero">
      <div className="hero__decor hero__decor--1" aria-hidden="true" />
      <div className="hero__decor hero__decor--2" aria-hidden="true" />
      <div className="hero__inner">
        <p className="hero__eyebrow">JEJU · 3N 4D</p>
        {isEditing ? (
          <div className="hero__edit">
            <EditField
              label="여행 제목"
              value={itinerary.title}
              onChange={(title) => onChange({ title })}
            />
            <EditField
              label="부제"
              value={itinerary.subtitle}
              onChange={(subtitle) => onChange({ subtitle })}
              multiline
            />
            <div className="hero__edit-row">
              <EditField
                label="시작일"
                value={itinerary.startDate}
                onChange={(startDate) => onChange({ startDate })}
              />
              <EditField
                label="종료일"
                value={itinerary.endDate}
                onChange={(endDate) => onChange({ endDate })}
              />
            </div>
          </div>
        ) : (
          <>
            <h1 className="hero__title">{itinerary.title}</h1>
            <p className="hero__subtitle">{itinerary.subtitle}</p>
            <p className="hero__dates">
              {itinerary.startDate} – {itinerary.endDate}
            </p>
          </>
        )}
        <ul className="hero__chips" aria-label="여행 정보">
          <li className="hero__chip">숙소 · {itinerary.accommodation}</li>
          <li className="hero__chip">차량 · {itinerary.vehicle}</li>
          <li className="hero__chip">인원 · {itinerary.travelers}</li>
        </ul>
      </div>
      <div className="hero__curve" aria-hidden="true" />
    </header>
  )
}
