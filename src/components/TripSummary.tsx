import type { Itinerary } from '../types'
import { EditField } from './EditField'

interface TripSummaryProps {
  itinerary: Itinerary
  isEditing: boolean
  onChange: (patch: Partial<Itinerary>) => void
}

export function TripSummary({ itinerary, isEditing, onChange }: TripSummaryProps) {
  return (
    <section className="section trip-summary" aria-labelledby="trip-summary-heading">
      <h2 id="trip-summary-heading" className="section__title">
        여행 정보
      </h2>
      {isEditing ? (
        <div className="trip-summary__edit">
          <p className="edit-section-label">기본 정보</p>
          <EditField
            label="숙소"
            value={itinerary.accommodation}
            onChange={(accommodation) => onChange({ accommodation })}
          />
          <EditField
            label="차량"
            value={itinerary.vehicle}
            onChange={(vehicle) => onChange({ vehicle })}
          />
          <EditField
            label="인원"
            value={itinerary.travelers}
            onChange={(travelers) => onChange({ travelers })}
          />
          <EditField
            label="태그 (쉼표로 구분)"
            value={itinerary.tags.join(', ')}
            onChange={(value) =>
              onChange({
                tags: value
                  .split(',')
                  .map((t) => t.trim())
                  .filter(Boolean),
              })
            }
          />
        </div>
      ) : (
        <>
          <dl className="trip-summary__grid">
            <div>
              <dt>숙소</dt>
              <dd>{itinerary.accommodation}</dd>
            </div>
            <div>
              <dt>차량</dt>
              <dd>{itinerary.vehicle}</dd>
            </div>
            <div>
              <dt>인원</dt>
              <dd>{itinerary.travelers}</dd>
            </div>
            <div>
              <dt>기간</dt>
              <dd>
                {itinerary.startDate} – {itinerary.endDate}
              </dd>
            </div>
          </dl>
          <ul className="tag-list" aria-label="태그">
            {itinerary.tags.map((tag) => (
              <li key={tag} className="tag">
                #{tag}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
