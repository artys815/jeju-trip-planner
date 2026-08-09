import type { Itinerary } from '../types'
import {
  isoInputToTripDate,
  tripDateToIsoInput,
} from '../utils/dateFormat'
import { EditField } from './EditField'

interface HeroProps {
  itinerary: Itinerary
  isEditing: boolean
  onChange: (patch: Partial<Itinerary>) => void
  dateNotice?: string | null
}

export function Hero({
  itinerary,
  isEditing,
  onChange,
  dateNotice = null,
}: HeroProps) {
  return (
    <header className="hero">
      <div className="hero__decor hero__decor--1" aria-hidden="true" />
      <div className="hero__decor hero__decor--2" aria-hidden="true" />
      <div className="hero__inner">
        <p className="hero__eyebrow">
          {itinerary.days.length > 1
            ? `${itinerary.days.length - 1}N ${itinerary.days.length}D`
            : `${itinerary.days.length} DAY`}
        </p>
        {isEditing ? (
          <div className="hero__edit">
            <p className="edit-section-label">기본 정보</p>
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
                type="date"
                value={tripDateToIsoInput(itinerary.startDate)}
                onChange={(iso) => {
                  const next = isoInputToTripDate(iso)
                  if (next) onChange({ startDate: next })
                }}
              />
              <EditField
                label="종료일"
                type="date"
                value={tripDateToIsoInput(itinerary.endDate)}
                onChange={(iso) => {
                  const next = isoInputToTripDate(iso)
                  if (next) onChange({ endDate: next })
                }}
              />
            </div>
            {dateNotice && (
              <p className="hero__date-notice no-print">{dateNotice}</p>
            )}
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
