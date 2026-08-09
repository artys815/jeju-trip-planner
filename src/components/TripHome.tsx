import type { Trip } from '../types'
import { getTripStatus, sortTripsForHome } from '../utils/trips'

interface TripHomeProps {
  trips: Trip[]
  onOpenTrip: (tripId: string) => void
  onCreateTrip: () => void
  onDuplicateTrip: (tripId: string) => void
  onDeleteTrip: (tripId: string) => void
}

export function TripHome({
  trips,
  onOpenTrip,
  onCreateTrip,
  onDuplicateTrip,
  onDeleteTrip,
}: TripHomeProps) {
  const sorted = sortTripsForHome(trips)

  return (
    <div className="app trip-home">
      <header className="trip-home__hero">
        <div className="trip-home__hero-inner">
          <p className="trip-home__eyebrow">MY TRIPS</p>
          <h1 className="trip-home__title">나의 여행</h1>
          <p className="trip-home__lead">
            여행 전에는 계획하고,
            <br />
            여행 중에는 다음 행동을 안내합니다.
          </p>
          <button
            type="button"
            className="btn btn--primary trip-home__create"
            onClick={onCreateTrip}
          >
            + 새 여행 만들기
          </button>
        </div>
      </header>

      <main className="main trip-home__main">
        <h2 className="trip-home__list-title">여행 목록</h2>
        {sorted.length === 0 ? (
          <p className="trip-home__empty">아직 등록된 여행이 없습니다.</p>
        ) : (
          <ul className="trip-home__list">
            {sorted.map((trip) => {
              const status = getTripStatus(trip)
              const dayCount = trip.itinerary.days.length
              return (
                <li key={trip.id} className="trip-card">
                  <div className="trip-card__top">
                    <span
                      className={[
                        'trip-card__badge',
                        `trip-card__badge--${status.kind}`,
                      ].join(' ')}
                    >
                      {status.label}
                    </span>
                    {trip.protected ? (
                      <span className="trip-card__protected">보호됨</span>
                    ) : null}
                  </div>
                  <h3 className="trip-card__name">{trip.name}</h3>
                  <p className="trip-card__dates">
                    {trip.itinerary.startDate} – {trip.itinerary.endDate}
                  </p>
                  <p className="trip-card__meta">
                    {trip.itinerary.accommodation
                      ? trip.itinerary.accommodation
                      : '거점 미정'}
                    <span aria-hidden="true"> · </span>
                    {dayCount}일
                  </p>
                  <div className="trip-card__actions">
                    <button
                      type="button"
                      className="btn btn--primary"
                      onClick={() => onOpenTrip(trip.id)}
                    >
                      여행 열기
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() => onDuplicateTrip(trip.id)}
                    >
                      복제
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost"
                      disabled={Boolean(trip.protected)}
                      title={
                        trip.protected
                          ? '현재 보호된 여행입니다.'
                          : '여행 삭제'
                      }
                      onClick={() => onDeleteTrip(trip.id)}
                    >
                      삭제
                    </button>
                  </div>
                  {trip.protected ? (
                    <p className="trip-card__protect-note">
                      현재 보호된 여행입니다.
                    </p>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </main>
    </div>
  )
}
